import * as vscode from 'vscode';
import {MySQLUtil} from '../utils/MySQLUtil';
import {Connection, ConnectionOptions, createConnection, QueryError} from 'mysql';

export class ConnectionController{
    private static mysqlConnection:Connection;
    public static getConnection():Connection{
        return ConnectionController.mysqlConnection;
    }

    private _connection:Connection;

    constructor(){
    }

    public dispose(){
        this.closeConnection().then(null, (err)=>{
            console.error('error closing connection: ',err);
        })
    }

    public inputConnectionAndConnect(){
        vscode.window.setStatusBarMessage('Connecting to MySQL server...');
        MySQLUtil.getMysqlConnectionOptions()
            .then(options => this.connect(options))
            .then((connectionOrError:Connection) => {    
                vscode.window.setStatusBarMessage('MySQL Connected: '+this._connection.config.user+'@'+this._connection.config.host);
                return this.openScratchpad();
            }, (error:QueryError) => {
                vscode.window.setStatusBarMessage('');
                vscode.window.setStatusBarMessage('Failed to connect to MySQL server', 3000);
                return vscode.window.showErrorMessage("MySQL "+error.message);
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
    private openScratchpad():Thenable<any> | any{
        return vscode.workspace.openTextDocument({language:'sql'})
                    .then(doc => vscode.window.showTextDocument(doc, vscode.ViewColumn.One, false));
    }
    
    
}