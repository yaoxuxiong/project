import {TypeInfo} from '../../UltraCreation/Core/TypeInfo';
import {TPeripheral, TConnectablePeripheral, TAggregatePeripheral, PeripheralFactory} from '.';
import {TLV, VALUE_TYPE} from '.';
import {BytesConv, UnitConv} from '../../UltraCreation/Core/Conv';
import {Endianness} from '../../UltraCreation/Core/Endian';
import { TShell } from '../shell';
// import {TShell} from '../shell';

export const TRIGGER_VALUE      = 0xD0;
export const TEMPERATURE_VALUE  = 0xD1;
export const COMPAT107_VALUE    = 0x80;

export const NAN_VALUE          = '---';

const LOCATOR_ID = '{9C603C7B-715C-4F4A-918A-BBFFFF65FC31}';
const LOCATOR_CLASSNAME = 'BB monitor Locator';

/* TThermometer */

export class TThermometer extends TConnectablePeripheral
{
    /// @override
    static ClassName = 'BBmonitor';
    /// @override
    static ProductName = 'BBmonitor';
    /// @override
    static AdName = ['bbmon', 'UCmonT1'];

    constructor()
    {
        super();
    }

    DevTest(): void /**@override */
    {
        super.DevTest();
        this.Temperature.CurrValue = Math.random() * 3 + 35;

        TThermometer.Locator.OnAggregateUpdate.next(this);
    }

    get Ver(): string
    {
        if (this.Version !== 0)
        {
            if (this.Version === 0x1007)
                return 'HKTDC Sample';
            else
                return ((this.Version >> 12) & 0x0F) + '.' + ((this.Version >> 8) & 0x0F) + '.' + (this.Version & 0xFF);
        }
        else
            return '';
    }

    get Shell(): TShell
    {
        return TShell.Get(this.ConnectId);
    }

    /// @override
    get Icon_Id(): number
    {
        return 0xe93f;
    }

    /// @override
    protected UpdateValue(v: TLV, ...args: any[]): void
    {
        super.UpdateValue(v, ...args);

        switch (v.Type)
        {
        case TEMPERATURE_VALUE:
        case COMPAT107_VALUE:
            this.Temperature.CurrValue = v.valueOf();
            break;
        }
    }

    Temperature = new TThermometerSensor();

    static HighTemperature: number = 37.0;
    static Locator: TThermometerLocator;
}

/* TThermometerSensor */

export interface IBBMonitorValue
{
    V: number;
    Timestamp: number;
}

export class TThermometerSensor
{
    get CurrValue(): number
    {
        return this._Curr;
    }

    set CurrValue(v: number)
    {
        this._Curr = v;
    }

    get Curr(): string
    {
        if (! isNaN(this.CurrValue))
        {
            const Value = UnitConv.Convert('temperature', this.CurrValue) + 0.0000000001;
            return Value.toFixed(1);
        }
        else
            return NAN_VALUE;
    }

    get Symbol(): string
    {
        const NewSymbol = UnitConv.GetConvertDefault('temperature').Symbol;
        if (NewSymbol !== this._Symbol)
            this._Symbol = NewSymbol;

        return this._Symbol;
    }

    private _Curr: number = NaN;
    private _Symbol: string;
}

/* TThermometerLocator */

class TThermometerLocator extends TAggregatePeripheral
{
    /// @override
    static ClassName = LOCATOR_CLASSNAME;
    /// @override
    static ProductName = 'UltraCreation BBmon Locator';
    /// @override
    static AggregateType = TThermometer;
    /// @override
    static IsVisible = false;

/* Instance */

    constructor()
    {
        super();
        this.Id = LOCATOR_ID;
    }

    /// @override
    protected UpdateValue(v: TLV | null, Ref: TPeripheral, Now: number, Timeouts: Array<TPeripheral>)
    {
        if (! TypeInfo.Assigned(v))
            return;

        if (v.Type === VALUE_TYPE.IDENTIFY)
            this.Curr = Ref as TThermometer;

        this.OnAggregateUpdate.next(Ref);
    }

    Curr: TThermometer;
}

/* BBmonTLV */

type TThermometerSensorTable = Array<{V: number, R1?: number, R2: number, R3?: number}>;

abstract class BBmonTLV extends TLV
{
    DecodeValue(): void
    {
        super.DecodeValue();

        this.Timestamp = BytesConv.AsUint(2, this._ValueRAW, 0, Endianness.BigEndian);
        this._Value = BytesConv.AsUint(2, this._ValueRAW, 2, Endianness.BigEndian);

        this._Value  = this.Interpolation(this._Value);
    }

    Interpolation(Resistant: number): number
    {
        if (isNaN(Resistant))
            return NaN;

        const LinearTable = this.GetLinearTable();

        let Idx = 0;
        for (; Idx < LinearTable.length; Idx ++)
        {
            if (Resistant >= LinearTable[Idx].R2)
                break;
        }
        if (Idx < LinearTable.length)
        {
            const Start = LinearTable[Idx - 1];
            const End = LinearTable[Idx];
            const Temperature = End.V - (Resistant - End.R2) * (End.V - Start.V) / (Start.R2 - End.R2);

            return Temperature;
        }
        else
            return NaN;
    }

    abstract GetLinearTable(): TThermometerSensorTable;
}

/** TemperatureTLV */

class TemperatureTLV extends BBmonTLV
{
    GetLinearTable(): TThermometerSensorTable
    {
        return TEMPERATURE_TABLE;
    }
}

/* TriggerTLV */
class TriggerTLV extends TLV
{
    DecodeValue(): void
    {
        super.DecodeValue();
    }
}

const TEMPERATURE_TABLE =
[
    {V: NaN,    R2: 16777216},
    {V: 19,     R2: 64810},
    {V: 20,     R2: 62044},
    {V: 21,     R2: 59397},
    {V: 22,     R2: 56872},
    {V: 23,     R2: 54463},
    {V: 24,     R2: 52165},
    {V: 25,     R2: 49971},
    {V: 26,     R2: 47877},
    {V: 27,     R2: 45879},
    {V: 28,     R2: 43971},
    {V: 29,     R2: 42149},
    {V: 30,     R2: 40408},
    {V: 31,     R2: 38747},
    {V: 32,     R2: 37159},
    {V: 33,     R2: 35642},
    {V: 34,     R2: 34193},
    {V: 35,     R2: 32808},
    {V: 36,     R2: 31484},
    {V: 37,     R2: 30218},
    {V: 38,     R2: 29008},
    {V: 39,     R2: 27851},
    {V: 40,     R2: 26744},
    {V: 41,     R2: 25685},
    {V: 42,     R2: 24672},
    {V: 43,     R2: 23703},
    {V: 44,     R2: 22775},
    {V: 45,     R2: 21888},
    {V: 46,     R2: 21038},
    {V: 47,     R2: 20224},
    {V: 48,     R2: 19445},
    {V: 49,     R2: 18699},
    {V: 50,     R2: 17984},
    {V: 51,     R2: 17300},
    {V: 52,     R2: 16644},
    {V: 53,     R2: 16015},
    {V: 54,     R2: 15413},
    {V: 55,     R2: 14835},
    {V: NaN,    R2: 0}
];

/* TLV register */

TLV.Register(TEMPERATURE_VALUE, TemperatureTLV, 'Temperature Value');
TLV.Register(COMPAT107_VALUE, TemperatureTLV, 'HKTDC Sample Value');
TLV.Register(TRIGGER_VALUE, TriggerTLV, 'BBmon Trigger');

 /* Peripheral Factory */

PeripheralFactory.Register(TThermometer);
PeripheralFactory.Register(TThermometerLocator);

TThermometer.Locator = PeripheralFactory.Get(LOCATOR_ID, 'Peripheral.' + LOCATOR_CLASSNAME) as any;
