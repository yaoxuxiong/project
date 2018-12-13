/*
 *  Cordova AppVersion plugin
 *      cordova plugin add cordova-plugin-local-notification --save
 *      https://github.com/katzer/cordova-plugin-local-notifications
 *
 *  this plugins dependency
 *      https://github.com/katzer/cordova-plugin-badge
 *
 *      todo: cordova-plugin-badge
 */
import {TCordovaPlugin} from './Abstract.Plugin';
import {TypeInfo} from '../Core/TypeInfo';

declare var window: any;

export namespace NativeNotification
{
/** AppBadge */
    export class AppBadge extends TCordovaPlugin
    {
        static readonly Name: string = 'notification.local';
        static readonly Repository: string = 'cordova-plugin-local-notification';

        static async Set(badge: number): Promise<number>
        {
            this.CallFunction('set', badge);
            return badge;
        }

        static Increase(badge: number): Promise<number>
        {
            return this.CallbackToPromise_LeftParam<number>('increase', badge);
        }

        static Decrease(badge: number): Promise<number>
        {
            return this.CallbackToPromise_LeftParam<number>('decrease', badge);
        }

        static Clear(): void
        {
            return this.CallFunction('clear');
        }

        protected static _GetInstance(PluginName: string): any
        {
            if (! TypeInfo.Assigned(window.cordova))
                return undefined;
            if (! TypeInfo.Assigned(window.cordova.plugins))
                return undefined;
            if (! TypeInfo.Assigned(window.cordova.plugins.notification))
                return undefined;

            return window.cordova.plugins.notification.badge;
        }
    }

/** Local Notification */

    export interface IAction
    {
        id?: string;
        title?: string;
        type?: string;
        emptyText?: string;
    }

    export interface ISchedule
    {
        id?: number;
        title?: string;
        text?: string;
        attachments?: Array<string>;
        actions?: Array<IAction>;
    }

    export class Local extends TCordovaPlugin
    {
        static readonly Name: string = 'notification.local';
        static readonly Repository: string = 'cordova-plugin-local-notification';

        static Defaults(): any
        {
            return this.CallFunction('getDefaults');
        }

        static Push(Noti: ISchedule): void;
        static Push(Noti: ISchedule[]): void;
        static Push(Noti: ISchedule | ISchedule[]): void
        {
            if (! (Noti instanceof Array))
                Noti = [Noti];
            return this.CallFunction('schedule', Noti);
        }

        protected static _GetInstance(PluginName: string): any
        {
            if (! TypeInfo.Assigned(window.cordova))
                return undefined;
            if (! TypeInfo.Assigned(window.cordova.plugins))
                return undefined;
            if (! TypeInfo.Assigned(window.cordova.plugins.notification))
                return undefined;

            console.log(window.cordova.plugins.notification.local);
            return window.cordova.plugins.notification.local;
        }
    }
}
