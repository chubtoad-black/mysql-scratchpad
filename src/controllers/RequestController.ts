import {window, workspace, commands, Range, TextEditor, Disposable, Uri, TextDocument, ViewColumn, TextEditorDecorationType} from 'vscode';
import {ConnectionController} from './ConnectionController';
import {MySqlResultDocumentContentProvider} from '../views/MySqlResultDocumentContentProvider';
import {MySqlStatementParser} from '../utils/MySqlStatementParser';
import {OutputChannelController} from './OutputChannelController';

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
        let parser = new MySqlStatementParser(editor);
        let parsed = parser.parseStatementAndRangeUnderCursor();

        this.updateDecorations(editor, parsed.range);

        if(!parsed || !parsed.statement){
            return;
        }
        this._resultDocumentProvider.setStatement(parsed.statement);

        this.execute(parsed.statement)
            .then(result => this.onSingleStatementExecutionSuccess(result, parsed.statement, editor), 
                (error) => this.onExecutionError(error, parsed.statement));
        
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
                    error => console.log("error: ",error));
    }

    public executeSelectedText(editor:TextEditor){
        if(!editor || !editor.document){
            return;
        }

        if(editor.selection.isEmpty){
            return;
        }

        let statement = editor.document.getText(editor.selection);

        this._resultDocumentProvider.setStatement(statement);
        this.execute(statement)
            .then(result => this.onSingleStatementExecutionSuccess(result, statement, editor), 
                (error) => this.onExecutionError(error, statement));
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
        this._resultDocumentProvider.setResult(result);
        this._resultDocumentProvider.setTimeTaken(this._timer);
        let uri:Uri = Uri.parse('mysql-scratchpad://authority/result');
        this._resultDocumentProvider.refresh(uri);
        commands.executeCommand('vscode.previewHtml', uri, ViewColumn.Two, 'MySQL Result');
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
        // display each statement result on new tab?
        // display each statement result below the next on a single tab? too big?
    }

    private onExecutionError(error, statement){
        window.showErrorMessage(error.message);
        OutputChannelController.outputError({
            message: error.message,
            statement: statement
        });
    }

    public dispose(){
        this._resultDocumentRegistration.dispose();
    }
}