import {TypeInfo} from './TypeInfo';

/* IPersistable */

export interface IPersistable
{
    Ref?: any;

    readonly IsEditing: boolean;
    OldValue?: any;

    /**
     *  Create RestorePoint to OldValue
     *      Ref
     *      OldValue losts when Object was saved by Storage / RevertChanges() / MergeChanges()
     */
    Edit(): void;

    /**
     *  for Storage
     *  define Storage persist Rules
     */
    DefineRules(Rules: Array<TPersistRule>): void;

    /**
     *  Revert Changes to OldValue
     */
    RevertChanges(): void;
    /**
     *  Merge Changes
     */
    MergeChanges(): void;
}

export interface IBeforePersist
{
    BeforePersist(...args: any[]): Promise<void>;
}

export interface IBeforeInsert
{
    BeforeInsert(...args: any[]): Promise<void>;
}

export interface IBeforeUpdate
{
    BeforeUpdate(...args: any[]): Promise<void>;
}

export interface IBeforeDelete
{
    BeforeDelete(...args: any[]): Promise<void>;
}

export interface IAfterPersist
{
    AfterPersist(...args: any[]): Promise<void>;
}

export interface IAfterInsert
{
    AfterInsert(...args: any[]): Promise<void>;
}

export interface IAfterUpdate
{
    AfterUpdate(...args: any[]): Promise<void>;
}

export interface IAfterDelete
{
    AfterDelete(...args: any[]): Promise<void>;
}

export interface IJsonMapper
{
    JsonMap(Key: string, Value: any): any;
}

/* TPersistRule */

export enum TPersistUpdateRule {WhereKeyOnly, WhereChanged, WhereAll}

export interface IPersistRuleOptions
{
    UpdateRule?: TPersistUpdateRule;
    NoUpdateKeyProps?: boolean;
}

export class TPersistRule
{
    constructor(Name: string, KeyProps: string[], Props: string[],
        opts?: IPersistRuleOptions)
    {
        opts = Object.assign({UpdateRule: this.UpdateRule, NoUpdateKeyProps: this.NoUpdateKeyProps}, opts);

        this.Name = Name;
        this.KeyProps = KeyProps;
        this.Props = Props;

        this.UpdateRule = opts.UpdateRule;
        this.NoUpdateKeyProps = opts.NoUpdateKeyProps;
    }

    Name: string;
    KeyProps: string[];
    Props: string[];

    UpdateRule: TPersistUpdateRule = TPersistUpdateRule.WhereKeyOnly;
    NoUpdateKeyProps: boolean = false;
}

/* TAssignable */

export interface IAssignOptions
{
    Merge?: boolean;
    NoTriggerAfterAssign?: boolean;
    NoRecursive?: boolean;
}

export abstract class TAssignable
{
    static AssignProperties(dst: any, src: any): any;
    static AssignProperties(dst: any, src: any, merge: boolean): any;
    static AssignProperties(dst: any, src: any, opts: IAssignOptions): any;
    static AssignProperties(dst: any, src: any, opts?: boolean | IAssignOptions): any
    {
        let Merge = false;
        let NoTriggerAfterAssign = false;
        let NoRecursive = false;

        if (TypeInfo.Assigned(opts))
        {
            if (! TypeInfo.IsBoolean(opts))
            {
                Merge = opts.Merge || false;
                NoTriggerAfterAssign = opts.NoTriggerAfterAssign || false;
                NoRecursive = opts.NoRecursive || false;
            }
            else
                Merge = opts;
        }


        for (const prop in src)
        {
            // at lease we need name match to copy to
            if (! Merge)
            {
                if (! (prop in dst))
                    continue;
            }
            const PropValue = src[prop];

            if (TypeInfo.IsPrimitive(PropValue))
            {
                // todo: check dst[prop] type match?
                try
                {
                    dst[prop] = PropValue;
                }
                catch (e)
                {
                    // PropValue maybe comes from getter
                    // but dst[prop] may not have setter, this can not be decided
                }
                continue;
            }

            if (PropValue instanceof Date)
            {
                dst[prop] = new Date(PropValue);
                continue;
            }

            // Generic Array
            if (PropValue instanceof Array)
            {
                // incase Array has futher inheritance
                const Creator = PropValue.constructor as {new(...args: any[]): Array<any>};

                dst[prop] = new Creator(...PropValue);
                continue;
            }
            // TypedArray
            if (PropValue instanceof Int8Array || PropValue instanceof Uint8Array ||
                PropValue instanceof Int16Array || PropValue instanceof Uint16Array ||
                PropValue instanceof Int32Array || PropValue instanceof Uint32Array ||
                PropValue instanceof Float32Array || PropValue instanceof Float64Array)
            {
                const Creator = PropValue.constructor as {new(...args: any[]): any};
                dst[prop] = new Creator(PropValue);
                continue;
            }

            if (PropValue instanceof Map)
            {
                const Creator = PropValue.constructor as {new(...args: any[]): Map<any, any>};
                dst[prop] = new Creator(PropValue);
                continue;
            }

            if (PropValue instanceof Set)
            {
                const Creator = PropValue.constructor as {new(...args: any[]): Set<any>};
                dst[prop] = new Creator(PropValue);
                continue;
            }

            // todo: is any other types need to Assign? before Object

            if (TypeInfo.IsObject(PropValue))
            {
                if (PropValue instanceof TAssignable)
                {
                    if (! NoRecursive)
                    {
                        dst[prop] = Object.create(PropValue);
                        dst[prop].Assign(PropValue);
                    }
                    else
                        dst[prop] = PropValue;
                }
                else
                    dst[prop] = Object.assign(Object.create(PropValue), PropValue);

                continue;
            }
        }

        if (! NoTriggerAfterAssign && dst instanceof TAssignable)
            dst.AfterAssignProperties();
        return dst;
    }

    static Clone(src: any): any
    {
        return this.AssignProperties(Object.create(src), src,
            {Merge: true, NoTriggerAfterAssign: true});
    }

    Assign(src: any): any;
    Assign(src: any, merge: boolean): any;
    Assign(src: any, opts: IAssignOptions): any;
    Assign(src: any, opts?: boolean | IAssignOptions): any
    {
        return (this.constructor as typeof TAssignable).AssignProperties(this, src, opts as any);
    }

    AssignTo(dst: any): any;
    AssignTo(dst: any, merge: boolean): any;
    AssignTo(dst: any, opts: IAssignOptions): any;
    AssignTo(dst: any, opts?: boolean |IAssignOptions): void
    {
        if (dst instanceof TAssignable)
            dst.Assign(this, opts as any);
        else
            TAssignable.AssignProperties(dst, this, opts as any);
    }

    Clone(): this
    {
        return (Object.create(this) as TAssignable).Assign(this,
            {Merge: true, NoTriggerAfterAssign: true});
    }

    protected AfterAssignProperties(): void
    {
        // nothing to do now
    }
}

/* TPersistable */

export abstract class TPersistable extends TAssignable implements IPersistable
{
    get IsReadOnly(): boolean
    {
        return Object.isFrozen(this);
    }

/* IPersistable */

    Edit(): this
    {
        if (! TypeInfo.Assigned(this.OldValue))
        {
            this.OldValue = this.Clone();
            Object.assign(this.OldValue, this);
        }

        return this;
    }

    get IsEditing(): boolean
    {
        return TypeInfo.Assigned(this.OldValue);
    }

    /** @deprecated */
    DefinePropRules(Rules: Array<TPersistRule>): void
    {
        // nothing to do
    }

    DefineRules(Rules: Array<TPersistRule>): void
    {
        this.DefinePropRules(Rules);

        if (Rules.length > 0)
            console.warn('DefinePropRules is Deprecated use DefineRules instead.');
    }

    RevertChanges(): void
    {
        if (TypeInfo.Assigned(this.OldValue))
        {
            this.Assign(this.OldValue);
            delete this.OldValue;
        }
    }

    MergeChanges(): void
    {
        delete this.OldValue;
    }

    OldValue?: this;
}

export class TRefPersistable<TRef> extends TPersistable
{
    constructor(public Ref: TRef)
    {
        super();
    }

    Edit(): this
    {
        this._IsEditing = true;
        return this;
    }

    get IsEditing(): boolean
    {
        return this._IsEditing;
    }

    RevertChanges(): void
    {
        this._IsEditing = false;
    }

    MergeChanges(): void
    {
        this._IsEditing = false;
    }

    private _IsEditing = false;
}
