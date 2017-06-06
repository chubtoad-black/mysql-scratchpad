# mysql-scratchpad

An extension for accessing MySQL databases and quickly running statements. The scratchpad is a .sql file that you can use to type out multiple statements and run one or many of them quickly. I use this for working out complicated queries or for reading from databases.

Thanks to [mysqljs/mysql](https://github.com/mysqljs/mysql) for the MySQL client.


## Features

### Connect to MySQL server
Use the command palette to run the `MySQL: Connect` command. You will be prompted for host address, username and user password. Once a connection is made, an untitled .sql file will be opened. Connections are closed when using the `MySQL: Disconnect` command or when VSCode is closed.

### Open sql scratchpad
Use the command palette to run the `MySQL: Open New MySQL Scratchpad` command. This will open an untitled .sql file to use as a scratchpad. The scratchpad is just a regular .sql file, but you can execute sql from it on the current connection.

### Execute Statement At Cursor
While on a .sql file you can execute the statement under the cursor on the current connection. You can use the default keyboard shortcut is `cmd+enter` (Windows: `ctrl+enter`) or run the `MySQL: Execute statement under cursor` command from the command palette. This allows you to quickly execute single statements from your scratchpad.
The results will be opened in a new tab.
> Note: The current statement detection is still immature so in order for it to work properly you must end all of your statements with a semiconlon.
>```
> CREATE TABLE mytable;
>
>SELECT * FROM mytable;
>```
>Without the semicolon at the end of the first statement, then both statements would be executed as one.

### Execute Entire File
While on a .sql file you can execute all of the statements in the file by running the `MySQL: Execute entire file`. The current connection will be used.

### Execute Selected Text As Statement
While on any file you can execute selected text as a MySQL statement on the current connection. You can execute this command from the command palette `MySQL: Execute selected text as MySQL statement` or from the context menu on the selected text.

### Disconnect from MySQL server
You can disconnect from the mysql server by running `MySQL: Disconnect`.


## Extension Settings

This extension contributes the following settings:

* `mysql-scratchpad.openResultsInNewTab`: Setting to open each statement result in a new tab. Results are cached, once the cache is full the oldest result is forgotten. Default: false

* `mysql-scratchpad.resultCacheSize`: Sets the maximum result cache size. Only in effect when `mysql-scratchpad.openResultsInNewTab` is set to true. Setting this value to `0` will remove the cache limit. Default: 10

* `mysql-scratchpad.defaultMysqlPort`: MySQL connection port. Default:3306

* `mysql-scratchpad.promptForPort`: When set to true and connecting to a server a prompt will be shown asking for the connection port. If set to false the value from `mysql-scratchpad.defaultMysqlPort` will be used instead.

* `mysql-scratchpad.promptForDatabase`: When set to true and connecting to a server a prompt will be shown asking for which database to use. If set to false no database is used.

## Known Issues

* Occasional issue where multiple statements are executed when trying to run `MySQL: Execute statement under cursor`. This is rare and I'm still working on tracking it down.
* Results tab steals focus. Waiting for change to vscode api. 


## TODO
* Better statement parsing. I would like to show syntax errors before running the statement.
* Better result display. The result table would be nice if you could adjust column widths and order columns.

## Release Notes

### 0.1.0
* Added result display when executing multiple statements at once. If you have the open results in new tab setting on, then each result will get its own tab. Otherwise all results will be displayed one after another on the same tab.

### 0.0.2

* Minor bug fixes.

### 0.0.1

* Initial release.