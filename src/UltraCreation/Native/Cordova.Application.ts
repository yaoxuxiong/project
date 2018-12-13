import {TypeInfo} from '../Core/TypeInfo';
import {Platform} from '../Core/Platform';
import {Subject} from 'rxjs/Subject';

declare var navigator: any;

export class TCordovaApplication
{
    constructor()
    {
        this.RegisterEvent();
    }

    OnDeviceReady(): Promise<void>
    {
        if (! TypeInfo.Assigned(this._OnDeviceReady))
        {
            if (Platform.IsCordova)
            {
                this._OnDeviceReady = new Promise<void>((resolve, reject) =>
                    document.addEventListener('deviceready', ev => resolve(), false));
            }
            else
                this._OnDeviceReady = Promise.resolve();
        }

        return this._OnDeviceReady;
    }

    EnableHardwareBackButton()
    {
        this.HardwareBackButtonDisabled = false;
    }

    DisableHardwareBackButton()
    {
        this.HardwareBackButtonDisabled = true;
    }

    private RegisterEvent(): void
    {
        this.OnDeviceReady().then(() =>
        {
            document.addEventListener('pause', ev =>
            {
                console.log('cordova application: pause');
                this.OnPause.next();
            }, false);

            document.addEventListener('resume', ev =>
            {
                console.log('cordova application: resume');
                this.OnResume.next();
            }, false);

            /* todo: cordova backbutton preventDefault not working?
            document.addEventListener('backbutton', ev =>
            {
                console.log('cordova application: backbutton');

                if (this.HardwareBackButtonDisabled)
                {
                    ev.returnValue = false;
                    ev.preventDefault();
                }
                else
                    this.OnBackButton.next(ev);

                console.log('cordova ev.defaultPrevented: ' + ev.defaultPrevented);
            }, false);
            */
        });
    }

    Halt(): void
    {
        if (Platform.IsCordova)
            this.OnDeviceReady().then(() => navigator.app.exitApp());
    }

    OnPause = new Subject<void>();
    OnResume = new Subject<void>();
    OnBackButton = new Subject<Event>();

    private _OnDeviceReady: Promise<void>;
    protected HardwareBackButtonDisabled: boolean = false;
}
