import {TextDocumentContentProvider, Uri, EventEmitter, Event, extensions} from 'vscode';
import * as path from 'path';

export class MySqlResultDocumentContentProvider implements TextDocumentContentProvider{

    private result:any;
    private currentStatement:string;
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

    public setStatement(s:string){
        this.currentStatement = s;
    }

    public setResult(r:any){
        this.result = r;
    }

    public provideTextDocumentContent(uri:Uri):Thenable<string>|string{
        let output = this.head();

        output += this.header();
        
        if(this.result){
            if(this.result instanceof Array){
                output += this.table();
            }else{
                output += this.databaseUpdate();
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

    private header():string{
        let header = `<h2>${this.currentStatement}</h2>`
        return header;
    }

    private table():string{
        if(this.result.length < 1){
            return "<p>Empty Result</p>";
        }
        let out = "<table><thead><tr>";

        let columns = [];
        for(let col in this.result[0]){
            columns.push(col);
            out+=`<th>${col}</th>`;
        }
        
        out+="</tr></thead><tbody>";
        out += this.tableRows(columns);
        out +="</tbody></table>";
        return out;
    }

    private tableRows(columns):string{
        let out = "";
        for(let row of this.result){
            out+="<tr>";
            for(let col of columns){
                out+=`<td>${row[col]}</td>`;
            }
            out+="</tr>"
        }
        return out;
    }

    private databaseUpdate():string{
        return `<p>Affected Rows: ${this.result.affectedRows}</p>
                    <p>Warnings: ${this.result.warningCount}</p>
                    <p>${this.result.message}</p>`
    }
}


