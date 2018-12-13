/**
 *  https://github.com/apache/cordova-plugin-statusbar
 *      cordova plugin add cordova-plugin-statusbar --save
 */
import {TypeInfo} from '../Core/TypeInfo';

export class StatusBar
{
    /** iOS */
    static overlaysWebView(Overlay: boolean = true): void
    {
        if (! TypeInfo.Assigned((window as any).StatusBar))
        {
            console.error('StatusBar Plugin not Installed.');
            return;
        }

        (window as any).StatusBar.overlaysWebView(Overlay);
    }

    static styleDefault(): void
    {
        if (! TypeInfo.Assigned((window as any).StatusBar))
        {
            console.error('StatusBar Plugin not Installed.');
            return;
        }

        (window as any).StatusBar.styleDefault();
    }

    /** iOS, WP */
    static styleLightContent(): void
    {
        if (! TypeInfo.Assigned((window as any).StatusBar))
        {
            console.error('StatusBar Plugin not Installed.');
            return;
        }

        (window as any).StatusBar.styleLightContent();
    }

    /** iOS, WP */
    static styleBlackTranslucent(): void
    {
        if (! TypeInfo.Assigned((window as any).StatusBar))
        {
            console.error('StatusBar Plugin not Installed.');
            return;
        }

        (window as any).StatusBar.styleBlackTranslucent();
    }

    /** iOS, WP */
    static styleBlackOpaque(): void
    {
        if (! TypeInfo.Assigned((window as any).StatusBar))
        {
            console.error('StatusBar Plugin not Installed.');
            return;
        }

        (window as any).StatusBar.styleBlackOpaque();
    }

    /** iOS note: you must call StatusBar.overlaysWebView(false) to enable color changing. */
    static backgroundColorByName(colorName: 'black' | 'darkGray' | 'lightGray' | 'white' | 'gray' | 'red' | 'green' |
        'blue' | 'cyan' | 'yellow' | 'magenta' | 'orange' | 'purple' | 'brown'): void
    {
        if (! TypeInfo.Assigned((window as any).StatusBar))
        {
            console.error('StatusBar Plugin not Installed.');
            return;
        }

        (window as any).StatusBar.backgroundColorByName(colorName);
    }

    /** iOS note: you must call StatusBar.overlaysWebView(false) to enable color changing. */
    static backgroundColorByHexString(hexString: string): void
    {
        if (! TypeInfo.Assigned((window as any).StatusBar))
        {
            console.error('StatusBar Plugin not Installed.');
            return;
        }

        (window as any).StatusBar.backgroundColorByHexString(hexString);
    }

    static hide(): void
    {
        if (! TypeInfo.Assigned((window as any).StatusBar))
        {
            console.error('StatusBar Plugin not Installed.');
            return;
        }

        (window as any).StatusBar.hide();
    }

    static show(): void
    {
        if (! TypeInfo.Assigned((window as any).StatusBar))
        {
            console.error('StatusBar Plugin not Installed.');
            return;
        }

        (window as any).StatusBar.show();
    }

    static get isVisible(): boolean
    {
        if (! TypeInfo.Assigned((window as any).StatusBar))
        {
            console.error('StatusBar Plugin not Installed.');
            return false;
        }

        return (window as any).StatusBar.isVisible;
    }
}
