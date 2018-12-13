import {Injectable, Injector} from '@angular/core';
import {AlertOptions, Alert, Loading} from 'ionic-angular';

import {TAppController} from '../UltraCreation/ng-ion/appcontroller';
import {TypeInfo} from '../UltraCreation/Core/TypeInfo';
import {EHttpClient} from '../UltraCreation/Core/Http';
import * as BLE from '../UltraCreation/Native/BluetoothLE';
import {TDiscoverService} from '.';

declare global
{
    var App: TApplication | undefined;

    interface Window
    {
        App: TApplication | undefined;
    }
}

@Injectable()
export class TApplication extends TAppController
{
    constructor(Injector: Injector)
    {
        super(Injector);

        console.log('TApplication Construct');

        window.App = this;

        let ts = new Date().getTime();
        this.Platform.ready().then(() =>
        {
            this.Platform.registerBackButtonAction(() =>
            {
                if (this.HardwareBackButtonDisabled)
                    return;

                if (this.Nav.canGoBack())
                {
                    this.Nav.pop();
                    return;
                }

                const now = new Date().getTime();
                if (now - ts > 500)
                {
                    if (now - ts > 3000)
                        this.ShowToast(this.Translate('hint.back_twice_exit'));
                    ts = now;
                }
                else
                    BLE.TGatt.StopScan().then(() => setTimeout(this.Platform.exitApp(), 100));
            });
        });
    }

    ShowLoading(Msg?: string): Promise<Loading>
    {
        if (! TypeInfo.Assigned(Msg))
        {
            return super.ShowLoading({spinner: 'hide', cssClass: 'loading-s1', showBackdrop: true, content: `<img src="assets/img/Loading.gif" />`});
        }
        else
            return super.ShowLoading({spinner: 'circles', content: Msg, cssClass: 'loading-s1'});
    }

    ShowToast(MsgOrConfig: string | Object): Promise<any>
    {
        if (MsgOrConfig instanceof Object)
            return super.ShowToast(MsgOrConfig);
        else
            return super.ShowToast({message: MsgOrConfig, position: 'middle', cssClass: 'toast-s1', duration: 1500});
    }

    ShowError(err: any,
        duration: number = 3000, position: 'top' | 'bottom' | 'middle' = 'middle'): Promise<void>
    {
        if (err instanceof EHttpClient)
        {
            if (TypeInfo.Assigned(err.Response))
            {
                const Content = err.Response.Content;

                return super.ShowError(Content.err, {
                    duration: duration, position: position,
                    cssClass: 'toast-s1'});
            }
            else
            {
                return super.ShowError(err.message, {
                    duration: duration, position: position,
                    cssClass: 'toast-s1'});
            }
        }
        else
        {
            if (err instanceof Error && err.message === 'e_disconnected')
                err.message = 'disconnected';

            return super.ShowError(err, {
                duration: duration, position: position,
                style: 'toast-s1',  prefix_lang: 'hint.'});
        }
    }

    ShowAlert(option: Object): Promise<Alert>
    {
        const alertOption: AlertOptions = option;
        if (! TypeInfo.Assigned(alertOption.cssClass))
            alertOption.cssClass = 'alert-s1';

        if (TypeInfo.Assigned(alertOption.buttons))
        {
            alertOption.buttons.forEach(button =>
            {
                if (! (typeof(button) === 'string') &&
                    ! (button as any).cssClass)
                {
                    (button as any).cssClass = 'round';
                }
            });
        }

        return super.ShowAlert(alertOption);
    }

    DisableHardwareBackButton()
    {
        this.HardwareBackButtonDisabled = true;
    }

    EnableHardwareBackButton()
    {
        this.HardwareBackButtonDisabled = false;
    }

    private HardwareBackButtonDisabled: boolean = false;
}
