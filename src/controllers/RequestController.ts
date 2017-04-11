import {window, workspace, commands, Range, TextEditor, Disposable, Uri, TextDocument, ViewColumn} from 'vscode';
import {ConnectionController} from './ConnectionController';
import {MySqlResultDocumentContentProvider} from '../views/MySqlResultDocumentContentProvider';
import {MySqlStatementParser} from '../utils/MySqlStatementParser';
import {OutputChannelController} from './OutputChannelController';

export class RequestController{
    private _resultDocumentProvider:MySqlResultDocumentContentProvider;
    private _resultDocumentRegistration:Disposable;

    constructor(){
        this._resultDocumentProvider = new MySqlResultDocumentContentProvider();
        this._resultDocumentRegistration = workspace.registerTextDocumentContentProvider('mysql-scratchpad', this._resultDocumentProvider)
    }

    public executeStatementUnderCursor(){
        let editor = window.activeTextEditor;
        if(!editor || !editor.document){
            return;
        }
        let parser = new MySqlStatementParser(editor);
        let statement = parser.parseStatementUnderCursor();
        
        if(!statement){
            return;
        }
        this._resultDocumentProvider.setStatement(statement);
        this.execute(statement)
            .then(result => {
                OutputChannelController.outputSuccesss({
                    statement:statement,
                    message:result.message
                });
                this._resultDocumentProvider.setResult(result);
                let uri:Uri = Uri.parse('mysql-scratchpad://authority/result');
                this._resultDocumentProvider.refresh(uri);
                commands.executeCommand('vscode.previewHtml', uri, ViewColumn.Two, 'MySQL Result');
            }, (error) => {
                window.showErrorMessage(error.message);
                OutputChannelController.outputError({
                    message: error.message,
                    statement: statement
                })
            });
        
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

    public dispose(){
        this._resultDocumentRegistration.dispose();
    }
}