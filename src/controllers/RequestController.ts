import {window, workspace, commands, Range, TextEditor, Disposable, Uri, TextDocument, ViewColumn} from 'vscode';
import {ConnectionController} from './ConnectionController';
import {MySqlResultDocumentContentProvider} from '../views/MySqlResultDocumentContentProvider';

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

        let statement = this.getStatement(editor);
        if(!statement){
            return;
        }
        console.log("selected statement: ",statement);
        this._resultDocumentProvider.setStatement(statement);
        this.execute(statement)
            .then(result => {
                this._resultDocumentProvider.setResult(result);
                let uri:Uri = Uri.parse('mysql-scratchpad://authority/result');
                this._resultDocumentProvider.refresh(uri);
                commands.executeCommand('vscode.previewHtml', uri, ViewColumn.Two, 'Result');
            })
        
    }

    private getStatement(editor:TextEditor):string{
        let line = editor.selection.active.line;
        //TODO: some sort of sql parser? pull statement out
            // go left from cursor until you hit start of file or ; = this is the start of the command
            // go right from the cursor until you hit ; or end of file = this is the end of the command
        return editor.document.lineAt(line).text;
    }

    private execute(sql:string, args?:any[]):Thenable<any>{
        return new Promise<any>((resolve, reject) => {
            let connection = ConnectionController.getConnection();
            if(connection){
                connection.query(sql, args, (err, result, fields) => {
                    if(err){
                        reject('Error: '+err);
                    }
                    resolve(result);
                })
            }else{
                reject('No connection');
            }
        });
    }

    public dispose(){
        this._resultDocumentRegistration.dispose();
    }
}