import * as vscode from 'vscode';
import {MySQLUtil} from '../utils/MySQLUtil';
import {Connection, ConnectionOptions, createConnection} from 'mysql';

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
            .then(connection => {
                vscode.window.setStatusBarMessage('MySQL Connected: '+this._connection.config.user+'@'+this._connection.config.host)
                return this.openScratchpad();
            });
    }
    
    public connect(connectionOptions:ConnectionOptions):Thenable<Connection>{
        return new Promise<Connection>(resolve => {
            this._connection = createConnection(connectionOptions);
            ConnectionController.mysqlConnection = this._connection;
            resolve(this._connection);
        });
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