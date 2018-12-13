import 'rxjs/add/operator/toPromise';
import {TypeInfo} from './TypeInfo';
// import {EAbort, ENotImplemented} from './Exception';

/** TLV */

export type IntTypeSize = 1 | 2 | 3 | 4;

export class TLV
{
    static Register(Type: number, TypeLV: typeof TLV, Hint: string)
    {
        console.log('TLV ' + Hint + '(0x' + Type.toString(16) + ') registered');
        this._TLVDict.set(Type, TypeLV);
    }

    static DecodeFrom(View: Uint8Array, StartOffset: number, TypeSize: IntTypeSize = 1, LengthSize: IntTypeSize = 1): Array<TLV>
    {
        const RetVal = new Array<TLV>();
        let Idx = StartOffset;

        while (Idx < View.byteLength)
        {
            if (Idx + TypeSize > View.byteLength)
                break;
            let Type = 0;
            for (let i = 0; i < TypeSize; i ++)
            {
                Type = Type * 256 + View[Idx];
                Idx ++;
            }

            if (Idx + LengthSize > View.byteLength)
                break;
            let Length = 0;
            for (let i = 0; i < LengthSize; i ++)
            {
                Length = Length * 256 + View[Idx];
                Idx ++;
            }

            if (Idx + Length > View.byteLength)
                break;
            const RAW = new Uint8Array(View.buffer, View.byteOffset + Idx, Length);
            Idx += Length;

            const TypeLV = this._TLVDict.get(Type);
            if (TypeInfo.Assigned(TypeLV))
            {
                const Instance = new TypeLV(Type, Length, RAW);
                try
                {
                    // try parse to Primitive
                    Instance.DecodeValue();
                    RetVal.push(Instance);
                }
                catch (e)
                {
                    console.log('Decode TLV error: ' + e.message);
                }
            }
            else
                console.warn('Decode unknown TLV Type(0x' + Type.toString(16) + ') of Length(' + Length + ')');
        }

        return RetVal;
    }

    constructor (Type: number, Value: TypeInfo.Primitive);
    constructor (Type: number, Length: number, ValueRAW: Uint8Array);
    constructor (Type: number, ValueOrLength: number | TypeInfo.Primitive, ValueRAW?: Uint8Array)
    {
        if (TypeInfo.Assigned(ValueRAW))
        {
            this.Type = Type;
            this.Length = ValueOrLength as number;
            this._ValueRAW = ValueRAW;
        }
        else
        {
            this.Type = Type;
            this._Value = ValueOrLength;
        }
    }

    /** decode Uint8Array --> Primitive */
    protected DecodeValue()
    {
    }

    /** encode Primitive --> Uint8Array */
    protected EncodeValue()
    {
    }

    get Value(): TypeInfo.Primitive
    {
        return this._Value;
    }

    /* Object */

    valueOf(): any
    {
        return this._Value;
    }

    toString()
    {
        return this._Value.toString();
    }

    private static _TLVDict = new Map<number, typeof TLV>();

    public Type: number;
    public Length?: number;

    protected _Value: TypeInfo.Primitive | undefined;
    protected _ValueRAW: Uint8Array | undefined;
}
