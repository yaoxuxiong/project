import {Component, Input, Output, EventEmitter, OnInit} from '@angular/core';

import {TypeInfo} from '../../../UltraCreation/Core/TypeInfo';
import {DateUtils} from '../../../UltraCreation/Core/DateUtils';

export const DefMonthNames =
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    // ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
export const DefWeekNames =
    ['1', '2', '3', '4', '5', '6', '7'];
    // ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    // ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

@Component({selector: 'calendar', templateUrl: 'index.html'})
export class CalendarComp implements OnInit
{
    constructor()
    {
    }

    ngOnInit()
    {
        this.Year = this.Today.getFullYear();
        this.Month = this.Today.getMonth();

        this.InitializeMonth();
    }


    NextMonth()
    {
        const MaxDate = TypeInfo.Assigned(this.MaxDate) ? this.MaxDate : this.Today;
        const NextMonth = new Date(this.Year, this.Month + 1, 1);

        if (NextMonth <= MaxDate)
        {
            this.Year = NextMonth.getFullYear();
            this.Month = NextMonth.getMonth();

            this.InitializeMonth();
            this.OnMonthChange.next(NextMonth);

            console.log(this.Year + ' ' + this.Month);
        }
    }

    PrevMonth()
    {
        const MinDate = TypeInfo.Assigned(this.MinDate) ? this.MinDate : this.Today;
        const PrevMonth = new Date(this.Year, this.Month, 0);

        if (PrevMonth >= MinDate)
        {
            this.Year = PrevMonth.getFullYear();
            this.Month = PrevMonth.getMonth();

            this.InitializeMonth();
            this.OnMonthChange.next(PrevMonth);

            console.log(this.Year + ' ' + this.Month);
        }
    }

    AddNotes(value: Array<Date> | Array<ICalendarNote>)
    {
        // cut time
        for (const iter of value)
        {
            if (iter instanceof Date)
            {
                const TS = new Date(iter.getFullYear(), iter.getMonth(), iter.getDate());
                this.NoteHash.set(TS.getTime(), {TS: TS});
            }
            else
            {
                const TS = new Date(iter.TS.getFullYear(), iter.TS.getMonth(), iter.TS.getDate());
                this.NoteHash.set(TS.getTime(), {TS: TS, Color: iter.Color, Content: iter.Content});
            }
        }

        this.InitializeMonth();
    }

    HasNote(Day?: Date): boolean
    {
        return TypeInfo.Assigned(Day) && TypeInfo.Assigned(this.NoteHash.get(Day.getTime()));
    }

    GetNote(Day: Date): ICalendarNote | undefined
    {
        if (TypeInfo.Assigned(Day))
            return this.NoteHash.get(Day.getTime());
        else
            return undefined;
    }

    TodayHasNote(Day: Date): boolean
    {
        if (TypeInfo.Assigned(Day))
            return this.IsToday(Day) && this.HasNote(Day);
        else
            return false;
    }

    IsToday(Day: Date): boolean
    {
        return Day >= this.Today && Day <= this.Today;
    }

    private InitializeMonth()
    {
        const StartingDayOfWeek = new Date(this.Year, this.Month, 0).getDay();
        const DaysOfMonth = new Date(this.Year, this.Month + 1, 0).getDate();

        const Days = [];
        for (let I = 0; I < StartingDayOfWeek; I ++)
            Days.push(undefined);
        for (let I = 1; I <= DaysOfMonth; I ++)
            Days.push(new Date(this.Year, this.Month, I));

        const WeekCount = Math.ceil(Days.length / 7);
        this.Weeks = [];

        for (let I = 0; I < WeekCount; I ++)
        {
            const WeekDays = new Array<IWeekDay>();

            for (let j = 0; j < 7; j++)
            {
                const DT = Days[(I * 7 + j)];

                if (TypeInfo.Assigned(DT))
                    WeekDays.push({DT: DT, Note: this.NoteHash.get(DT.getTime())});
                else
                    WeekDays.push(undefined);
            }
            this.Weeks.push(WeekDays);
        }
    }

    Today = DateUtils.Today();
    Year: number;
    Month: number;

    @Input() set Max(value: {Year: number, Month: number} | Date)
    {
        if (value instanceof Date)
            this.MaxDate = new Date(value.getFullYear(), value.getMonth(), 1);
        else
            this.MaxDate = new Date(value.Year, value.Month, 1);
    }

    @Input() set Min(value: {Year: number, Month: number} | Date)
    {
        if (value instanceof Date)
            this.MinDate = new Date(value.getFullYear(), value.getMonth(), 1);
        else
            this.MinDate = new Date(value.Year, value.Month, 1);
    }

    @Input() MonthNames: Array<string> = DefMonthNames;
    @Input() WeekNames: Array<string> = DefWeekNames;

    @Output() OnNoteClick: EventEmitter<IWeekDay> = new EventEmitter();
    @Output() OnClick: EventEmitter<IWeekDay> = new EventEmitter();
    @Output() OnMonthChange: EventEmitter<Date> = new EventEmitter();

    private MaxDate: Date = undefined;
    private MinDate: Date = undefined;

    private Weeks: Array<Array<IWeekDay>> = [];
    private NoteHash = new Map<number, ICalendarNote>();
}

export interface ICalendarNote
{
    TS: Date;
    Color?: string;
    Content?: any;
}

export interface IWeekDay
{
    DT: Date;
    Note?: ICalendarNote;
}
