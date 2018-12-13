/*
 *  Cordova AppVersion plugin
 *      cordova plugin add cordova-plugin-app-version --save
 *      https://github.com/whiteoctober/cordova-plugin-app-version
 */
import {TCordovaPlugin} from './Abstract.Plugin';

export class AppVersion extends TCordovaPlugin
{
    static readonly Name: string = 'getAppVersion';
    static readonly Repository: string = 'cordova-plugin-app-version';

    static getAppName(): Promise<string>
    {
        return this.CallbackToPromise<string>('getAppName')
            .catch(err => '<APP NAME>');
    }

    static getPackageName(): Promise<string>
    {
        return this.CallbackToPromise<string>('getPackageName')
            .catch(err => 'PACKAGE NAME');
    }

    static getVersionCode(): Promise<string>
    {
        return this.CallbackToPromise<string>('getVersionCode')
            .catch(err => '<VERSION CODE>');
    }

    static getVersionNumber(): Promise<string>
    {
        return this.CallbackToPromise<string>('getVersionNumber')
            .catch(err => '<VERSION NUMBER>');
    }
}
