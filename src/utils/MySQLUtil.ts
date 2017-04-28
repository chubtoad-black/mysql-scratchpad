import * as vscode from 'vscode';
import {Connection, ConnectionOptions, createConnection} from 'mysql';

export class MySQLUtil{

    public static getMysqlConnectionOptions():Promise<ConnectionOptions>{
        let options:ConnectionOptions = {};
        let extensionConfig = vscode.workspace.getConfiguration('mysql-scratchpad');
        
        return this.getHostName(options)
            .then(options => this.getPort(options, extensionConfig))
            .then(options => this.getUserName(options))
            .then(options => this.getUserPass(options))
            .then(options => this.getDatabase(options, extensionConfig))
            .then(options => this.addDefaults(options));
    }

    private static getOptionField(promptOptions:any, addInputToOptions:(inputString:string)=>ConnectionOptions){
        return new Promise<ConnectionOptions>(resolve => {
            vscode.window.showInputBox(promptOptions)
                            .then(inputString => resolve(addInputToOptions(inputString)));
        });
    }

    private static getHostName(options:ConnectionOptions):Promise<ConnectionOptions>{
        return this.getOptionField({
                prompt: "MySQL Host"}, 
            hostName => {
                options.host = hostName;
                return options;   
            });
    }

    private static getUserName(options:ConnectionOptions):Promise<ConnectionOptions>{
        return this.getOptionField({
                prompt:'Username for '+options.host},
            userName => {
                options.user = userName;
                return options;
            }
        )
    }

    private static getUserPass(options:ConnectionOptions):Promise<ConnectionOptions>{
        return this.getOptionField({
                prompt:'Password for '+options.user+'@'+options.host,
                password:true
            },
            userPass => {
                options.password = userPass;
                return options;
            }
        );
    }

    private static getPort(options:ConnectionOptions, extensionConfig):Promise<ConnectionOptions>{
        if(extensionConfig.get("promptForPort")){
            return this.getOptionField({
                    prompt:'MySQL Port'
                },
                port => {
                    options.port = Number(port);
                    return options;
                });
        }else{
            let defaultPort:number = extensionConfig.get("defaultMysqlPort");
            options.port = defaultPort;
            return new Promise<ConnectionOptions>(resolve => resolve(options));
        }
    }

    private static getDatabase(options:ConnectionOptions, extensionConfig):Promise<ConnectionOptions>{
        if(extensionConfig.get("promptForDatabase")){
            return this.getOptionField({
                    prompt: 'Database Name'
                },
                dbName => {
                    options.database = dbName;
                    return options
                });
        }else{
            return new Promise<ConnectionOptions>(resolve => resolve(options));
        }
    }

    private static addDefaults(options:ConnectionOptions):Promise<ConnectionOptions>{
        return new Promise<ConnectionOptions>((resolve, reject) => {
           options.multipleStatements = true;
           resolve(options);
        });
    }
}