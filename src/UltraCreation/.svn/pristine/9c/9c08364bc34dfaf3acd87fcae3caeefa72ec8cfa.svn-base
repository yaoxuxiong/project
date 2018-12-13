import 'rxjs/add/operator/toPromise';
import {TypeInfo} from './TypeInfo';
// import {EAbort, ENotImplemented} from './Exception';
import {TStream} from './Stream';

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

    constructor (Type: number, Length: number, _Value?: TypeInfo.Primitive);
    constructor (Type: number, Length: number, _ValueRAW?: Uint8Array);
    constructor (public Type: number, public Length: number, Value?: TypeInfo.Primitive | Uint8Array)
    {
        if (TypeInfo.Assigned(Value))
        {
            if (Value instanceof Uint8Array)
                this._ValueRAW = Value;
            else
                this._Value = Value;
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

    static Encode(Stream: TStream, Instance: TLV, TypeSize: IntTypeSize = 1, LengthSize: IntTypeSize = 1): Promise<number>
    {
        return Promise.resolve(0);
        /*
        let RetVal: Promise<void>;
        let RAW: Uint8Array;

        const TypeLV = this._TLVDict.get(Instance.Type);
        if (TypeInfo.Assigned(TypeLV))
        {
            let Instance = new TypeLV()
            try
            {
                RAW = Parser.EncodeValue(Instance);
                RetVal = Promise.resolve();
            }
            catch (e)
            {
                RetVal = Promise.reject(e);
            }
        }
        else
            RetVal = Promise.reject(new EAbort('Encode unknown TLV Type(0x' + Instance.Type.toString(16) + ')'));

        return RetVal
            .then(() =>
            {
                switch (TypeSize)
                {
                case 1:
                    return Stream.WriteUint8(Instance.Type);
                case 2:
                    return Stream.WriteUint16(Instance.Type);
                case 3:
                    return Stream.WriteUint24(Instance.Type);
                case 4:
                    return Stream.WriteUint32(Instance.Type);
                }
            })
            .then(() =>
            {
                switch (LengthSize)
                {
                case 1:
                    return Stream.WriteUint8(Instance.Length);
                case 2:
                    return Stream.WriteUint16(Instance.Length);
                case 3:
                    return Stream.WriteUint24(Instance.Length);
                case 4:
                    return Stream.WriteUint32(Instance.Length);
                }
            })
            .then(() => Stream.WriteBuf(RAW).toPromise())
            .then(() => TypeSize + LengthSize + RAW.byteLength);
        */
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

    protected _Value: TypeInfo.Primitive | undefined;
    protected _ValueRAW: Uint8Array | undefined;
}
