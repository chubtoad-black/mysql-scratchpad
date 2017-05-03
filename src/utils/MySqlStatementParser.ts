import {TextEditor, TextLine, Position, Range} from 'vscode';

export interface StatementRange{
    range:Range,
    statement:string
}

export class MySqlStatementParser{

    constructor(private editor:TextEditor){
    }

    public parseStatementAndRangeUnderCursor():StatementRange{
        let cursorPosition:Position = this.editor.selection.anchor;

        if(this.cursorIsInComment(cursorPosition)){
            return null;
        }

        let startPos = this.getStartOfStatement(cursorPosition.line, cursorPosition.character);
        let endPos;
        if(this.cursorAndStatementStartAtEndOfLine(startPos.character, this.editor.document.lineAt(cursorPosition.line))){
            startPos = this.getStartOfStatement(cursorPosition.line, startPos.character-1);
            if(startPos.line !== cursorPosition.line){
                endPos = this.getEndOfStatement(cursorPosition.line, cursorPosition.character-1);
            }else{
                endPos = this.getEndOfStatement(cursorPosition.line, startPos.character-1);

            }
        }else{
            endPos = this.getEndOfStatement(cursorPosition.line, cursorPosition.character);
        }

        let statement = this.stripComments(startPos, endPos);

        if(statement.length < 1){
            statement = null;
        }
        return {
            statement:statement,
            range: new Range(startPos,endPos)
        };
    }

    private cursorIsInComment(cursorPosition:Position):boolean{
        let line = this.editor.document.lineAt(cursorPosition.line);
        return line.text.lastIndexOf("--",cursorPosition.character) > -1;
    }

    private cursorAndStatementStartAtEndOfLine(startPos:number, line:TextLine){
        let text = this.stripCommentFromLine(line.text).trim();
        if(startPos === text.length && this.editor.selection.anchor.line === line.lineNumber){
            return true;
        }
        return false;
    }

    private getStartOfStatement(lineNum:number, startPos?:number):Position{
        let line = this.editor.document.lineAt(lineNum);
        if(startPos === null || startPos === undefined){
            startPos = line.range.end.character;
        }else if(startPos > 0){
            startPos--;
        }

        let startOfStatement = line.text.lastIndexOf(';', startPos);
        
        if(startOfStatement > -1){
            return new Position(lineNum, ++startOfStatement);
        }else if(lineNum > 0){
            return this.getStartOfStatement(--lineNum);
        }else{
            return line.range.start;
        }
    }

    private getEndOfStatement(lineNum:number, startPos?:number):Position{
        let line = this.editor.document.lineAt(lineNum);
        if(!startPos){
            startPos = 0;
        }
        let endOfStatement = line.text.indexOf(';',startPos);
        if(endOfStatement > -1){
            return new Position(lineNum, endOfStatement+1);
        }else if(lineNum < this.editor.document.lineCount-1){
            return this.getEndOfStatement(++lineNum);
        }else{
            return line.range.end;
        }
    }

    private stripComments(startPos:Position, endPos:Position, stripNewline?:boolean):string{
        let statement = "";
        let currentLine = startPos.line;
        while(currentLine <= endPos.line){
            let lineText = this.editor.document.lineAt(currentLine).text;
            if(startPos.line === endPos.line){
                lineText = lineText.substr(startPos.character, endPos.character-startPos.character);
            }else if(currentLine === startPos.line){
                lineText = lineText.substr(startPos.character);
            }else if(currentLine === endPos.line){
                lineText = lineText.substring(0,endPos.character);
            }
            lineText = this.stripCommentFromLine(lineText);

            statement+=lineText;
            if(!stripNewline){
                statement+="\n";
            }
            currentLine++;
        }
        return statement.trim();
    }

    private stripCommentFromLine(line:string){
        let commentIdx = line.indexOf("--");
        if(commentIdx > -1){
            line = line.substring(0, commentIdx);
        }
        return line;
    }

    public parseSelectedStatements():string{
        return null;
    }


}