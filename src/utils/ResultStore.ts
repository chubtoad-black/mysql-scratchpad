
export interface MySQLResult{
    statement:string,
    result:any,
    uri:string,
    timeTaken:number
}

export class ResultStore{

    private static store:Map<string, MySQLResult> = new Map<string, MySQLResult>();
    private static nth:number = 0;

    public static add(uri:string, result:MySQLResult){
        this.store.set(uri, result);
        this.nth++;
    }

    public static count(){
        return this.nth;
    }

    public static get(uri:string):MySQLResult{
        return this.store.get(uri);
    }

    public static remove(uri:string){
        if(this.store.has(uri)){
            this.store.delete(uri);
        }
    }

    public static clear(){
        this.store.clear();
    }
}