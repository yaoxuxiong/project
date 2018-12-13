/**
 *  https://github.com/apache/cordova-plugin-splashscreen
 *      cordova plugin add cordova-plugin-splashscreen --save
 */
import {TCordovaPlugin} from './Abstract.Plugin';

export class SplashScreen extends TCordovaPlugin
{
    static readonly Name: string = 'splashscreen';
    static readonly Repository: string = 'cordova-plugin-splashscreen';

    static show(): void
    {
        return this.CallFunction<void>('show');
    }

    static hide(): void
    {
        return this.CallFunction<void>('hide');
    }
}
