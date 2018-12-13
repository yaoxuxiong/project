/**
 *  Native Bluetooth LE Shell support
 *      Base on Serial Profile SERVICE_UUID = FFE0 / CHARACTERISTRIC_UUID = FFE1
 *
 */
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import 'rxjs/add/operator/toPromise';

import {TypeInfo} from '../Core/TypeInfo';
import {Exception, EAbort} from '../Core/Exception';
import {TStream} from '../Core/Stream';
import {TUtf8Encoding} from '../Encoding/Utf8';

export const LINE_BREAK = '\r\n';
export const LINE_BUFFER = 1024;

export class ERequestTimeout extends Exception
{
    constructor ()
    {
        super('e_request_timeout');
    }
}

export class EDisconnected extends Exception
{
    constructor ()
    {
        super('e_disconnected');
    }
}

/* TShell */

export abstract class TAbstractShell
{
    protected constructor()
    {
    }

    Attach(): void
    {
        this.Connect().catch(err => console.log(err.message));
    }

    Detach(): void
    {
        this.Disconnect().catch(err => console.log(err.message));
    }

    get IsAttached(): boolean
    {
        return false;
    }

    Connect(): Promise<void>
    {
        return this.AfterConnected();
    }

    Disconnect(): Promise<void>
    {
        return Promise.resolve();
    }

    RefreshConnectionTimeout(): void
    {

    }

    /** After Connect happens when Connect and Connection Est
     *
     *  *NOTE* for drived classes who override this
     *      Promise.reject will kill connection instantly
     */
    protected AfterConnected(): Promise<void>
    {
        return Promise.resolve();
    }

    /**
     *  Request a Exclusive make sure all request is done and all other request
     *      must wait until this Subject is completed / error
     */
    RequestExclusive(): Promise<Subject<void>>
    {
        let WaitExclusive: Promise<void>;

        if (TypeInfo.Assigned(this.Exclusive))
            WaitExclusive = (this.Exclusive as Observable<void>).toPromise();
        else
            WaitExclusive = Promise.resolve();

        return WaitExclusive.then(() =>
        {
            // create exclusive object
            this.Exclusive = new Subject<void>();

            // release exclusive when anything happens
            this.Exclusive.subscribe(
                next => this.Exclusive ? this.Exclusive.complete() : 0,
                err => this.Exclusive = undefined,
                () => this.Exclusive = undefined
            );

            if (this.RequestList.length === 0)
                return Promise.resolve(this.Exclusive);

            const RequestPromises = new Array<Promise<any>>();
            for (const Request of this.RequestList)
                RequestPromises.push(Request.toPromise());

            return Promise.all(RequestPromises)
                .then(() => this.Exclusive);
        });
    }

    /** Internal waiting for Exclusive is completed / error */
    protected WaitForExclusive(): Promise<void>
    {
        if (TypeInfo.Assigned(this.Exclusive))
            return (this.Exclusive as Observable<void>).toPromise();
        else
            return Promise.resolve();
    }

    /**  a Simple Request that ask and answer
     *
     *  @param Cmd
     *      the request is asking for
     *  @param Timeout
     *      request timeout
     *  @param IsResponseCallback?: (Line: string) => boolean
     *      the callback called when every lines reached, return true when its Cmd asking for
     *      always return true when not specified
     */
    async Execute(Cmd: string, Timeout: number = 0, IsResponseCallback?: (Line: string) => boolean): Promise<any>
    {
        if (! TypeInfo.Assigned(IsResponseCallback))
            IsResponseCallback = function(Line: string) { return true; };

        const Request = await this.RequestStart(TShellSimpleRequest, Timeout, Cmd, IsResponseCallback);
        return await Request.toPromise();
    }

    RequestStart(RequestClass: typeof TShellRequest, Timeout: number = 0, ...args: any[]): Promise<TShellRequest>
    {
        return this.Connect()
            .then(() => this.WaitForExclusive())
            .then(() =>
            {
                const RetVal = new (RequestClass as any)(this, Timeout);
                RetVal.subscribe(
                    (next: any) => {},
                    (err: any) => RemoveRequest(this, RetVal),
                    () => RemoveRequest(this, RetVal)
                );
                this.RequestList.push(RetVal);

                RetVal.Start(...args);
                return RetVal;
            });

        function RemoveRequest(Self: TAbstractShell, Request: TShellRequest)
        {
            const Idx = Self.RequestList.indexOf(Request);
            if (Idx !== -1)
                Self.RequestList.splice(Idx, 1);
        }
    }

    RequestAbort(Request: TShellRequest)
    {
        for (let i = this.RequestList.length - 1; i >= 0; i --)
        {
            if (this.RequestList[i] === Request)
            {
                this.RequestList.splice(i, 1);
                Request.error(new EAbort());
                return;
            }
        }
    }

    /** Sending CmdOrSomething that Promises is sent to Device */
    PromiseSend(CmdOrSomething: string | Array<string> | Uint8Array): Promise<number>
    {
        return this.ObserveSend(CmdOrSomething)
            .then(Observer => Observer.toPromise());
    }

    /** Sending CmdOrSomething that can be observe the progress */
    ObserveSend(CmdOrSomething: string | Array<string> | Uint8Array): Promise<Observable<number>>
    {
        return this.Connect()
            .then(() => this.WaitForExclusive())
            .then(() =>
            {
                return new Promise<Observable<number>>((resolve, reject) =>
                {
                    // push Sending to queue
                    const Sending: ISendingQueueContext = {CmdOrSomething: CmdOrSomething,
                        PromiseResolve: resolve, PromiseReject: reject};
                    this.SendingQueue.push(Sending);

                    if (! TypeInfo.Assigned(this.SendingQueueTimerId))
                        this.SendingQueueTimerId = setTimeout(() => this.ObserveSendingQueue());
                });
            });
    }

    private ObserveSendingQueue()
    {
        if (! TypeInfo.Assigned(this.Channel))
        {
            console.error('shell channel has been terminated. aborting..');
            return;
        }

        const Context = this.SendingQueue.splice(0, 1)[0];
        const CmdOrSomething = Context.CmdOrSomething;
        let RetVal: Observable<number>;

        if (CmdOrSomething instanceof Uint8Array)
        {
            RetVal = this.Channel.WriteBuf(CmdOrSomething as Uint8Array);
        }
        else if (CmdOrSomething instanceof Object)
        {
            const Str = (CmdOrSomething as Array<string>).join(LINE_BREAK);

            console.log(Str);
            RetVal = this.Channel.WriteBuf(TUtf8Encoding.Encode(Str + LINE_BREAK));
        }
        else
        {
            console.log(CmdOrSomething);
            RetVal = this.Channel.WriteBuf(TUtf8Encoding.Encode(CmdOrSomething + LINE_BREAK));
        }

        RetVal.toPromise()
            .then(() =>
            {
                if (this.SendingQueue.length > 0)
                    this.SendingQueueTimerId = setTimeout(() => this.ObserveSendingQueue());
                else
                    this.SendingQueueTimerId = null;
            })
            .catch(err =>
            {
                // cancel queue
                this.SendingQueue = [];
                this.SendingQueueTimerId = null;
            });

        Context.PromiseResolve(RetVal);
    }

    protected ResetState(err: any)
    {
        /* stop sending queue */
        if (TypeInfo.Assigned(this.SendingQueueTimerId))
        {
            clearTimeout(this.SendingQueueTimerId);
            this.SendingQueueTimerId = null;
        }
        /* cancel all sending */
        this.SendingQueue = [];

        /* reject all request */
        this.RequestList.forEach(request => request.error(err));
        this.RequestList = [];
    }

    /** Notification when Connection Disconnected */
    protected OnDisconnected(): void
    {
        this.ResetState(new EDisconnected());
    }

    /** Notification when Connection has any error happened  */
    protected OnConnectionError(err: any): void
    {
        this.ResetState(err);
    }

    /** Notification GapConnection Timeout */
    protected OnConnectionTimeout(): void
    {
        // do nothing
    }

    /** Notification when Stream has incoming data */
    protected OnRead(Line: string): void
    {
        this.RequestList.forEach(request => request.Notification(Line));
    }

    protected Channel: TStream | undefined;

    private Exclusive: Subject<void> | undefined;
    private RequestList = new Array<TShellRequest>();

    private SendingQueue = new Array<ISendingQueueContext>();
    private SendingQueueTimerId: any = null;
}

/* ISendingQueueContext */

interface ISendingQueueContext
{
    CmdOrSomething: string | Array<string> | Uint8Array;
    PromiseResolve: (Value: Observable<number>) => void;
    PromiseReject: (Reason?: any) => void;
}

/* TShellRequest */
/** generics request support of Shell */

export abstract class TShellRequest extends Subject<any>
{
    constructor (Shell: TAbstractShell, Timeout: number)
    {
        super();

        this.Shell = Shell;
        this.TimeoutInterval = Timeout;

        this.RefreshTimeout();
    }

    /* called by TShell.RequestStart */
    abstract Start(...args: any[]): void;
    /* called by TShell */
    abstract Notification(Line: string): void;

    RefreshTimeout()
    {
        if (this.isStopped)
            return;

        // also delay Connection Timeout
        (this.Shell as TAbstractShell).RefreshConnectionTimeout();

        if (TypeInfo.Assigned(this.TimeoutId))
        {
            clearTimeout(this.TimeoutId);
            this.TimeoutId = null;
        }

        if (this.TimeoutInterval === 0)
            return;

        this.TimeoutId = setTimeout(
            (Self: TShellRequest) =>
            {
                this.TimeoutId = null;
                Self.error(new ERequestTimeout());
            },
            this.TimeoutInterval, this);
    }

    private Disponse()
    {
        if (TypeInfo.Assigned(this.TimeoutId))
        {
            clearTimeout(this.TimeoutId);
            this.TimeoutId = null;
        }
        this.Shell = undefined;
    }

/* Subject */
    complete(): void /**@override */
    {
        if (! this.isStopped)
        {
            super.complete();
            this.Disponse();
        }
    }

    error(err: any): void /**@override */
    {
        if (! this.isStopped)
        {
            super.error(err);
            this.Disponse();
        }
    }

    protected Shell: TAbstractShell | undefined;
    protected TimeoutId: any;
    protected TimeoutInterval: number;
}

/* TShellSimpleRequest */
/** the request narrow to 1 ack 1 answer simple request, most cases toPromise */

export class TShellSimpleRequest extends TShellRequest
{
    Start(Cmd: string, IsResponseCallback: (Line: string) => boolean): void /**@override */
    {
        this.Cmd = Cmd;
        this.IsResponseCallback = IsResponseCallback;

        if (TypeInfo.Assigned(this.Shell))
        {
            this.Shell.ObserveSend(this.Cmd)
                .then(Observer => Observer.subscribe(next => this.RefreshTimeout()))
                .catch(err => this.error(err));
        }
        else
            this.error(new EAbort());
    }

    Notification(Line: string): void /**@override */
    {
        try
        {
            if (this.IsResponseCallback(Line))
            {
                this.next(Line);
                this.complete();
            }
        }
        catch (err)
        {
            this.error(err);
        }
    }

    error(err: any): void
    {
        console.log('ShellRequest Error: ' + this.Cmd + ' Message: ' + err.message);
        super.error(err);
    }
    protected Cmd: string;
    protected IsResponseCallback: (Line: string) => boolean;
}
