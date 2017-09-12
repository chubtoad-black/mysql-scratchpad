import * as vscode from 'vscode';
import { TextDocument, Position, CancellationToken } from 'vscode'
import { ConnectionController } from '../controllers/ConnectionController';
import { OkPacket, FieldPacket, RowDataPacket } from 'mysql/lib/protocol/packets/index';

export class CompletionProvider implements vscode.CompletionItemProvider {

    private _inited: boolean;
    private _tables: vscode.CompletionItem[];
    private _columns: { [table: string]: vscode.CompletionItem[] }
    private _allColumns: vscode.CompletionItem[];

    public async init(): Promise<boolean> {
        if (this._inited) {
            return true;
        }
        let connection = ConnectionController.getConnection();
        if (!connection) {
            return false;
        }

        try {
            this._tables = await this.collectTables();
            this._columns = await this.collectColumns();
            this._allColumns = this.collectAllColumns();
            this._inited = true;
        } catch (ex) {
            this._inited = false;
        }
        return this._inited;
    }


    public provideCompletionItems(
        document: TextDocument,
        position: Position,
        token: CancellationToken
    ): Thenable<vscode.CompletionItem[]> {

        let wordRange = document.getWordRangeAtPosition(position);
        let currentWord = document.getText(wordRange);
        let wordOffset = document.offsetAt(position);

        let dot = '';
        if (wordRange.start.character > 2) {
            let dotRange = new vscode.Range(
                new Position(wordRange.start.line, wordRange.start.character - 1),
                new Position(wordRange.start.line, wordRange.start.character)
            );
            dot = document.getText(document.validateRange(dotRange));
        }

        let prevWord = '';
        if (wordRange.start.character > 2) {
            let prevPost = document.positionAt(wordOffset - currentWord.length - 1);
            let prevRange = document.getWordRangeAtPosition(document.validatePosition(prevPost));
            prevWord = document.getText(prevRange);
        }
        return this.init().then(inited => {
            if (!inited) {
                return [];
            }
            if (dot != '.') { // completion for tabel name
                return this._tables;
            }
            let columns = this._columns[prevWord];
            if (columns) { // completion for fields of specific table
                return columns;
            } else { // completion for all fields
                return this._allColumns;
            }

        });
    }

    private collectTables(): Promise<vscode.CompletionItem[]> {
        let connection = ConnectionController.getConnection();
        let tablesSql = 'select table_name from information_schema.tables;';
        return new Promise((resolve, reject) => {
            connection.query(tablesSql, (err, result: RowDataPacket[]) => {
                if (err) {
                    reject(err);
                    return;
                }

                let tables = result.map(row => {
                    return new vscode.CompletionItem(row.table_name, vscode.CompletionItemKind.Class);
                });
                resolve(tables);
            });
        })
    }

    private collectColumns(): Promise<{ [table: string]: vscode.CompletionItem[] }> {
        let connection = ConnectionController.getConnection();
        let columnSql = `
            select table_name as tables, group_concat(distinct(column_name)) as columns
                from information_schema.columns
                group by table_name
        `;
        return new Promise((resolve, reject) => {
            connection.query(columnSql, (err, result: RowDataPacket[]) => {
                if (err) {
                    reject(err);
                    return;
                }
                let columns = {}
                result.forEach(row => {
                    columns[row['tables']] = row['columns'].split(',').map(c => {
                        return new vscode.CompletionItem(c, vscode.CompletionItemKind.Field);
                    })
                });
                resolve(columns);
            });
        })
    }

    private collectAllColumns() {
        let columns = {};
        for (let table of Object.keys(this._columns)) {
            for (let column of this._columns[table]) {
                columns[column.label] = column;
            }
        }
        let result = [];
        for (let c of Object.keys(columns)) {
            result.push(columns[c]);
        }
        return result;
    }
}