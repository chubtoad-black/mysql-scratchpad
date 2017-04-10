import * as vscode from 'vscode';
import {Connection, ConnectionOptions, createConnection} from 'mysql';

export class MySQLUtil{

    public static getMysqlConnectionOptions():Thenable<ConnectionOptions>{
        let options:ConnectionOptions = {};
        return this.getHostName(options)
            .then(options => this.getUserName(options))
            .then(options => this.getUserPass(options));
    }

    private static getHostName(options:ConnectionOptions):Thenable<ConnectionOptions>{
        return new Promise<ConnectionOptions>((resolve, reject) => {
            vscode.window.showInputBox({
                prompt: "MySQL host:"
            }).then(hostName => {
                options.host = hostName;
                resolve(options);
            });
        });
    }

    private static getUserName(options:ConnectionOptions):Thenable<ConnectionOptions>{
        return new Promise<ConnectionOptions>((resolve, reject) => {
            vscode.window.showInputBox({
                prompt:'Username for '+options.host,
            }).then(userName => {
                options.user = userName;
                resolve(options);
            });
        });
    }

    private static getUserPass(options:ConnectionOptions):Thenable<ConnectionOptions>{
        return new Promise<ConnectionOptions>((resolve, reject) => {
            vscode.window.showInputBox({
                prompt:'Password for '+options.user+'@'+options.host,
                password:true
            }).then(userPass => {
                options.password = userPass;
                resolve(options);
            });
        });
    }
}