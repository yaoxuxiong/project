import {Injectable} from '@angular/core';
import {TypeInfo} from '../UltraCreation/Core/TypeInfo';
import {TPersistable, IBeforeInsert, TPersistRule} from '../UltraCreation/Core/Persistable';
import {TGuid} from '../UltraCreation/Core/Guid';

import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/interval';
import {Subject} from 'rxjs/Subject';
import {NativeNotification} from '../UltraCreation/Native/Notifi';
import {DateUtils} from '../UltraCreation/Core/DateUtils';

@Injectable()
export class TMedicineService
{
    constructor()
    {
        console.log('TMedicineService construct');

        setTimeout(() => this.Start());
    }

    private Start(): void
    {
        this.List().catch(err => {});

        Observable.interval(30000).subscribe(next =>
        {
            const DT = new Date();
            const Now = Math.trunc(DT.getTime() / 1000);
            const Today = Math.trunc(Now / 86400) * 86400;

            for (const iter of this._List)
            {
                const TS = Math.trunc(iter.TS.getTime() / 1000);

                let Next = Today + iter.Start;
                while (Next < TS)
                    Next += iter.Interval;
                if (Next > (Today + iter.End + 30))
                    continue;

                const Diff = Now - Next;
                if (Diff > 0)
                {
                    iter.Edit();
                    iter.TS = DT;
                    this.Save(iter).then(() =>
                    {
                        NativeNotification.Local.Push({title: iter.Note});
                        this.OnNotify.next(iter);
                    })
                    .catch(err => {});
                }
            }
        });
    }

    async List(): Promise<Array<TMedicine>>
    {
        if (! TypeInfo.Assigned(this._List))
        {
            this._List = [];

            const DataSet = await StorageEngine.ExecQuery('SELECT * FROM Medicine');
            while (! DataSet.Eof)
            {
                const Medicine = new TMedicine();
                Medicine.Assign(DataSet.Curr);

                this._List.push(Medicine);
                DataSet.Next();
            }
        }

        return this._List;
    }

    async Save(med: TMedicine): Promise<void>
    {
        const IsEditing = med.IsEditing;
        await StorageEngine.SaveObject(med);

        if (! IsEditing)
            this._List.push(med);
    }

    async Remove(med: TMedicine): Promise<Array<TMedicine>>
    {
        await StorageEngine.RemoveObject(med);

        const Idx = this._List.indexOf(med);
        if (Idx !== -1)
            this._List.splice(Idx, 1);

        return this._List;
    }

    OnNotify = new Subject<TMedicine>();
    private _List: Array<TMedicine>;
}

export class TMedicine extends TPersistable implements IBeforeInsert
{
    constructor()
    {
        super();
    }

    Id: string = undefined;
    Picture: string = undefined;
    Note: string = undefined;
    Start: number = undefined;
    End: number = undefined;
    Interval: number = undefined;
    TS = new Date();

    get Frequency(): number
    {
        return Math.trunc((this.End - this.Start) / this.Interval);
    }

    protected AfterAssignProperties(): void
    {
        super.AfterAssignProperties();

        if (TypeInfo.IsString(this.TS))
            this.TS = DateUtils.FromISO8601(this.TS + 'Z');
    }

    DefineRules(Rules: Array<TPersistRule>): void
    {
        super.DefineRules(Rules);

        Rules.push(new TPersistRule('Medicine',
            ['Id'], ['Picture', 'Note', 'Start', 'End', 'Interval', 'TS']));
    }

    async BeforeInsert(): Promise<void>
    {
        if (! TypeInfo.Assigned(this.Id))
            this.Id = TGuid.Generate();
    }
}
