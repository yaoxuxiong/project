import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';

import {TypeInfo} from '../../Core/TypeInfo';
import {Exception, EInvalidArg} from '../../Core/Exception';
import {TStream} from '../../Core/Stream';

import {TLoopBuffer} from '../../Core/LoopBuffer';

/** Buffer size to cache the peripherial notification data, data will discard when buffer full */
const NOTIFICATION_IN_BUFFER = 8 * 1024;

/* EPlugin */

export class EPlugin extends Exception
{
    constructor ()
    {
        super('e_usb_plugin');
    }
}

/* EPermission */
export class EPermission extends Exception
{
    constructor()
    {
        super('e_usb_permission');
    }
}

/**
 *  TUsbConnection
 *      subscribe.next indicate the data from USB
 *      subscribe.complete indicate the USB was unpluged
 */
export class TUsbConnection extends Subject<TUsbStream>
{
    constructor (private _VendorId: number, private _ProductId: number, private _MTU: number, private _Latency: number)
    {
        super();
    }

    get VendorId(): number
    {
        return this._VendorId;
    }

    get ProductId(): number
    {
        return this._ProductId;
    }

    get MTU(): number
    {
        return this._MTU;
    }

    get Latency(): number
    {
        return this._Latency;
    }

    RequestPermission(): Promise<void>
    {
        return new Promise<void>((resolve, reject) =>
        {
            (window as any).usb.requestPermission({vid: this._VendorId, pid: this._ProductId},
                () => resolve(),
                (err: string) => reject(new EPermission()));
        });
    }

    Open(): Promise<void>
    {
        const Self = this;
        return new Promise<void>((resolve, reject) =>
        {
            (window as any).usb.open({vid: this._VendorId, pid: this._ProductId},
                () =>
                    resolve(),
                (err: string) =>
                {
                    console.log('TUsbConnection.Open error: ' + err);

                    const err_obj = new EPlugin();
                    Self.error(err_obj);
                    reject(err_obj);
                });
        });
    }

    StartNotification(USBtoSerialStreamType?: typeof TUsbStream): TUsbStream
    {
        if (TypeInfo.Assigned(this.Stream))
            return this.Stream;

        if (! TypeInfo.Assigned(USBtoSerialStreamType))
            USBtoSerialStreamType = TUsbStream;

        const RetVal = new USBtoSerialStreamType(this);
        this.Stream = RetVal;

        const Self = this;
        (window as any).usb.registerReadCallback(
            (buf: ArrayBuffer) =>
                RetVal.next(buf),
            (err: string) =>
            {
                console.log('TUsbConnection.StartNotification error: ' + err);
                Self.error(new EPlugin());
            });

        return RetVal;
    }

    complete(): void /**@override Subject */
    {
        this.Disponse();
        super.complete();
    }

    error(err: any): void /**@override Subject */
    {
        this.Disponse();
        super.error(err);
    }

    private Disponse()
    {
        console.log('Usb Connection disponse');

        if (TypeInfo.Assigned(this.Stream))
        {
            this.Stream._Disponse();
            this.Stream = undefined;
        }
    }

    Read(): Promise<ArrayBuffer>
    {
        return new Promise<ArrayBuffer>((resolve, reject) =>
        {
            const Self = this;
            (window as any).usb.read(
                (buf: any) =>
                    resolve(buf),
                (err: any) =>
                {
                    Self.error(err);
                    reject((err));
                });
        });
    }

    Write(buf: ArrayBuffer): void
    {
        if (buf.byteLength > this.MTU)
            throw new EInvalidArg('Buffer ' + buf.byteLength + ' exceed the MTU ' + this.MTU.toString());

        (window as any).usb.write(buf,
            () => {},
            (err: string) => console.log('TUsbConnection.Write err ' + err));
    }

    private Stream: TUsbStream | undefined;
}

export class TUsbStream extends TStream
{
    constructor (Owner: TUsbConnection)
    {
        super();
        this._Owner = Owner;
    }

    /// @private: call from TUsbConnection
    _Disponse()
    {
        this._Owner = undefined;
    }

/* TStream */

    Read(Buf: Uint8Array, Count?: number): Promise<number>
    {
        if (! TypeInfo.Assigned(this._Owner))
            return Promise.resolve(0);

        if (! TypeInfo.Assigned(Count) || Count > Buf.byteLength)
            Count = Buf.byteLength;

        if (Count !== Buf.byteLength)
        {
            const view = new Uint8Array(Buf.buffer, Buf.byteOffset, Count);
            return Promise.resolve(this.InBuffer.ExtractTo(view));
        }
        else
            return Promise.resolve(this.InBuffer.ExtractTo(Buf));
    }

    Write(Buf: Uint8Array, Count?: number): Promise<number>
    {
        return Promise.resolve(this.WriteGuarantee(Buf, Count));
    }

    private WriteGuarantee(Buf: Uint8Array, Count?: number): number
    {
        if (! TypeInfo.Assigned(this._Owner))
            return 0;

        if (! TypeInfo.Assigned(Count) || Count > Buf.byteLength)
            Count = Buf.byteLength;

        if (Count > this._Owner.MTU)
            Count = this._Owner.MTU;

        const View = new Uint8Array(Buf.buffer, Buf.byteOffset, Count);
        Buf = new Uint8Array(Count);
        Buf.set(View);

        this._Owner.Write(Buf.buffer);
        return Count;
    }

    WriteBuf(Buf: Uint8Array, Count?: number): Observable<number> /**@override for USB interval Write */
    {
        return super.WriteBuf(Buf, Count, this._Owner.Latency);
    }

    protected _Owner: TUsbConnection;
    protected InBuffer = new TLoopBuffer(NOTIFICATION_IN_BUFFER);

/* Subject<T> */

    next(buf: ArrayBuffer)
    {
        this.InBuffer.Push(new Uint8Array(buf));
        super.next(buf);
    }
}
