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
        let output = `<head>
                        <link rel="stylesheet" href="${MySqlResultDocumentContentProvider.resultCssPath}">
                    </head>
                    <h2>${this.currentStatement}</h2>`;
        
        if(this.result){
            if(this.result instanceof Array){
                output += this.buildTable();
            }else{
                output += this.buildUpdateResponse();
            }
        }else{
            output += "<p>no result!</p>";
        }
        return output;
    }

    private buildTable():string{
        let out = "<table><thead><tr>";
        let columns = [];
        let result0 = this.result[0];
        for(let field in result0){
            columns.push(field);
            out+="<th>"+field+"</th>";
        }
        out+="</tr></thead><tbody>";

        for(let row of this.result){
            out+="<tr>";
            for(let col of columns){
                out+="<td>"+row[col]+"</td>";
            }
            out+="</tr>"
        }
        out +="</tbody></table>";
        return out;
    }

    private buildUpdateResponse():string{
        return `<p>Affected Rows: ${this.result.affectedRows}</p>
                    <p>Warnings: ${this.result.warningCount}</p>
                    <p>${this.result.message}</p>`
    }
}


