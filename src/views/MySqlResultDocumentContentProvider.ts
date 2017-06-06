import {TextDocumentContentProvider, Uri, EventEmitter, Event, extensions} from 'vscode';
import * as path from 'path';
import {ResultCache, MySQLResult} from '../utils/ResultCache';
import {QueryError} from 'mysql';

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
        let storedResult = ResultCache.get(uri.toString());

        let output = this.head();
        if(storedResult){
            if(!storedResult.multiStatement){
                output = this.buildResultHtml(output, storedResult);
            }else{
                let statements = storedResult.statement.split(';');
                let results = storedResult.result;

                output += this.multiResultHeader(results.length);

                let resultObj:MySQLResult = {
                    statement: null,
                    result: null,
                    uri: storedResult.uri,
                    timeTaken: storedResult.timeTaken,
                    error: storedResult.error,
                    multiStatement:true
                };
                for(let i=0; i<statements.length; i++){
                    let statement = statements[i].trim();
                    if(statement && statement.length > 0){
                        if(i !== 0){
                            output += this.resultDivider();
                        }
                        resultObj.statement = statements[i];
                        resultObj.result = results[i];
                        output = this.buildResultHtml(output, resultObj);
                    }
                }
            }
        }else{
            output += "<p class='cache-expired-message'>Result is no longer cached.</p><p>Change the 'resultCacheSize' setting to change the size of the result cache.</p>";
        }
        return output;
    }

    private multiResultHeader(resultCount:number){
        return `<h1 class="mulit-result-header">${resultCount} Results</h1>`;
    }

    private buildResultHtml(html:string, storedResult:MySQLResult):string{
        html += this.header(storedResult);
        if(storedResult.error){
            html += this.error(storedResult);
        }else if(storedResult.result instanceof Array){
            html += this.table(storedResult);
        }else{
            html += this.databaseUpdate(storedResult);
        }
        return html;
    }

    private head():string{
        let head = `<head>
                        <link rel="stylesheet" href="${MySqlResultDocumentContentProvider.resultCssPath}">
                    </head>`;
        return head;
    }

    private header(storedResult:MySQLResult):string{
        let header = `<h2>${storedResult.statement}</h2>
                        <p>Time taken: ${storedResult.timeTaken/1000} seconds</p>`;
        if(storedResult.result && storedResult.result.message){
            header += `<p>${storedResult.result.message}`;
        }
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

    private resultDivider():string{
        return `<div class="result-divider"></div>`
    }

    private databaseUpdate(storedResult:MySQLResult):string{
        return `<p>Affected Rows: ${storedResult.result.affectedRows}</p>
                    <p>Warnings: ${storedResult.result.warningCount}</p>
                    <p>${storedResult.result.message}</p>`
    }

    private error(result:MySQLResult):string{
        return `<h4>Error</h4>
        <p>Code: ${result.error.code}</p>
        <p>Message: ${result.error.message.replace(result.error.code+":", "")}</p>
        `
    }
}


