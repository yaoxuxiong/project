import {TypeInfo} from '../../UltraCreation/Core/TypeInfo';
import {TSqlQuery} from '../../UltraCreation/Storage/Storage.sql';
import {THttpClient} from '../../UltraCreation/Core/Http/Client';

import {TPeripheral, PeripheralFactory} from './asset.peripheral';

export const PATH_ASSETS = 'assets/';
export const PATH_ASSETS_TRANSLATE = PATH_ASSETS + 'i18n/';

module Queries
{
    export const ListPeripheral = 'SELECT * FROM Asset WHERE ObjectName LIKE "Peripheral.%"';
    export const RemovePeripheral = 'DELETE FROM Asset WHERE Id = ":Id"';
}

export class TBasicAssetService
{
    static async Initialize(): Promise<void>
    {
        console.log('static TBasicAssetService.Initialize()');
    }

    constructor ()
    {
        console.log('TBasicAssetService construct.');
        setTimeout(() => this.ListPeripheral().catch((err: any) => console.log(err)));
    }

    static async LoadStaticFile(FileName: string, ResponseType: XMLHttpRequestResponseType, Path?: string): Promise<any>
    {
        const Http = new THttpClient(ResponseType, Path);
        return await Http.Get(FileName).toPromise().then(res => res.Content);
    }

    LoadStaticFile(FileName: string, ResponseType: XMLHttpRequestResponseType, Path?: string): Promise<any>
    {
        return (this.constructor as typeof TBasicAssetService).LoadStaticFile(FileName, ResponseType, Path);
    }

    static LoadTranslation(FileName: string, Lang: string): any
    {
        let Fmt: XMLHttpRequestResponseType;
        if (FileName.endsWith('.html'))
            Fmt = 'text';
        else
            Fmt = 'json';

            // load current lang translation error...fallback to local
        return this.LoadStaticFile(FileName, Fmt, PATH_ASSETS_TRANSLATE + Lang).catch(err =>
        {
            // lang translation not exists...fallback to english
            if (Lang !== 'en')
                return this.LoadStaticFile(FileName, Fmt, PATH_ASSETS_TRANSLATE + 'en');
            else
                return Promise.reject(err);
        });
    }

    async ListPeripheral(): Promise<Array<TPeripheral>>
    {
        if (TypeInfo.Assigned(this._PeripheralList))
            return this._PeripheralList;
        if (TypeInfo.Assigned(this._PromisingPeripheralList))
            return await this._PromisingPeripheralList;

        this._PromisingPeripheralList = StorageEngine.ExecQuery(new TSqlQuery(Queries.ListPeripheral)).then(DataSet =>
        {
            const RetVal = new Array<TPeripheral>();
            while (! DataSet.Eof)
            {
                const Peripheral = PeripheralFactory.Get(DataSet.Curr.Id, DataSet.Curr.ObjectName);

                if (TypeInfo.Assigned(Peripheral))
                {
                    Peripheral.Assign(DataSet.Curr);
                    RetVal.push(Peripheral);
                }
                else
                    console.log('Unsupported Peripheral: ' + DataSet.Curr.ObjectName);

                DataSet.Next();
            }

            this._PeripheralList = RetVal;
            this._PromisingPeripheralList = null;
            return RetVal;
        });

        const RetVal = await this._PromisingPeripheralList;
        return RetVal;
    }

    async AddPeripheral(Peripheral: TPeripheral): Promise<TPeripheral>
    {
        if (TypeInfo.Assigned(Peripheral.Timestamp))
            return Promise.resolve(Peripheral);
        Peripheral.Timestamp = new Date();

        await StorageEngine.SaveObject(Peripheral);
        await this.ListPeripheral();

        this._PeripheralList.push(Peripheral);
        return Peripheral;
    }

    RemovePeripheral(Id: string): Promise<void>;
    RemovePeripheral(Peripheral: TPeripheral): Promise<void>;
    async RemovePeripheral(IdOrObj: string | TPeripheral): Promise<void>
    {
        let Id = '';
        if (TypeInfo.IsString(IdOrObj))
            Id = IdOrObj;
        else
            Id = IdOrObj.Id;

        await StorageEngine.ExecSQL(Queries.RemovePeripheral, {Id: Id});
        await this.ListPeripheral();

        for (let Idx = 0; Idx < this._PeripheralList.length; Idx ++)
        {
            if ( this._PeripheralList[Idx].Id === Id)
            {
                const peri = this._PeripheralList.splice(Idx, 1)[0];
                peri.Timestamp = undefined;
                break;
            }
        }

        PeripheralFactory.Uncache(Id);
    }

    private _PeripheralList: Array<TPeripheral>;
    private _PromisingPeripheralList: Promise<Array<TPeripheral>>;
}
