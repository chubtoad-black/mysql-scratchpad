import {window, workspace, commands, Range, TextEditor, Disposable, Uri, TextDocument, ViewColumn, TextEditorDecorationType} from 'vscode';
import {ConnectionController} from './ConnectionController';
import {MySqlResultDocumentContentProvider} from '../views/MySqlResultDocumentContentProvider';
import {MySqlStatementParser} from '../utils/MySqlStatementParser';
import {OutputChannelController} from './OutputChannelController';
import {ResultCache} from '../utils/ResultCache';

export class RequestController{
    private _resultDocumentProvider:MySqlResultDocumentContentProvider;
    private _resultDocumentRegistration:Disposable;
    private _timer:number;

    constructor(){
        this._resultDocumentProvider = new MySqlResultDocumentContentProvider();
        this._resultDocumentRegistration = workspace.registerTextDocumentContentProvider('mysql-scratchpad', this._resultDocumentProvider);
    }

    public executeStatementUnderCursor(editor:TextEditor){
        if(!editor || !editor.document){
            return;
        }

        let parsed = new MySqlStatementParser(editor).parseStatementAndRangeUnderCursor();

        if(!parsed || !parsed.statement){
            return;
        }

        this.updateDecorations(editor, parsed.range);

        this.execute(parsed.statement)
            .then(result => this.onSingleStatementExecutionSuccess(result, parsed.statement, editor), 
                (error) => this.onExecutionError(error, parsed.statement, editor));
        
    }

    public executeEntireFile(editor:TextEditor){
        if(!editor || !editor.document){
            return;
        }

        if(editor.document.languageId !== 'sql'){
            window.showWarningMessage('Cannot execute a non-sql file.');
        }

        let statements = editor.document.getText();
        this.execute(statements)
            .then(result => this.onEntireFileExecutionSuccess(result, statements.split(';')),
                    error => this.onExecutionError(error, statements, editor));
    }

    public executeSelectedText(editor:TextEditor){
        if(!editor || !editor.document){
            return;
        }

        if(editor.selection.isEmpty){
            return;
        }

        let statement = editor.document.getText(editor.selection);

        this.execute(statement)
            .then(result => this.onSingleStatementExecutionSuccess(result, statement, editor), 
                error => this.onExecutionError(error, statement, editor));
    }

    private updateDecorations(editor:TextEditor, range:Range){
        let options = {
                light:{
                    backgroundColor:`rgba(0,255,0,0.4)`
                },
                dark: {
                    backgroundColor:`rgba(255,255,255,0.4)`
                }
            };
        let decoType = window.createTextEditorDecorationType(options);
        editor.setDecorations(decoType,[range]);
        setTimeout(() => editor.setDecorations(decoType,[]), 1000);
    }

    private execute(sql:string, args?:any[]):Thenable<any>{
        return new Promise<any>((resolve, reject) => {
            let connection = ConnectionController.getConnection();
            if(connection){
                this._timer = new Date().getTime();
                connection.query(sql, args, (err, result, fields) => {
                    this._timer = (new Date().getTime()) - this._timer;
                    if(err){
                        reject(err);
                    }
                    resolve(result);
                })
            }else{
                reject({message: 'No Connection'});
            }
        });
    }

    private onSingleStatementExecutionSuccess(result, statement:string, editor:TextEditor){
        OutputChannelController.outputSuccesss({
            statement:statement,
            message:result.message
        });
        
        let uri = this.getResultUri();
        ResultCache.add(uri.toString(), {
            statement:statement,
            result:result,
            uri:uri.toString(),
            timeTaken:this._timer,
            error: null
        });

        this.openResult(uri, editor);
    }

    private getResultUri():Uri{
        let uriString = 'mysql-scratchpad://authority/result'
        if(workspace.getConfiguration('mysql-scratchpad').get('openResultsInNewTab')){
            uriString += (new Date()).getTime();
        }
        return Uri.parse(uriString);
    }

    private getResultTabTitle():string{
        let tabTitle = "MySQL Result";
        if(workspace.getConfiguration('mysql-scratchpad').get('openResultsInNewTab')){
            tabTitle += ` ${ResultCache.count()+1}`;
        }
        return tabTitle;
    }

    private openResult(uri:Uri, editor){
        this._resultDocumentProvider.refresh(uri);
        commands.executeCommand('vscode.previewHtml', uri, ViewColumn.Two, this.getResultTabTitle());
        window.showTextDocument(editor.document, 1, false);
    }

    private onEntireFileExecutionSuccess(result, statements:string[]){
        for(let statement of statements){
            if(statement && statement.length > 0){
                OutputChannelController.outputSuccesss({
                    statement: statement,
                    message: null
                });
            }
        }
    }

    private onExecutionError(error, statement, editor){
        if(statement instanceof Array){
            //Todo: think of something for the case of multiple statements
            statement = null;
        }else{
            let uri = this.getResultUri();
            ResultCache.add(uri.toString(), {
                statement:statement,
                result:null,
                uri:uri.toString(),
                timeTaken:this._timer,
                error: error
            });

            this.openResult(uri, editor);
            
        }
        OutputChannelController.outputError({
            message: error.message,
            statement: statement
        });

    }

    public dispose(){
        this._resultDocumentRegistration.dispose();
    }
}