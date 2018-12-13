/* TypeInfo namespace */

export namespace TypeInfo
{
    export type Primitive = string | number | boolean;

    export const UNDEFINED: string = typeof (void 0);
    export const BOOLEAN: string = typeof true;
    export const NUMBER: string = typeof 0;
    export const STRING: string = typeof '';
    export const OBJECT: string = typeof {};
    export const FUNCTION: string = typeof function () {};

    /**
     * Returns true if the value Assigned (defined and not null)
     * @param value
     * @returns {boolean}
     */
    export function Assigned(value?: any): value is Object
    {
        return (typeof value !== UNDEFINED) && (value !== null);
    }

    /**
     * Returns true if the value defined
     * @param value
     * @returns {boolean}
     */
    export function Defined(value?: any): value is undefined
    {
        return (typeof value !== UNDEFINED);
    }

    /**
     * Returns true if the value is ture null
     * @param value
     * @returns {boolean}
     */
    export function IsNull(value?: any): value is null
    {
        return (typeof value !== UNDEFINED) && (value === null);
    }

    /**
     * Returns true if the value parameter is a true/false
     * @param value
     * @returns {boolean}
     */
    export function IsBoolean(value: any): value is boolean
    {
        return typeof value === BOOLEAN;
    }

    /**
     * Returns true if the value parameter is a number.
     * @param value
     * @param allowNaN Default is true.
     * @returns {boolean}
     */
    export function IsNumber(value: any, allowNaN: boolean = true): value is number
    {
        return typeof value === NUMBER && (allowNaN || ! isNaN(value));
    }

    /**
     * Returns true if is a number and is NaN.
     * @param value
     * @returns {boolean}
     */
    export function IsTrueNaN(value: any): value is number
    {
        return typeof value === NUMBER && isNaN(value);
    }

    /**
     * Returns true if the value parameter is a string.
     * @param value
     * @returns {boolean}
     */
    export function IsString(value: any): value is string
    {
        return typeof value === STRING;
    }

    /**
     * Returns true if the value is a boolean, string, number, null, or undefined.
     * @param value
     * @returns {boolean}
     */
    export function IsPrimitive(value: any): value is Primitive
    {
        const t = typeof value;
        switch (t)
        {
        case BOOLEAN:
        case STRING:
        case NUMBER:
        case UNDEFINED:
            return true;
        case OBJECT:
            return value === null;
        }
        return false;
    }

    /**
     * Returns true if the value parameter is a function.
     * @param value
     * @returns {boolean}
     */
    export function IsFunction(value: any): value is Function
    {
        return typeof value === FUNCTION;
    }

    /**
     * Returns true if the value parameter is an object.
     * @param value
     * @param allowNull If false (default) null is not considered an object.
     * @returns {boolean}
     */
    export function IsObject(value: any, allowNull: boolean = false): boolean
    {
        return typeof value === OBJECT && (allowNull || value !== null);
    }

    export function IsArrayLike(instance: any): boolean
    {
        /*
        * NOTE:
        *
        * Functions:
        * Enumerating a function although it has a .length property will yield nothing or unexpected results.
        * Effectively, a function is not like an array.
        *
        * Strings:
        * Behave like arrays but don't have the same exact methods.
        */
        return Assigned(instance) && (
            (instance instanceof Array) ||
            IsString(instance) ||
            (! IsFunction(instance) && HasMember(instance, 'length'))
        );
    }

    /**
     *  Zero a Array
     */
    export type TArrayTypes = Array<number> | Uint8Array | Uint16Array | Uint32Array | Float32Array | Float64Array;

    export function ZeroArray(ary: TArrayTypes)
    {
        if (ary.fill)
        {
            ary.fill(0);
        }
        else
        {
            for (let I = 0; I < ary.length; I ++)
                ary[I] = 0;
        }
    }

    export function ArrayCopy(Dst: TArrayTypes, Src: TArrayTypes,
        SrcOffset: number, Count: number, DstOffset: number = 0): void
    {
        if ((Src as any).subarray && (Dst as any).subarray)
        {
            (Dst as any).set((Src as any).subarray(SrcOffset, SrcOffset + Count), DstOffset);
        }
        // Fallback to ordinary array
        else
        {
            for (let i = 0; i < Count; i++)
            Dst[DstOffset + i] = Src[SrcOffset + i];
        }
    }

    /**
     *  Guarantees a number value or NaN instead.
     *  @param value
     *  @returns {number}
     */
    export function NumberOrNaN(value: any): number
    {
        return isNaN(value) ? NaN : value;
    }

    /**
     */
    export function HasMember(value: any, property: string): boolean
    {
        return Assigned(value) && ! IsPrimitive(value) && (property in value);
    }

    /**
     */
    export function HasMemberOfType(instance: any, property: string, type: string): boolean
    {
        return HasMember(instance, property) && typeof(instance[property]) === type;
    }

    /**
     *  Create any object
     */
    export interface ClassConstructor<T>
    {
        new (...args: any[]): T;
    }

    export function Create<T>(Creater: ClassConstructor<T>, ...args: any[]): T
    {
        return new Creater(args);
    }

    /**
     *  access Object using Key/Value Hash
     */
    export interface TKeyValueHash<T>
    {
        [Name: string]: T;
    }

    export interface TReadonyKeyValueHash<T>
    {
        readonly [Name: string]: T;
    }

    /**
     *  get property Value
     */
    export function GetPropValue<T, K extends keyof T>(Obj: T, PropName: K): T[K]
    {
        return Obj[PropName];
    }

    /**
     *  set property Value
     */
    export function SetPropValue<T, K extends keyof T>(Obj: T, PropName: K, PropValue: T[K])
    {
        Obj[PropName] = PropValue;
    }

/* Decorator */

    /** Class Decorator:
     *      seal class for futher extendion or add properties
     */
    export function Sealed(): Function
    {
        return (Cls: Function) =>
        {
            Object.seal(Cls);
            Object.seal(Cls.prototype);
        };
    }

    /** Class Decorator:
     *      static implements decorator
     *
     *      interface FooStatic
     *      {
     *          function bar();
     *      }
     *
     *      @StaticImplements<FooStatic>
     *      class Foo
     *      {
     *          static function bar() {};   // shows error if not implements this
     *      }
     */
    export function StaticImplements<T>()
    {
        return (constructor: T) => {};
    }
}
Object.freeze(TypeInfo);
