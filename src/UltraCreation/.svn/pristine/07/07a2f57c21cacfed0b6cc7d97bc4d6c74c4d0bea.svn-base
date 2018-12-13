declare var process: any;

export class Platform
{
    static get IsBrowser(): boolean
    {
        return typeof window !== 'undefined';
    }

    static get IsCordova(): boolean
    {
        return this.IsBrowser && (typeof (window as any).cordova !== 'undefined');
    }

    static get IsNodeJS(): boolean
    {
        return (typeof process !== 'undefined') &&
            typeof (process as any).release !== 'undefined' &&
            typeof (process as any).release.name !== 'undefined' &&
            (process as any).release.name === 'node';
    }

/* Mobile */
    static get IsMoble(): boolean
    {
        return this.MobilePlatform !== 'unknown';
    }

    static get IsAndroid(): boolean
    {
        return this.MobilePlatform === 'Android';
    }

    static get IsiOS(): boolean
    {
        return this.MobilePlatform === 'iOS';
    }

    static get IsWindowsPhone(): boolean
    {
        return this.MobilePlatform === 'Windows Phone';
    }

    static get MobilePlatform(): string
    {
        if (typeof this._MobilePlatform === 'undefined')
        {
            if (! this.IsBrowser)
            {
                this._MobilePlatform = 'none Browser';
                return this._MobilePlatform;
            }

            const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

            // Windows Phone must come first because its UA also contains "Android"
            if (/windows phone/i.test(userAgent))
                this._MobilePlatform = 'Windows Phone';
            else if (/android/i.test(userAgent))
                this._MobilePlatform = 'Android';
            // iOS detection from: http://stackoverflow.com/a/9039885/177710
            else if (/iPad|iPhone|iPod/.test(userAgent) && ! (window as any).MSStream)
                this._MobilePlatform =  'iOS';
            else
                this._MobilePlatform = 'unknown';
        }

        return this._MobilePlatform;
    }

    static _MobilePlatform: string | undefined;
}
