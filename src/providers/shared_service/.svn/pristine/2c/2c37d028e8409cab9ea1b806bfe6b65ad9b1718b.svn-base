/**
 *  Discover Peripheral Service
 *      for BLE peripheral device discover
 *          cordova plugin add cordova-plugin-ble-central --save
 *
 *      for UPnP peripheral device discover
 *
 *      for android only need to enable Location Service
 *          cordova plugin add cordova.plugins.diagnostic --save
 *      add config.xml
 *          <preference name="cordova.plugins.diagnostic.modules" value="LOCATION" />
 */
import {Injectable, isDevMode, OnInit, OnDestroy} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {Subscription} from 'rxjs/Subscription';

import {TypeInfo} from '../../UltraCreation/Core/TypeInfo';
import {Platform} from '../../UltraCreation/Core/Platform';
import {Exception, EAbort} from '../../UltraCreation/Core/Exception';
import * as BLE from '../../UltraCreation/Native/BluetoothLE';

import {TUPnPContrlPoint, ESocketPlugin} from '../../UltraCreation/Native/Socket';
import {TPeripheral, TConnectablePeripheral, PeripheralFactory, PERIPHERAL_TIMEOUT} from './asset.peripheral';
import {NativeSetting} from '../../UltraCreation/Native/NativeSetting';

const DEF_DISCOVER_TIMEOUT = PERIPHERAL_TIMEOUT;
const DEF_SCAN_TIMEOUT = PERIPHERAL_TIMEOUT * 2;

export class EBluetoothNotEnabled extends Exception
{
    constructor()
    {
        super('open_ble');
    }
}

export class ELocationServiceRequired extends Exception
{
    constructor()
    {
        super('open_location');
    }
}

@Injectable()
export class TDiscoverService implements OnInit, OnDestroy
{
    private static Singleton: TDiscoverService = undefined;

    constructor()
    {
        console.log('TDiscoverService construct');

        if (TypeInfo.Assigned((this.constructor as typeof TDiscoverService).Singleton))
            console.warn('TDiscoverService is prefer global injection.');
        else
            (this.constructor as typeof TDiscoverService).Singleton = this;
    }

    ngOnInit(): void
    {
        console.log('TDiscoverService Construct.');
    }

    ngOnDestroy(): void
    {
        console.log('TDiscoverService Destruct.');
        this.Stop();
    }

    IsBrowserDebuging(): boolean
    {
        return isDevMode() && ! BLE.Admin.IsPluginInstalled;
    }

    async PrepareBLE(): Promise<void>
    {
        if (this.IsBrowserDebuging())
        {
            console.warn('develop mode and not BLE plugin installed...is browser debuging?');
            return;
        }
        console.log('prepareing BLE...');

        let Enabled = await BLE.Admin.IsEnable();
        if (! Enabled)
        {
            if (Platform.IsAndroid)
            {
                Enabled = await BLE.Admin.AndroidRequestEnable();
                if (! Enabled)
                    throw new EBluetoothNotEnabled();
            }
            else
                throw new EBluetoothNotEnabled();
        }

        if (Platform.IsAndroid)
        {
            Enabled = await NativeSetting.LocationService.IsEnabled();
            if (! Enabled)
                throw new ELocationServiceRequired();
        }

        BLE.Admin.OnStateChange.subscribe(next =>
        {
            if (this.Scanning && next === 'turningOn')
                this.StartScanBLE();
        });
    }

    async PrepareWifi(): Promise<void>
    {
    }

    GoLocationSetting(): void
    {
        NativeSetting.LocationService.GoSetting();
    }

    WaitLocationSetting(): Promise<void>
    {
        return NativeSetting.LocationService.WaitForEnable();
    }

    GoBleSetting(): void
    {
        // BLE.Admin.go
    }

    WaitForBleEnabled(): Promise<void>
    {
        return BLE.Admin.WaitForEnable();
    }

    _DevFakeDevice(Type: string, Addr?: string)
    {
        if (! TypeInfo.Assigned(Addr))
            Addr = '00:00:00:00:00:00';

        const Peripheral = PeripheralFactory.Get(Addr, Type);
        Peripheral.Status.RSSI = -50;
        Peripheral.Status.BatteryPercent = 0;
        Peripheral.LastActivity = new Date().getTime();

        console.log('attach fake device');

        setTimeout(() => this.Discover(Peripheral), 1000);
        setInterval(() => Peripheral.DevTest(), 1000);
    }

    async ScanId(Id: string): Promise<TPeripheral>;
    async ScanId(Id: string[]): Promise<TPeripheral[]>;
    async ScanId(Id: string | string[]): Promise<TPeripheral | TPeripheral[]>
    {
        await this.Stop();
        try
        {
            const RetVal = await new Promise<TPeripheral | TPeripheral[]>((resolve, reject) =>
            {
                const MutiRetVal: TPeripheral[] = [];

                this.Start().subscribe(
                    next =>
                    {
                        if ((Id instanceof Array) && Id.indexOf(next.Id) !== -1)
                        {
                            MutiRetVal.push(next);

                            if (MutiRetVal.length === Id.length)
                                resolve(MutiRetVal);
                        }
                        else if (next.Id === Id)
                            resolve(next);
                    },
                    err =>
                        reject(err),
                    () =>
                        reject(new EAbort())
                );

                setTimeout(() =>
                {
                    if ((Id instanceof Array) && MutiRetVal.length > 0)
                        resolve(MutiRetVal);
                    else
                        reject(new EAbort());
                }, DEF_DISCOVER_TIMEOUT);
            });

            return RetVal;
        }
        finally
        {
            await this.Stop();
        }
    }

    Start(): Subject<TPeripheral>
    {
        const LocalPnP = PeripheralFactory.GetFromLocalPnP();
        if (TypeInfo.Assigned(LocalPnP))
        {
            console.log('discovered PNP device.');
            setTimeout(() => this.Discover(LocalPnP));
        }
        else
        {
            if (! this.Scanning)
            {
                this.Scanning = true;

                if (PeripheralFactory.HasBLE)
                {
                    this.StartScanBLE();
                    console.log('Discover from BLE');
                }

                if (PeripheralFactory.HasUniversalPnP)
                {
                    setTimeout(() => this.StartScanSSDP(), 200);
                    console.log('Discover from Univeral Plug and Play');
                }

                console.log('AdNames: ' + PeripheralFactory.AdNames);
            }
        }

        return this.OnDiscover;
    }

    async Stop(): Promise<void>
    {
        this.Scanning = false;
        try
        {
            await this.StopScanBLE();
            await this.StopScanSSDP();

            clearTimeout(this.DiscoverTimeoutId);
            this.PeripheralList = [];
        }
        catch (e)
        {
        }
    }

    ManualDiscover(Peripheral: TPeripheral)
    {
        Peripheral.LastActivity = new Date().getTime();
        Peripheral.Status.RSSI = 0;

        setTimeout(() => this.Discover(Peripheral));
    }

    protected Discover(Peripheral: TPeripheral)
    {
        this.OnScanResponse.next(Peripheral);

        for (const Iter of this.PeripheralList)
        {
            if (Iter.Id === Peripheral.Id || Iter === Peripheral)
                return;
        }

        this.PeripheralList.push(Peripheral);
        this.StartDiscoverTimeout();

        this.OnDiscover.next(Peripheral);
    }

    private StartDiscoverTimeout()
    {
        if (TypeInfo.Assigned(this.DiscoverTimeoutId))
            return;
        if (this.PeripheralList.length === 0)
            return;

        this.DiscoverTimeoutId = setTimeout(() => Loop(this), 1000);

        function Loop(Self: TDiscoverService)
        {
            const Now = new Date().getTime();

            for (let i = Self.PeripheralList.length - 1; i >= 0; i --)
            {
                const Peripheral = Self.PeripheralList[i];

                // connected device
                if (Peripheral instanceof TConnectablePeripheral && Peripheral.IsConnected)
                {
                    const Shell = Peripheral.Shell;

                    if (TypeInfo.Assigned(Shell.Connection))
                    {
                        if (typeof Shell.Connection.RSSI === typeof Function)
                        {
                            const RSSI = Shell.Connection.RSSI();

                            if (RSSI instanceof Promise)
                            {
                                RSSI.then(val =>
                                {
                                    if (! TypeInfo.Assigned(val))
                                    {
                                        const Idx = Self.PeripheralList.indexOf(Peripheral);
                                        if (Idx !== -1)
                                        {
                                            const removed = Self.PeripheralList.splice(Idx, 1)[0];
                                            removed.SignalUpdate(undefined);
                                            setTimeout(() => Self.OnDiscoverTimeout.next(removed));
                                        }
                                    }
                                    else
                                        Peripheral.SignalUpdate(val);
                                });
                            }
                            else if (TypeInfo.IsNumber(RSSI))
                            {
                                if (! TypeInfo.Assigned(RSSI))
                                {
                                    const removed = Self.PeripheralList.splice(i, 1)[0];
                                    removed.SignalUpdate(undefined);
                                    setTimeout(() => Self.OnDiscoverTimeout.next(removed));
                                }
                                else
                                    Peripheral.SignalUpdate(RSSI);
                            }
                        }
                        else
                            console.warn('Shell.Connection.RSSI() not implemented.');
                    }
                }
                else if (Now - Peripheral.LastActivity >= Self.DiscoverTimeout)
                {
                    const removed = Self.PeripheralList.splice(i, 1)[0];
                    removed.SignalUpdate(undefined);

                    setTimeout(() => Self.OnDiscoverTimeout.next(removed));
                }
            }

            if (Self.PeripheralList.length === 0)
                Self.DiscoverTimeoutId = undefined;
            else
                Self.DiscoverTimeoutId = setTimeout(() => Loop(Self), 1000);
        }
    }

    private async StartScanBLE(): Promise<void>
    {
        await this.StopScanBLE();

        const Gatt = BLE.TGattScaner.Start([], (Device: BLE.IScanDiscovery): boolean =>
        {
            if (! TypeInfo.Assigned(Device.name))
                return false;

            const view = BLE.TGatt.GetManufactoryData(Device.advertising);
            const Peripheral = PeripheralFactory.GetFromBLE(Device.name, view, Device.id);
            if (TypeInfo.Assigned(Peripheral))
            {
                Peripheral.SignalUpdate(Device.rssi);
                this.Discover(Peripheral);
            }

            // always false to ignore TGattScanner.DeviceList
            return false;
        }, this.ScanTimeout);

        this.GattScanner = Gatt.subscribe(
            next => {},
            err => {},
            () =>
            {
                console.log('StartScanBLE.complate');

                if (TypeInfo.Assigned(this.GattScanner))
                {
                    this.GattScanner.unsubscribe();
                    setTimeout(() => this.StartScanBLE());
                }
            });
    }

    private StopScanBLE(): Promise<void>
    {
        if (TypeInfo.Assigned(this.GattScanner))
            this.GattScanner.unsubscribe();
        this.GattScanner = undefined;

        return BLE.TGatt.StopScan().catch(err => {});
    }

    private async StartScanSSDP()
    {
        await this.StopScanSSDP();

        if (! TypeInfo.Assigned(this.SsdpSearcher))
        {
            this.SsdpSearcher = new TUPnPContrlPoint();
            this.SsdpSearcher.Init();
        }

        this.SsdpSubscription = this.SsdpSearcher.OnDeviceFound().subscribe((DeviceInfo) =>
        {
            console.log('Found ' + JSON.stringify(DeviceInfo));
            const Peripheral = PeripheralFactory.GetFromSocket(DeviceInfo.Id, DeviceInfo.Addr, DeviceInfo.Name);
            if (TypeInfo.Assigned(Peripheral))
            {
                Peripheral.SignalUpdate(-0);
                this.Discover(Peripheral);
            }
        });

        this.SsdpSearchTimerId = setInterval(() =>
        {
            this.SsdpSearcher.SearchDevice().catch((err) =>
            {
                if (err instanceof ESocketPlugin)
                {
                    console.log('without socket plugin');
                    this.StopScanSSDP();
                }
            });
        }, 5000);
    }

    private async StopScanSSDP()
    {
        if (TypeInfo.Assigned(this.SsdpSearchTimerId))
        {
            clearInterval(this.SsdpSearchTimerId);
            this.SsdpSearchTimerId = undefined;
        }

        if (TypeInfo.Assigned(this.SsdpSubscription))
        {
            this.SsdpSubscription.unsubscribe();
            this.SsdpSubscription = undefined;
        }
    }

    PeripheralList: Array<TPeripheral> = [];

    Scanning = false;
    ScanTimeout = DEF_SCAN_TIMEOUT;
    DiscoverTimeout = DEF_DISCOVER_TIMEOUT;

    OnScanResponse = new Subject<TPeripheral>();
    OnDiscover = new Subject<TPeripheral>();
    OnDiscoverTimeout = new Subject<TPeripheral>();

    private GattScanner: Subscription;
    private DiscoverTimeoutId: any;

    private SsdpSearcher: TUPnPContrlPoint;
    private SsdpSubscription: Subscription;
    private SsdpSearchTimerId: any;
}
