import {TypeInfo} from '../../../UltraCreation/Core/TypeInfo';
import {DateUtils} from '../../../UltraCreation/Core/DateUtils';
import {UITypes} from '../../../UltraCreation/Graphic';
import {TAxis} from './intf';

export class TTimestampAxis extends TAxis
{
    constructor (MinTS: Date, MaxTS: Date, Interval: number)
    {
        super(MinTS.getTime(), MaxTS.getTime(), Interval);

        this.UpdateDisplayFormat();
    }

    get MinTS(): Date
    {
        return new Date(this.Min);
    }

    set MinTS(value: Date)
    {
        this.Min = value.getTime();
    }

    get MaxTS(): Date
    {
        return new Date(this.Max);
    }

    set MaxTS(value: Date)
    {
        this.Max = value.getTime();
    }

    Label(Value: number): string
    {
        const dt = new Date(Value);
        return DateUtils.Format(dt, this.DisplayFormat);
    }

    UpdateParams(MinTS: Date, MaxTS: Date, Interval?: number)
    {
        this.MinTS = MinTS;
        this.MaxTS = MaxTS;

        if (TypeInfo.Assigned(Interval))
            this.Step = Interval;

        this.UpdateDisplayFormat();
    }

    private UpdateDisplayFormat(): void
    {
        if (this.Max - this.Min <= DateUtils.Milliseconds.Per.Day)
        {
            if (this.Min % DateUtils.Milliseconds.Per.Minute === 0
                && this.Step % DateUtils.Milliseconds.Per.Minute === 0)
            {
                this.DisplayFormat = 'hh:nn';
            }
            else
                this.DisplayFormat = 'hh:nn:ss';
        }
        else
        {
            if (this.Min % DateUtils.Milliseconds.Per.Day === 0
                && this.Step % DateUtils.Milliseconds.Per.Day === 0)
            {
                this.DisplayFormat = 'yyyy/mm/dd';
            }
            else if (this.Min % DateUtils.Milliseconds.Per.Minute === 0
                && this.Step % DateUtils.Milliseconds.Per.Minute === 0)
            {
                this.DisplayFormat = 'yyyy/mm/dd hh:nn';
            }
            else
                this.DisplayFormat = 'yyyy/mm/dd hh:nn:ss';
        }
    }

    DisplayFormat: string;
}
