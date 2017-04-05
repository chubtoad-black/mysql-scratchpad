'use strict';
import * as vscode from 'vscode';
import {RequestController} from './controllers/RequestController';
import {ConnectionController} from './controllers/ConnectionController';
import {MySQLUtil} from './utils/MySQLUtil';

export function activate(context: vscode.ExtensionContext) {
    let requestController = new RequestController();
    let connectionController = new ConnectionController();

    context.subscriptions.push(requestController);
    context.subscriptions.push(connectionController);
    context.subscriptions.push(vscode.commands.registerCommand('extension.mysqlConnect', () => connectionController.inputConnectionAndConnect()));
    context.subscriptions.push(vscode.commands.registerCommand('extensions.executeCurrentLine', ()=> requestController.executeStatementUnderCursor()));
}



// this method is called when your extension is deactivated
export function deactivate() {
}