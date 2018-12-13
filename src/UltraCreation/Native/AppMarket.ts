/*
 * Native Phone Call Trapper support
 *      cordova plugin add cordova-plugins-market --save
 *      https://github.com/xmartlabs/cordova-plugin-market
 */
import {TCordovaPlugin} from './Abstract.Plugin';

export class AppMarket extends TCordovaPlugin
{
    static readonly Name: string = 'market';
    static readonly Repository: string = 'cordova-plugins-market';

    static Open(AppId: string): Promise<void>
    {
        return this.CallbackToPromise_LeftParam<void>('open', AppId).catch(err => {});
    }
}
