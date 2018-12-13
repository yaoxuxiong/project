/**
 *  https://github.com/apache/cordova-plugin-splashscreen
 *      cordova plugin add cordova-plugin-splashscreen --save
 */
import {TypeInfo} from '../Core/TypeInfo';

export class SplashScreen
{
    static show(): void
    {
        if (! TypeInfo.Assigned((navigator as any).splashscreen))
        {
            console.error('SplashScreen Plugin not Installed.');
            return;
        }

        (navigator as any).splashscreen.show();
    }

    static hide(): void
    {
        if (! TypeInfo.Assigned((navigator as any).splashscreen))
        {
            console.error('SplashScreen Plugin not Installed.');
            return;
        }

        (navigator as any).splashscreen.hide();
    }
}
