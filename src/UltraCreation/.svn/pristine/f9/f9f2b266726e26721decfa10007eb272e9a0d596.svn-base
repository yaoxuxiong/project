/**
 *  Native PowerManagement support
 *      .Cordova PowerManagement plugin
 *          cordova plugin add cordova-plugin-powermanagement --save
 *          https://github.com/cranberrygame/cordova-plugin-powermanagement
 */
import {TypeInfo} from '../Core/TypeInfo';

export class PowerManagement
{
    static Acquire(Timeout: number = 0): void
    {
        if (! TypeInfo.Assigned((window as any).powermanagement))
        {
            console.error('PowerManagement plugin not installed.');
            return;
        }
        else
        {
            (window as any).powermanagement.acquire();
            console.log('PowerManagement Acquired');
        }

        if (Timeout > 0)
            setTimeout(() => this.Release(), Timeout);
    }

    static Release(): void
    {
        if (! TypeInfo.Assigned((window as any).powermanagement))
        {
            console.error('PowerManagement plugin not installed.');
            return;
        }
        else
        {
            (window as any).powermanagement.release();
            console.log('PowerManagement Released');
        }
    }
}
