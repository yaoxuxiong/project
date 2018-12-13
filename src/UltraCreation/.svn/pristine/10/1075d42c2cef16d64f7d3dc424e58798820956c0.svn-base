import {TypeInfo} from '../Core/TypeInfo';
import {Exception, EAbort} from '../Core/Exception';
import {TStringBuilder} from '../Core/StringBuilder';
import {IPersistable, TPersistRule, TPersistUpdateRule} from '../Core/Persistable';

import {IStorageEngine, TStorage, TStorageEngine} from './Storage';

export const STORAGE_INIT = 'CREATE TABLE IF NOT EXISTS _kv (key TEXT NOT NULL PRIMARY KEY, value TEXT)';
const STORAGE_GET = 'SELECT key, value FROM _kv WHERE key = ":key"';
const STORAGE_SET = 'INSERT OR REPLACE INTO _kv(key, value) VALUES(:key, :value)';
const STORAGE_REMOVE = 'DELETE FROM _kv WHERE key = ":key"';
const STORAGE_CLEAR = 'DELETE FROM _kv';

/* Exceptions */

export class EKeyNotExists extends EAbort
{
    constructor()
    {
        super('e_key_not_exists');
    }
}

export class SqlError extends Exception
{
}

export class ENoRecoredChanged extends SqlError
{
    constructor()
    {
        super('e_no_record_changed');
    }
}

export class EMultiRecordChanged extends SqlError
{
    constructor()
    {
        super('e_multi_record_changed');
    }
}

/* ISqlEngineSupport */

export interface ISqlEngineSupport
{
    /**
     *  Generate GUID string or Sql GUID function
     */
    GUID(): string;

    /**
     *  Generate a GUID
     */
    GenerateGUID(): Promise<string>;

    /**
     *  checking the sql is insert or update
     */
    IsInsertOrUpdate(sql: string): boolean;
    /**
     *  Support for ? params
     *      SELECT * FROM table WHERE FIELD = ?
     *  params as any[]
     *
     *  Support for :variable params
     *      SELECT * FROM table WHERE FIELD > :var
     *  params as {var: 'foo'}, use RegExpr to replace
     */
    AssignParams(sql: string, params: any[]): string;
    AssignParams(sql: string, params: Object): string;
    AssignParams(sql: string, ObjOrAry: Object | any[]): string;

    /**
     *  JSP value convert to Sql
     */
    ParamValue(v: any): string;

    /**
     *  JSP value convert to INSERT/UPDATE Sql
     */
    FieldValue(v: any): string;

    /**
     *  JSP Date convert to Sql
     */
    DateTimeValue(dt: Date): string;
}

/* ISqlStorage */

export interface ISqlStorage
{
    ExecSQL(Sql: string, params?: any[] | Object): Promise<number>;
    ExecSQL(Sql: string[], params?: any[] | Object): Promise<number>;
    ExecSQL(Sql: string | string[], params?: any[] | Object): Promise<number>;

    ExecQuery(Sql: string, params?: any[] | Object): Promise<TDataSet>;
    ExecQuery(Sql: string[], params?: any[] | Object): Promise<Array<TDataSet>>;
    ExecQuery(Query: TSqlQuery, params?: any[] | Object): Promise<TDataSet>;
    ExecQuery(Queries: Array<TSqlQuery>, params?: any[] | Object): Promise<Array<TDataSet>>;
    ExecQuery(Queries: string | TSqlQuery | Array<TSqlQuery>, params?: any[] | Object): Promise<TDataSet | Array<TDataSet>>;
}

/* ITransactionSupport */

export interface ITransactionSupport extends ISqlStorage
{
    readonly InTransaction: boolean;

    BeginTrans(): Promise<void>;
    Commit(): Promise<void>;
    Rollback(): Promise<void>;
}

/* ISqlConnection */

export interface ISqlConnection extends ISqlStorage, ITransactionSupport
{
    /**
     *  Release the connection
     */
    Release(): void;

    /**
     *  CLose/Destroy the connection
     */
    Close(): void;
}

/* ISqlConnectionPool */

export interface ISqlConnectionPool
{
    /**
     *  Get a free connection or Create new connection
     */
    GetConnection(): Promise<TSqlConnection>;

    /**
     *  Release the connection
     */
    ReleaseConnection(Conn: TSqlConnection): void;

    /**
     *  try GetConnection...Callback...finally ReleaseConnection
     */
    Execute<TRetVal>(Callback: (conn: TSqlConnection, ...args: any[]) => Promise<TRetVal>, ...args: any[]): Promise<TRetVal>;
}

/* extends IStorageEngine to Sql like Engine and export it */

declare module './Storage'
{
    interface IStorageEngine extends ISqlEngineSupport, ISqlConnectionPool, ISqlStorage
    {
    }
}
export {IStorageEngine};

/* TSqlEngine */

export abstract class TSqlEngine extends TStorageEngine implements ISqlEngineSupport, ISqlConnectionPool, ISqlStorage
{
/* ISqlEngineSupport */

    abstract GUID(): string;
    abstract GenerateGUID(): Promise<string>;

    IsInsertOrUpdate(sql: string): boolean
    {
        const test = sql.trim().substr(0, 7).toUpperCase().trim();
        return ['INSERT', 'UPDATE', 'REPLACE'].indexOf(test) !== -1;
    }

    AssignParams(sql: string, params: any[]): string;
    AssignParams(sql: string, params: Object): string;
    AssignParams(sql: string, ObjOrAry: Object | any[]): string
    {
        const IsInsertOrUpdate = this.IsInsertOrUpdate(sql);

        if (TypeInfo.IsArrayLike(ObjOrAry))
        {
            const params: any[] = ObjOrAry as any[];

            if (IsInsertOrUpdate)
            {
                for (const param of params)
                    sql = sql.replace('?', this.FieldValue(param));
            }
            else
            {
                for (const param of params)
                    sql = sql.replace('?', this.ParamValue(param));
            }
            return sql;
        }
        else
        {
            const Obj = ObjOrAry as any;

            return sql.replace(/\:(\w+)/g, (txt, key) =>
            {
                const value = Obj[key];

                if (IsInsertOrUpdate)
                    return this.FieldValue(value);
                else
                    return this.ParamValue(value);
            });
        }
    }

    ParamValue(v: any): string
    {
        if (! TypeInfo.Assigned(v))
            return 'NULL';
        else if (TypeInfo.IsString(v))
            return v;
        else if (v instanceof Date)
            return this.DateTimeValue(v);
        else
            return v.toString();
    }

    FieldValue(v: any): string
    {
        if (! TypeInfo.Assigned(v))
            return 'NULL';
        // primitive types: string
        else if (TypeInfo.IsString(v))
            return '"' + v.split('"').join('""') + '"';
        // primitive types: number & boolean
        else if (TypeInfo.IsNumber(v) || TypeInfo.IsBoolean(v))
            return v.toString();
        // date types
        else if (v instanceof Date)
            return this.DateTimeValue(v);
        // all other unknowns
        else
            return '"' + v.toString().split('"').join('""') + '"';
    }

    abstract DateTimeValue(dt: Date): string;

/* ISqlConnectionPool */

    async Execute<TRetVal>(Callback: (conn: TSqlConnection, ...args: any[]) => Promise<TRetVal>, ...args: any[]): Promise<TRetVal>
    {
        const conn = await this.GetConnection();
        try
        {
            await conn.BeginTrans();
            return await Callback(conn, ...args);
        }
        catch (e)
        {
            if (conn.InTransaction)
                await conn.Rollback();

            throw e;
        }
        finally
        {
            if (conn.InTransaction)
                await conn.Commit();
            this.ReleaseConnection(conn);
        }
    }

    abstract GetConnection(): Promise<TSqlConnection>;
    abstract ReleaseConnection(Conn: TSqlConnection): void;

/* ISqlStorage */

    ExecSQL(Sql: string, params?: any[] | Object): Promise<number>;
    ExecSQL(Sql: string[], params?: any[] | Object): Promise<number>;
    ExecSQL(Sql: string | string[], params?: any[] | Object): Promise<number>
    {
        return this.Execute(conn => conn.ExecSQL(Sql as any, params));
    }

    ExecQuery(Sql: string, params?: any[] | Object): Promise<TDataSet>;
    ExecQuery(Sql: string[], params?: any[] | Object): Promise<Array<TDataSet>>;
    ExecQuery(Query: TSqlQuery, params?: any[] | Object): Promise<TDataSet>;
    ExecQuery(Queries: Array<TSqlQuery>, params?: any[] | Object): Promise<Array<TDataSet>>;
    ExecQuery(Queries: string | string[] | TSqlQuery | Array<TSqlQuery>, params?: any[] | Object): Promise<TDataSet | Array<TDataSet>>
    {
        return this.Execute(conn => conn.ExecQuery(Queries as any, params));
    }

/* IStorageEngine */

    Get(Key: string): Promise<string | Object>
    {
        return this.Execute(conn => conn.Get(Key));
    }

    Set(Key: string, Value: string | Object): Promise<void>
    {
        return this.Execute<void>(conn => conn.Set(Key, Value));
    }

    RemoveKey(Key: string): Promise<void>
    {
        return this.Execute<void>(conn => conn.RemoveKey(Key));
    }

    ClearKeys(): Promise<number>
    {
        return this.Execute(conn => conn.ClearKeys());
    }

    SaveObject(Obj: IPersistable, SharedConnection?: any): Promise<void>
    {
        if (TypeInfo.Assigned(SharedConnection))
            return SharedConnection.SaveObject(Obj, SharedConnection);
        else
            return this.Execute<void>(conn => conn.SaveObject(Obj, conn));
    }

    RemoveObject(Obj: IPersistable, SharedConnection?: any): Promise<void>
    {
        if (TypeInfo.Assigned(SharedConnection))
            return SharedConnection.RemoveObject(Obj, SharedConnection);
        else
            return this.Execute<void>(conn => conn.RemoveObject(Obj, conn));
    }
}

/* TSqlConnection */

export abstract class TSqlConnection extends TStorage implements ISqlConnection
{
/* ISqlConnection */

    abstract Close(): void;
    abstract Release(): void;

/* ITransactionSupport */

    get InTransaction(): boolean
    {
        return this._InTransaction;
    }

    abstract BeginTrans(): Promise<void>;
    abstract Commit(): Promise<void>;
    abstract Rollback(): Promise<void>;

    protected _InTransaction: boolean = false;

/* ISqlStorage */
    /**
     *  Execute SQL in a transaction and Promise a Raw SQL result
     *  Mutiple SQLs execution only Promise error or success
     */
    ExecSQL(Sql: string, params?: any[] | Object): Promise<number>;
    ExecSQL(Sql: string[], params?: any[] | Object): Promise<number>;
    ExecSQL(Sql: string | string[], params?: any[] | Object): Promise<number>
    {
        if (TypeInfo.IsString(Sql))
        {
            if (TypeInfo.Assigned(params))
                Sql = StorageEngine.AssignParams(Sql, params);

            if (StorageEngine.DebugTracing)
                console.warn(Sql);
            return this.InternalExecSQL(Sql);
        }
        else
        {
            if (TypeInfo.Assigned(params))
            {
                for (let i = 0; i < Sql.length; i ++)
                {
                    Sql[i] = StorageEngine.AssignParams(Sql[i], params);

                    if (StorageEngine.DebugTracing)
                        console.warn(Sql[i]);
                }
            }
            return this.InternalExecSQLs(Sql);
        }
    }

    protected abstract InternalExecSQL(Sql: string): Promise<number>;
    protected abstract InternalExecSQLs(Sql: string[]): Promise<number>;

    /**
     *  Execute Query object transaction and Promise a DataSet Result
     *  the Error handling was passed to TSqlQuery and it's derived classes for more Transaction Control
     */
    ExecQuery(Sql: string, params?: any[] | Object): Promise<TDataSet>;
    ExecQuery(Sql: string[], params?: any[] | Object): Promise<Array<TDataSet>>;
    ExecQuery(Query: TSqlQuery, params?: any[] | Object): Promise<TDataSet>;
    ExecQuery(Queries: Array<TSqlQuery>, params?: any[] | Object): Promise<Array<TDataSet>>;
    ExecQuery(Queries: string | string[] | TSqlQuery | Array<TSqlQuery>, params?: any[] | Object): Promise<TDataSet> | Promise<Array<TDataSet>>
    {
        if (TypeInfo.IsString(Queries))
            return this.InternalExecQuery(new TSqlQuery(Queries, params));
        else if (Queries instanceof TSqlQuery)
        {
            if (TypeInfo.Assigned(params))
                Queries.Params = params;
            return this.InternalExecQuery(Queries);
        }
        else
        {
            const ary = Array<TSqlQuery>();

            for (const Qry of Queries)
            {
                if (! TypeInfo.IsString(Qry))
                {
                    if (TypeInfo.Assigned(params))
                        Qry.Params = params;
                    ary.push(Qry);
                }
                else
                    ary.push(new TSqlQuery(Qry, params));
            }

            return this.InternalExecQuerys(ary);
        }
    }

    protected abstract InternalExecQuery(Query: TSqlQuery): Promise<TDataSet>;
    protected abstract InternalExecQuerys(Queries: Array<TSqlQuery>): Promise<Array<TDataSet>>;

/* IStorage */
    /**
     *  SQL basic storage support
     *  @param Key
     */
    Get(Key: string): Promise<string | Object>
    {
        return this.ExecQuery(new TSqlQuery(STORAGE_GET, {key: Key})).then(DataSet =>
        {
            if (DataSet.RecordCount !== 1)
                return Promise.reject(new EKeyNotExists());

            const RetVal = DataSet.Curr.value as string;
            if (TypeInfo.Assigned(RetVal) && TypeInfo.IsString(RetVal) && RetVal[0] === '{')
                return JSON.parse(RetVal);
            else
                return RetVal;
        });
    }

    Set(Key: string, Value: string | Object): Promise<void>
    {
        if (Value instanceof Object)
            Value = JSON.stringify(Value);

        return this.ExecSQL(STORAGE_SET, {key: Key, value: Value}).then(RowsAffected =>
        {
            if (RowsAffected === 1)
                return Promise.resolve();
            else
                return Promise.reject(new EKeyNotExists());
        });
    }

    RemoveKey(Key: string): Promise<void>
    {
        return this.ExecSQL(STORAGE_REMOVE, {key: Key}).then(RowsAffected =>
        {
            if (RowsAffected === 1)
                return Promise.resolve();
            else
                return Promise.reject(new EKeyNotExists());
        });
    }

    ClearKeys(): Promise<number>
    {
        return this.ExecSQL(STORAGE_CLEAR);
    }

    InsertByRules(Rules: Array<TPersistRule>, Obj: IPersistable): Promise<void>
    {
        const Instance = TypeInfo.Assigned(Obj.Ref) ? Obj.Ref : Obj as any;
        const Queries = new Array<TSqlQuery>();

        for (const Rule of Rules)
        {
            try
            {
                const Inserts = new Array<string>();
                const Values = new Array<any>();

                // INSERT INTO table()
                this.StringBuilder.Append('INSERT INTO ', Rule.Name, '(');
                // KeyProps
                if (Rule.KeyProps.length > 0)
                {
                    for (const str of Rule.KeyProps)
                    {
                        if (Inserts.indexOf(str) === -1)
                        {
                            Inserts.push(str);
                            Values.push(Instance[str]);

                            this.StringBuilder.Append(str, ', ');
                        }
                    }
                }
                // Props
                for (const str of Rule.Props)
                {
                    if (Inserts.indexOf(str) === -1)
                    {
                        const PropValue = Instance[str];
                        if (TypeInfo.Assigned(PropValue))
                        {
                            this.StringBuilder.Append(str, ', ');
                            Values.push(PropValue);
                        }
                    }
                }
                this.StringBuilder.Pop().Append(')', ' VALUES(');

                if (Values.length > 0)
                {
                    // VALUES()
                    for (const Value of Values)
                        this.StringBuilder.Append(StorageEngine.FieldValue(Value), ',');
                    this.StringBuilder.Pop().Append(')');

                    Queries.push(new TSqlQuery(this.StringBuilder.toString()));
                }

                this.StringBuilder.Clear();
            }
            catch (err)
            {
                this.StringBuilder.Clear();
                return Promise.reject(err);
            }
        }

        if (Queries.length === 0)
            return Promise.reject(new Error('Nothing to Append'));  // everything is null? must be an error
        else
            return this.ExecQuery(Queries).then(() => {});
    }

    UpdateByRules(Rules: Array<TPersistRule>, Obj: IPersistable): Promise<void>
    {
        const Instance = TypeInfo.Assigned(Obj.Ref) ? Obj.Ref : Obj as any;
        const OldObj = TypeInfo.Assigned(Obj.OldValue) ? Obj.OldValue : Instance;

        const Queries = new Array<TSqlQuery>();

        for (const Rule of Rules)
        {
            try
            {
                const Updates = new Array<string>();
                const UpdateValues = new Array<any>();
                let Wheres: Array<string>;   // init later
                const WhereValues = new Array<any>();

                if (Rule.UpdateRule !== TPersistUpdateRule.WhereKeyOnly)
                {
                    Wheres = new Array<string>();
                    Object.assign(Wheres, Rule.KeyProps);
                }
                else
                    Wheres = Rule.KeyProps;

                // Key Fields
                for (const str of Rule.KeyProps)
                {
                    const OldValue = OldObj[str];
                    const NewValue = Instance[str];

                    // KeyProps in where of any case
                    WhereValues.push(OldValue);

                    // KeyProps in updates
                    if (! Rule.NoUpdateKeyProps && Updates.indexOf(str) === -1 && NewValue !== OldValue)
                    {
                        Updates.push(str);
                        UpdateValues.push(NewValue);
                    }
                }

                // Other Fields
                for (const str of Rule.Props)
                {
                    const OldValue = OldObj[str];
                    const NewValue = Instance[str];

                    // all in where by rule
                    if (Rule.UpdateRule === TPersistUpdateRule.WhereAll &&
                        TypeInfo.Assigned(OldValue) && Wheres.indexOf(str) === -1)
                    {
                        Wheres.push(str);
                        WhereValues.push(OldValue);
                    }

                    // updates when changed
                    if ((OldObj === Instance || NewValue !== OldValue) &&
                        TypeInfo.Assigned(NewValue) && Updates.indexOf(str) === -1)
                    {
                        Updates.push(str);
                        UpdateValues.push(NewValue);

                        if (Rule.UpdateRule === TPersistUpdateRule.WhereChanged &&
                            TypeInfo.Assigned(OldValue) && Wheres.indexOf(str) === -1)
                        {
                            Wheres.push(str);
                            WhereValues.push(OldValue);
                        }
                    }
                }

                if (Updates.length > 0 && Wheres.length > 0)
                {
                    this.StringBuilder.Append('UPDATE ', Rule.Name, ' SET ');
                    for (let i = 0; i < Updates.length; i ++)
                    {
                        this.StringBuilder.Append(Updates[i] + '=');
                        this.StringBuilder.Append(StorageEngine.FieldValue(UpdateValues[i]));
                        this.StringBuilder.Append(',');
                    }
                    this.StringBuilder.Pop();

                    this.StringBuilder.Append(' WHERE ');
                    for (let i = 0; i < Wheres.length; i ++)
                    {
                        this.StringBuilder.Append(Wheres[i] + '=');
                        this.StringBuilder.Append(StorageEngine.FieldValue(WhereValues[i]));
                        this.StringBuilder.Append(' AND ');
                    }
                    this.StringBuilder.Pop();

                    if (StorageEngine.StrictUpdate)
                        Queries.push(new TSqlStrictQuery(this.StringBuilder.toString()));
                    else
                        Queries.push(new TSqlQuery(this.StringBuilder.toString()));
                }

                this.StringBuilder.Clear();
            }
            catch (err)
            {
                this.StringBuilder.Clear();
                return Promise.reject(err);
            }
        }

        if (Queries.length === 0)
            return Promise.resolve();   // nothing changed..it cool, no error
        else
            return this.ExecQuery(Queries).then(() => {});
    }

    DeleteByRules(Rules: Array<TPersistRule>, Obj: IPersistable): Promise<void>
    {
        const Queries = new Array<TSqlQuery>();

        const Instance = TypeInfo.Assigned(Obj.Ref) ? Obj.Ref : Obj as any;
        const OldObj = TypeInfo.Assigned(Obj.OldValue) ? Obj.OldValue : Instance;

        for (let i = Rules.length; i > 0; i --)
        {
            try
            {
                const Rule = Rules[i - 1];
                let Wheres: Array<string>;   // init later

                if (Rule.UpdateRule !== TPersistUpdateRule.WhereKeyOnly)
                {
                    Wheres = new Array<string>();
                    Object.assign(Wheres, Rule.KeyProps);

                    for (const str of Rule.Props)
                    {
                        if (Wheres.indexOf(str) === -1)
                            Wheres.push(str);
                    }
                }
                else
                    Wheres = Rule.KeyProps;

                // DELETE FROM table
                this.StringBuilder.Append('DELETE FROM ', Rule.Name, ' WHERE ');
                for (const str of Wheres)
                {
                    this.StringBuilder.Append(str, '=');
                    this.StringBuilder.Append(StorageEngine.FieldValue(OldObj[str]), ' AND ');
                }
                this.StringBuilder.Pop();

                if (StorageEngine.StrictDelete)
                    Queries.push(new TSqlStrictQuery(this.StringBuilder.toString()));
                else
                    Queries.push(new TSqlQuery(this.StringBuilder.toString()));

                this.StringBuilder.Clear();
            }
            catch (err)
            {
                this.StringBuilder.Clear();
                return Promise.reject(err);
            }
        }

        if (Queries.length === 0)
            return Promise.reject(new Error('Nothing to Delete'));  // everything is null? it must be an error
        else
            return this.ExecQuery(Queries).then(() => {});
    }

    protected StringBuilder = new TStringBuilder();
}

/* TField */

export class TField
{
    constructor(private Owner: TFields, private _Name: string)
    {

    }

    get Name(): string
        { return this._Name; }

    get Value(): any
    {
        return this.Owner.FieldValue(this._Name);
    }
}

/* TUndefinedField */

class TUndefinedField extends TField
{
    get Value(): any
    {
        return undefined;
    }
}

/* TFields */

export abstract class TFields
{
    constructor(protected Owner: TDataSet, ...args: any[])
    {
    }

    get Count(): number
    {
        return this.Hash.size;
    }

    FindField(Name: string): TField | undefined
    {
        return this.Hash.get(Name);
    }

    /**
     *  Find Field by Field.Name
     *      differ to FindField: return TUndefinedField when field not exists
     */
    FieldByName(Name: string): TField /* | TUndefinedField */
    {
        let RetVal = this.Hash.get(Name);

        if (! TypeInfo.Assigned(RetVal))
            RetVal = new TUndefinedField(this, 'undefined');

        return RetVal;
    }

    FieldValue(FieldName: string): any
    {
        return this.Owner.Curr[FieldName];
    }

    protected Hash = new Map<string, TField>();
}

export abstract class TSqlResult
{
    constructor(protected _SqlResult: any)
        {}

    get SqlResult(): any
    {
        return this._SqlResult;
    }

    get IsDataSet(): boolean
        { return this.GetIsDataSet(); }

    get EffectRows(): number
        { return this.GetEffectRows(); }

    protected abstract GetIsDataSet(): boolean;
    protected abstract GetEffectRows(): number;
}

/* TDataSet */

export abstract class TDataSet extends TSqlResult
{
    constructor(SqlResult: any)
    {
        super(SqlResult);

        if (this.IsDataSet)
            this.GotoRecord(0);
    }

    get Bof(): boolean
        { return this._Bof; }
    get Eof(): boolean
        { return this._Eof; }
    get IsEmpty(): boolean
        { return this._Bof === true && this._Eof === true; }

    /**
     *  Cursors
     */
    First(): any
        { return this.GotoRecord(0); }
    Last(): any
        { return this.GotoRecord(this.RecordCount); }
    Next(): any
        { return this.GotoRecord(this._RecNo + 1); }
    Piror(): any
        { return this.GotoRecord(this._RecNo - 1); }
    get RecNo(): number
        { return this._RecNo; }
    set RecNo(value: number)
        { this.GotoRecord(value); }

    get Curr(): any
        { return this.GotoRecord(this._RecNo); }

    get RecordCount(): number
        { return this.GetRecordCount(); }
    get FieldCount(): number
        { return this.GetFieldCount(); }

    protected _RecNo: number = 0;
    protected _Bof: boolean = true;
    protected _Eof: boolean = true;

// abstracts
    protected abstract GetRecordCount(): number;
    protected abstract GetFieldCount(): number;
    protected abstract GotoRecord(RecNo: number): any;

    /* todo: it's possiable to do?
    Append();
    Delete();
    Post();
    */
}

/* TSqlQuery */

export class TSqlQuery
{
    /**
     *  '?' in sql segement
     *  *INSERT OR UPDATE:
     *      new TSqlQuery('update table set field1=?, field2=? where key=?', ['abcd', 1234, 'key'])
     *          => update table set field1="abcd", field2=1234 where key="key"

     *  SELECT:
     *      new TSqlQuery('select * from table where field1=?, field2=?', ['abcd', 1234])
     *          => select * from table where field1=abcd and field2=1234
     *                                              ^^^^ error
     *  :param in sql segement
     *      new TSqlQuery('select * from table where field1=:param', {param: 'test'})
     */

    constructor (sql: string, params?: Object | any[])
    {
        this._Sql = sql.trim();
        this.Params = params;

        this._IsInsertOrUpdate = StorageEngine.IsInsertOrUpdate(this._Sql);
    }

    get Sql(): string
    {
        let RetVal: string;

        if (TypeInfo.Assigned(this.Params))
            RetVal = StorageEngine.AssignParams(this._Sql, this.Params);
        else
            RetVal = this._Sql;

        if (StorageEngine.DebugTracing)
            console.warn(RetVal);

        return RetVal;
    }

    get IsInsertOrUpdate(): boolean
    {
        return this._IsInsertOrUpdate;
    }

    /**
     *  Handle a Successful Result. Throw a exception to rollback Transaction
     */
    HandleResult(Result: any, EffectRows: number): void
    {

    }

    /**
     *  Returns Is the Error can be Handled. also indicate the Transaction should continues or rollback
     *  or throw a exception to rollback Transaction
     */
    HandleError(Error: any): boolean
    {
        return false;
    }

    private _Sql: string;
    private _IsInsertOrUpdate: boolean;

    Params: Object | any[];
}

/* TSqlStrictQuery */

export class TSqlStrictQuery extends TSqlQuery
{
    HandleResult(Result: any, EffectRows: number): void
    {
        super.HandleResult(Result, EffectRows);

        if (EffectRows === 0)
            throw new ENoRecoredChanged();
        else if (EffectRows !== 1)
            throw new EMultiRecordChanged();
    }
}
