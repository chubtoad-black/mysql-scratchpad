import {OutputChannel, window} from 'vscode';
import {Connection} from 'mysql';

export interface Error{
    statement:string,
    message:string
}

export interface Result{
    statement:string,
    message:string
}

export class OutputChannelController{
    private static outputChannel:OutputChannel;

    constructor(){
        OutputChannelController.outputChannel = window.createOutputChannel('MySQL');
    }

    public static showOutputChannel(){
        OutputChannelController.outputChannel.show();
    }

    private static timestamp():string{
        let pad = (num:number):string => {
            let out = num.toString();
            if(out.length < 2){
                return '0'+out
            }
            return out;
        }

        let now = new Date();
        return `[${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}] - `
    }

    public static outputConnection(connection:Connection){
        let line = `${this.timestamp()}Connected as ${connection.config.user}@${connection.config.host}`;
        OutputChannelController.outputChannel.appendLine(line);
    }

    public static outputDisconnect(){
        let line = `${this.timestamp()}Disconnected from MySQL server.`;
        OutputChannelController.outputChannel.appendLine(line);
    }

    public static outputError(error:Error){
        let line = `${this.timestamp()}Statement: ${error.statement}   Error: ${error.message}`;
        OutputChannelController.outputChannel.appendLine(line);
    }
    
    public static outputSuccesss(result:Result){
        let line = `${this.timestamp()}Statement: ${result.statement}`;
        if(result.message){
            line +=`     Message: ${result.message}`;
        }
        OutputChannelController.outputChannel.appendLine(line);
    }

    public dispose(){
        OutputChannelController.outputChannel.hide();
        OutputChannelController.outputChannel.dispose();
    }
}