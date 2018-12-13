import {TUtf8Encoding} from '../../Encoding/Utf8';
import {TMemoryStream} from '../../Core/Stream';
import {TypeInfo} from '../../Core/TypeInfo';

import {TAbstractShell} from '../Abstract.Shell';
import {TSocketConnection} from './Socket';
import {LINE_BREAK, LINE_BUFFER} from '../Abstract.Shell';
import * as Socket from './Socket';

/* TSocketShellConnection */

export class TSocketShell extends TAbstractShell
{
    static CachedSocketShellList = new Map<string, TSocketShell>();

    static Get(SocketId: string, ConnectionTimeout: number): TSocketShell
    {
        let SocketShell = this.CachedSocketShellList.get(SocketId);
        if (! TypeInfo.Assigned(SocketShell))
        {
            SocketShell = new (this as any)(SocketId);
            this.CachedSocketShellList.set(SocketId, SocketShell);
        }
        SocketShell.ConnectionTimeout = ConnectionTimeout;
        return SocketShell;
    }

    constructor(SocketId: string)
    {
        super();
        this.SocketAddr = SocketId;
    }

    get IsAttached(): boolean
    {
        return TypeInfo.Assigned(this.Channel);
    }

    Connect(): Promise<void>
    {
        if (TypeInfo.Assigned(this.Channel))
            return Promise.resolve();
        if (TypeInfo.Assigned(this.Connecting))
            return this.Connecting;

        console.log('start connect: ' + this.SocketAddr);
        this.TcpClient = new Socket.TTcpClient({}, TSocketShellConnection);
        this.Connecting = this.TcpClient.Connect(this.SocketAddr)
            .then((SocketConn) =>
            {
                // let ReadBuffer = new Uint8Array(1024);
                this.TcpClient.OnReadReady.subscribe((SocketStream) =>
                {
                    const Result = (SocketStream as any).Line;
                    console.log('socketshell: ' + Result);
                    this.OnRead(Result);
                });
                this.Channel = SocketConn;
                this.Connecting = undefined;
            })
            .catch((err) => console.log(err));

        return this.Connecting;
    }

    Disconnect(): Promise<void>
    {
        console.log('start Disconnect: ' + this.SocketAddr);
        // if (! TypeInfo.Assigned(this.Channel))
        //     return Promise.resolve();
        this.Channel = undefined;

        return this.TcpClient.Close().catch((err) => console.log(err));
    }

    RefreshConnectionTimeout()
    {
        if (TypeInfo.Assigned(this.TimeoutId))
        {
            clearTimeout(this.TimeoutId);
            this.TimeoutId = undefined;
        }

        if (this.ConnectionTimeout === 0)
            return;

        this.TimeoutId = setTimeout(() =>
        {
            this.TimeoutId = undefined;
            this.Detach();
        }, this.ConnectionTimeout);
    }

    SocketAddr: string;
    TcpClient: Socket.TTcpClient;
    Connecting: Promise<void>;

    TimeoutId: any;
    ConnectionTimeout: number;
}

export class TSocketShellConnection extends TSocketConnection
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
                    this.Owner.OnReadReady.next(this);

                    this.LineBuffer.Clear();
                    this.LineBreakMatched = 0;
                }
            }
            else
                this.LineBreakMatched = 0;
        }
    }
}
