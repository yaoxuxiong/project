import {Injectable} from '@angular/core';

import {TypeInfo} from '../UltraCreation/Core/TypeInfo';
import {TUtf8Encoding} from '../UltraCreation/Encoding/Utf8';

import {TDiscoverService as TBasicDiscoverService} from './shared_service/asset.discover';
import {TMqttClient, TMqttSubject} from '../UltraCreation/Extras/Mqtt';
import {TThermometer, PeripheralFactory, TLV, TPeripheral} from '.';

import {TAssetService} from './asset/service';
import {TAuthService} from '../shared_module/authorize';

export * from './shared_service/asset.discover';

@Injectable()
export class TDiscoverService extends TBasicDiscoverService
{
    constructor(private Auth: TAuthService, private Asset: TAssetService)
    {
        super();
        console.log('BBmon DiscoverService construct');

        this.MqttClient = new TMqttClient(Config.IoT);
        setTimeout(() => this.MonitorAuthState());
    }

    get MqttHost(): boolean
    {
        return this._MqttHost;
    }

    set MqttHost(value: boolean)
    {
        this._MqttHost = value;
        console.log('mqtthost ' + this._MqttHost);

        if (value)
            this.StopMqttDiscover();
        else
            this.StartMqttDiscover();
    }

    MqttPost(peri: TThermometer): void
    {
        if (! this.Auth.IsLogin || ! this._MqttHost)
            return;

        const ary = Array.from(peri.ValueHash.values());
        if (ary.length > 0)
        {
            const msg = JSON.stringify({C: peri.ClassName, Id: peri.Id, V: ary}, (key, value) =>
            {
                if (key === '_ValueRAW' || key === 'Length')
                return undefined;
                else
                    return value;
            });

            console.log(msg);
            this.MqttClient.Publish(this.Auth.Me.Email, msg);
        }
    }

    protected Discover(peri: TPeripheral): void
    {
        super.Discover(peri);

        if (! peri.IsObjectSaved)
        {
            console.log('discover new device');
            this.Asset.AddPeripheral(peri);
        }
    }

    private MonitorAuthState()
    {
        this.Auth.OnStateChange.subscribe(next =>
        {
            switch (next)
            {
            case 'login':
                this.MqttClient.Connect();
                this.StartMqttDiscover();
                break;

            case 'logout':
                this.MqttClient.Disconnect();
                this.StopMqttDiscover();
            break;
            }
        },
        err => {}, () => {});
    }

    private StartMqttDiscover(): void
    {
        if (! this.Auth.IsLogin || this._MqttHost)
            return;

        console.log('mqtt: subscribe: ' + this.Auth.Me.Email);
        this.MqttSub = this.MqttClient.Listen(this.Auth.Me.Email);

        this.MqttSub.subscribe(next =>
        {
            try
            {
                const o = JSON.parse(TUtf8Encoding.Decode(next));
                if (! TypeInfo.Assigned(o.C) || ! TypeInfo.Assigned(o.Id) || ! TypeInfo.Assigned(o.V))
                    return;

                const peri = PeripheralFactory.Get(o.Id, 'Peripheral.' + o.C);
                if (TypeInfo.Assigned(peri))
                {
                    peri.LastActivity = new Date().getTime();

                    const TLVList = new Array<TLV>();
                    for (const iter of o.V)
                        TLVList.push(new TLV(iter.Type, iter._Value));
                    peri.UpdateTLValues(TLVList);

                    setTimeout(() => this.Discover(peri));
                }
            }
            catch (err)
            {
                console.log(err);
            }
        },
        err =>
            console.log('Mqtt error: ' + err.message),
        () =>
            console.log('Mqtt completed'));
    }

    private StopMqttDiscover(): void
    {
        if (TypeInfo.Assigned(this.MqttSub))
        {
            this.MqttSub.unsubscribe();
            this.MqttSub = undefined;
        }
    }

    private _MqttHost: boolean = false;
    private MqttClient: TMqttClient;
    private MqttSub: TMqttSubject;
}
