import {Injectable, OnDestroy, NgZone} from '@angular/core';
import {Subscription} from 'rxjs/Subscription';
import {Subject} from 'rxjs/Subject';

import {TypeInfo} from '../UltraCreation/Core/TypeInfo';
import {TGuid} from '../UltraCreation/Core/Guid';
import {UITypes} from '../UltraCreation/Graphic';

import {TPersistable, TPersistRule, IBeforePersist, IBeforeInsert, IBeforeDelete, IBeforeUpdate} from '../UltraCreation/Core/Persistable';
import {TEMPERATURE_VALUE, TThermometer} from './asset';
import {DateUtils} from '../UltraCreation/Core/DateUtils';
import {UnitConv} from '../UltraCreation/Core/Conv';

import {TDiscoverService} from './bbmon.discover';
import { TPeripheral } from './index';
import { Scheduler } from 'rxjs/Scheduler';

const SVG_BABY = String.fromCharCode(0xE92A);
const SVG_FEMALE = String.fromCharCode(0xE914);
const SVG_MALE = String.fromCharCode(0xE916);

namespace Queries
{
    export const ListProfile = 'SELECT * FROM Profile';

    export const StoreSample = 'INSERT INTO Sampling(Profile_Id, Type, Value, Timestamp) VALUES(:Profile_Id, :Type, :Value, :Timestamp)';
    export const RemoveProfileSamples = 'DELETE FROM Sampling WHERE Profile_Id="?"';

    export const QueryChart = `SELECT MAX(Value) AS Value,
        datetime((strftime('%s', Timestamp) / :Interval) * :Interval, 'unixepoch') AS TS FROM Sampling
        WHERE DATE(Timestamp) = DATE(:Day) AND Profile_Id = ":Profile_Id" GROUP BY TS`;

    export const QueryCalendar = `SELECT MAX(Value) AS Value,
    	datetime((strftime('%s', Timestamp) / 86400) * 86400, 'unixepoch') AS TS FROM Sampling
    	WHERE DATE(Timestamp) > DATE('now', '-12 months') AND Profile_Id = ":Profile_Id"
    	GROUP BY TS`;
}

@Injectable()
export class TSamplingService implements OnDestroy
{
    constructor(private Zone: NgZone, private Discover: TDiscoverService)
    {
    }

    ngOnDestroy(): void
    {
        if (TypeInfo.Assigned(this._Sub))
            this._Sub.unsubscribe();
    }

    async Initialize(): Promise<void>
    {
        const ary = await this.ListProfile();

        const LastId = localStorage.getItem('last_profile');

        for (const iter of ary)
        {
            if (iter.Id === LastId)
            {
                this._Profile = iter;
                break;
            }
        }

        if (! TypeInfo.Assigned(this._Sub))
        {
            this._Sub = TThermometer.Locator.OnAggregateUpdate.subscribe(
                next => this.Zone.run(() => this.OnTemperatureChanged(next)),
                err => {},
                () => {});
        }
    }

    get Recording(): boolean
    {
        return this._Recording;
    }

    Start(): void
    {
        this._Recording = true;
    }

    Stop(): void
    {
        this._Recording = false;
    }

    async ChartSamples(Interval: number, Day: Date): Promise<Array<TSample>>
    {
        const UTCDay = new Date(Day.getTime() - Day.getTimezoneOffset() * 60 * 1000);

        const DataSet = await StorageEngine.ExecQuery(Queries.QueryChart, {
            Profile_Id: this._Profile.Id,
            Interval: Math.trunc(Interval / 1000),
            Day: UTCDay});
        const RetVal = new Array<TSample>();

        while (! DataSet.Eof)
        {
            const Sample = new TSample();

            Sample.Assign(DataSet.Curr);
            RetVal.push(Sample);

            DataSet.Next();
        }
        return RetVal;
    }

    async CalendarSamples(): Promise<Array<TSample>>
    {
        const DataSet = await StorageEngine.ExecQuery(Queries.QueryCalendar, {Profile_Id: this._Profile.Id});
        const RetVal = new Array<TSample>();

        while (! DataSet.Eof)
        {
            const Sample = new TSample();

            Sample.Assign(DataSet.Curr);
            RetVal.push(Sample);

            DataSet.Next();
        }
        return RetVal;
    }

    get Profile(): TProfile
    {
        return this._Profile;
    }

    set Profile(value: TProfile)
    {
        this._Profile = value;
        localStorage.setItem('last_profile', value.Id);

        this.OnChange.next(value);
    }

    get Device(): TThermometer
    {
        return this._Device;
    }

    set Device(value: TThermometer)
    {
        this._Device = value;
        this.OnChange.next(value);
    }


    async ListProfile(): Promise<Array<TProfile>>
    {
        const DataSet = await StorageEngine.ExecQuery(Queries.ListProfile);
        const RetVal = new Array<TProfile>();
        while (! DataSet.Eof)
        {
            const Profile = new TProfile();
            Profile.Assign(DataSet.Curr);

            RetVal.push(Profile);
            DataSet.Next();
        }

        if (RetVal.length === 0)
        {
            const profile = new TProfile();
            profile.Id = '{00000000-0000-0000-8000-123456789ABC}';
            profile.Type = AvatarList[0].Type;
            profile.Avatar = AvatarList[0].Icon;
            profile.Name = App.Translate('profile_page.default_nickname');

            await StorageEngine.SaveObject(profile);
            RetVal.push(profile);
        }

        if (! TypeInfo.Assigned(this._Profile))
            this._Profile = RetVal[0];

        return RetVal;
    }

    async RemoveProfile(Profile: TProfile): Promise<Array<TProfile>>
    {
        console.log(Profile);
        await StorageEngine.RemoveObject(Profile);

        if (Profile.Id === this._Profile.Id)
            this._Profile = null;

        return await this.ListProfile();
    }

    SaveProfile(Profile: TProfile): Promise<void>
    {
        console.log(Profile);
        return StorageEngine.SaveObject(Profile)
            .then(() => this._Profile = Profile)
            .then(() => this.OnChange.next(Profile));
    }

    private OnTemperatureChanged(peri: TThermometer): void
    {
        this.Discover.MqttPost(peri);

        if (! TypeInfo.Assigned(this._Device) || peri.Id !== this._Device.Id)
            return;
        if (! this._Recording || ! TypeInfo.Assigned(this._Profile))
            return;

        this.StoreSample(this._Profile.Id, peri.Temperature.CurrValue)
            .then(() =>
                this.OnChange.next('sample'))
            .catch(err =>
                console.error(err.message));
    }

    private StoreSample(Profile_Id: string, Value: number): Promise<void>
    {
        return StorageEngine.ExecSQL(Queries.StoreSample,
            {Profile_Id: Profile_Id, Type: TEMPERATURE_VALUE, Value: Value, Timestamp: new Date()}).then(() => {});
    }

    OnChange = new Subject<TThermometer | TProfile | 'sample'>();

    private _Recording: boolean;
    private _Profile: TProfile;
    private _Device: TThermometer;
    private _Sub: Subscription;
}

/* IAvatar */

export interface IAvatar
{
    Type: string;
    Icon: string;
}

export const AvatarList: Array<IAvatar> =
[
    {Type: 'baby', Icon: SVG_BABY},
    {Type: 'female', Icon: SVG_FEMALE},
    {Type: 'male', Icon: SVG_MALE}
];

/* TProfile */

export class TProfile extends TPersistable implements IBeforePersist, IBeforeInsert, IBeforeDelete
{
    constructor()
    {
        super();

        // create hidden ExtraProp
        (this as any)['ExtraProp'] = null;
    }

    Id: string = undefined;
    Type: string = undefined;
    Avatar: string = undefined;
    Name: string = undefined;

    ExtraProps: Map<string, any> | any = new Map<string, any>();

/* TAssignable */

    protected AfterAssignProperties(): void
    {
        super.AfterAssignProperties();

        const ExtraProp = (this as any)['ExtraProp'];
        if (TypeInfo.Assigned(ExtraProp))
        try
        {
            const ary: Array<[string, any]> = JSON.parse(ExtraProp);
            ary.forEach(iter => this.ExtraProps.set(iter[0], iter[1]));
        }
        catch (e)
        {
            console.error('unable to parse ExtraProp: ' + ExtraProp);
        }
    }

/* TPersistable */

    DefineRules(Rules: Array<TPersistRule>): void
    {
        super.DefineRules(Rules);

        Rules.push(new TPersistRule('Profile',
            ['Id'], ['Type', 'Avatar', 'Name', 'ExtraProp']));
    }

    async BeforePersist(): Promise<void>
    {
        if (this.ExtraProps.size > 0)
        {
            const ary = Array.from(this.ExtraProps);
            (this as any).ExtraProp = JSON.stringify(ary);
        }
    }

    async BeforeInsert(): Promise<void>
    {
        if (! TypeInfo.Assigned(this.Id))
            this.Id = TGuid.Generate();
    }

    async BeforeDelete(): Promise<void>
    {
        StorageEngine.ExecSQL(Queries.RemoveProfileSamples, [this.Id]).catch((err) => console.log('before delete' + err));
    }
}

export class TSample extends TPersistable implements UITypes.IPosition
{
    Value: number = undefined;
    TS: Date = undefined;

    get X(): number
    {
        return this.TS.getTime();
    }

    get Y(): number
    {
        return this.Value;
    }

    protected AfterAssignProperties(): void
    {
        super.AfterAssignProperties();

        if (TypeInfo.IsString(this.TS))
            this.TS = DateUtils.FromISO8601(this.TS + 'Z');
    }

    toString(): string
    {
        const Value = UnitConv.Convert('temperature', this.Value) + 0.0000000001;
        return Value.toFixed(1);
    }
}

