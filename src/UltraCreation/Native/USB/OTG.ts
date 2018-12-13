/**
 *  Native UltraCreation USBtoSerial OTG support
 */
import {TypeInfo} from '../../Core/TypeInfo';
import {EPlugin, TUsbConnection} from './Connection';

/** OTG */

export class OTG
{
    static IsSupported(): Promise<boolean>
    {
        if (! TypeInfo.Assigned((window as any).usb))
            return Promise.resolve(false);

        return new Promise((resolve, reject) =>
        {
            (window as any).usb.isSupportOTG((supported: number) => resolve(supported !== 0));
        });
    }

    static Start(VendorId: number, ProductId: number, MTU: number, Latency: number): Promise<void>
    {
        if (! TypeInfo.Assigned((window as any).usb))
            return Promise.reject(new EPlugin());

        RequestPermission(this);

        const Self = this;
        (window as any).usb.registerUsbStateCallback({vid: VendorId, pid: ProductId},
            (msg: string) =>
            {
                console.log('attach callback: ' + msg);
                Detached(Self);
                setTimeout(() => RequestPermission(Self));
            },
            (msg: string) =>
            {
                console.log('detach callback: ' + msg);
                Detached(Self);
            }
        );

        return Promise.resolve();

        function RequestPermission(Self: typeof OTG)
        {
            (window as any).usb.requestPermission({vid: VendorId, pid: ProductId},
                () => Attach(Self),
                (err: string) => console.log(err));
        }

        function Attach(Self: typeof OTG)
        {
            Self.Connection = new TUsbConnection(VendorId, ProductId, MTU, Latency);
        }

        function Detached(Self: typeof OTG)
        {
            if (TypeInfo.Assigned(Self.Connection))
            {
                Self.Connection.complete();
                Self.Connection = undefined;
            }
        }
    }

    static get IsAttached(): boolean
    {
        return TypeInfo.Assigned(this.Connection);
    }

    static AttachedDevice(): TUsbConnection | undefined
    {
        return this.Connection;
    }

    private constructor ()
    {
    }

    static Instance: OTG = new OTG();
    private static Connection: TUsbConnection | undefined;
}
