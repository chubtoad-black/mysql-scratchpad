import * as vscode from 'vscode';
import {MySqlConnectionPrompt} from '../utils/MySqlConnectionPrompt';
import {OutputChannelController} from './OutputChannelController';
import {Connection, ConnectionOptions, createConnection, QueryError} from 'mysql';
import {ResultCache} from '../utils/ResultCache';

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

    public dispose():void{
        this.disconnect()
            .then(() => OutputChannelController.outputDisconnect(), 
                err => this.handleConnectionError(err));
    }

    public inputConnectionAndConnect():void{
        this._statusBarItem.text ='Connecting to MySQL server...';
        this._statusBarItem.show();
        OutputChannelController.showOutputChannel();
        MySqlConnectionPrompt.getMysqlConnectionOptions()
            .then(options => this.connect(options))
            .then((connection:Connection) => this.onConnectionSuccess(), 
                (error:QueryError) => this.onConnectionFailure(error));
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

    public openScratchpad():Thenable<any> | any{
        return vscode.workspace.openTextDocument({language:'sql'})
                    .then(doc => vscode.window.showTextDocument(doc));
    }

    private onConnectionSuccess():Thenable<any>{
        this._statusBarItem.text = 'MySQL: '+this._connection.config.user+'@'+this._connection.config.host;
        OutputChannelController.outputConnection(this._connection);
        return this.openScratchpad();
    }

    private onConnectionFailure(error:QueryError):Thenable<any>{
        this._statusBarItem.text = 'Failed to connect to MySQL server';
        setTimeout(() => this._statusBarItem.hide(),3000);
        return this.handleConnectionError(error);
    }

    public closeConnection():Thenable<any>{
        if(!this._connection){
            return null;
        }
        return this.disconnect()
                    .then(() => this.onDisconnect(), 
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
            });
        });
    }

    private onDisconnect(){
        ResultCache.clear();
        this._statusBarItem.hide();
        vscode.window.showInformationMessage('MySQL connection closed.',{});
    }
    
    private handleConnectionError(error:QueryError):Thenable<any>{
        return vscode.window.showErrorMessage("MySQL "+error.message);
    }
    
}