export namespace DateUtils
{
    export enum TWeekDay
    {
        Sunday                          = 0,
        Monday,
        Tuesday,
        Wednesday,
        Thursday,
        Firday,
        Saturday
    }

    export namespace Milliseconds
    {
        export namespace Per
        {
            export const Second         = 1000;
            export const Minute         = 60000;
            export const Hour           = 3600000;
            export const Day            = 86400000;
            export const Week           = 604800000;
        }
    }

    export namespace Seconds
    {
        export namespace Per
        {
            export const Minute         = 60;
            export const Hour           = 3600;
            export const Day            = 86400;
            export const Week           = 604800;
        }
    }

    export namespace Minutes
    {
        export namespace Per
        {
            export const Hour           = 60;
            export const Day            = 1440;
            export const Week           = 10080;
        }
    }

    export namespace Hours
    {
        export namespace Per
        {
            export const Day            = 24;
            export const Week           = 168;
        }
    }

    export function Now(): Date
    {
        return new Date();
    }

    export function Today(): Date
    {
        const dt = new Date();
        return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    }

    export function YearsAgo(Years: number)
    {
        const dt = new Date();
        return new Date(dt.getFullYear() - Years, dt.getMonth(), dt.getDate());
    }

    export function ThisYear(): Date
    {
        const dt = new Date();
        return new Date(dt.getFullYear(), 0, 1);
    }

    export function EndofThisYear(): Date
    {
        const dt = new Date();
        return new Date(dt.getFullYear() + 1, 0, 0);
    }

    export function LastYear(): Date
    {
        const dt = new Date();
        return new Date(dt.getFullYear() - 1, 0, 1);
    }

    export function EndofLastYear(): Date
    {
        const dt = new Date();
        return new Date(dt.getFullYear(), 0, 0);
    }

    const TimezoneOffset = new Date().getTimezoneOffset() * Milliseconds.Per.Minute;

    export function ToUTC(dt: Date): Date
    {
        return new Date(dt.getTime() + TimezoneOffset);
    }

    export function FromUTC(UTC: number | Date): Date
    {
        if (UTC instanceof Date)
            return new Date(UTC.getTime() - TimezoneOffset);
        else
            return new Date(UTC - TimezoneOffset);
    }

    export function ToISO8601(dt: Date): string
    {
        return Format(ToUTC(dt), 'yyyy-mm-ddThh:nn:ss');
    }

    export function FromISO8601(str: string): Date
    {
        // includes TimeZone designator
        if (str.match(/[Z\+\-]/))
            return new Date(str.replace(/\s/, 'T'));
        // otherwise is localtime
        else
            return FromUTC(new Date(str.replace(/\s/, 'T')));
    }

    export function FromIEEE(Double: number): Date
    {
        return new Date(Math.trunc(Double * 86400000));
    }

    export type TDatePart =
        'millisecond' | 'second' | 'minute' | 'hour' | 'day';

    export function Add(DT: Date, Value: number, Part: TDatePart  = 'millisecond'): Date
    {
        switch (Part)
        {
        case 'millisecond':
            return new Date(DT.getTime() + Value);
        case 'second':
            return new Date(DT.getTime() + Value * Milliseconds.Per.Second);
        case 'minute':
            return new Date(DT.getTime() + Value * Milliseconds.Per.Minute);
        case 'hour':
            return new Date(DT.getTime() + Value * Milliseconds.Per.Hour);
        case 'day':
            return new Date(DT.getTime() + Value * Milliseconds.Per.Day);
        }
    }

    export function Sub(DT: Date, Value: number, Part: TDatePart  = 'millisecond'): Date
    {
        return Add(DT, -Value, Part);
    }

    export function Diff(Left: Date, Right: Date, Part: TDatePart  = 'millisecond'): number
    {
        const Diff = Left.getTime() - Right.getTime();

        switch (Part)
        {
        case 'millisecond':
            return Diff;
        case 'second':
            return Math.trunc(Diff / Milliseconds.Per.Second);
        case 'minute':
            return Math.trunc(Diff / Milliseconds.Per.Minute);
        case 'hour':
            return Math.trunc(Diff / Milliseconds.Per.Hour);
        case 'day':
            return Math.trunc(Diff / Milliseconds.Per.Day);
        }
    }

    export function Format(date: Date, format: string): string
    {
        const o: any = {
            'm+': date.getMonth() + 1,
            'M+': date.getMonth() + 1,
            'd+': date.getDate(),
            'D+': date.getDate(),
            'h+': date.getHours(),
            'H+': date.getHours(),
            'n+': date.getMinutes(),
            'N+': date.getHours(),
            's+': date.getSeconds(),
            'S+': date.getSeconds(),
            'q+': Math.floor((date.getMonth() + 3) / 3),
            'Q+': Math.floor((date.getMonth() + 3) / 3),
            'z+': date.getMilliseconds(),
            'Z+': date.getMilliseconds()
        };

        if (/(y+)/.test(format))
            format = format.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));

        for (const k in o)
        {
            if (new RegExp('(' + k + ')').test(format))
            {
                if (k[0] === 'z' || k[0] === 'Z')
                    format = format.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('000' + o[k]).substr(('' + o[k]).length)));
                else
                    format = format.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
            }
        }
        return format;
    }

    export function FormatTimeTick(Tick: number, format: string): string
    {
        if (isNaN(Tick))
            Tick = 0;

        const o: any = {
            'h+': Math.trunc(Tick / Milliseconds.Per.Hour),
            'H+': Math.trunc(Tick / Milliseconds.Per.Hour),
            'n+': Math.trunc((Tick % Milliseconds.Per.Hour) / Milliseconds.Per.Minute),
            'N+': Math.trunc((Tick % Milliseconds.Per.Hour) / Milliseconds.Per.Minute),
            's+': Math.trunc(Tick % Milliseconds.Per.Minute / Milliseconds.Per.Second),
            'S+': Math.trunc(Tick % Milliseconds.Per.Minute / Milliseconds.Per.Second),
            'z+': Tick % Milliseconds.Per.Second,
            'Z+': Tick % Milliseconds.Per.Second
        };

        for (const k in o)
        {
            if (new RegExp('(' + k + ')').test(format))
            {
                if (k[0] === 'z' || k[0] === 'Z')
                    format = format.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('000' + o[k]).substr(('' + o[k]).length)));
                else
                    format = format.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
            }
        }
        return format;
    }
}
