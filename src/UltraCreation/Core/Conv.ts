import {TypeInfo} from './TypeInfo';
import {Endianness} from './Endian';

/** Uint8Array <--> Integers as BIG-Endian */
export namespace BytesConv
{
    export type TIntSize = 1 | 2 | 3 | 4 | 5 | 6;

    export function AsUint(IntSize: TIntSize, Buf: Uint8Array, Offset: number = 0,
        Endian = Endianness.HostEndian): number
    {
        let RetVal = 0;

        if (Endian === Endianness.BigEndian)
        {
            for (let I = 0; I < IntSize; I ++)
                RetVal = RetVal * 256 + Buf[Offset ++];
        }
        else
        {
            let Base = 1;
            for (let I = 0; I < IntSize; I ++)
            {
                RetVal = RetVal + Buf[Offset] * Base;
                Offset ++;
                Base *= 256;
            }
        }

        return RetVal;
    }

    export function AsInt(IntSize: TIntSize, Buf: Uint8Array, Offset: number = 0,
        Endian = Endianness.HostEndian): number
    {
        let RetVal = 0;
        let Base = 1;
        let Signed: boolean;

        if (Endian === Endianness.BigEndian)
        {
            // sign at first Byte
            Signed = (Buf[Offset] & 0x80) !== 0;

            for (let I = 0; I < IntSize; I ++)
            {
                RetVal = RetVal * 256 + Buf[Offset ++];
                Base *= 256;
            }

            Base /= 2;
        }
        else
        {
            for (let I = 0; I < IntSize; I ++)
            {
                RetVal = RetVal + Buf[Offset ++] * Base;
                Base *= 256;
            }

            Base /= 2;
            // sign at last byte
            Signed = (Buf[Offset - 1] & 0x80) !== 0;
        }

        if (Signed)
            return (RetVal & (Base - 1)) - Base;
        else
            return RetVal;
    }

    export function ToUint(v: number, IntSize: TIntSize, Buf: Uint8Array, Offset: number = 0,
        Endian = Endianness.HostEndian): void
    {
        if (Endian === Endianness.BigEndian)
        {
            for (let I = IntSize - 1; I !== 0; I --)
            {
                Buf[Offset + I] = v & 0xFF;
                v = Math.trunc(v / 256);
            }
        }
        else
        {
            for (let I = 0; I < IntSize; I ++)
            {
                Buf[Offset + I] = v & 0xFF;
                v = Math.trunc(v / 256);
            }
        }
    }

    export function ToInt(v: number, IntSize: TIntSize, Buf: Uint8Array, Offset: number = 0,
        Endian = Endianness.HostEndian): void
    {
        if (v < 0)
            ToUint(v + Math.pow(2, IntSize * 8), IntSize, Buf, Offset, Endian);
        else
            ToUint(v, IntSize, Buf, Offset, Endian);
    }
}

/* Integers / Bytes Array <--> HEX string */
export namespace HexConv
{
    export function IntToHex(v: number, Digit?: number): string
    {
        return ('0000000000000000' + v.toString(16).toUpperCase()).substr(-Digit);
    }

    export function BinToHex(Buf: Uint8Array, Count?: number): string
    {
        if (! TypeInfo.Assigned(Count))
            Count = Buf.byteLength;
        let RetVal = '';

        for (let I = 0; I < Count; I ++)
            RetVal += ('00' + Buf[I].toString(16).toUpperCase()).substr(-2);

        return RetVal;
    }

    export function HexToBin(str: string): Uint8Array
    {
        const Buf = new Uint8Array(str.length / 2);

        for (let i = 0; i < str.length / 2; i ++)
            Buf[i] = parseInt(str[i * 2], 16) * 16 + parseInt(str[i * 2 + 1], 16);

        return Buf;
    }
}

// basic Unit conversion
export namespace UnitConv
{
    export type TUnitSubject = string;
    export type TUnitSymbol = string;
    export type TUnitName = string;

    export function Register(Subject: TUnitSubject, Base: IUnit): void;
    // export function Register(Subject: TUnitSubject, From: IUnit, Converter: [IUnit, TUnitConverter]): void;
    export function Register(Subject: TUnitSubject, From: IUnit | TUnitName, Converters: Array<[IUnit, TUnitConverter]>): void;
    export function Register(Subject: TUnitSubject, From: IUnit | TUnitName, Converters?: Array<[IUnit, TUnitConverter]>): void
    {
        let Reg = Registry.get(Subject);
        if (! TypeInfo.Assigned(Reg))
        {
            Reg = {Subject: Subject, Base: undefined, UnitHash: new Map<TUnitName, IUnitReg>()};
            Registry.set(Subject, Reg);
        }

        let FromReg = TypeInfo.IsString(From) ? Reg.UnitHash.get(From) : Reg.UnitHash.get(From.Name);
        if (! TypeInfo.Assigned(FromReg))
        {
            if (TypeInfo.IsString(From))
            {
                console.log('UnitConv ' + From + ' has registered information...Call Register(Base: IUnit) first');
                return;
            }
            else
                FromReg = {Name: From.Name, Symbol: From.Symbol, ConverterHash: new Map<TUnitName, TUnitConverter>()};

            Reg.UnitHash.set(FromReg.Name, FromReg);
        }

        if (TypeInfo.Assigned(Converters))
        {
            for (const c of Converters)
            {
                let ToReg = Reg.UnitHash.get(c[0].Name);

                if (! TypeInfo.Assigned(ToReg))
                {
                    ToReg = {Name: c[0].Name, Symbol: c[0].Symbol, ConverterHash: new Map<TUnitName, TUnitConverter>()};
                    Reg.UnitHash.set(ToReg.Name, ToReg);
                }

                if (TypeInfo.Assigned(FromReg.ConverterHash.get(ToReg.Name)))
                console.warn('UnitConv ' + FromReg.Name + ' => ' + ToReg.Name + ' already registered');
                FromReg.ConverterHash.set(ToReg.Name, c[1]);
            }
        }
        else
        {
            // SetupBase(Subject, FromReg);
            Reg.Base = FromReg;
            Reg.DefaultConvert = Reg.Base;
        }
    }

    export function SetupBase(Subject: TUnitSubject, Base: IUnit | TUnitName): void
    {
        let Reg = Registry.get(Subject);
        if (! TypeInfo.Assigned(Reg))
        {
            Reg = {Subject: Subject, Base: undefined, UnitHash: new Map<TUnitName, IUnitReg>()};
            Registry.set(Subject, Reg);
        }

        let BaseReg = TypeInfo.IsString(Base) ? Reg.UnitHash.get(Base) : Reg.UnitHash.get(Base.Name);
        if (! TypeInfo.Assigned(BaseReg))
        {
            if (TypeInfo.IsString(Base))
            {
                console.log('UnitConv Unit: ' + Base + ' has registered information...Call Register(Subject, Base) first');
                return;
            }
            else
                BaseReg = {Name: Base.Name, Symbol: Base.Symbol, ConverterHash: new Map<TUnitName, TUnitConverter>()};

            Reg.UnitHash.set(BaseReg.Name, BaseReg);
        }

        Reg.Base = BaseReg;
        Reg.DefaultConvert = Reg.Base;
    }

    export function SetConvertDefault(Subject: TUnitSubject, UnitName: TUnitName): void
    {
        const Reg = Registry.get(Subject);
        if (! TypeInfo.Assigned(Reg))
            return;

        if (! TypeInfo.Assigned(Reg.Base))
        {
            console.log('UnitConv Subject' + Subject + ' has not base...Call SetupBase(Subject, Base) first');
            return;
        }

        if (Reg.Base.Name !== UnitName)
        {
            const ConvReg = Reg.Base.ConverterHash.get(UnitName);
            if (! TypeInfo.Assigned(ConvReg))
                console.log('UnitConv can not conver to ' + UnitName);
        }

        Reg.DefaultConvert = Reg.UnitHash.get(UnitName);
    }

    export function GetConvertDefault(Subject: TUnitSubject): IUnit
    {
        const Reg = Registry.get(Subject);
        if (TypeInfo.Assigned(Reg) && TypeInfo.Assigned(Reg.DefaultConvert))
            return Reg.DefaultConvert;
        else
            return {Name: '', Symbol: ''};
    }

    export function ExportDefaults(): Array<ISubjectDefault>
    {
        const RetVal = new Array<ISubjectDefault>();

        Registry.forEach(Reg =>
        {
            if (TypeInfo.Assigned(Reg.Base) && TypeInfo.Assigned(Reg.Base) && Reg.Base !== Reg.DefaultConvert)
                RetVal.push({Subject: Reg.Subject, Base: Reg.Base.Name, DefaultConvert: Reg.DefaultConvert.Name});
        });

        return RetVal;
    }

    export function ImportDefaults(ary: Array<ISubjectDefault>): void
    {
        ary.forEach(iter =>
        {
            const Reg = Registry.get(iter.Subject);
            if (! TypeInfo.Assigned(Reg))
                return;

            const BaseReg = Reg.UnitHash.get(iter.Base);
            const DefaultReg = Reg.UnitHash.get(iter.DefaultConvert);

            if (TypeInfo.Assigned(BaseReg) && TypeInfo.Assigned(DefaultReg) && BaseReg !== DefaultReg &&
                BaseReg.ConverterHash.get(iter.DefaultConvert))
            {
                Reg.Base = BaseReg;
                Reg.DefaultConvert = DefaultReg;
            }
        });
    }

    export function Convertibles(Subject: TUnitSubject, Base?: TUnitName): Array<IUnit>
    {
        const Reg = Registry.get(Subject);
        if (! TypeInfo.Assigned(Reg))
            return [];

        const BaseReg = TypeInfo.Assigned(Base) ? Reg.UnitHash.get(Base) : Reg.Base;
        if (TypeInfo.Assigned(BaseReg))
        {
            const ary = new Array<IUnit>();

            const Keys = BaseReg.ConverterHash.keys();
            for (let iter = Keys.next(); ! iter.done; iter = Keys.next())
            {
                const RetVal = Reg.UnitHash.get(iter.value);
                if (TypeInfo.Assigned(RetVal))
                {
                    ary.push(RetVal);
                    // ary.push({Name: RetVal.Name, Symbol: RetVal.Symbol});
                }
            }

            if (ary.length > 0)
            {
                ary.unshift(Reg.Base);
                // ary.unshift({Name: BaseReg.Name, Symbol: BaseReg.Symbol});
            }
            return ary;
        }
        else
            return [];
    }

    /// convert to or using default converter to convert value
    export function Convert(Subject: TUnitSubject, Value: number): number;
    export function Convert(Subject: TUnitSubject, Value: number, To: TUnitName): number;
    export function Convert(Subject: TUnitSubject, Value: number, To?: TUnitName): number
    {
        const Reg = Registry.get(Subject);
        if (! TypeInfo.Assigned(Reg))
        {
            console.warn('UnitConv unknown subject: ' + Subject);
            return undefined;
        }

        let Base = Reg.Base;
        if (! TypeInfo.Assigned(Base))
        {
            console.warn('UnitConv subject: ' + Subject + ' has no Base yet');
            Reg.Base = Reg.UnitHash.values().next().value;
            Reg.DefaultConvert = Reg.Base;

            Base = Reg.Base;
        }
        if (! TypeInfo.Assigned(Base))
        {
            console.warn('UnitConv subject: ' + Subject + ' has no converter registered');
            return undefined;
        }

        if (! TypeInfo.Assigned(To))
            To = Reg.DefaultConvert.Name;

        if (Reg.Base === Reg.DefaultConvert && To === Reg.DefaultConvert.Name)
            return Value;

        const Converter = Reg.Base.ConverterHash.get(To);
        if (TypeInfo.Assigned(Converter))
            return Converter(Value);
        else
            return undefined;
    }

    export interface IUnit
    {
        Name: TUnitName;
        Symbol: TUnitSymbol;
    }

    export interface ISubjectDefault
    {
        Subject: TUnitSubject;
        Base: TUnitName;
        DefaultConvert: TUnitName;
    }

    export type TUnitConverter = (value: number) => number;

    interface IUnitReg extends IUnit
    {
        ConverterHash: Map<TUnitName, TUnitConverter>;
    }

    interface IUnitSubject
    {
        Subject: TUnitSubject;
        Base: IUnitReg | undefined;
        DefaultConvert?: IUnitReg | undefined;

        UnitHash: Map<TUnitName, IUnitReg>;
    }

    const Registry = new Map<TUnitSubject, IUnitSubject>();
}
