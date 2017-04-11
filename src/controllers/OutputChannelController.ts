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

    public static outputConnection(connection:Connection){
        let line = "Connected as "+connection.config.user+"@"+connection.config.host;
        OutputChannelController.outputChannel.appendLine(line);
    }

    public static outputDisconnect(){
        let line = "Disconnected from MySQL server.";
        OutputChannelController.outputChannel.appendLine(line);
    }

    public static outputError(error:Error){
        let line = "Statement: "+error.statement+"   Error: "+error.message;
        OutputChannelController.outputChannel.appendLine(line);
    }
    
    public static outputSuccesss(result:Result){
        let line = "Statement: "+result.statement;
        if(result.message){
            line +="     Message: "+result.message;
        }
        OutputChannelController.outputChannel.appendLine(line);
    }
}