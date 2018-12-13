import * as Mqtt from 'mqtt';
import {Subject} from 'rxjs/Subject';

import {TypeInfo} from '../Core/TypeInfo';
import {Exception} from '../Core/Exception';

/** IConfig */

export interface IConfig
{
    Addr: string;
    AutoConnect?: boolean;
    UserName?: string;
    Password?: string;
}

/** EMqttClientNotConnected */

export class EMqttClientNotConnected extends Exception
{
    constructor()
    {
        super('e_mqtt_client_not_connected');
    }
}

/** TMqttClient */

export class TMqttClient
{
    constructor(private Config: IConfig)
    {
        if (Config.AutoConnect)
            this.Connect().catch(err => console.log(err));
    }

    get IsConnected(): boolean
    {
        return TypeInfo.Assigned(this.Client) && this.Client.connected;
    }

    Connect(ClientId?: string): Promise<void>
    {
        if (TypeInfo.Assigned(this.Connecting))
            return this.Connecting;
        if (this.IsConnected)
            return Promise.resolve();

        try
        {
            const opts: Mqtt.IClientOptions = {};

            if (TypeInfo.Assigned(ClientId))
                opts.clientId = ClientId;

            if (TypeInfo.Assigned(this.Config.UserName))
            {
                opts.username = this.Config.UserName;
                opts.password = this.Config.Password;
            }

            this.Client = Mqtt.connect(this.Config.Addr, opts);

            this.Connecting = new Promise<void>((resolve, reject) =>
            {
                this.Client.once('connect', () =>
                {
                    console.log('Mqtt client connected.');
                    resolve();
                    this.Connecting = null;
                });
            });

            this.Client.on('connect', () => console.log('Mqtt client online.'));
            this.Client.on('offline', () => console.warn('Mqtt client offline.'));
            this.Client.on('error', err => console.error('Mqtt error: ' + err.message));

            this.Client.on('message', (Topic, Message) =>
            {
                const Subject = this.Observers.get(Topic);

                if (TypeInfo.Assigned(Subject))
                    Subject.next(Message);
            });

            return this.Connecting;
        }
        catch (err)
        {
            return Promise.reject(err);
        }
    }

    Disconnect(): void
    {
        if (this.IsConnected)
            this.Client.end();
    }

    Listen(Topic: string, QoS: Mqtt.QoS = 0): TMqttSubject
    {
        let Subject = this.Observers.get(Topic);
        if (! TypeInfo.Assigned(Subject))
        {
            Subject = new TMqttSubject(this, Topic, QoS);

            this.Client.subscribe(Topic, {qos: QoS}, (err, granted) =>
            {
                if (TypeInfo.Assigned(err))
                    Subject.error(err);
                else
                    this.Observers.set(Topic, Subject);
            });
        }
        return Subject;
    }

    Unlisten(Topic: string): void
    {
        if (! TypeInfo.Assigned(this.Client))
            return;

        const Subject = this.Observers.get(Topic);
        if (TypeInfo.Assigned(Subject))
        {
            this.Client.unsubscribe(Topic);

            Subject.complete();
            this.Observers.delete(Topic);
        }
    }

    Publish(Topic: string, Message: string | Uint8Array, opts?: Mqtt.IClientPublishOptions): Promise<void>
    {
        return this.Connect().then(() => new Promise<void>((resolve, reject) =>
        {
            this.Client.publish(Topic, Message as any, opts, (err?, packet?) =>
            {
                if (TypeInfo.Assigned(err))
                    reject(err);
                else
                    resolve();
            });
        }));
    }

    Client?: Mqtt.Client;

    private Connecting: Promise<void>;
    private Observers = new Map<string, TMqttSubject>();
}

/** TMqttSubject */

export class TMqttSubject extends Subject<Uint8Array>
{
    constructor(private Owner: TMqttClient, public readonly Topic: string, public readonly QoS: number)
    {
        super();
    }

    unsubscribe() /**@override */
    {
        console.log('TMqttSubject unsubscribe');

        this.Owner.Unlisten(this.Topic);
        this.Owner = null;

        super.unsubscribe();
    }
}
