/**
 *  Stream Support
 *
 *  Rxjs:
 *      http://reactivex.io/rxjs/manual/overview.html
 */
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import 'rxjs/add/operator/toPromise';

import {TypeInfo} from './TypeInfo';
import {EAbort, EInvalidArg} from './Exception';
import {Endianness} from './Endian';

/** Exceptions */

export class EStreamRead extends EAbort
{
    constructor ()
        { super('e_stream_read'); }
}

export class EStreamWrite extends EAbort
{
    constructor ()
        { super('e_stream_write'); }
}

export class EStreamStopped extends EAbort
{
    constructor ()
        { super('e_stream_stopped'); }
}

/* TSeekable */

export enum TSeekOrigin
{
    FormBeginning,
    FormCurrent,
    FromEnd
}

export interface ISeekable
{
    Seek(Offset: number, Origin: TSeekOrigin): number;
    /**
     *  Stream Properties, implements with getter /setter
     */
    Size: number;
    Position: number;
}

export abstract class TSeekable extends Subject<Uint8Array | ArrayBuffer | void> implements ISeekable
{
    Seek(Offset: number, Origin: TSeekOrigin): number
    {
        return 0;
    }

    get Size(): number
    {
        const curr = this.Seek(0, TSeekOrigin.FormCurrent);
        const retval = this.Seek(0, TSeekOrigin.FromEnd) - this.Seek(0, TSeekOrigin.FormBeginning);
        this.Seek(curr, TSeekOrigin.FormBeginning);

        return retval;
    }

    get Position(): number
    {
        return this.Seek(0, TSeekOrigin.FormCurrent);
    }

    set Position(Value: number)
    {
        this.Seek(Value, TSeekOrigin.FormBeginning);
    }
}

/* ReadableStreamImplement */

export interface IReadableStream extends ISeekable
{
    Endian: Endianness.TEndian;

    Read(Buf: Uint8Array, Count?: number): Promise<number>;
    ReadBuf(Buf: Uint8Array, Count?: number, DeviceInterval?: number): Observable<number>;

    ReadUint(IntSize: number): Promise<number>;
    ReadInt(IntSize: number): Promise<number>;
}

namespace ReadableStreamImplement
{
    export function ReadBuf(Stream: IReadableStream & Subject<any>,
        Buf: Uint8Array, Count?: number, DeviceInterval?: number): Observable<number>
    {
        if (! TypeInfo.Assigned(Count) || Count > Buf.byteLength)
            Count = Buf.byteLength;
        if (! TypeInfo.Assigned(DeviceInterval))
            DeviceInterval = 0;

        const Observer = new Subject<number>();
        let readed = 0;

        if (Count === 0)
        {
            Observer.next(0);
            Observer.complete();
        }
        else if (Stream.isStopped)
            Observer.error(new EStreamStopped());
        else
            setTimeout(() => ReadNext(Buf), DeviceInterval);

        return Observer as Observable<number>;

        function ReadNext(View: Uint8Array): void
        {
            Stream.Read(View, Count - readed)
                .catch(err => 0)
                .then(reading =>
                {
                    if (reading <= 0)
                    {
                        if (Stream.isStopped)
                            return Observer.error(new EStreamStopped());
                        else
                            return Observer.error(new EStreamRead());
                    }

                    readed += reading;
                    Observer.next(readed);

                    if (readed < Count)
                    {
                        const NextView = new Uint8Array(View.buffer, View.byteOffset + reading);
                        setTimeout(() => ReadNext(NextView), DeviceInterval);
                    }
                    else
                        setTimeout(Observer.complete(), DeviceInterval);
                });
        }
    }

    export async function ReadUint(Stream: IReadableStream & Subject<any>, IntSize: number): Promise<number>
    {
        let RetVal = 0;
        const buf = new Uint8Array(1);

        if (Stream.Endian === Endianness.BigEndian)
        {
            for (let I = 0; I < IntSize; I ++)
            {
                await ReadUint8(Stream, buf);
                RetVal = RetVal * 256 + buf[0];
            }
        }
        else
        {
            let Base = 1;
            for (let I = 0; I < IntSize; I ++)
            {
                await ReadUint8(Stream, buf);
                RetVal = RetVal + buf[0] * Base;
                Base *= 256;
            }
        }

        return RetVal;
    }

    export async function ReadInt(Stream: IReadableStream & Subject<any>, IntSize: number): Promise<number>
    {
        let RetVal = 0;
        let Base = 1;
        let Signed: boolean;
        const buf = new Uint8Array(1);

        if (Stream.Endian === Endianness.BigEndian)
        {
            await ReadUint8(Stream, buf);
            Base *= 256;

            // sign at first Byte
            Signed = (buf[0] & 0x80) !== 0;
            RetVal = buf[0];

            for (let I = 0; I < IntSize - 1; I ++)
            {
                await ReadUint8(Stream, buf);
                RetVal = RetVal * 256 + buf[0];
                Base *= 256;
            }
        }
        else
        {
            for (let I = 0; I < IntSize; I ++)
            {
                await ReadUint8(Stream, buf);
                RetVal = RetVal + buf[0] * Base;
                Base *= 256;
            }

            // sign at last byte
            Signed = (buf[0] & 0x80) !== 0;
        }

        if (Signed)
            return RetVal - Base;
        else
            return RetVal;
    }

    async function ReadUint8(Stream: IReadableStream & Subject<any>, view: Uint8Array): Promise<void>
    {
        if (await Stream.Read(view) <= 0)
        {
            if (Stream.isStopped)
                throw new EStreamStopped();
            else
                throw new EStreamRead();
        }
    }
}

/**
 *   TReadableStream
 *      .next = when read ready
 *      .complete = when ended gracefully
 *      .error = when ended with error
 */
export abstract class TReadableStream extends TSeekable implements IReadableStream
{
    constructor(public Endian: Endianness.TEndian = Endianness.HostEndian)
    {
        super();
    }

/* IReadableStream */

    abstract Read(Buf: Uint8Array, Count?: number): Promise<number>;

    ReadBuf(Buf: Uint8Array, Count?: number, DeviceInterval?: number): Observable<number>
    {
        return ReadableStreamImplement.ReadBuf(this, Buf, Count, DeviceInterval);
    }

    async ReadUint(IntSize: number): Promise<number>
    {
        return ReadableStreamImplement.ReadUint(this, IntSize);
    }

    async ReadInt(IntSize: number): Promise<number>
    {
        return ReadableStreamImplement.ReadInt(this, IntSize);
    }
}

/* WritableStreamImplement */

export interface IWritableStream extends ISeekable
{
    Endian: Endianness.TEndian;

    Write(Buf: Uint8Array, Count?: number): Promise<number>;
    WriteBuf(Buf: Uint8Array, Count?: number, DeviceInterval?: number): Observable<number>;

    WriteUint(N: number, IntSize: number): Promise<number>;
    WriteInt(N: number, IntSize: number): Promise<number>;
}

namespace WritableStreamImplement
{
    export function WriteBuf(Stream: IWritableStream & Subject<any>,
        Buf: Uint8Array, Count?: number, DeviceInterval?: number): Observable<number>
    {
        if (! TypeInfo.Assigned(Count) || Count > Buf.byteLength)
            Count = Buf.byteLength;
        if (! TypeInfo.Assigned(DeviceInterval))
            DeviceInterval = 0;

        const Observer = new Subject<number>();
        let written = 0;

        if (Count === 0)
        {
            Observer.next(0);
            Observer.complete();
        }
        else if (Stream.isStopped)
            Observer.error(new EStreamStopped());
        else
            setTimeout(() => WriteNext(Buf), DeviceInterval);

        function WriteNext(View: Uint8Array)
        {
            Stream.Write(View, Count - written)
                .catch(err => 0)
                .then(writting =>
                {
                    if (writting <= 0)
                    {
                        if (Stream.isStopped)
                            return Observer.error(new EStreamStopped());
                        else
                            return Observer.error(new EStreamWrite());
                    }

                    written += writting;
                    Observer.next(written);

                    if (written < Count)
                    {
                        const NextView = new Uint8Array(View.buffer, View.byteOffset + writting);
                        setTimeout(() => WriteNext(NextView), DeviceInterval);
                    }
                    else
                        setTimeout(() => Observer.complete(), DeviceInterval);
                });
        }

        return Observer as Observable<number>;
    }

    export async function WriteUint(Stream: IWritableStream & Subject<any>,
        N: number, IntSize: number): Promise<number>
    {
        const Buf = new Uint8Array(IntSize);
        if (Stream.Endian === Endianness.BigEndian)
        {
            for (let I = IntSize - 1; I >= 0; I --)
            {
                Buf[I] = N % 256;
                N = Math.trunc(N / 256);
            }
        }
        else
        {
            for (let I = 0; I < IntSize; I ++)
            {
                Buf[I] = N % 256;
                N = Math.trunc(N / 256);
            }
        }

        return WriteBuf(Stream, Buf).toPromise();
    }

    export async function WriteInt(Stream: IWritableStream & Subject<any>,
        N: number, IntSize: number): Promise<number>
    {
        if (N < 0)
            N += Math.pow(2, IntSize * 8);
        return WriteUint(Stream, N, IntSize);
    }
}

/**
 *   TWritableStream
 *      .next = ? when write ready
 *      .complete = when ended gracefully
 *      .error = when ended with error
 */
export abstract class TWritableStream extends TSeekable implements IWritableStream
{
    constructor(public Endian: Endianness.TEndian = Endianness.HostEndian)
    {
        super();
    }

    abstract Write(Buf: Uint8Array, Count?: number): Promise<number>;

    WriteBuf(Buf: Uint8Array, Count?: number, DeviceInterval?: number): Observable<number>
    {
        return WritableStreamImplement.WriteBuf(this, Buf, Count, DeviceInterval);
    }

    async WriteUint(N: number, IntSize: number): Promise<number>
    {
        return WritableStreamImplement.WriteUint(this, N, IntSize);
    }

    async WriteInt(N: number, IntSize: number): Promise<number>
    {
        return WritableStreamImplement.WriteInt(this, N, IntSize);
    }
}

/**
 *   TDuplexStream
 *      .next = ? when write/write ready depends
 *      .complete = when ended gracefully
 *      .error = when ended with error
 */
export abstract class TDuplexStream extends TSeekable implements ISeekable, IReadableStream, IWritableStream
{
    constructor(public Endian: Endianness.TEndian = Endianness.HostEndian)
    {
        super();
    }

/* IReadableStream */

    abstract Read(Buf: Uint8Array, Count?: number): Promise<number>;

    ReadBuf(Buf: Uint8Array, Count?: number, DeviceInterval?: number): Observable<number>
    {
        return ReadableStreamImplement.ReadBuf(this, Buf, Count, DeviceInterval);
    }

    async ReadUint(IntSize: number): Promise<number>
    {
        return ReadableStreamImplement.ReadUint(this, IntSize);
    }

    async ReadInt(IntSize: number): Promise<number>
    {
        return ReadableStreamImplement.ReadInt(this, IntSize);
    }

/* IWritableStream */

    abstract Write(Buf: Uint8Array, Count?: number): Promise<number>;

    WriteBuf(Buf: Uint8Array, Count?: number, DeviceInterval?: number): Observable<number>
    {
        return WritableStreamImplement.WriteBuf(this, Buf, Count, DeviceInterval);
    }

    async WriteUint(N: number, IntSize: number): Promise<number>
    {
        return WritableStreamImplement.WriteUint(this, N, IntSize);
    }

    async WriteInt(N: number, IntSize: number): Promise<number>
    {
        return WritableStreamImplement.WriteInt(this, N, IntSize);
    }
}

/* TStream */

export abstract class TStream extends TDuplexStream
{

}

/** TMemroyStream */

export class TMemoryStream extends TDuplexStream
{
    constructor(CapacityOrBuf: number | ArrayBuffer | Uint8Array, private AutoGrow: boolean = false)
    {
        super();

        if (TypeInfo.IsNumber(CapacityOrBuf))
        {
            CapacityOrBuf = (CapacityOrBuf + 0x1FF) & 0xFFFFFE00;
            this._Memory = new Uint8Array(CapacityOrBuf);
        }
        else
        {
            if (CapacityOrBuf instanceof ArrayBuffer)
                this._Memory = new Uint8Array(CapacityOrBuf);
            else if (CapacityOrBuf instanceof Uint8Array)
                this._Memory = CapacityOrBuf;
            else
                throw new EInvalidArg('CapacityOrBuf');

            this._Size = CapacityOrBuf.byteLength;
        }
    }

    get Capacity(): number
    {
        return this._Memory.byteLength;
    }

    set Capacity(Value: number)
    {
        const old = this._Memory;

        this._Memory = new Uint8Array(Value);
        this._Memory.set(old);
    }

    Clear(): void
    {
        this._Size = this._Position = 0;
    }

    /**
     *  Memory Property is violatile when AutoGrow is on
     */
    get Memory(): ArrayBuffer
    {
        return this._Memory.buffer;
    }

    /**
     *  MemoryView Property is violatile when AutoGrow is on
     */
    get MemoryView(): Uint8Array
    {
        return new Uint8Array(this._Memory.buffer, this._Memory.byteOffset, this._Size);
    }

    private Graw(Count: number): void
    {
        if (! this.AutoGrow)
            return;
        if (this._Memory.byteLength - this._Position >= Count)
            return;

        if (this._Memory.byteLength < Count)
            Count *= 2;
        else
            Count = this._Memory.byteLength * 2;

        this.Capacity = Count;
    }

    protected _Memory: Uint8Array;
    protected _Size: number = 0;
    protected _Position: number = 0;

/* ISeekable */

    Seek(Offset: number, Origin: TSeekOrigin): number
    {
        switch (Origin)
        {
        case TSeekOrigin.FormBeginning:
            this._Position = Offset;
            break;
        case TSeekOrigin.FormCurrent:
            this._Position += Offset;
            break;
        case TSeekOrigin.FromEnd:
            this._Position = this._Size + Offset;
            break;
        }

        if (this._Position < 0)
            this._Position = 0;
        else if (this._Position > this._Size)
            this._Position = this._Size;

        return this._Position;
    }

    get Size(): number
    {
        return this._Size;
    }

/* IReadableStream */

    Read(Buf: Uint8Array, Count?: number): Promise<number>
    {
        if (! TypeInfo.Assigned(Count) || Count > Buf.byteLength)
            Count = Buf.byteLength;

        if (Count > this._Size - this._Position)
            Count = this._Size - this._Position;

        if (Count > 0)
        {
            const src = new Uint8Array(this._Memory.buffer, this._Memory.byteOffset + this._Position, Count);
            const dst = new Uint8Array(Buf.buffer, Buf.byteOffset, Count);
            dst.set(src);

            this._Position += Count;
        }

        return Promise.resolve(Count);
    }

/* IWritableStream */

    Write(Buf: Uint8Array, Count?: number): Promise<number>
    {
        if (! TypeInfo.Assigned(Count) || Count > Buf.byteLength)
            Count = Buf.byteLength;

        if (Count > 0)
        {
            this.Graw(Count);

            const src = new Uint8Array(Buf.buffer, Buf.byteOffset, Count);
            const dst = new Uint8Array(this._Memory.buffer, this._Memory.byteOffset + this._Position, Count);
            dst.set(src);

            this._Position += Count;
            if (this._Position > this._Size)
                this._Size = this._Position;
        }

        return Promise.resolve(Count);
    }
}

/* TDuplexStreamDSP */

export abstract class TDuplexStreamDSP
{
}

/* TSourceDSP */

export abstract class TSourceDSP extends TDuplexStreamDSP
{
    abstract CreateReadStream(): IReadableStream;
}

/* TSinkDSP */

export abstract class TSinkDSP extends TDuplexStreamDSP
{
    abstract CreateWriteStream(): IWritableStream;
}

/* TTransformDSP */

export abstract class TTransformDSP extends TDuplexStreamDSP
{
    abstract CreateReadStream(): IReadableStream;
    abstract CreateWriteStream(): IWritableStream;
}

