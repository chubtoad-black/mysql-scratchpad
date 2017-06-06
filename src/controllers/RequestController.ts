import {window, workspace, commands, Range, TextEditor, Disposable, Uri, TextDocument, ViewColumn, TextEditorDecorationType} from 'vscode';
import {ConnectionController} from './ConnectionController';
import {MySqlResultDocumentContentProvider} from '../views/MySqlResultDocumentContentProvider';
import {MySqlStatementParser} from '../utils/MySqlStatementParser';
import {OutputChannelController} from './OutputChannelController';
import {ResultCache, MySQLResult} from '../utils/ResultCache';

export class RequestController{
    private _resultDocumentProvider:MySqlResultDocumentContentProvider;
    private _resultDocumentRegistration:Disposable;
    private _timer:number;

    constructor(){
        this._resultDocumentProvider = new MySqlResultDocumentContentProvider();
        this._resultDocumentRegistration = workspace.registerTextDocumentContentProvider('mysql-scratchpad', this._resultDocumentProvider);
    }

    public dispose():any{
        this._resultDocumentRegistration.dispose();
    }

    public executeStatementUnderCursor(editor:TextEditor):void{
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

    public executeEntireFile(editor:TextEditor):void{
        if(!editor || !editor.document){
            return;
        }

        if(editor.document.languageId !== 'sql'){
            window.showWarningMessage('Cannot execute a non-sql file.');
        }

        let statements = editor.document.getText();
        this.execute(statements)
            .then(result => this.onMultipleStatementExecutionSuccess(result, statements, editor),
                    error => this.onExecutionError(error, statements, editor));
    }

    public executeSelectedText(editor:TextEditor):void{
        if(!editor || !editor.document){
            return;
        }

        if(editor.selection.isEmpty){
            return;
        }

        let statement = editor.document.getText(editor.selection);

        this.execute(statement)
            .then(result => {
                    if(this.isSingleStatement(statement)){
                        this.onSingleStatementExecutionSuccess(result, statement, editor)
                    }else{
                        this.onMultipleStatementExecutionSuccess(result, statement, editor);
                    }
                }, 
                error => this.onExecutionError(error, statement, editor));
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

    private onSingleStatementExecutionSuccess(result, statement:string, editor:TextEditor):void{
        OutputChannelController.outputSuccesss({
            statement:statement,
            message:result.message
        });
        
        this.cacheAndOpenResult(result, statement, editor, false);
    }

    private onMultipleStatementExecutionSuccess(result, combinedStatements:string, editor:TextEditor):void{
        let statements = combinedStatements.split(';');
        
        for(let i=0; i<statements.length; i++){
            let statement = statements[i];

            if(statement && statement.length > 0){
                statement = statement.trim();
                let currentResult = result[i];

                OutputChannelController.outputSuccesss({
                    statement: statement,
                    message: currentResult.message
                });

                if(this.isOpenResultsInNewTab()){
                    this.cacheAndOpenResult(currentResult, statement, editor, false);
                }
            }
        }
        if(!this.isOpenResultsInNewTab()){
            this.cacheAndOpenResult(result, combinedStatements, editor, true);
        }
    }

    private cacheAndOpenResult(result, statement:string, editor:TextEditor, isMultiStatement?:boolean):void{
        let uri = this.getResultUri();

        ResultCache.add(uri.toString(), {
            statement:statement,
            result:result,
            uri:uri.toString(),
            timeTaken:this._timer,
            error: null,
            multiStatement: isMultiStatement
        });

        this.openResult(uri, editor);
    }

    private openResult(uri:Uri, editor:TextEditor):void{
        this._resultDocumentProvider.refresh(uri);
        commands.executeCommand('vscode.previewHtml', uri, ViewColumn.Two, this.getResultTabTitle());
        window.showTextDocument(editor.document, 1, false);
    }

    private onExecutionError(error, statement, editor):void{
        let uri = this.getResultUri();
        ResultCache.add(uri.toString(), {
            statement:statement,
            result:null,
            uri:uri.toString(),
            timeTaken:this._timer,
            error: error
        });

        this.openResult(uri, editor);
            
        OutputChannelController.outputError({
            message: error.message,
            statement: statement
        });
    }

    private isSingleStatement(text:string):boolean{
        let count = 0;
        for(let statement of text.split(';')){
            if(statement && statement.trim().length > 0){
                count++;
                if(count >= 2){
                    break;
                }
            }
        }
        return count === 1;
    }

    private isOpenResultsInNewTab():boolean{
        return workspace.getConfiguration('mysql-scratchpad').get<boolean>('openResultsInNewTab');
    }

    private getResultUri():Uri{
        let uriPrefix = 'mysql-scratchpad://authority/result';
        let uriString;
        if(this.isOpenResultsInNewTab()){
            let now = new Date().getTime();
            uriString = uriPrefix + now;
            while(ResultCache.has(uriString)){
                now++;
                uriString = uriPrefix + now;
            }
        }else{
            uriString = uriPrefix;
        }
        return Uri.parse(uriString);
    }

    private getResultTabTitle():string{
        let tabTitle = "MySQL Result";
        if(this.isOpenResultsInNewTab()){
            tabTitle += ` ${ResultCache.count()+1}`;
        }
        return tabTitle;
    }

    private updateDecorations(editor:TextEditor, range:Range):void{
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
}