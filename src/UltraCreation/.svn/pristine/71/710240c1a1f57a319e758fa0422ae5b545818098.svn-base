/**
 *  Native PowerManagement support
 *      .Cordova PowerManagement plugin
 *          cordova plugin add cordova-plugin-powermanagement --save
 *          https://github.com/cranberrygame/cordova-plugin-powermanagement
 */
import {TCordovaPlugin} from './Abstract.Plugin';

export class PowerManagement extends TCordovaPlugin
{
    static readonly Name: string = 'powermanagement';
    static readonly Repository: string = 'cordova-plugin-powermanagement';

    static Acquire(Timeout: number = 0): void
    {
        this.CallFunction<void>('acquire');
        if (Timeout > 0)
            setTimeout(() => this.Release(), Timeout);
    }

    static Release(): void
    {
        this.CallFunction<void>('release');
    }
}
