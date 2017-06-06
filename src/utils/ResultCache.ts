import {workspace} from 'vscode';
import {QueryError} from 'mysql';

export interface MySQLResult{
    statement:string,
    result:any,
    uri:string,
    timeTaken:number,
    error:QueryError,
    multiStatement?:boolean
}

export class ResultCache{
    
    private static CACHE_SIZE = workspace.getConfiguration('mysql-scratchpad').get<number>('resultCacheSize') | 10;
    private static store:Map<string, MySQLResult> = new Map<string, MySQLResult>();
    private static cacheWindow:Array<string> = new Array<string>();
    private static nth:number = 0;

    public static add(uri:string, result:MySQLResult):string{
        this.store.set(uri, result);
        this.nth++;
        let toRemove = null;
        if(workspace.getConfiguration('mysql-scratchpad').get<boolean>('openResultsInNewTab')){
            this.cacheWindow.push(uri);
            toRemove = this.shiftCacheWindow();
        }
        return toRemove;
    }

    public static count(){
        return this.nth;
    }

    public static get(uri:string):MySQLResult{
        return this.store.get(uri);
    }

    public static has(uri:string):boolean{
        return this.store.has(uri);
    }

    public static clear(){
        this.store.clear();
        this.nth = 0;
    }

    private static shiftCacheWindow():string{
        let toRemove = null;
        if(this.CACHE_SIZE > 0 && this.cacheWindow.length > this.CACHE_SIZE){
            toRemove = this.cacheWindow.shift();
            this.remove(toRemove);
        }
        return toRemove;
    }

    private static remove(uri:string){
        if(this.store.has(uri)){
            this.store.delete(uri);
        }
    }
}