'use strict';
import * as vscode from 'vscode';
import {RequestController} from './controllers/RequestController';
import {ConnectionController} from './controllers/ConnectionController';
import {OutputChannelController} from './controllers/OutputChannelController';
import {MySQLUtil} from './utils/MySQLUtil';
import {ResultStore} from './utils/ResultStore';

export function activate(context: vscode.ExtensionContext) {
    let requestController = new RequestController();
    let connectionController = new ConnectionController();
    let outputChannelController = new OutputChannelController();
    
    context.subscriptions.push(requestController);
    context.subscriptions.push(connectionController);
    context.subscriptions.push(outputChannelController);
    context.subscriptions.push(vscode.commands.registerCommand('mysql-scratchpad.mysqlConnect', () => connectionController.inputConnectionAndConnect()));
    context.subscriptions.push(vscode.commands.registerCommand('mysql-scratchpad.mysqlDisconnect', ()=> connectionController.closeConnection()));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('mysql-scratchpad.executeCurrentLine', editor => requestController.executeStatementUnderCursor(editor)));
    context.subscriptions.push(vscode.commands.registerCommand('mysql-scratchpad.openScratchpad', () => connectionController.openScratchpad()));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('mysql-scratchpad.executeEntireFile', editor => requestController.executeEntireFile(editor)));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('mysql-scratchpad.executeSelectedText', editor => requestController.executeSelectedText(editor)));

    context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(document => {
        if(document.uri.scheme === 'mysql-scratchpad'){
            ResultStore.remove(document.uri.toString());
        }
    }))
}

// this method is called when your extension is deactivated
export function deactivate() {
    ResultStore.clear();
}