import {TypeInfo} from '../Core/TypeInfo';
import {Platform} from '../Core/Platform';
import {ENotImplemented} from '../Core/Exception';

import {IPersistable, TPersistRule} from '../Core/Persistable';
import {IBeforePersist, IBeforeInsert, IBeforeUpdate, IBeforeDelete} from '../Core/Persistable';
import {IAfterPersist, IAfterInsert, IAfterUpdate, IAfterDelete} from '../Core/Persistable';

/* IStorage */

export interface IStorage
{
    Get(Key: string): Promise<string | Object>;
    Set(Key: string, Value: string | Object): Promise<void>;
    RemoveKey(Key: string): Promise<void>;
    ClearKeys(): Promise<number>;

    SaveObject(Obj: IPersistable, State?: any): Promise<void>;
    RemoveObject(Obj: IPersistable, State?: any): Promise<void>;
}

/* IStorageEngine */

export interface IStorageEngine extends IStorage
{
    DebugTracing: boolean;

    StrictInsert: boolean;  // don't trying update when faiure
    StrictUpdate: boolean;  // use T
    StrictDelete: boolean;
}

declare global
{
/* extends StorageEngine to window global variable */

    let StorageEngine: IStorageEngine | undefined;

    interface Window
    {
        StorageEngine: IStorageEngine | undefined;
    }

    module NodeJS
    {
        interface Global
        {
            StorageEngine: IStorageEngine | undefined;
        }
    }
}

declare var global: any;

/* InitializeStorage */

export function InitializeStorage(Engine: IStorageEngine): IStorageEngine
{
    if (Platform.IsBrowser)
    {
        console.log('initialize StorageEngine as global variable & windows.StorageEngine');

        window.StorageEngine = Engine;
        StorageEngine = Engine;
    }

    if (Platform.IsNodeJS)
    {
        console.log('initialize StorageEngine as NodeJS global variable');
        global.StorageEngine = Engine;
    }

    return Engine;
}

/* TStorage */

export abstract class TStorage implements IStorage
{
    constructor()
    {
    }

/* Simple Key/Value Support */

    abstract Get(Key: string): Promise<string | Object>;
    abstract Set(Key: string, Value: string | Object): Promise<void>;
    abstract RemoveKey(Key: string): Promise<void>;
    abstract ClearKeys(): Promise<number>;

/* Persistable Object Support */

    async SaveObject(Obj: IPersistable, State?: any): Promise<void>
    {
        const ObjEvent = (Obj as any) as IBeforePersist & IBeforeInsert & IBeforeUpdate &
            IAfterPersist & IAfterInsert & IAfterUpdate;

        const Rules = new Array<TPersistRule>();
        Obj.DefineRules(Rules);

        if (TypeInfo.Assigned(ObjEvent.BeforePersist))
            await ObjEvent.BeforePersist(State);

        if (! Obj.IsEditing)
        {
            if (StorageEngine.StrictInsert)
            {
                if (TypeInfo.Assigned(ObjEvent.BeforeInsert))
                    await ObjEvent.BeforeInsert(State);

                await this.InsertByRules(Rules, Obj);

                if (TypeInfo.Assigned(ObjEvent.AfterInsert))
                    await ObjEvent.AfterInsert(State);
            }
            else
            try
            {
                if (TypeInfo.Assigned(ObjEvent.BeforeInsert))
                    await ObjEvent.BeforeInsert(State);

                await this.InsertByRules(Rules, Obj);

                if (TypeInfo.Assigned(ObjEvent.AfterInsert))
                    await ObjEvent.AfterInsert(State);
            }
            catch (e)
            {
                console.warn('SaveObject using INSERT failure, trying UPDATE');

                if (TypeInfo.Assigned(ObjEvent.BeforeUpdate))
                    await ObjEvent.BeforeUpdate(State);

                await this.UpdateByRules(Rules, Obj);

                if (TypeInfo.Assigned(ObjEvent.AfterUpdate))
                    await ObjEvent.AfterUpdate(State);

                console.log('SaveObject using UPDATE successful.');
            }
        }
        else
        {
            if (TypeInfo.Assigned(ObjEvent.BeforeUpdate))
                await ObjEvent.BeforeUpdate(State);

            await this.UpdateByRules(Rules, Obj);

            if (TypeInfo.Assigned(ObjEvent.AfterUpdate))
                await ObjEvent.AfterUpdate(State);
        }

        if (TypeInfo.Assigned(ObjEvent.AfterPersist))
            await ObjEvent.AfterPersist(State);

        Obj.MergeChanges();
    }

    async RemoveObject(Obj: IPersistable, State?: any): Promise<void>
    {
        const ObjEvent = (Obj as any) as IBeforeDelete & IAfterDelete;
        const Rules = new Array<TPersistRule>();

        Obj.DefineRules(Rules);

        if (TypeInfo.Assigned(ObjEvent.BeforeDelete))
            await ObjEvent.BeforeDelete(State);

        await this.DeleteByRules(Rules, Obj);

        if (TypeInfo.Assigned(ObjEvent.AfterDelete))
            await ObjEvent.AfterDelete(State);
    }

    protected InsertByRules(Rules: Array<TPersistRule>, Obj: IPersistable): Promise<void>
    {
        return Promise.reject(new ENotImplemented());
    }

    protected UpdateByRules(Rules: Array<TPersistRule>, Obj: IPersistable): Promise<void>
    {
        return Promise.reject(new ENotImplemented());
    }

    protected DeleteByRules(Rules: Array<TPersistRule>, Obj: IPersistable): Promise<void>
    {
        return Promise.reject(new ENotImplemented());
    }
}

/* TStorageEngine */

export abstract class TStorageEngine extends TStorage
{
    DebugTracing: boolean = false;
    StrictInsert: boolean = false;
    StrictDelete: boolean = false;
    StrictUpdate: boolean = false;
}
