/**
 *  Native Bluetooth LE support
 *      .cordova-plugin-ble-central
 *          cordova plugin add cordova-plugin-ble-central --save
 *          https://www.npmjs.com/package/cordova-plugin-ble-central
 *
 *  Rxjs:
 *      http://reactivex.io/rxjs/manual/overview.html
 *      https://medium.com/@benlesh/learning-observable-by-building-observable-d5da57405d87#.7fqyp2m0w
 *      https://medium.com/@benlesh/hot-vs-cold-observables-f8094ed53339#.96zlvauma
 */
import {TypeInfo} from '../../Core/TypeInfo';
import {TMemoryStream} from '../../Core/Stream';
import {TUtf8Encoding} from '../../Encoding/Utf8';

import {TGatt, TGapConnection, TCharacteristicStream} from './BLE';
import {TAbstractShell, LINE_BREAK, LINE_BUFFER} from '../Abstract.Shell';

export const SERVICE_UUID_SHELL = 'FFE0';
export const CHARACTERISTRIC_UUID_SHELL = 'FFE1';

/* TShell */

export class TShell extends TAbstractShell
{
    static Get<T extends TShell>(DeviceId: string, ConnectionTimeout: number): T
    {
        let RetVal = this.Cached.get(DeviceId) as TShell;

        if (! TypeInfo.Assigned(RetVal))
        {
            RetVal = new (this as typeof TShell)(DeviceId);
            RetVal.ConnectionTimeout = ConnectionTimeout;

            this.Cached.set(DeviceId, RetVal);
        }
        return RetVal as T;
    }

    protected constructor(DeviceId: string)
    {
        super();
        this._DeviceId = DeviceId;
    }

    get Connection(): TGapConnection
    {
        return this._Connection as TGapConnection;
    }

    get DeviceId(): string
    {
        return this._DeviceId;
    }

    get IsAttached(): boolean /**@override TAbstractShel */
    {
        return TypeInfo.Assigned(this._Connection);
    }

    Connect(): Promise<void> /**@override TAbstractShel */
    {
        if (TypeInfo.Assigned(this._Connection))
        {
            this._Connection.RefreshTimeout();
            return Promise.resolve();
        }
        if (TypeInfo.Assigned(this.Connecting))
            return this.Connecting;

        this.Connecting = TGatt.Connect(this._DeviceId, this.ConnectionTimeout)
            .then((Conn) =>
            {
                this._Connection = Conn;
                this.Connecting = undefined;

                Conn.OnTimeoutEvent.subscribe(next => this.OnConnectionTimeout());
                Conn.SetTimeout(this.ConnectionTimeout);

                this.Channel = Conn.StartNotification(SERVICE_UUID_SHELL, CHARACTERISTRIC_UUID_SHELL, TShellStream);
                Conn.subscribe(
                    next =>
                    {
                        this.OnRead((next as TShellStream).Line);
                    },
                    (err: any) =>
                    {
                        this.Channel = undefined;
                        this._Connection = undefined;
                        setTimeout(() =>
                        {
                            this.Disconnect().catch(err => {});
                            this.OnConnectionError(err);
                        });
                    },
                    () =>
                    {
                        this.Channel = undefined;
                        this._Connection = undefined;
                        setTimeout(() => this.OnDisconnected());
                    }
                );

                return super.Connect();
            })
            .catch((err: any) =>
            {
                this.Channel = undefined;
                this.Connecting = undefined;

                this.OnConnectionError(err);
                return Promise.reject(err);
            });

        return this.Connecting;
    }

    Disconnect(): Promise<void> /**@override TAbstractShel */
    {
        return TGatt.Disconnect(this._DeviceId);
    }

    RefreshConnectionTimeout(): void /**@override TAbstractShel */
    {
        if (TypeInfo.Assigned(this.Connection))
            this.Connection.RefreshTimeout();
    }

    private _DeviceId: string;
    private _Connection: TGapConnection | undefined;
    private Connecting: Promise<void> | undefined;
    private ConnectionTimeout: number;

    private static Cached = new Map<string, TShell>();
}

/* TShellStream */

export class TShellStream extends TCharacteristicStream
{
    Line: string;

    private LineBuffer = new TMemoryStream(LINE_BUFFER);
    private LineBreak: Uint8Array = TUtf8Encoding.Encode(LINE_BREAK);
    private LineBreakMatched: number = 0;

/* Subject<T> */

    next(buf: ArrayBuffer)
    {
    /**
     *  do not inherited, our class is last buffer consumer
     */
        this.InBuffer.Push(new Uint8Array(buf));
        const byte = new Uint8Array(1);

        while (! this.InBuffer.IsEmpty)
        {
            this.InBuffer.ExtractTo(byte);
            this.LineBuffer.Write(byte);

            if (byte[0] === this.LineBreak[this.LineBreakMatched])
            {
                this.LineBreakMatched ++;

                if (this.LineBreakMatched === this.LineBreak.byteLength)
                {
                    const BytesArray = new Uint8Array(this.LineBuffer.Memory, 0, this.LineBuffer.Position - this.LineBreak.byteLength);
                    this.Line = TUtf8Encoding.Decode(BytesArray);
                    this._Connection.next(this);

                    this.LineBuffer.Clear();
                    this.LineBreakMatched = 0;
                }
            }
            else
                this.LineBreakMatched = 0;
        }
    }
}
