/**
 *  Native Socket(tcp/udp only) support
 *      .ultracreation-socket-plugin
 *          cordova plugin add https://github.com/disword/ultracreation-socket-plugin
 *
 *  the plugin support Inet Socket Only, map socket type to 'tcp', 'udp', 'tcp_server'
 */
import {Subject} from 'rxjs/Subject';

import {TypeInfo} from '../../Core/TypeInfo';
import {Exception, ENotImplemented, EAbort} from '../../Core/Exception';
import {TStream, TMemoryStream, TSeekOrigin} from '../../Core/Stream';
import {TBase64Encoding} from '../../Encoding/Base64';
import {TLoopBuffer} from '../../Core/LoopBuffer';

const DEFAULT_CONNECTION_INACTIVE_TIMEOUT = 0;  // forever

export class ESocketPlugin extends EAbort
{
    constructor ()
    {
        super('e_socket_plugin');
    }
}

/* ESocket */

export class ESocket extends Exception
{
    constructor(Message: string, Code: number)
    {
        super(Message + ' error :' + Code);
    }
}

/* consts */

export enum TSocketFamily {AF_INET}
export enum TSocketType {SOCK_STREAM, SOCK_DGRAM}
export enum TSocketProtoIP {TCP = 6, UDP = 17}
export enum TSocketShutdown {READ, WRITE, READ_WRITE}

export const INET_ADDR_NONE = '0.0.0.0:0';

export const INET_IP_ANY = '0.0.0.0';
export const INET_IP_LOOPBACK = '127.0.0.1';
export const INET_IP_NONE = '255.255.255.255';
// export const INET_HOST_LOOPBACK = 'localhost'

export const INET_PORT_ANY = 0;

export const INET_MTU = 1500;
export const INET_TCP_MTU = 1460;
export const INET_UDP_MTU = 512;    // 1480 in theory, but 512 is guarantee (by dns)

const IN_STREAM_BUFFER = 16384;

/* API to native */

export class SocketAPI
{
    static CreateSocket(Family: TSocketFamily, Type: TSocketType, Protocol: number): Promise<number>
    {
        if (! TypeInfo.Assigned((window as any).socket))
            return Promise.reject(new ESocketPlugin());

        return new Promise((resolve, reject) =>
        {
            let ServerType: string;
            if (Protocol === TSocketProtoIP.TCP)
                ServerType = 'tcp_server';
            else
                ServerType = ['tcp', 'udp'][Type];

            (window as any).socket.socket(ServerType,
                (SocketId: number) =>
                {
                    if (SocketId === -1)
                        reject(new ESocket('socket()', (window as any).socket.errno));
                    else
                        resolve(SocketId);
                });
        });
    }

    static SetReuseAddress(SocketId: number, Enable: boolean): Promise<void>
    {
        if (! TypeInfo.Assigned((window as any).socket))
            return Promise.reject(new ESocketPlugin());

        return new Promise<void>((resolve, reject) =>
        {
            (window as any).socket.setreuseraddr(SocketId, Enable,
                (result: number) =>
                {
                    if (result === -1)
                        reject(new ESocket('setsockopt(SO_REUSEADDR)', (window as any).socket.errno));
                    else
                        resolve();
                });
        });
    }

    static SetBroadcast(SocketId: number, Enable: boolean): Promise<void>
    {
        if (! TypeInfo.Assigned((window as any).socket))
            return Promise.reject(new ESocketPlugin());

        return new Promise<void>((resolve, reject) =>
        {
            (window as any).socket.setbroadcast(SocketId, Enable,
                (result: number) =>
                {
                    if (result === -1)
                        reject(new ESocket('setsockopt(SO_BROADCAST)', (window as any).socket.errno));
                    else
                        resolve();
                });
        });
    }

    static CloseSocket(SocketId: number | undefined): Promise<void>
    {
        if (! TypeInfo.Assigned((window as any).socket))
            return Promise.reject(new ESocketPlugin());

        if (! TypeInfo.Assigned(SocketId))
            return Promise.resolve();

        return new Promise<void>((resolve, reject) =>
        {
            (window as any).socket.close(SocketId,
                (result: number) =>
                {
                    if (result === -1)
                        reject(new ESocket('close()', (window as any).socket.errno));
                    else
                        resolve();
                });
        });
    }

    static Shutdown(SocketId: number, How: TSocketShutdown): Promise<void>
    {
        if (! TypeInfo.Assigned((window as any).socket))
            return Promise.reject(new ESocketPlugin());

        return new Promise<void>((resolve, reject) =>
        {
            (window as any).socket.shutdown(SocketId, How,
                (result: number) =>
                {
                    if (result === -1)
                        reject(new ESocket('close()', (window as any).socket.errno));
                    else
                        resolve();
                });
        });
    }

    static Bind(SocketId: number, LocalAddr: string): Promise<void>
    {
        if (! TypeInfo.Assigned((window as any).socket))
            return Promise.reject(new ESocketPlugin());

        return new Promise<void>((resolve, reject) =>
        {
            (window as any).socket.bind(SocketId, LocalAddr,
                (result: number) =>
                {
                    if (result === -1)
                        reject(new ESocket('bind()', (window as any).socket.errno));
                    else
                        resolve();
                });
        });
    }

    static Listen(ServerSocketId: number, BackLog: number): Promise<void>
    {
        if (! TypeInfo.Assigned((window as any).socket))
            return Promise.reject(new ESocketPlugin());

        return new Promise<void>((resolve, reject) =>
        {
            (window as any).socket.listen(ServerSocketId, BackLog,
                (result: number) =>
                {
                    if (result === -1)
                        reject(new ESocket('listen()', (window as any).socket.errno));
                    else
                        resolve();
                });
        });
    }

    static Accept(ServerSocketId: number): Promise<{SocketId: number, SocketAddr: string}>
    {
        if (! TypeInfo.Assigned((window as any).socket))
            return Promise.reject(new ESocketPlugin());

        return new Promise((resolve, reject) =>
        {
            (window as any).socket.accept(ServerSocketId,
                (result: {SocketId: number, SocketAddr: string}) =>
                {
                    if (result.SocketId === -1)
                        reject(new ESocket('accept()', (window as any).socket.errno));
                    else
                        resolve(result);
                });
        });
    }

    static Connect(ClientSocketId: number, RemoteAddr: string): Promise<void>
    {
        if (! TypeInfo.Assigned((window as any).socket))
            return Promise.reject(new ESocketPlugin());

        return new Promise<void>((resolve, reject) =>
        {
            (window as any).socket.connect(ClientSocketId, RemoteAddr,
                (result: number) =>
                {
                    if (result === -1)
                        reject(new ESocket('connect()', (window as any).socket.errno));
                    else
                        resolve();
                });
        });
    }

    static Recv(SocketId: number, Size: number): Promise<ArrayBuffer>
    {
        if (! TypeInfo.Assigned((window as any).socket))
            return Promise.reject(new ESocketPlugin());

        return new Promise((resolve, reject) =>
        {
            (window as any).socket.recv(SocketId, Size,
                (data: ArrayBuffer) =>
                {
                    if (data.byteLength === 0)
                    {
                        const errno = (window as any).socket.errno;
                        if (errno !== 0)
                        {
                            reject(new ESocket('recv()', errno));
                            return;
                        }
                    }
                    // receive 0 = close connection
                    resolve(data);
                });
        });
    }

    static RecvFrom(SocketId: number, Size: number): Promise<{ByteBase64: string, SocketAddr: string}>
    {
        if (! TypeInfo.Assigned((window as any).socket))
            return Promise.reject(new ESocketPlugin());

        return new Promise((resolve, reject) =>
        {
            (window as any).socket.recvfrom(SocketId, Size,
                (data: {ByteBase64: string, SocketAddr: string}) =>
                {
                    if (data.ByteBase64.length === 0)
                    {
                        const errno = (window as any).socket.errno;
                        if (errno !== 0)
                        {
                            reject(new ESocket('recvfrom()', errno));
                            return;
                        }
                    }
                    // receive 0 = close connection
                    resolve(data);
                });
        });
    }

    static Send(SocketId: number, Buffer: ArrayBuffer): Promise<number>
    {
        if (! TypeInfo.Assigned((window as any).socket))
            return Promise.reject(new ESocketPlugin());

        return new Promise((resolve, reject) =>
        {
            (window as any).socket.send(SocketId, Buffer,
                (bytesent: number) =>
                {
                    if (bytesent === -1)
                        return reject(new ESocket('send()', (window as any).socket.errno));
                    else
                        resolve(bytesent);
                });
        });
    }

    static SendTo(SocketId: number, Buffer: ArrayBuffer, RemoteAddr: string): Promise<number>
    {
        if (! TypeInfo.Assigned((window as any).socket))
            return Promise.reject(new ESocketPlugin());

        return new Promise((resolve, reject) =>
        {
            (window as any).socket.sendto(SocketId, Buffer, RemoteAddr,
                (bytesent: number) =>
                {
                    if (bytesent === -1)
                        return reject(new ESocket('sendto()', (window as any).socket.errno));
                    else
                        resolve(bytesent);
                });
        });
    }

    static ReadReady(fds: Array<number>, Timeout: number): Promise<Array<number>>
    {
        if (! TypeInfo.Assigned((window as any).socket))
            return Promise.reject(new ESocketPlugin());

        return new Promise((resolve, reject) =>
        {
            (window as any).socket.select_readfds(fds, Timeout,
                (ary: Array<number>) =>
                {
                    const errno: number = (window as any).socket.errno;
                    if (errno !== 0)
                        reject(new ESocket('select(read_fds)', (window as any).socket.errno));
                    else
                        resolve(ary);
                });
        });
    }

    static GetLocalAddr(SocketId: number): Promise<string>
    {
        if (! TypeInfo.Assigned((window as any).socket))
            return Promise.reject(new ESocketPlugin());

        return new Promise((resolve, reject) =>
        {
            (window as any).socket.getsockname(SocketId,
                (SocketAddr: string) =>
                {
                    if ((window as any).socket.errno !== 0)
                        return reject(new ESocket('getsockname()', (window as any).socket.errno));
                    else
                        resolve(SocketAddr);
                });
        });
    }

    static GetRemoteAddr(SocketId: number): Promise<string>
    {
        if (! TypeInfo.Assigned((window as any).socket))
            return Promise.reject(new ESocketPlugin());

        return new Promise((resolve, reject) =>
        {
            (window as any).socket.getpeername(SocketId,
                (SocketAddr: string) =>
                {
                    if ((window as any).socket.errno !== 0)
                        return reject(new ESocket('getpeername()', (window as any).socket.errno));
                    else
                        resolve(SocketAddr);
                });
        });
    }

    static GetIfAddrs(): Promise<string[]>
    {
        if (! TypeInfo.Assigned((window as any).socket))
            return Promise.reject(new ESocketPlugin());

        return new Promise((resolve, reject) =>
        {
            (window as any).socket.getifaddrs(
                (SocketAddr: string[]) =>
                {
                    if ((window as any).socket.errno !== 0)
                        return reject(new ESocket('getifaddrs()', (window as any).socket.errno));
                    else
                        resolve(SocketAddr);
                });
        });
    }
}

/* TSocketStream */

export abstract class TSocketStream extends TStream
{
    constructor(protected Owner: TAbstractSocket, RemoteAddr: string, ...args: any[])
    {
        super();
        this._RemoteAddr = Owner.CreateAddressing(RemoteAddr);
    }

    abstract get SocketId(): number | undefined;

    get RemoteAddr(): TAddressing
    {
        return this._RemoteAddr;
    }

    get LocalAddr(): TAddressing
    {
        return this.Owner.LocalAddr;
    }

    abstract get ReceiveLength(): number;

    protected _RemoteAddr: TAddressing;
}

/* TSocketConnection */

export class TSocketConnection extends TSocketStream
{
    constructor(Owner: TAbstractSocket, RemoteAddr: string, protected _SocketId: number, ...args: any[])
    {
        super(Owner, RemoteAddr);
        this.LastActivityTS = new Date().getTime();
    }

    /// @protected: but call from TSocketServer/TSocketClient
    _NotificationInactiveTimeout(): Promise<void>
    {
        console.log('Connection Timeout: ' + this._RemoteAddr.SocketAddr);
        return this.Close();
    }

    get SocketId(): number
    {
        return this._SocketId;
    }

    get ReceiveLength(): number
    {
        return this.InBuffer.Count;
    }

    Close(): Promise<void>
    {
        if (! TypeInfo.Assigned(this._SocketId))
            return Promise.resolve();
        else if (this.Owner instanceof TSocketServer)
            return this.Owner.CloseConnection(this);
        else if (this.Owner instanceof TSocketClient)
            return this.Owner.Close();
        else
            return Promise.reject(new EAbort());
    }

    Shutdown(How: TSocketShutdown = TSocketShutdown.WRITE): Promise<void>
    {
        if (this.Owner instanceof TSocketServer)
            return this.Owner.ShutdownConnection(this, How);
        else if (this.Owner instanceof TSocketClient)
            return this.Owner.Shutdown(How);
        else
            return Promise.reject(new EAbort());
    }

 /** TStream */

    Read(Buf: Uint8Array, Count?: number): Promise<number>
    {
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
        if (! TypeInfo.Assigned(Count) || Count > Buf.byteLength)
            Count = Buf.byteLength;

        const View = new Uint8Array(Buf.buffer, Buf.byteOffset, Count);
        Buf = new Uint8Array(Count);
        Buf.set(View);

        return SocketAPI.Send(this._SocketId, Buf.buffer)
            .then(BytesSent =>
            {
                if (BytesSent > 0)
                    this.LastActivityTS = new Date().getTime();
                return BytesSent;
            });
    }

    Seek(Offset: number, Origin: TSeekOrigin): number
    {
        if (Offset === 0)
        {
            switch (Origin)
            {
            case TSeekOrigin.FormBeginning:
            case TSeekOrigin.FormCurrent:
                return 0;
            case TSeekOrigin.FromEnd:
                return this.InBuffer.Count;
            default:
                return 0;
            }
        }
        else
            return 0;
    }

/** Subject */

    next(buf: ArrayBuffer): void
    {
        // cache the buffer
        this.InBuffer.Push(new Uint8Array(buf));
        // notify Listener
        this.Owner.OnReadReady.next(this);
    }

    LastActivityTS: number;
    protected InBuffer = new TLoopBuffer(IN_STREAM_BUFFER);
}

/* TSocketDatagram */

export class TSocketDatagram extends TSocketStream
{
    constructor(Owner: TAbstractSocket, RemoteAddr: string, Buffer: ArrayBuffer, ...args: any[])
    {
        super(Owner, RemoteAddr);
        this.Datagram = new TMemoryStream(Buffer);
    }

    get ReceiveLength(): number
    {
        return this.Datagram.Size;
    }

    get SocketId(): number | undefined
    {
        return this.Owner.SocketId;
    }

    get Buffer(): ArrayBuffer
    {
        return this.Datagram.Memory;
    }

    set Buffer(v: ArrayBuffer)
    {
        this.Datagram = new TMemoryStream(v);
    }

    get BufferView(): Uint8Array
    {
        return this.Datagram.MemoryView;
    }

    Read(Buf: Uint8Array, Count?: number): Promise<number>
    {
        return this.Datagram.Read(Buf, Count);
    }

    Write(Buf: Uint8Array, Count?: number): Promise<number>
    {
        return this.Datagram.Write(Buf, Count);
    }

    Seek(Offset: number, Origin: TSeekOrigin): number
    {
        return this.Datagram.Seek(Offset, Origin);
    }

    private Datagram: TMemoryStream;
}

/* TAddressing */

export abstract class TAddressing
{
    abstract get SocketAddr(): string;
    abstract get IsUnaddressed(): boolean;
}

/* TSocketAddr */

export class TSocketAddr extends TAddressing
{
    constructor (protected _Addr: string)
    {
        super();
    }

    get SocketAddr(): string
    {
        return this._Addr;
    }

    get IsUnaddressed(): boolean
    {
        return this._Addr === '';
    }
}

/* TAbstractSocket */

export abstract class TAbstractSocket
{
    constructor(Addressing: TAddressing | {SocketAddr: string}, StreamClass: typeof TSocketStream)
    {
        if (Addressing instanceof TAddressing)
            this._LocalAddr = Addressing;
        else
            this._LocalAddr = new TSocketAddr(Addressing.SocketAddr);

        this._StreamClass = StreamClass;
    }

    protected static get SocketFamily(): TSocketFamily
    {
        throw new ENotImplemented();
    }

    protected static get SocketType(): TSocketType
    {
        throw new ENotImplemented();
    }

    protected static get SocketProtocol(): number
    {
        return 0;
    }

    abstract CreateAddressing(SocketAddr: string): TAddressing;

    /**
     *  @param args
     *      for TCP server/client Close has (GracefulTimeout: number) param
     *  @param GracefulTimeout
     *      when > 0 perform graceful close, hard close when countdown to 0
     *      when = 0 perform hard close
     *      when < 0 clients sockets remain connected until it close/shutdown from another side
     */
    Close(...args: any[]): Promise<void>
    {
        if (! TypeInfo.Assigned(this._SocketId))
            return Promise.resolve();
        if (TypeInfo.Assigned(this.Closing))
            return this.Closing;

        this.Closing = this.CloseInheritable(...args)
            .then(() => {this._SocketId = undefined; })
            .then(() => this.Closing = undefined);

        return this.Closing;
    }

    protected CloseInheritable(...args: any[]): Promise<void>
    {
        return SocketAPI.CloseSocket(this._SocketId)
            .then(() => this._SocketId = undefined);
    }

    get Active(): boolean
    {
        return TypeInfo.Assigned(this._SocketId);
    }

    get SocketId(): number | undefined
    {
        return this._SocketId;
    }

    get LocalAddr(): TAddressing
    {
        return this._LocalAddr;
    }

    protected CreateSocket(): Promise<void>
    {
        const Family = (this.constructor as typeof TSocketServer).SocketFamily;
        const Type = (this.constructor as typeof TSocketServer).SocketType;
        const Protocol = (this.constructor as typeof TSocketServer).SocketProtocol;

        return SocketAPI.CreateSocket(Family, Type, Protocol)
            .then(SocketId =>
            {
                this._SocketId = SocketId;
                return SocketAPI.Bind(this._SocketId, this._LocalAddr.SocketAddr);
            })
            .then(() =>
            {
                if (this._LocalAddr.IsUnaddressed)
                {
                    return SocketAPI.GetLocalAddr(this._SocketId as number)
                        .then(SocketAddr => { this._LocalAddr = this.CreateAddressing(SocketAddr); });
                }
                else
                    return;
            });
    }

    InactiveTimeout: number = DEFAULT_CONNECTION_INACTIVE_TIMEOUT;
    OnReadReady = new Subject<TSocketStream>();

    protected _SocketId: number | undefined;
    protected _LocalAddr: TAddressing;
    protected _StreamClass: typeof TSocketStream;
    protected Closing: Promise<void> | undefined;
}

/* TSocketServer */

export abstract class TSocketServer extends TAbstractSocket
{
    Open(): Promise<void>
    {
        if (TypeInfo.Assigned(this._SocketId))
            return Promise.resolve();
        if (TypeInfo.Assigned(this.Opening))
            return this.Opening;

        this.Opening = this.CreateSocket()
            .then(() =>
            {
                const SocketType = (this.constructor as typeof TSocketServer).SocketType;

                if (SocketType === TSocketType.SOCK_STREAM)
                    return SocketAPI.Listen(this._SocketId as number, 0);
                else
                    return;
            })
            .then(() => this.StartMonitor())
            .then(() => { this.Opening = undefined; });

        return this.Opening;
    }

    /**
     *  @param GracefulTimeout
     *      when > 0 perform graceful close, hard close when countdown to 0
     *      when = 0 perform hard close
     *      when < 0 clients sockets remain connected until it close/shutdown from another side
     */
    protected CloseInheritable(GracefulTimeout: number = 500): Promise<void> /**@override */
    {
        console.log('ServerSocket Closing...' + GracefulTimeout);

        return super.CloseInheritable()
            .then(() =>
            {
                // graceful closing
                if (GracefulTimeout > 0)
                {
                    this.Connections
                        .forEach(Conn => Conn.Shutdown(TSocketShutdown.WRITE).catch(err => {}));
                }

                // hard close socket when timeout
                setTimeout(() =>
                    this.Connections.forEach(Conn => Conn.Close().catch(err => {})), GracefulTimeout);

                return new Promise<void>((resolve, reject) =>
                {
                    if (this.Connections.size === 0)
                    {
                        resolve();
                        return;
                    }
                    else
                        console.log('SocketServer Waitfor ' + this.Connections.size + ' client connections to shutdown.');

                    this.OnDisconnect.subscribe(
                        Conn =>
                        {
                            if (this.Connections.size === 0)
                                resolve();
                            else
                                console.log('SocketServer recycle client connection: ' + this.Connections.size);
                        });
                });
            })
            .then(() => console.log('ServerSocket Closed'));
    }

    CloseConnection(Conn: TSocketConnection): Promise<void>
    {
        console.log('Closing Connection: ' + Conn.RemoteAddr.SocketAddr);

        if (this.Connections.delete(Conn.SocketId))
        {
            return SocketAPI.CloseSocket(Conn.SocketId)
                .catch(err => console.error(err.message))
                .then(() =>
                {
                    this.OnDisconnect.next(Conn);
                    Conn.complete();
                });
        }
        else
            return Promise.resolve();
    }

    ShutdownConnection(Conn: TSocketConnection, How: TSocketShutdown): Promise<void>
    {
        return SocketAPI.Shutdown(Conn.SocketId, How)
            .catch(err => console.error(err.message));
    }

    protected StartMonitor(): void
    {
        const peek_fds: Array<number> = [];

        if (! TypeInfo.Assigned(this._SocketId))
        {
            if (this.Connections.size === 0)
                return;
        }
        else
            peek_fds.push(this._SocketId);

        this.Connections.forEach(Conn => peek_fds.push(Conn.SocketId));

        SocketAPI.ReadReady(peek_fds, 500)
            .then(fds =>
            {
                let FdActivity: Array<Promise<void>> = [];

                for (const fd of fds)
                {
                    if (fd === this._SocketId)
                        FdActivity.push(this.ServerSocketReadReady());
                    else
                        FdActivity.push(this.ServerClientSocketReadReady(fd));
                }

                let FdActivityCompleted: Promise<void>;
                if (FdActivity.length === 0)
                {
                    /** todo: action for select() timeout */
                    FdActivityCompleted = Promise.resolve();
                }
                else
                    FdActivityCompleted = Promise.all(FdActivity).then(() => {});

                FdActivityCompleted.then(() =>
                {
                    // another may push when timeout
                    FdActivity = [];

                    if (this.InactiveTimeout > 0)
                    {
                        const ActivityTS = new Date().getTime();
                        this.Connections.forEach(Conn =>
                        {
                            if (ActivityTS - Conn.LastActivityTS > this.InactiveTimeout)
                                FdActivity.push(Conn._NotificationInactiveTimeout());
                        });
                    }

                    // loop
                    if (FdActivity.length !== 0)
                        Promise.all(FdActivity).then(all => setTimeout(() => this.StartMonitor(), 50));
                    else
                        setTimeout(() => this.StartMonitor(), 50);
                });
            })
            .catch(err =>
            {
                console.error('StartMonitor error: ' + err.message);
                // hard close for everything
                setTimeout(this.Close(0));
            });
    }

    get ConnectionCount(): number
    {
        return this.Connections.size;
    }

    protected ServerSocketReadReady(): Promise<void>
    {
        const SocketType = (this.constructor as typeof TSocketServer).SocketType;

        if (SocketType === TSocketType.SOCK_STREAM)
        {
            return SocketAPI.Accept(this._SocketId as number)
                .then((Result: {SocketId: number, SocketAddr: string}) =>
                {
                    const ConnectionType = this._StreamClass as typeof TSocketConnection;
                    const Conn = new ConnectionType(this, Result.SocketAddr, Result.SocketId);

                    this.Connections.set(Result.SocketId, Conn);
                    this.OnAccept.next(Conn);
                    console.log('Accepted Connection: ' + Result.SocketAddr);
                })
                .catch(err => console.error(err.message));
        }
        else
        {
            return SocketAPI.RecvFrom(this._SocketId as number, INET_MTU)
                .then((data: {ByteBase64: string, SocketAddr: string}) =>
                {
                    const DatagramType = this._StreamClass as typeof TSocketDatagram;
                    const Buf = TBase64Encoding.Decode(data.ByteBase64).buffer;

                    const Datagram = new DatagramType(this, data.SocketAddr, Buf);
                    this.OnReadReady.next(Datagram);
                })
                .catch(err => console.error(err.message));
        }
    }

    protected ServerClientSocketReadReady(fd: number): Promise<void>
    {
        return SocketAPI.Recv(fd, INET_MTU)
            .catch(err =>
            {
                console.error('server: ' + this.LocalAddr + ' fd: ' + fd + ' ' + err.message);
                return new ArrayBuffer(0);
            })
            .then(Buf =>
            {
                const Conn = this.Connections.get(fd);
                if (! TypeInfo.Assigned(Conn))
                    return;

                if (Buf.byteLength !== 0)
                {
                    Conn.LastActivityTS = new Date().getTime();
                    return Conn.next(Buf);
                }
                else
                    return this.CloseConnection(Conn).catch(err => {});
            });
    }

    Connections = new Map<number, TSocketConnection>();
    OnAccept = new Subject<TSocketConnection>();
    OnDisconnect = new Subject<TSocketConnection>();

    private Opening: Promise<void> | undefined;
}

/* TSocketClient */

export abstract class TSocketClient extends TAbstractSocket
{
    Connect(RemoteAddr: string): Promise<TSocketConnection>
    {
        if (TypeInfo.Assigned(this.Connecting))
            return this.Connecting;

        this.Connecting = this.CreateSocket()
            .then(() => SocketAPI.Connect(this._SocketId as number, RemoteAddr))
            .then(() =>
            {
                const ConnectionType = this._StreamClass as typeof TSocketConnection;
                this.Connection = new ConnectionType(this, RemoteAddr, this._SocketId as number);
            })
            .then(() => this.StartMonitor())
            .then(() => this.Connection);

        return this.Connecting.then(Conn =>
        {
            this.Connecting = undefined;
            return Conn;
        });
    }

    Shutdown(How: TSocketShutdown): Promise<void>
    {
        return SocketAPI.Shutdown(this._SocketId as number, How)
            .catch(err => console.error(err.message));
    }

    protected CloseInheritable(): Promise<void> /**@override */
    {
        return super.CloseInheritable()
            .then(() =>
            {
                this.OnDisconnect.next(this.Connection);
                this.Connection.complete();
                this.Connection = undefined;
            });
    }

    protected StartMonitor()
    {
        if (! TypeInfo.Assigned(this._SocketId))
            return;

        SocketAPI.ReadReady([this._SocketId], 500)
            .then(fds =>
            {
                let FdActivity: Promise<void> | undefined;
                if (fds.length !== 0)
                {
                    FdActivity = SocketAPI.Recv(this._SocketId as number, INET_MTU)
                        .catch(err =>
                        {
                            console.error(err.message);
                            return new ArrayBuffer(0);
                        })
                        .then(buf =>
                        {
                            if (buf.byteLength !== 0)
                            {
                                (this.Connection as TSocketConnection).LastActivityTS = new Date().getTime();
                                return (this.Connection as TSocketConnection).next(buf);
                            }
                            else
                                return this.Close();
                        })
                        .catch(err => console.error(err.message));
                }
                else
                    FdActivity = Promise.resolve();

                FdActivity.then(() =>
                {
                    FdActivity = undefined;

                    if (this.InactiveTimeout > 0)
                    {
                        const Activity = new Date().getTime();
                        if (Activity - (this.Connection as TSocketConnection).LastActivityTS > this.InactiveTimeout)
                            FdActivity = (this.Connection as TSocketConnection)._NotificationInactiveTimeout();
                    }

                    // loop
                    if (FdActivity)
                        FdActivity.then(() => setTimeout(() => this.StartMonitor(), 50));
                    else
                        setTimeout(() => this.StartMonitor(), 50);
                });
            })
            .catch(err =>
            {
                console.error('StartMonitor error: ' + err.message);
                // hard close for everything
                setTimeout(this.Close());
            });
    }

    Connection: TSocketConnection | undefined;
    OnDisconnect = new Subject<TSocketConnection>();

    private Connecting: Promise<TSocketConnection> | undefined;
}

/* Inet Addressing */

export class TInetAddr extends TAddressing
{
    constructor (InetAddr: {Host?: string, Port?: number});
    constructor (Port: number);
    constructor (Addressing?: {Host?: string, Port?: number} | number)
    {
        super();

        if (! TypeInfo.Assigned(Addressing))
        {
            this._Host = INET_IP_ANY;
            this._Port = INET_PORT_ANY;
        }
        else if (TypeInfo.IsNumber(Addressing))
        {
            this._Host = INET_IP_ANY;
            this._Port = Addressing;
        }
        else
        {
            if (TypeInfo.Assigned(Addressing.Host))
                this._Host = Addressing.Host;
            else
                this._Host = INET_IP_ANY;

            if (TypeInfo.Assigned(Addressing.Port))
                this._Port = Addressing.Port;
            else
                this._Port = INET_PORT_ANY;
        }
    }

    static CreateFromSocketAddr(SocketAddr: string): TInetAddr
    {
        const Idx = SocketAddr.lastIndexOf(':');
        return new TInetAddr({Host: SocketAddr.substr(0, Idx), Port: parseInt(SocketAddr.substr(Idx + 1), 10)});
    }

    get SocketAddr(): string /**@override */
    {
        return this._Host + ':' + this._Port;
    }

    get IsUnaddressed(): boolean /**@override */
    {
        return this.SocketAddr === INET_ADDR_NONE;
    }

    get Host(): string
    {
        return this._Host;
    }

    get Port(): number
    {
        return this._Port;
    }

    protected _Host: string;
    protected _Port: number;
}

/* TInetServer */

export abstract class TInetServer extends TSocketServer
{
    constructor (LocalAddr: {Host?: string, Port?: number}, StreamClass: typeof TSocketStream);
    constructor (LocalPort: number, StreamClass: typeof TSocketStream);
    constructor (Addressing?: any, StreamClass?: typeof TSocketStream)
    {
        super(new TInetAddr(Addressing), StreamClass as (typeof TSocketStream));
    }

    protected static get SocketFamily(): TSocketFamily /**@override */
    {
        return TSocketFamily.AF_INET;
    }

    protected CreateSocket(): Promise<void> /**@override */
    {
        return super.CreateSocket()
            .then(() => console.log('Inet Server Created: ' + this._LocalAddr.SocketAddr + ' SocketId: ' + this._SocketId));
    }

    CreateAddressing(SocketAddr: string): TAddressing /**@override */
    {
        return TInetAddr.CreateFromSocketAddr(SocketAddr);
    }

    get LocalAddr(): TInetAddr
    {
        return this._LocalAddr as TInetAddr;
    }
}

/* TTcpServer */

export class TTcpServer extends TInetServer
{
    constructor (LocalAddr: {Host?: string, Port?: number}, ConnectionClass?: typeof TSocketConnection);
    constructor (LocalPort: number, ConnectionClass?: typeof TSocketConnection);
    constructor (Addressing?: {Host?: string, Port?: number} | number, ConnectionClass?: typeof TSocketConnection)
    {
        if (! TypeInfo.Assigned(ConnectionClass))
            ConnectionClass = TSocketConnection;

        super(Addressing as any, ConnectionClass);
    }

    protected static get SocketType(): TSocketType
    {
        return TSocketType.SOCK_STREAM;
    }

    protected static get SocketProtocol(): number
    {
        return TSocketProtoIP.TCP;
    }
}

/* TTcpClient */

export class TTcpClient extends TSocketClient
{
    constructor (LocalAddr?: {Host?: string, Port?: number}, ConnectionClass?: typeof TSocketConnection);
    constructor (LocalPort?: number, ConnectionClass?: typeof TSocketConnection);
    constructor (Addressing?: any, ConnectionClass?: typeof TSocketConnection)
    {
        if (! TypeInfo.Assigned(ConnectionClass))
            ConnectionClass = TSocketConnection;

        super(new TInetAddr(Addressing), ConnectionClass);
    }

    protected static get SocketFamily(): TSocketFamily /**@override */
    {
        return TSocketFamily.AF_INET;
    }

    protected static get SocketType(): TSocketType /**@override */
    {
        return TSocketType.SOCK_STREAM;
    }

    Connect(RemoteAddr: TInetAddr | string): Promise<TSocketConnection> /**@override &overload */
    {
        if (TypeInfo.IsString(RemoteAddr))
            return super.Connect(RemoteAddr);
        else
            return super.Connect(new TInetAddr(RemoteAddr).SocketAddr);
    }

    CreateAddressing(SocketAddr: string): TAddressing /**@override */
    {
        return TInetAddr.CreateFromSocketAddr(SocketAddr);
    }

    get LocalAddr(): TInetAddr
    {
        return this._LocalAddr as TInetAddr;
    }
}

/* TUdpServer */

export class TUdpServer extends TInetServer
{
    constructor (LocalAddr: {Host?: string, Port?: number}, DatagramClass?: typeof TSocketDatagram);
    constructor (LocalPort: number, DatagramClass?: typeof TSocketDatagram);
    constructor (Addressing?: any, DatagramClass?: typeof TSocketDatagram)
    {
        if (! TypeInfo.Assigned(DatagramClass))
            DatagramClass = TSocketDatagram;

        super(Addressing, DatagramClass);
    }

    protected static get SocketType(): TSocketType /**@override */
    {
        return TSocketType.SOCK_DGRAM;
    }

    CreateAddressing(SocketAddr: string): TAddressing
    {
        return TInetAddr.CreateFromSocketAddr(SocketAddr);
    }

    get LocalAddr(): TInetAddr
    {
        return this._LocalAddr as TInetAddr;
    }
}

/* TUdpClient */

export class TUdpClient extends TAbstractSocket
{
    constructor (LocalAddr?: {Host?: string, Port?: number}, DatagramClass?: typeof TSocketDatagram);
    constructor (LocalPort?: number, DatagramClass?: typeof TSocketDatagram);
    constructor (Addressing?: any, DatagramClass?: typeof TSocketDatagram)
    {
        if (! TypeInfo.Assigned(DatagramClass))
            DatagramClass = TSocketDatagram;

        super(new TInetAddr(Addressing), DatagramClass);
    }

    protected static get SocketFamily(): TSocketFamily /**@override */
    {
        return TSocketFamily.AF_INET;
    }

    protected static get SocketType(): TSocketType /**@override */
    {
        return TSocketType.SOCK_DGRAM;
    }

    CreateDatagram(opts: {RemoteAddr?: string, Size?: number, DatagramClass?: typeof TSocketDatagram}): TSocketDatagram
    {
        let SocketDgramType = this._StreamClass as typeof TSocketDatagram;
        let RemoteAddr = INET_ADDR_NONE;
        let Size = INET_UDP_MTU;

        if (TypeInfo.Assigned(opts.DatagramClass))
            SocketDgramType = opts.DatagramClass;
        if (TypeInfo.Assigned(opts.Size))
            Size = opts.Size;
        if (TypeInfo.Assigned(opts.RemoteAddr))
            RemoteAddr = opts.RemoteAddr;

        return new SocketDgramType(this, RemoteAddr, new ArrayBuffer(Size));
    }

    Broadcast(BufferOrDgram: ArrayBuffer | TSocketDatagram, Port: number): Promise<number>
    {
        let Buf: ArrayBuffer;
        const RemoteAddr = new TInetAddr({Host: INET_IP_NONE, Port: Port}).SocketAddr;

        if (BufferOrDgram instanceof TSocketDatagram)
        {
            const View = new Uint8Array(BufferOrDgram.Size);
            View.set(BufferOrDgram.BufferView);

            Buf = View.buffer;
        }
        else
            Buf = BufferOrDgram;

        let CreatingSocket: Promise<void>;

        if (TypeInfo.Assigned(this._SocketId))
            CreatingSocket = Promise.resolve();
        else
            CreatingSocket = this.CreateSocket();

        return CreatingSocket
            .then(()  =>
            {
                if (! this.BroadcastEnabled)
                    return SocketAPI.SetBroadcast(this._SocketId as number,  true);
                else
                    return Promise.resolve();
            })
            .then(() => SocketAPI.SendTo(this._SocketId as number, Buf, RemoteAddr));
    }

    SendTo(BufferOrDgram: ArrayBuffer | TSocketDatagram, RemoteAddr?: string): Promise<number>
    {
        let Buf: ArrayBuffer;

        if (BufferOrDgram instanceof TSocketDatagram)
        {
            const View = new Uint8Array(BufferOrDgram.Size);
            View.set(BufferOrDgram.BufferView);

            Buf = View.buffer;
            if (! TypeInfo.Assigned(RemoteAddr))
                RemoteAddr = BufferOrDgram.RemoteAddr.SocketAddr;
        }
        else
            Buf = BufferOrDgram;

        if (! TypeInfo.Assigned(RemoteAddr))
            return Promise.reject(new Error('no RemoteAddr to SendTo()'));

        let CreatingSocket: Promise<void>;
        if (TypeInfo.Assigned(this._SocketId))
            CreatingSocket = Promise.resolve();
        else
            CreatingSocket = this.CreateSocket();

        return CreatingSocket
            .then(() => SocketAPI.SendTo(this._SocketId as number, Buf, RemoteAddr as string));
    }

    CreateAddressing(SocketAddr: string): TAddressing /**@override */
    {
        return TInetAddr.CreateFromSocketAddr(SocketAddr);
    }

    protected CreateSocket(): Promise<void> /**@override */
    {
        return super.CreateSocket()
            .then(() => { this.BroadcastEnabled = false; });
    }

    private BroadcastEnabled: boolean;
}

/** TUDPTranscever */

export class TUDPTranscever extends TUdpServer
{
    CreateDatagram(opts: {RemoteAddr?: string, Size?: number, DatagramClass?: typeof TSocketDatagram}): TSocketDatagram
    {
        let SocketDgramType = this._StreamClass as typeof TSocketDatagram;
        let RemoteAddr = INET_ADDR_NONE;
        let Size = INET_UDP_MTU;

        if (TypeInfo.Assigned(opts.DatagramClass))
            SocketDgramType = opts.DatagramClass;
        if (TypeInfo.Assigned(opts.Size))
            Size = opts.Size;
        if (TypeInfo.Assigned(opts.RemoteAddr))
            RemoteAddr = opts.RemoteAddr;

        return new SocketDgramType(this, RemoteAddr, new ArrayBuffer(Size));
    }

    Broadcast(BufferOrDgram: ArrayBuffer | TSocketDatagram, Port: number): Promise<number>
    {
        let Buf: ArrayBuffer;
        const RemoteAddr = new TInetAddr({Host: INET_IP_NONE, Port: Port}).SocketAddr;

        if (BufferOrDgram instanceof TSocketDatagram)
        {
            const View = new Uint8Array(BufferOrDgram.Size);
            View.set(BufferOrDgram.BufferView);

            Buf = View.buffer;
        }
        else
            Buf = BufferOrDgram;

        let OpeningSocket: Promise<void>;

        if (TypeInfo.Assigned(this._SocketId))
            OpeningSocket = Promise.resolve();
        else
            OpeningSocket = this.Open();

        return OpeningSocket
            .then(()  =>
            {
                if (! this.BroadcastEnabled)
                    return SocketAPI.SetBroadcast(this._SocketId as number,  true);
                else
                    return Promise.resolve();
            })
            .then(() => SocketAPI.SendTo(this._SocketId as number, Buf, RemoteAddr));
    }

    SendTo(BufferOrDgram: ArrayBuffer| TSocketDatagram, RemoteAddr?: string): Promise<number>
    {
        let Buf: ArrayBuffer;

        if (BufferOrDgram instanceof TSocketDatagram)
        {
            const View = new Uint8Array(BufferOrDgram.Size);
            View.set(BufferOrDgram.BufferView);

            Buf = View.buffer;
            if (! TypeInfo.Assigned(RemoteAddr))
                RemoteAddr = BufferOrDgram.RemoteAddr.SocketAddr;
        }
        else
            Buf = BufferOrDgram;

        if (! TypeInfo.Assigned(RemoteAddr))
            return Promise.reject(new Error('no RemoteAddr to SendTo()'));

        let OpeningSocket: Promise<void>;
        if (TypeInfo.Assigned(this._SocketId))
            OpeningSocket = Promise.resolve();
        else
            OpeningSocket = this.Open();

        return OpeningSocket
            .then(() => SocketAPI.SendTo(this._SocketId as number, Buf, RemoteAddr as string));
    }

    protected CreateSocket(): Promise<void> /**@override */
    {
        return super.CreateSocket()
            .then(() => { this.BroadcastEnabled = false; });
    }

    private BroadcastEnabled: boolean;
}
