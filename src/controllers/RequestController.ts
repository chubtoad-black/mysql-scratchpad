import {window, workspace, commands, Range, TextEditor, Disposable, Uri, TextDocument, ViewColumn, TextEditorDecorationType} from 'vscode';
import {ConnectionController} from './ConnectionController';
import {MySqlResultDocumentContentProvider} from '../views/MySqlResultDocumentContentProvider';
import {MySqlStatementParser} from '../utils/MySqlStatementParser';
import {OutputChannelController} from './OutputChannelController';

export class RequestController{
    private _resultDocumentProvider:MySqlResultDocumentContentProvider;
    private _resultDocumentRegistration:Disposable;

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
            .then(result => this.onExecutionSuccess(result, parsed.statement), 
                (error) => this.onExecutionError(error, parsed.statement));
        
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
                connection.query(sql, args, (err, result, fields) => {
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

    private onExecutionSuccess(result, statement){
        OutputChannelController.outputSuccesss({
            statement:statement,
            message:result.message
        });
        this._resultDocumentProvider.setResult(result);
        let uri:Uri = Uri.parse('mysql-scratchpad://authority/result');
        this._resultDocumentProvider.refresh(uri);
        commands.executeCommand('vscode.previewHtml', uri, ViewColumn.Two, 'MySQL Result');
    }

    private onExecutionError(error, statement){
        window.showErrorMessage(error.message);
        OutputChannelController.outputError({
            message: error.message,
            statement: statement
        })
    }

    public dispose(){
        this._resultDocumentRegistration.dispose();
    }
}