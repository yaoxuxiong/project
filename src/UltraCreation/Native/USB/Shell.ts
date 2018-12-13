import {TypeInfo} from '../../Core/TypeInfo';
import {TMemoryStream} from '../../Core/Stream';
import {TUtf8Encoding} from '../../Encoding/Utf8';
import {TAbstractShell, LINE_BREAK, LINE_BUFFER} from '../Abstract.Shell';

import {OTG} from './OTG';
import {TUsbStream} from './Connection';

/* TShell */

export class TShell extends TAbstractShell
{
    constructor()
    {
        super();
    }

    get IsAttached(): boolean
    {
        return OTG.IsAttached;
    }

    Connect(): Promise<void>
    {
        if (TypeInfo.Assigned(this.Channel))
            return Promise.resolve();
        if (TypeInfo.Assigned(this.Connecting))
            return this.Connecting;

        this.Connecting = OTG.AttachedDevice().Open()
            .then(() =>
            {
                this.Connecting = undefined;

                const Connection = OTG.AttachedDevice();
                this.Channel = Connection.StartNotification(TUsbShellStream);

                Connection.subscribe(
                    next =>
                        this.OnRead((next as TUsbShellStream).Line),
                    err =>
                    {
                        console.log('USB connection error');
                        this.Channel = undefined;
                        setTimeout(() => this.OnConnectionError(err));
                    },
                    () =>
                    {
                        console.log('USB connection completed');
                        this.Channel = undefined;
                        setTimeout(() => this.OnDisconnected());
                    });

                return super.Connect();
            })
            .catch((err: any) =>
            {
                console.error('Connect error :' + err.message);
                this.Channel = undefined;

                this.OnConnectionError(err);
                return Promise.reject(err);
            });

        return this.Connecting;
    }

    private Connecting: Promise<void> | undefined;
}

/* TUsbShellStream */

export class TUsbShellStream extends TUsbStream
{
    public Line: string;

    private LineBuffer = new TMemoryStream(LINE_BUFFER);
    private LineBreak: Uint8Array = TUtf8Encoding.Encode(LINE_BREAK);
    private LineBreakMatched: number = 0;

/* Subject<T> */

    next(buf: ArrayBuffer): void
    {
    /**
     *  do not inherited, our class is last buffer consumer
     */
        this.InBuffer.Push(new Uint8Array(buf));
        const byte = new Uint8Array(1);

        while (! this.InBuffer.IsEmpty)
        {
            this.InBuffer.ExtractTo(byte);
            this.LineBuffer.Write(byte);

            if (byte[0] === this.LineBreak[this.LineBreakMatched])
            {
                this.LineBreakMatched ++;

                if (this.LineBreakMatched === this.LineBreak.byteLength)
                {
                    const BytesArray = new Uint8Array(this.LineBuffer.Memory, 0, this.LineBuffer.Position - this.LineBreak.byteLength);
                    this.Line = TUtf8Encoding.Decode(BytesArray);
                    this._Owner.next(this);
                    console.log(this.Line);

                    this.LineBuffer.Clear();
                    this.LineBreakMatched = 0;
                }
            }
            else
                this.LineBreakMatched = 0;
        }
    }
}
