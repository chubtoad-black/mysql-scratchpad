import {TextDocumentContentProvider, Uri, EventEmitter, Event, extensions} from 'vscode';
import * as path from 'path';
import {ResultStore, MySQLResult} from '../utils/ResultStore';

export class MySqlResultDocumentContentProvider implements TextDocumentContentProvider{
    private static resultCssPath:string = path.join(extensions.getExtension('jblack.mysql-scratchpad').extensionPath, 'styles','result.css');
    private _onDidChange = new EventEmitter<Uri>();
    
    constructor(){
    }

    public get onDidChange(): Event<Uri> {
        return this._onDidChange.event;
    }

    public refresh(uri:Uri){
        this._onDidChange.fire(uri);
    }

    public provideTextDocumentContent(uri:Uri):Thenable<string>|string{
        let storedResult = ResultStore.get(uri.toString());

        let output = this.head();
        output += this.header(storedResult);
        
        if(storedResult){
            if(storedResult.result instanceof Array){
                output += this.table(storedResult);
            }else{
                output += this.databaseUpdate(storedResult);
            }
        }else{
            output += "<p>No Result</p>";
        }
        return output;
    }

    private head():string{
        let head = `<head>
                        <link rel="stylesheet" href="${MySqlResultDocumentContentProvider.resultCssPath}">
                    </head>`;
        return head;
    }

    private header(storedResult:MySQLResult):string{
        let header = `<h2>${storedResult.statement}</h2>
                        <p>Time taken: ${storedResult.timeTaken/1000} seconds</p>
                        <p>${storedResult.result.message}`;
        return header;
    }

    private table(storedResult:MySQLResult):string{
        if(storedResult.result.length < 1){
            return "<p>Empty Result</p>";
        }
        let out = "<table><thead><tr>";

        let columns = [];
        for(let col in storedResult.result[0]){
            columns.push(col);
            out+=`<th>${col}</th>`;
        }
        
        out+="</tr></thead><tbody>";
        out += this.tableRows(columns, storedResult);
        out +="</tbody></table>";
        return out;
    }

    private tableRows(columns:string[], storedResult:MySQLResult):string{
        let out = "";
        for(let row of storedResult.result){
            out+="<tr>";
            for(let col of columns){
                out+=`<td>${row[col]}</td>`;
            }
            out+="</tr>"
        }
        return out;
    }

    private databaseUpdate(storedResult:MySQLResult):string{
        return `<p>Affected Rows: ${storedResult.result.affectedRows}</p>
                    <p>Warnings: ${storedResult.result.warningCount}</p>
                    <p>${storedResult.result.message}</p>`
    }
}


