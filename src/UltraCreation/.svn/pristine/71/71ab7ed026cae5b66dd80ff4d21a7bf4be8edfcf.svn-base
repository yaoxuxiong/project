/**
 *  Native Bluetooth LE support
 *      .cordova-plugin-ble-central
            cordova plugin add cordova-plugin-ble-central --variable BLUETOOTH_USAGE_DESCRIPTION="Simulate Serial Communication"
            https://github.com/don/cordova-plugin-ble-central
 *
 *  Rxjs:
 *      http://reactivex.io/rxjs/manual/overview.html
 *      https://medium.com/@benlesh/learning-observable-by-building-observable-d5da57405d87#.7fqyp2m0w
 *      https://medium.com/@benlesh/hot-vs-cold-observables-f8094ed53339#.96zlvauma
 */
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';

import {TypeInfo} from '../../Core/TypeInfo';
import {Exception, EInvalidArg} from '../../Core/Exception';
import {TStream} from '../../Core/Stream';
import {TLoopBuffer} from '../../Core/LoopBuffer';
import {TBase64Encoding} from '../../Encoding/Base64';

declare var window: any;

/** BLE MTU */
export const MTU = 20;
/** BLE write minial interval, 5926 bps */
export const MIN_WRITE_INTERVAL = 27;

const DEFAULT_SCAN_TIMEOUT = 180000;
const DEFAULT_DISCOVERY_TIMEOUT = 6000;

/**
 *  TGatt.Connect using Promise to indicate the connection is successful
 *   but ble callback never notification the unsuccess connection
 *   CONNECT_FAILURE_INTERVAL is how long the promise should report connect is failure
 */
const CONNECT_FAILURE_INTERVAL = 10100;
/** Buffer size to cache the peripherial notification data, data will discard when buffer full */
const NOTIFICATION_IN_BUFFER = 8 * 1024;

/* EBluetoothLEPlugin */
export class EBluetoothLEPlugin extends Exception
{
    constructor (Message?: string)
    {
        if (TypeInfo.Assigned(Message))
            super(Message);
        else
            super('e_ble_plugin');
    }
}

/* EConnectTimeout */

export class EConnectTimeout extends Exception
{
    constructor ()
    {
        super('e_connect_timeout');
    }
}

/* Admin */

export type TStateNotify = 'on' | 'off' | 'turningOff' | 'turningOn';

export class Admin
{
    /**
     *  private constructor this is all static member class
     */
    private constructor()
    {
    }

    /** is BLE plugin installed */
    static get IsPluginInstalled(): boolean
    {
        return TypeInfo.Assigned(window.ble);
    }

    static get OnStateChange(): Observable<TStateNotify>
    {
        return new Observable<TStateNotify>(obs =>
        {
            console.log('startStateNotifications ');

            window.ble.startStateNotifications(
                (state: TStateNotify) =>
                    obs.next(state),
                (err: string) =>
                    obs.next('off'),
            );

            return () =>
            {
                console.log('stopStateNotifications ');
                window.ble.stopStateNotifications();
            };
        });
    }

    /** Check BLE is Enabled */
    static IsEnable(): Promise<boolean>
    {
        if (! TypeInfo.Assigned(window.ble))
            return Promise.resolve(false);

        return new Promise<boolean>((resolve, reject) =>
        {
            window.ble.isEnabled(
                () => resolve(true),
                () => resolve(false)
            );
        });
    }

    /** Enable BLE for Android, no effect in iOS */
    static AndroidRequestEnable(): Promise<boolean>
    {
        if (! TypeInfo.Assigned(window.ble))
            return Promise.resolve(false);

        return new Promise<boolean>((resolve, reject) =>
        {
            window.ble.enable(
                () =>
                {
                    resolve(true);
                },
                (err: any) =>
                {
                    if ((err as string).includes('User did not enable Bluetooth'))
                        resolve(false);
                    else
                        reject(new EBluetoothLEPlugin(err));
                });
        });
    }

    static WaitForEnable(): Promise<void>
    {
        return null;
    }
}

/* TGatt @sealed */
export class TGatt
{
    /**
     *  private constructor this is all static member class
     */
    private constructor()
    {
    }

    /**
     *  Start GATT scan.
     *      @param Services
     *      @param Filter when discovery a device, true to be added
     *      @param Timeout this is total timeout of scan task
     *      @returns TGattScaner
     */
    static StartScan(Services: string[], Filter?: (Device: IScanDiscovery) => boolean, Timeout: number = 180000): TGattScaner
    {
        return TGattScaner.Start(Services, Filter, Timeout);
    }

    /**
     *  Stop GATT scan
     *      @returns Promise<void> to indicate successful / failure
     */
    static StopScan(): Promise<void>
    {
        return TGattScaner.Stop();
    }

    /**
     *  Get adversing Manufactory data
     */
    static GetManufactoryData(adv: any, Callback?: (view: Uint8Array) => void): Uint8Array | null
    {
        if (! TypeInfo.Assigned(adv))
            return null;

        let RetVal: Uint8Array | null = null;
        // android
        if (adv instanceof ArrayBuffer)
        {
            this.AndroidAdversingWalkthrough(adv,
                (view, type): boolean =>
                {
                    if (type === 0xFF)
                    {
                        RetVal = view;
                        return false;
                    }
                    else
                        return true;
                }
            );
        }
        // ios
        else
        {
            try
            {
                if (TypeInfo.Assigned(adv.kCBAdvDataManufacturerData))
                {
                    // ios 10+
                    if (TypeInfo.Assigned(adv.kCBAdvDataManufacturerData.data))
                        RetVal = TBase64Encoding.Decode(adv.kCBAdvDataManufacturerData.data);
                    // ios 9-
                    else
                        RetVal = new Uint8Array(adv.kCBAdvDataManufacturerData);
                }
                else
                    RetVal = null;
            }
            catch (err)
            {
                console.error('error: Decode adv.kCBAdvDataManufacturerData.data');
                RetVal = null;
            }
        }

        if (TypeInfo.Assigned(RetVal) && TypeInfo.Assigned(Callback))
            Callback(RetVal);
        return RetVal;
    }

    /**
     *  Android only: Walk Through TGatt.StartScan adversing response data
     *  @returns true to continue, false assume caller found the data reqiured and breaks walk through
     */
    static AndroidAdversingWalkthrough(adv: ArrayBuffer, Callback: (view: Uint8Array, type: number) => boolean): void
    {
        return TGattScaner.AdversingDataWalkthrough(adv, Callback);
    }

    /**
     *  Connect retrive an GAP connection.
     *  the BLE Read/Write/WriteNoResponse can be called after connect, TGapConnection also a Subject that can be subscribe:
     *      .BLE Notification OnData event = next, ths happened after StartNotification called
     *      .Disconnect event = complete
     *
     *      @param Timeout is how long the connection should kepp, 0 = INFINITE until Disconnect
     *      @returns Promise<TGapConnection> of a newly created connection
     */
    static Connect(DeviceId: string, Timeout: number = 0, ConnectionType?: typeof TGapConnection): Promise<TGapConnection>
    {
        if (! TypeInfo.Assigned(window.ble))
            return Promise.reject(new EBluetoothLEPlugin());

        for (const conn of this.ConnectionList)
        {
            if (conn.DeviceId === DeviceId)
                return Promise.resolve(conn);
        }

        console.log('Connecting ' + DeviceId);
        let Connected = false;
        let Canceled = false;
        let ConnectionInfo: IConnectionInfo;

        let TryTimes = 0;
        let ReconnectTimerId = setTimeout(() => ble_try_connect(TGatt), 0);
        const Tick = new Date().getTime();

        return new Promise<TGapConnection>((resolve, reject) =>
        {
            const IntervalId = setInterval(() =>
            {
                if (Connected)
                {
                    clearInterval(IntervalId);
                    clearTimeout(ReconnectTimerId);

                    if (! TypeInfo.Assigned(ConnectionType))
                        ConnectionType = TGapConnection;

                    const conn = new ConnectionType(DeviceId, ConnectionInfo);
                    this.ConnectionList.push(conn);
                    if (Timeout > 0)
                        conn.SetTimeout(Timeout);

                    console.log('Connected ' + DeviceId + '  use_time:' + (new Date().getTime() - Tick));
                    return resolve(conn);
                }

                if (new Date().getTime() - Tick > CONNECT_FAILURE_INTERVAL)
                {
                    console.error('Connect failure due to Timeout' + '  use_time:' + (new Date().getTime() - Tick));

                    Canceled = true;
                    clearInterval(IntervalId);
                    clearTimeout(ReconnectTimerId);

                    return this.Disconnect(DeviceId).then(() =>
                    {
                        console.log('disconnect: ' + DeviceId);
                        reject(new EConnectTimeout());
                    });
                }
            }, 50);
        });

        function ble_try_connect(Self: typeof TGatt)
        {
            if (Canceled)
                return;

            TryTimes ++;
            console.log('try connect ' + TryTimes + '  use_time:' + (new Date().getTime() - Tick));

            window.ble.connect(DeviceId,
                (info: any) =>   // successful connected
                {
                    Connected = true;
                    ConnectionInfo = info;
                },
                () =>   // long term callback when disconnect
                {
                    if (Connected)
                    {
                        console.log('connect long term disconnect callback');
                        Self.RemoveConnection(DeviceId);
                    }
                    else if (! Canceled)
                        ReconnectTimerId = setTimeout(() => ble_try_connect(Self), 1000);
                });
        }
    }

    /**
     *  Disconnect the GAP connection.
     *      the TGapConnection that owns this DeviceId will be trigger complete
    */
    static Disconnect(DeviceId: string): Promise<void>
    {
        if (! TypeInfo.Assigned(window.ble))
            return Promise.reject(new EBluetoothLEPlugin());

        return new Promise<void>((resolve, reject) =>
        {
            window.ble.disconnect(DeviceId,
                (buf: any) =>
                {
                    TGatt.RemoveConnection(DeviceId);
                    resolve();
                },
                (err: any) =>
                {
                    TGatt.RemoveConnection(DeviceId);
                    reject(new EBluetoothLEPlugin('ble disconnect failure'));
                });
        });
    }

    private static RemoveConnection(DeviceId: string): void
    {
        for (let i = 0; i < this.ConnectionList.length; i ++)
        {
            if (this.ConnectionList[i].DeviceId === DeviceId)
            {
                const conn = this.ConnectionList.splice(i, 1)[0];

                console.log(conn.DeviceId + ' disconnected.');
                conn.complete();
                return;
            }
        }
    }

    /* Maintain the TGapConnection lifecycle until disonnected */
    static ConnectionList: Array<TGapConnection> = new Array<TGapConnection>();
    static StrictWrite: boolean = false;
}
Object.seal(TGatt);

/* IScanDiscovery */

export interface IScanDiscovery
{
    id: string;
    name: string;
    rssi: number;
    advertising: ArrayBuffer | Object | null;
    timestamp: number;
    mac?: string;    // really mac address if exists
}

/* TGattScaner */

export class TGattScaner extends Subject<Array<IScanDiscovery>>
{
    static Start(Services: string[], Filter?: (Device: IScanDiscovery) => boolean,
        Timeout: number = DEFAULT_SCAN_TIMEOUT, DiscoveryTimeout = DEFAULT_DISCOVERY_TIMEOUT): TGattScaner
    {
        if (TypeInfo.Assigned(this.Singleton))
        {
            if (Timeout > 0)
                this.Singleton.SetTimeout(Timeout);
            return this.Singleton;
        }

        this.Singleton = new TGattScaner(Filter);
        const Obj = this.Singleton;

        if (! TypeInfo.Assigned(window.ble))
        {
            this.Singleton.error(new EBluetoothLEPlugin());
            return Obj;
        }

        if (Timeout > 0)
        {
            this.Singleton.SetTimeout(Timeout);
            console.log('GattScaner startting');
        }
        else
            console.warn('GattScaner startting (no timeout until Stop)');

        this.Singleton.StartUpdate(DiscoveryTimeout);

        const Self = this;
        window.ble.startScanWithOptions(Services, {reportDuplicates: true},
            (Device: IScanDiscovery) =>
            {
                if (TypeInfo.Assigned(Self.Singleton))
                    Self.Singleton.NotificationDiscovery(Device);
            },
            () =>
            {
                if (TypeInfo.Assigned(Self.Singleton))
                    Self.Singleton.error(new EBluetoothLEPlugin());
            }
        );

        return Obj;
    }

    static Stop(): Promise<void>
    {
        if (! TypeInfo.Assigned(this.Singleton))
            return Promise.resolve();
        if (! TypeInfo.Assigned(window.ble))
            return Promise.reject(new EBluetoothLEPlugin());

        return new Promise<void>((resolve, reject) =>
        {
            const Self = this;
            window.ble.stopScan(
                () =>
                {
                    if (TypeInfo.Assigned(Self.Singleton))
                        Self.Singleton.complete();
                    resolve();
                },
                (err: any) =>
                {
                    if (TypeInfo.Assigned(Self.Singleton))
                        Self.Singleton.error(new EBluetoothLEPlugin('ble stopScan failure'));
                    resolve();
                });
        });
    }

    static ClearDeviceList(): void
    {
        if (TypeInfo.Assigned(this.Singleton))
            this.Singleton.DeviceList = [];
    }

    static AdversingDataWalkthrough(adv: ArrayBuffer, Callback: (view: Uint8Array, type: number) => boolean): void
    {
        const view = new Uint8Array(adv);
        let idx = 0;

        while (idx < view.byteLength)
        {
            const len = view[idx];
            if (len === 0)
                break;

            const block_view = new Uint8Array(adv, idx + 2, len - 1);
            if (! Callback(block_view, view[idx + 1]))
                break;
            idx = idx + len + 1;
        }
    }

    /**
     *  private constructor only new by static member
     */
    private constructor(ScanFilter?: (Device: IScanDiscovery) => boolean)
    {
        super();

        this.ScanFilter = ScanFilter;
    }

    private NotificationDiscovery(Device: IScanDiscovery)
    {
        Device.timestamp = new Date().getTime();

        for (const Iter of this.DeviceList)
        {
            if (Iter.id === Device.id)
            {
                Iter.name = Device.name;
                Iter.rssi = Device.rssi;
                Iter.advertising = Device.advertising;
                Iter.timestamp = Device.timestamp;

                this.Updating = true;
                return;
            }
        }

        if (! TypeInfo.Assigned(this.ScanFilter) || this.ScanFilter(Device))
        {
            this.DeviceList.push(Device);
            this.NewDiscoveryList.push(Device);
            this.Updating = true;
        }
    }

    private StartUpdate(DiscoveryTimeout: number)
    {
        if (TypeInfo.Assigned(this.UpdateTimerId))
            return;

        this.UpdateTimerId = setInterval((Self: TGattScaner) =>
        {
            if (this.Updating)
            {
                this.Updating = false;

                const Timestamp = new Date().getTime();
                // discovery timeout device
                for (let i = Self.DeviceList.length - 1; i >= 0; i --)
                {
                    if ((Timestamp - Self.DeviceList[i].timestamp) > DiscoveryTimeout)
                    {
                        const Removed = Self.DeviceList.splice(i, 1)[0];
                        Self.OnDiscoveryTimeout.next(Removed);
                    }
                }
                Self.next(Self.DeviceList);

                for (const Iter of Self.NewDiscoveryList)
                    Self.OnDiscovery.next(Iter);
                Self.NewDiscoveryList = [];
            }
        }, 250, this);

        console.log('TGattScaner Updating for UI timer Started...');
    }

    private SetTimeout(Timeout: number): void
    {
        if (! TypeInfo.Assigned(window.ble))
            return;

        if (TypeInfo.Assigned(this.DaemonTimer))
        {
            clearTimeout(this.DaemonTimer);
            this.DaemonTimer = null;
        }

        this.DaemonTimer = setTimeout((Self: TGattScaner) =>
        {
            this.DaemonTimer = null;

            window.ble.stopScan(
                () =>
                    Self.complete(),
                (err: any) =>
                    Self.error(new EBluetoothLEPlugin('ble stopScan failure'))
            );
        }, Timeout, this);
    }

    private _Disponse()
    {
        if (TypeInfo.Assigned(this.DaemonTimer))
        {
            clearTimeout(this.DaemonTimer);
            this.DaemonTimer = null;
        }

        if (TypeInfo.Assigned(this.UpdateTimerId))
        {
            clearInterval(this.UpdateTimerId);
            this.UpdateTimerId = null;
        }

        this.OnDiscovery.complete();
        this.OnDiscoveryTimeout.complete();

        (this.constructor as typeof TGattScaner).Singleton = undefined;
        console.log('GattScaner Done');
    }

/* Subject */
    complete(): void
    {
        super.complete();
        this._Disponse();
    }

    error(err: any): void
    {
        super.error(err);
        this._Disponse();
    }

    DeviceList: Array<IScanDiscovery> = [];

    OnDiscovery = new Subject<IScanDiscovery>();
    OnDiscoveryTimeout = new Subject<IScanDiscovery>();

    private ScanFilter: ((Device: IScanDiscovery) => boolean) | undefined;
    private NewDiscoveryList: Array<IScanDiscovery> = [];

    private UpdateTimerId: any = null;
    private Updating: boolean = false;
    private DaemonTimer: any = null;

    static Singleton: TGattScaner | undefined;
}

/* IConnectionInfo */

export interface IConnectionInfo
{
    name: string;
    id: string;
    advertising: string;
    rssi: number;
    services: Array<string>;
    characteristics: Array<ICharacteristicInfo>;
}

export type TCharacteristicProp = 'Indicate' | 'Read'| 'Write' | 'WriteWithoutResponse' | 'Notify';

/* ICharacteristicsInfo */

export interface ICharacteristicInfo
{
    service: string;
    characteristic: string;
    properties: Array<TCharacteristicProp>;
    descriptors: Array<Object>;
}

/* TGapConnection */

interface IWriteQueueNext
{
    Instance: TGapConnection;
    Method: string;
    Service: string;
    Characteristic: string;
    Buf: ArrayBuffer;
    resolve: (value: number) => void;
    reject: (reason?: any) => void;
}

export class TGapConnection extends Subject<TCharacteristicStream>
{
    constructor(DeviceId: string, Info: IConnectionInfo)
    {
        super();

        this._DeviceId = DeviceId;

        for (const iter of Info.characteristics)
            this.CharacteristicsInfo.set(iter.characteristic.toUpperCase(), iter);
    }

    get DeviceId(): string
    {
        return this._DeviceId;
    }

    private _DeviceId: string;

    Disconnect(): Promise<void>
    {
        return TGatt.Disconnect(this._DeviceId);
    }

    /** Refresh Timeout, this will delay Disconnect */
    SetTimeout(Timeout: number): void
    {
        this.TimeoutInterval = Timeout;
        this.RefreshTimeout();
    }

    /** set a connection timeout, call disconnect when happens && Callback retuns true  */
    RefreshTimeout(): void
    {
        if (TypeInfo.Assigned(this.TimeoutId))
        {
            clearTimeout(this.TimeoutId);
            this.TimeoutId = undefined;
        }

        if (this.TimeoutInterval === 0)
            return;

        this.TimeoutId = setTimeout(() =>
        {
            this.TimeoutId = undefined;
            this.OnTimeout.next(this);

            if (! TypeInfo.Assigned(this.TimeoutId))
                this.Disconnect().catch((err) => console.log(err.message));
        }, this.TimeoutInterval);
    }

    RSSI(): Promise<number>
    {
        return new Promise((resolve, reject) =>
        {
            window.ble.readRSSI(this._DeviceId,
                (rssi: number) =>
                    resolve(rssi),
                (err: string) =>
                    resolve(undefined));
        });
    }

    ReadChar(Service: string, Characteristic: string): Promise<ArrayBuffer>
    {
        return new Promise<ArrayBuffer>((resolve, reject) =>
        {
            const Self = this;
            window.ble.read(this._DeviceId, Service, Characteristic,
                (buf: any) => resolve(buf),
                (err: any) =>
                {
                    Self.error(new EBluetoothLEPlugin('ble read failure'));
                    reject((err));
                });

            this.RefreshTimeout();
        });
    }

    WriteChar(Service: string, Characteristic: string, buf: ArrayBuffer): Promise<number>
    {
        if (buf.byteLength > MTU)
            throw new EInvalidArg('Write exceed the BLE MTU ' + MTU.toString());

        return new Promise<number>((resolve, reject) =>
        {
            this._Write({
                Instance: this,
                Method: 'write',
                Service: Service, Characteristic: Characteristic, Buf: buf,
                resolve, reject
            });
            /*
            setTimeout(() => (this.constructor as typeof TGapConnection).WriteQueueNext({
                Instance: this,
                Method: 'write',
                Service: Service, Characteristic: Characteristic, Buf: buf,
                resolve, reject
            }));
            */
        })
        .then(val =>
        {
            this.RefreshTimeout();
            return val;
        });
    }

    WriteCharNoResponse(Service: string, Characteristic: string, buf: ArrayBuffer): Promise<number>
    {
        if (buf.byteLength > MTU)
            throw new EInvalidArg('Buffer ' + buf.byteLength + ' exceed the BLE MTU ' + MTU.toString());

        return new Promise<number>((resolve, reject) =>
        {
            this._Write({
                Instance: this,
                Method: 'writeWithoutResponse',
                Service: Service, Characteristic: Characteristic, Buf: buf,
                resolve, reject
            });
            /*
            setTimeout(() => (this.constructor as typeof TGapConnection).WriteQueueNext({
                Instance: this,
                Method: 'writeWithoutResponse',
                Service: Service, Characteristic: Characteristic, Buf: buf,
                resolve, reject
            }));
            */
        })
        .then(val =>
        {
            this.RefreshTimeout();
            return val;
        });
    }

    private _Write(Ctx: IWriteQueueNext): void
    {
        const func = window.ble[Ctx.Method];

        if (! TypeInfo.IsFunction(func))
            Ctx.reject(new EBluetoothLEPlugin('ble ' + Ctx.Method + ' failure'));

        func(Ctx.Instance._DeviceId, Ctx.Service, Ctx.Characteristic, Ctx.Buf,
            () =>
            {
                Ctx.resolve(Ctx.Buf.byteLength);
            },
            (err: any) =>
            {
                const obj = new EBluetoothLEPlugin('BLE.' + Ctx.Method + ': ' + err);
                Ctx.Instance.error(obj);
                Ctx.reject(obj);
            }
        );
    }

    /*
    private static WriteQueueNext(Inst?: IWriteQueueNext): void
    {
        if (TypeInfo.Assigned(Inst))
        {
            if (this.WriteQueue.push(Inst) !== 1)
                return;
        }
        const iter = this.WriteQueue[0];
        const func = window.ble[iter.Method];
        const Self = this;

        if (! TypeInfo.IsFunction(func))
            iter.reject(new EBluetoothLEPlugin('ble ' + iter.Method + ' failure'));

        func(iter.Instance._DeviceId, iter.Service, iter.Characteristic, iter.Buf,
            () =>
            {
                iter.resolve(iter.Buf.byteLength);

                Self.WriteQueue.pop();
                if (Self.WriteQueue.length > 0)
                    setTimeout(() => Self.WriteQueueNext(), 0);
            },
            (err: any) =>
            {
                for (let Idx = this.WriteQueue.length - 1; Idx >= 0 ; Idx --)
                {
                    if (Self.WriteQueue[Idx].Instance === iter.Instance)
                        Self.WriteQueue.splice(Idx, 1);
                }
                if (Self.WriteQueue.length > 0)
                    setTimeout(() => Self.WriteQueueNext(), 0);

                const obj = new EBluetoothLEPlugin('BLE.' + iter.Method + ': ' + err);
                iter.Instance.error(obj);
                iter.reject(obj);
            }
        );
    }
    private static WriteQueue = new Array<IWriteQueueNext>();
    */

    /** start new or get Characteristic Stream that receive Notification
     *  *NOTE*: each Service.Characteristic can have one solo Characteristic Stream
     *      multiple StartNotification calls using same Service & Characteristic got same Stream
    */
    StartNotification(Service: string, Characteristic: string,
        CharacteristicStreamType?: typeof TCharacteristicStream): TCharacteristicStream
    {
        for (const Stream of this.CharacteristicStreamList)
        {
            if (Stream.Service === Service && Stream.Characteristic === Characteristic)
                return Stream;
        }

        if (! TypeInfo.Assigned(CharacteristicStreamType))
            CharacteristicStreamType = TCharacteristicStream;

        const RetVal = new CharacteristicStreamType(this, Service, Characteristic);
        this.CharacteristicStreamList.push(RetVal);

        const Self = this;
        window.ble.startNotification(this._DeviceId, Service, Characteristic,
            (buf: ArrayBuffer) =>
            {
                Self.RefreshTimeout();
                RetVal.next(buf);
            },
            (err: any) =>
                Self.error(new EBluetoothLEPlugin('ble startNotification failure')));

        return RetVal;
    }

    StopNotification(Service: string, Characteristic: string): void
    {
        for (let i = 0; i < this.CharacteristicStreamList.length; i ++)
        {
            if (this.CharacteristicStreamList[i].Service === Service &&
                this.CharacteristicStreamList[i].Characteristic === Characteristic)
            {
                const s = this.CharacteristicStreamList.splice(i, 1)[0];

                s._Disponse();
                s.complete();
                break;
            }
        }
        window.ble.stopNotification(this._DeviceId, Service, Characteristic);
    }

    private Disponse()
    {
        console.log('GapConnection disponse');

        if (TypeInfo.Assigned(this.TimeoutId))
        {
            clearTimeout(this.TimeoutId);
            this.TimeoutId = undefined;
        }
        if (TypeInfo.Assigned(this.OnTimeout))
        {
            this.OnTimeout.complete();
            this.OnTimeout = undefined;
        }

        this.CharacteristicStreamList.forEach((Stream) => Stream._Disponse());
    }

    CharacteristicsInfo = new Map<string, ICharacteristicInfo>();
    OnTimeout = new Subject<TGapConnection>();

    private TimeoutInterval: number = 0;
    private TimeoutId: any;
    private CharacteristicStreamList = new Array<TCharacteristicStream>();

/* Subject */
    complete(): void /**@override */
    {
        console.log('GapConnection completed');
        super.complete();
        this.Disponse();
    }

    error(err: any): void /**@override */
    {
        console.log('GapConnection error: ' + err.message);
        super.error(err);
        this.Disponse();
    }
}

/* TCharacteristicStream */

export class TCharacteristicStream extends TStream
{
    constructor(Owner: TGapConnection, Service: string, Characteristic: string)
    {
        super();

        this._Connection = Owner;
        this._Service = Service;
        this._Characteristic = Characteristic;
    }

    get Connection(): TGapConnection
    {
        return this._Connection;
    }

    get Service(): string
    {
        return this._Service;
    }

    get Characteristic(): string
    {
        return this._Characteristic;
    }

    StopNotification(): void
    {
        if (TypeInfo.Assigned(this._Connection))
            this._Connection.StopNotification(this._Service, this._Characteristic);
    }

    /// @private: call from TGapConnection
    _Disponse()
    {
        (this as any)._Connection = undefined;
    }

 /* TStream */
    Read(Buf: Uint8Array, Count?: number): Promise<number> /**@override */
    {
        if (! TypeInfo.Assigned(Count) || Count > Buf.byteLength)
            Count = Buf.byteLength;

        if (Count !== Buf.byteLength)
        {
            const view = new Uint8Array(Buf.buffer, Buf.byteOffset, Count);
            return Promise.resolve(this.InBuffer.ExtractTo(view));
        }
        else
            return Promise.resolve(this.InBuffer.ExtractTo(Buf));
    }

    Write(Buf: Uint8Array, Count?: number): Promise<number> /**@override */
    {
        if (! TypeInfo.Assigned(this._Connection))
            return Promise.reject(new Error('e_disconnected'));

        if (! TypeInfo.Assigned(Count) || Count > Buf.byteLength)
            Count = Buf.byteLength;

        Count = Count > MTU ? MTU : Count;

        const View = new Uint8Array(Buf.buffer, Buf.byteOffset, Count);
        Buf = new Uint8Array(Count);
        Buf.set(View);

        if (TGatt.StrictWrite)
            return this._Connection.WriteChar(this._Service, this._Characteristic, Buf.buffer as ArrayBuffer);
        else
            return this._Connection.WriteCharNoResponse(this._Service, this._Characteristic, Buf.buffer as ArrayBuffer);
    }

    WriteBuf(Buf: Uint8Array, Count?: number): Observable<number> /**@override for BLE interval Write */
    {
        if (TGatt.StrictWrite)
            return super.WriteBuf(Buf, Count, 0);
        else
            return super.WriteBuf(Buf, Count, MIN_WRITE_INTERVAL);
    }

    _Connection: TGapConnection;
    _Service: string;
    _Characteristic: string;
    protected InBuffer = new TLoopBuffer(NOTIFICATION_IN_BUFFER);

/* Subject<T> */

    next(value: ArrayBuffer)
    {
        this.InBuffer.Push(new Uint8Array(value));
        this._Connection.next(this);

        super.next(value);
    }

    complete(): void
    {
        if (! this.isStopped)
        {
            super.complete();
            this.StopNotification();
        }
    }

    error(err: any): void
    {
        if (! this.isStopped)
        {
            super.error(err);
            this.StopNotification();
        }
    }
}
