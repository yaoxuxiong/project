import {Component, OnInit, OnDestroy, Output, EventEmitter} from '@angular/core';
import {Subscription} from 'rxjs/Subscription';

import {TypeInfo} from '../../../UltraCreation/Core/TypeInfo';
import {Platform} from '../../../UltraCreation/Core/Platform';
import * as Svc from '../../../providers';

import {NativeSetting} from '../../../UltraCreation/Native/NativeSetting';

@Component({selector: 'discover-peripheral', templateUrl: 'discover.comp.html'})
export class DiscoverComp implements OnInit, OnDestroy
{
    constructor(private Discover: Svc.TDiscoverService)
    {
    }

    ngOnInit(): void
    {
        console.log('discover component construct');

        this.Start();
        setTimeout(() => this.Prepare());
    }

    ngOnDestroy(): void
    {
        if (TypeInfo.Assigned(this.ScanSub))
        {
            this.ScanSub.unsubscribe();
            this.ScanSub = undefined;
        }

        if (TypeInfo.Assigned(this.TimeoutSub))
        {
            this.TimeoutSub.unsubscribe();
            this.TimeoutSub = undefined;
        }

        this.Discover.Stop();
        console.log('discover component destroying');
    }

    Start(): void
    {
        this.PeripheralList = this.Discover.PeripheralList;

        if (! TypeInfo.Assigned(this.ScanSub))
        {
            this.ScanSub = this.Discover.OnDiscover.subscribe(Peripheral =>
            {
                this.PeripheralList = this.Discover.PeripheralList;

                if (! TypeInfo.Assigned(this.LastSelection) && this.PeripheralList.length > 0)
                    this.SelectionDevice(this.PeripheralList[0]);
            });
        }

        if (! TypeInfo.Assigned(this.TimeoutSub))
        {
            this.TimeoutSub = this.Discover.OnDiscoverTimeout.subscribe(Peripheral =>
            {
                this.PeripheralList = this.Discover.PeripheralList;

                if (Peripheral = this.LastSelection)
                {
                    this.LastSelection = undefined;

                    if (this.Discover.PeripheralList.length > 0)
                        this.SelectionDevice(this.Discover.PeripheralList[0]);
                    else
                        this.SelectionDevice(undefined);
                }

                this.PeripheralList = this.Discover.PeripheralList;
            });
        }
    }

    SelectionDevice(peri: Svc.TPeripheral): void
    {
        if (this.LastSelection !== peri)
            this.LastSelection = peri;

        this.OnSelectionDevice.emit(peri);
    }

    private Prepare(): void
    {
        this.Discover.PrepareBLE()
            .catch(err =>
            {
                if (err instanceof Svc.ELocationServiceRequired)
                {
                    return App.ShowAlert({
                        message:
                            App.Translate('hint.open_location'),
                        buttons: [
                        {
                            text: App.Translate('button.go'), handler: () =>
                            {
                                NativeSetting.LocationService.GoSetting();
                                return false;   // avoid close
                            }
                        }]
                    })
                    .then(alert =>
                        NativeSetting.LocationService.WaitForEnable().then(() => alert.dismiss()));
                }
                else
                    return Promise.reject(err);
            })
            .then(() =>
                this.Discover.Start())
            .catch(err =>
                App.ShowError(err));

        if (Platform.IsAndroid && ! TypeInfo.Assigned(this.LocationServiceSub))
        {
            this.LocationServiceSub = NativeSetting.LocationService.OnStateChange.subscribe(next =>
            {
                if (next === NativeSetting.LocationService.Instance.locationMode.LOCATION_OFF)
                    setTimeout(() => this.Prepare());
            });
        }
    }

    PeripheralList: Array<Svc.TPeripheral> = [];
    private ScanSub: Subscription | undefined;
    private TimeoutSub: Subscription | undefined;
    private LocationServiceSub: Subscription | undefined;

    private LastSelection: Svc.TPeripheral | undefined = undefined;

    @Output() OnSelectionDevice = new EventEmitter<Svc.TPeripheral | undefined>();
}
