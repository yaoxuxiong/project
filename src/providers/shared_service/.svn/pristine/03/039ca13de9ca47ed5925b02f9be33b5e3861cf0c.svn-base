import {BytesConv} from '../../UltraCreation/Core/Conv';
import {EInvalidArg} from '../../UltraCreation/Core/Exception';
import {TLV as BasicTLV, IntTypeSize} from '../../UltraCreation/Core/TLV';
import {Endianness} from '../../UltraCreation/Core/Endian';

export enum VALUE_TYPE
{
    // common
    BATTERY     = 0x01,         // Integer
    IDENTIFY    = 0x02,         // Boolean
}

/* extends TLV */

export class TLV extends BasicTLV
{
    static DecodeFrom(View: Uint8Array, StartOffset: number, TypeSize: IntTypeSize = 1, LengthSize: IntTypeSize = 1): Array<TLV>
    {
        return super.DecodeFrom(View, StartOffset, TypeSize, LengthSize) as Array<TLV>;
    }

    public Timestamp: number;
}

/* Measure16TLV */

export class Measure16TLV extends TLV
{
    DecodeValue(): void
    {
        if (this._ValueRAW.length !== 4)
            throw new EInvalidArg();

        this.Timestamp = BytesConv.AsUint(2, this._ValueRAW, 0, Endianness.BigEndian);
        this._Value = BytesConv.AsUint(2, this._ValueRAW, 2, Endianness.BigEndian);
    }

    EncodeValue(): void
    {
        this._ValueRAW = new Uint8Array(4);

        BytesConv.ToUint(this.Timestamp, 2, this._ValueRAW, 0, Endianness.BigEndian);
        BytesConv.ToUint(this.valueOf(), 2, this._ValueRAW, 2, Endianness.BigEndian);
    }
}

/* Measure32TLV */

export class Measure32TLV extends TLV
{
    DecodeValue(): void
    {
        if (this._ValueRAW.length !== 6)
            throw new EInvalidArg();

        this.Timestamp = BytesConv.AsUint(2, this._ValueRAW, 0, Endianness.BigEndian);
        this._Value = BytesConv.AsUint(4, this._ValueRAW, 2, Endianness.BigEndian);
    }

    EncodeValue(): void
    {
        this._ValueRAW = new Uint8Array(6);

        BytesConv.ToUint(this.Timestamp, 2, this._ValueRAW, 0, Endianness.BigEndian);
        BytesConv.ToUint(this.valueOf(), 4, this._ValueRAW, 2, Endianness.BigEndian);
    }
}

/* battery */

class BatteryTLV extends Measure16TLV
{
}

/* battery */

class IdentifyTLV extends Measure16TLV
{
    valueOf(): boolean
    {
        return ! (this._Value === 0);
    }
}

/* TLV register */

TLV.Register(VALUE_TYPE.BATTERY, BatteryTLV, 'Battery');
TLV.Register(VALUE_TYPE.IDENTIFY, IdentifyTLV, 'Identify Button');
