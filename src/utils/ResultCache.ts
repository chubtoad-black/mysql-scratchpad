import * as vscode from 'vscode';

export interface MySQLResult{
    statement:string,
    result:any,
    uri:string,
    timeTaken:number
}

export class ResultCache{
    
    private static CACHE_SIZE = vscode.workspace.getConfiguration('mysql-scratchpad').get<number>('resultCacheSize') | 10;
    private static store:Map<string, MySQLResult> = new Map<string, MySQLResult>();
    private static cacheWindow:Array<string> = new Array<string>();
    private static nth:number = 0;

    public static add(uri:string, result:MySQLResult):string{
        this.store.set(uri, result);
        this.nth++;
        this.cacheWindow.push(uri);
        let toRemove = null;
        if(this.cacheWindow.length > this.CACHE_SIZE){
            toRemove = this.cacheWindow.shift();
            this.remove(toRemove);
        }
        return toRemove;
    }

    public static count(){
        return this.nth;
    }

    public static get(uri:string):MySQLResult{
        return this.store.get(uri);
    }


    public static clear(){
        this.store.clear();
        this.nth = 0;
    }

    private static remove(uri:string){
        if(this.store.has(uri)){
            this.store.delete(uri);
        }
    }
}