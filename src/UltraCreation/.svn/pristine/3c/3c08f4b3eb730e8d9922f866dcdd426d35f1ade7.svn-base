/// <reference path= "./websql.d.ts" />
// WebSQL to W3C is deprecated so this is no very unlikely to update further more

/**
 *  Sqlite extension of Storage
 *  support for:
 *      .https://github.com/litehelpers/Cordova-sqlite-storage
            cordova plugin add cordova-sqlite-storage --save
 *      .or alternate cordova-plugin-sqlite-2
 *          cordova plugin add cordova-plugin-sqlite-2 --save
 *      .downto WebSQL when native sqlite not available
 *          but WebSQL was only native suppoerted by chrome
 */
import {TypeInfo} from '../../Core/TypeInfo';
import {EAbort} from '../../Core/Exception';
import {TGuid} from '../../Core/Guid';

import {TSqlEngine, TSqlConnection, TSqlQuery, TDataSet, STORAGE_INIT} from '../Storage.sql';

export {InitializeStorage} from '../Storage';

/* extends TSqlConnection */

declare module '../Storage.sql'
{
    interface TSqlConnection
    {
        Pragma(Text: string): Promise<void>;
        EnableForeignKeysConstraint(): Promise<void>;
        DisableForeignKeysConstraint(): Promise<void>;
    }
}

/* TSqliteEngineCommon */

export abstract class TSqliteEngineCommon extends TSqlEngine
{
    DebugTracing: boolean = false;

    DateTimeValue(dt: Date): string
    {
        return 'datetime(' + Math.trunc(dt.getTime() / 1000) + ', "unixepoch")';
    }

    GUID(): string
    {
        return TGuid.Generate();
    }

    GenerateGUID(): Promise<string>
    {
        return Promise.resolve(this.GUID());
    }
}

/* TSqliteEngine */

export class TSqliteEngine extends TSqliteEngineCommon
{
    constructor(public DBName: string)
    {
        super();
    }

    private static OpenDatabase(Name: string): Database | undefined
    {
        let Conn: Database;

        // globally open the database first time.
        if (! TypeInfo.Assigned(this.OpenDBFuncPtr))
        {
            try
            {
                if (TypeInfo.Assigned((window as any).sqlitePlugin))
                {
                    try
                    {
                        // support for cordova-sqlite-storage
                        Conn = OpenDBSqliteStorage(Name);
                        console.log('cordova-sqlite-storage for Sqlite');
                        this.OpenDBFuncPtr = OpenDBSqliteStorage;
                    }
                    catch (err)
                    {
                        // support for cordova-plugin-sqlite-2
                        Conn = OpenDBSqlite(Name);
                        console.log('cordova-plugin-sqlite-2 for Sqlite');
                        this.OpenDBFuncPtr = OpenDBSqlite;
                    }
                }
                else
                {
                    Conn = OpenDBWebSql(Name);
                    console.warn('window.sqlitePlugin is undefined, using WebSQL instead');
                    this.OpenDBFuncPtr = OpenDBWebSql;
                }

                return Conn;
            }
            catch (err)
            {
                this.OpenDBFuncPtr = undefined;
                return undefined;
            }
        }
        else
        {
            const OpenDBFuncPtr = this.OpenDBFuncPtr;
            if (TypeInfo.Assigned(OpenDBFuncPtr))
            {
                Conn = OpenDBFuncPtr(Name);
                return Conn;
            }
        }

        function OpenDBSqlite(Name: string): any
            { return (window as any).sqlitePlugin.openDatabase(Name, '1.0', Name, 0);  }
        function OpenDBSqliteStorage(Name: string): any
            { return  (window as any).sqlitePlugin.openDatabase({name: Name, location: 'default'}); }
        function OpenDBWebSql(Name: string)
            { return (window as any).openDatabase(Name, '1.0', Name, 5 * 1024 * 1024);  }
    }

    private static Pool = new Array<TSqlConnection>();
    private static StorageInitialized = false;
    private static OpenDBFuncPtr: ((Name: string) => any) | undefined;

/* ISqlConnectionPool */

    GetConnection(): Promise<TSqlConnection>
    {
        return new Promise<TSqlConnection>((resolve, reject) =>
        {
            const SelfType = this.constructor as typeof TSqliteEngine;
            const Conn = SelfType.Pool.pop();
            if (TypeInfo.Assigned(Conn))
            {
                // console.log('SqliteEngine: Connection.Pool hit...');
                return resolve(Conn);
            }
            else
                console.warn('SqliteEngine: Creating new connection...');

            const Db = SelfType.OpenDatabase(this.DBName);
            if (TypeInfo.Assigned(Db))
                resolve(new TSqliteConnection(this, Db));
            else
                reject(new EAbort());
        })
        .then(Conn =>
        {
            const SelfType = this.constructor as typeof TSqliteEngine;
            if (! SelfType.StorageInitialized)
            {
                return Conn.ExecSQL(STORAGE_INIT).then(() =>
                {
                    SelfType.StorageInitialized = true;
                    return Conn;
                });
            }
            else
                return Conn;
        });
    }

    ReleaseConnection(Conn: TSqlConnection): void
    {
        (this.constructor as typeof TSqliteEngine).Pool.push(Conn);
    }
}

/* TSqliteConnection */

class TSqliteConnection extends TSqlConnection
{
    constructor (private Owner: TSqliteEngine, private Instance: Database)
    {
        super();
    }

    Pragma(Text: string): Promise<void>
    {
        return new Promise<void>((resolve, reject) =>
        {
            try // enable foreign_key support
            {
                (this.Instance as any).executeSql('PRAGMA ' + Text, [],  () => resolve());
            }
            catch (e)
            {
                reject(new EAbort('SQLite No PRAGMA support'));
            }
        });
    }

    EnableForeignKeysConstraint(): Promise<void>
    {
        return this.Pragma('foreign_keys=ON')
            .catch(err => console.warn(err.message + ': foreign_keys'));
    }

    DisableForeignKeysConstraint(): Promise<void>
    {
        return this.Pragma('foreign_keys=OFF')
            .catch(err => console.warn(err.message + ': foreign_keys'));
    }

/* TSqlConnection */

    Release(): void
    {
        this.Owner.ReleaseConnection(this);
    }

    Close(): void
    {
        // sqlite has no action
    }

    BeginTrans(): Promise<void>
    {
        return Promise.resolve();
    }

    Rollback(): Promise<void>
    {
        return Promise.resolve();
    }

    Commit(): Promise<void>
    {
        return Promise.resolve();
    }

    protected InternalExecSQL(Sql: string): Promise<number>
    {
        return new Promise<any>((resolve, reject) =>
        {
            this.Instance.transaction(
                tx =>
                {
                    tx.executeSql(Sql as string, [],
                        (tx, result) =>
                            { resolve(result.rowsAffected); },
                        (tx, err) =>
                        {
                            console.error(Sql);
                            reject(err);
                            return true;
                        }
                    );
                },
                err =>
                    { reject(err); }
            );
        });
    }

    protected InternalExecSQLs(Sqls: string[]): Promise<number>
    {
        return new Promise<number>((resolve, reject) =>
        {
            let RowsAffected: number = 0;

            this.Instance.transaction(
                tx =>
                {
                    for (const sql of Sqls)
                    {
                        tx.executeSql(sql, [],
                            (tx, result) =>
                                { RowsAffected += result.rowsAffected; },
                            (tx, err) =>
                            {
                                console.error(sql);
                                reject(err);
                                return true;
                            }
                        );
                    }
                },
                err =>
                    { reject(err); },
                () =>
                    { resolve(RowsAffected); }
            );
        });
    }

    protected InternalExecQuery(Query: TSqlQuery): Promise<TDataSet>
    {
        return new Promise<TDataSet>((resolve, reject) =>
        {
            this.Instance.transaction(tx =>
            {
                tx.executeSql(Query.Sql, [],
                    (tx, result) =>
                    {
                        try
                        {
                            Query.HandleResult(result, result.rowsAffected);

                            const DataSet = new TSqliteDataSet(result);
                            resolve(DataSet);
                        }
                        catch (err)
                        {
                            reject(err);
                            throw err;
                        }
                    },
                    (tx, err) =>
                    {
                        console.error(Query.Sql);
                        // rollback transaction when return true
                        reject(err);
                        return ! Query.HandleError(err);
                    }
                );
            });
        });
    }

    protected InternalExecQuerys(Queries: Array<TSqlQuery>): Promise<Array<TDataSet>>
    {
        return new Promise<Array<TDataSet>>((resolve, reject) =>
        {
            const SqlRetVal = new Map<TSqlQuery, TDataSet>();

            this.Instance.transaction(
                tx =>
                {
                    for (const Qry of Queries)
                    {
                        tx.executeSql(Qry.Sql, [],
                            (tx, result) =>
                            {
                                try
                                {
                                    Qry.HandleResult(result, result.rowsAffected);

                                    const DataSet = new TSqliteDataSet(result);
                                    SqlRetVal.set(Qry, DataSet);
                                }
                                catch (err)
                                {
                                    reject(err);
                                    throw err;
                                }
                            },
                            (tx, err) =>
                            {
                                console.error(Qry.Sql);

                                if (! Qry.HandleError(err))
                                {
                                    reject(err);
                                    return true;    // rollback transaction
                                }
                                else
                                    return false;   // continue transaction
                            }
                        );
                    }
                },
                err =>
                    { },
                () =>
                {
                    const RetVal = new Array<TDataSet>();

                    for (const qry of Queries)
                        RetVal.push(SqlRetVal.get(qry) as TDataSet);
                    resolve(RetVal);
                }
            );
        });
    }
}

/* TSqliteDataSet */

class TSqliteDataSet extends TDataSet
{
    protected GetRecordCount(): number
    {
        if (this.IsDataSet)
            return this.SqlResult.rows.length;
        else
            return 0;
    }

    get SqlResult(): SQLResultSet
    {
        return this._SqlResult;
    }

    protected GetEffectRows(): number
    {
        if (this.IsDataSet)
            return this.RecordCount;
        else
            return this.SqlResult.rowsAffected;
    }

    protected GetIsDataSet(): boolean
    {
        return TypeInfo.IsArrayLike(this.SqlResult.rows);
    }

    protected GetFieldCount(): number
    {
        const obj = this.SqlResult.rows.item(0);
        if (obj)
            return Object.keys(obj).length;
        else
            return 0;
    }

    protected GotoRecord(RecNo: number): any
    {
        if (! TypeInfo.Assigned(this.SqlResult))
        {
            this._RecNo = 0;
            this._Bof = this._Eof = true;
            return null;
        }

        this._Bof = RecNo < 0;
        if (this._Bof)
        {
            this._Eof = this.SqlResult.rows.length === 0;
            this._RecNo = 0;
            return null;
        }

        this._Eof = RecNo >= this.SqlResult.rows.length;
        if (this._Eof)
        {
            this._Bof = this.SqlResult.rows.length === 0;
            this._RecNo = this.SqlResult.rows.length - 1;
            return null;
        }
        else
        {
            this._RecNo = RecNo;
            return this.SqlResult.rows.item(RecNo);
        }
    }
}
