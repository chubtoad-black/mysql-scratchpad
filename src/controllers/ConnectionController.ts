import * as vscode from 'vscode';
import {MySQLUtil} from '../utils/MySQLUtil';
import {Connection, ConnectionOptions, createConnection, QueryError} from 'mysql';

export class ConnectionController{
    private static mysqlConnection:Connection;
    public static getConnection():Connection{
        return ConnectionController.mysqlConnection;
    }

    private _connection:Connection;
    private _statusBarItem:vscode.StatusBarItem;

    constructor(){
        this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right,99);
    }

    public dispose(){
        this.disconnect().then(null, (err)=>{
            console.error('error closing connection: ',err);
        })
    }

    public inputConnectionAndConnect(){
        this._statusBarItem.text ='Connecting to MySQL server...';
        this._statusBarItem.show();
        MySQLUtil.getMysqlConnectionOptions()
            .then(options => this.connect(options))
            .then((connectionOrError:Connection) => {
                this._statusBarItem.text = 'MySQL: '+this._connection.config.user+'@'+this._connection.config.host;
                return this.openScratchpad();
            }, (error:QueryError) => {
                this._statusBarItem.text = 'Failed to connect to MySQL server';
                setTimeout(() => this._statusBarItem.hide(),3000);
                return this.handleConnectionError(error);
            });
    }
    
    public connect(connectionOptions:ConnectionOptions):Promise<Connection>{
        return new Promise<Connection>((resolve, reject) => {
            this._connection = createConnection(connectionOptions);
            ConnectionController.mysqlConnection = this._connection;
            this._connection.connect(error => {
                if(error){
                    reject(error);
                }else{
                    resolve(this._connection);
                }
            })
        })
    }
    public closeConnection():Thenable<any>{
        if(!this._connection){
            return null;
        }
        return this.disconnect()
                    .then(() => this._statusBarItem.hide(), 
                        error => this.handleConnectionError(error));
    }
    private disconnect():Promise<any>{
        return new Promise<any>((resolve, reject) => {
            this._connection.end(err => {
                if(err){
                    reject(err.message);
                }else{
                    resolve();
                }
            })
        })
    }
    public openScratchpad():Thenable<any> | any{
        return vscode.workspace.openTextDocument({language:'sql'})
                    .then(doc => vscode.window.showTextDocument(doc));
    }
    
    private handleConnectionError(error:QueryError):Thenable<any>{
        return vscode.window.showErrorMessage("MySQL "+error.message);
    }
    
}