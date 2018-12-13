import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/toPromise';

import {TypeInfo} from '../../UltraCreation/Core/TypeInfo';
import {TShellRequest, ERequestTimeout} from '../../UltraCreation/Native/Abstract.Shell';
import * as BLE from '../../UltraCreation/Native/BluetoothLE';

import {TOTARequest} from './shell.ota';

export {ERequestTimeout};

const BLE_CONNECTION_TIMEOUT = 15000;
const REQUEST_TIMEOUT = 6000;

/* TShell */

export class TShell extends BLE.TShell
{
    static Get<TShell>(DeviceId: string): TShell
    {
        return super.Get(DeviceId, BLE_CONNECTION_TIMEOUT) as any;
    }

    OTARequest(Firmware: ArrayBuffer): Promise<TShellRequest>
    {
        return this.RequestStart(TOTARequest, REQUEST_TIMEOUT, Firmware);
    }

/** TAbstractShell overrides */

    protected AfterConnected(): Promise<void> /**@override */
    {
        console.warn('Shell: device connected...');
        return super.AfterConnected();
    }

    protected OnDisconnected(): void /**@override */
    {
        console.warn('Shell: device disconnected...');
        super.OnDisconnected();
    }

    protected OnRead(Line: string): void /**@override */
    {
        console.log(Line);
        return super.OnRead(Line);
    }

    protected OnConnectionTimeout(): void /**@override */
    {
        super.OnConnectionTimeout();
        // ignore timeout
        this.Connection.RefreshTimeout();
    }
}
