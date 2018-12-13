import {Subject} from 'rxjs/Subject';
import 'rxjs/add/operator/toPromise';

import {TypeInfo} from '../TypeInfo';
import {Exception} from '../Exception';
import {TStringBuilder} from '../StringBuilder';

import {THttpHeaders, THttpAuthroizationType, THttpMethod} from './Types';
import {THttpRequestHeaderNames, THttpResponseHeaderNames} from './Types';

/* Exceptions */

export class EHttpClient extends Exception
{
    constructor(ResponseOrStatus: THttpResponse | number)
    {
        super();

        if (ResponseOrStatus instanceof THttpResponse)
        {
            this.Response = ResponseOrStatus;
            this.message = this.Response.Content;
            this.Status = ResponseOrStatus.Status;
        }
        else
        {
            this.Status = ResponseOrStatus;

            // http server error
            if (this.Status >= 500 && this.Status < 600)
                this.message = 'HTTP Server Error: ' + this.Status;
            // http client error
            else if (this.Status >= 400)
                this.message = 'HTTP Client Error: ' + this.Status;
            // http redirection
            else if (this.Status >= 300)
                this.message = 'HTTP Redirection: ' + this.Status;
            // http successful
            else if (this.Status >= 200)
                this.message = 'HTTP Successful: ' + this.Status;
            // http informational
            else if (this.Status >= 100)
                this.message = 'HTTP Informational: ' + this.Status;
            else if (this.Status === -1)
                this.message = 'HTTP Request Error';
            else if (this.Status === -2)
                this.message = 'HTTP Request Timeout';
            else
                this.message = 'HTTP Unknown Status: ' + this.Status;
        }
    }

    Status: number;
    Response?: THttpResponse;
}

export class EHttpRequest extends EHttpClient
{
    constructor()
    {
        super(-1);
    }
}

export class EHttpRequestTimeout extends EHttpClient
{
    constructor()
    {
        super(-2);
        this.message = 'network_unavailable';
    }
}

/* THttpClient */

export class THttpClient
{
    constructor(public ResponseType: XMLHttpRequestResponseType = '', public BaseUrl?: string,
        ...headers: Array<{Key: THttpRequestHeaderNames, Value: string}>)
    {
        for (const header of headers)
            this.Headers.Set(header.Key, header.Value);
    }

    Head(Path: string, Queries?: Object | string): THttpRequest
    {
        return new THttpRequest(this, 'HEAD', this.BuildUri(Path, Queries));
    }

    Get(Path: string, Queries?: Object | string): THttpRequest
    {
        return new THttpRequest(this, 'GET', this.BuildUri(Path, Queries));
    }

    Delete(Path: string, Queries?: Object | string): THttpRequest
    {
        return new THttpRequest(this, 'DELETE', this.BuildUri(Path, Queries));
    }

    Post(Path: string, Content: any): THttpRequest;
    Post(Path: string, Quereis: Object | string, Content: any): THttpRequest;
    Post(Path: string, ContentOrQueries?: Object | string, Content?: any): THttpRequest
    {
        let Queries: any = undefined;

        if (TypeInfo.Assigned(Content))
            Queries = ContentOrQueries;
        else
            Content = ContentOrQueries;

        this.SetContentType(Content);
        return new THttpRequest(this, 'POST', this.BuildUri(Path, Queries), Content);
    }

    Put(Path: string, Content: any): THttpRequest;
    Put(Path: string, Quereis: Object | string, Content: any): THttpRequest;
    Put(Path: string, ContentOrQueries?: Object, Content?: any): THttpRequest
    {
        let Queries: Object | undefined = undefined;

        if (TypeInfo.Assigned(Content))
            Queries = ContentOrQueries;
        else
            Content = ContentOrQueries;

        this.SetContentType(Content);
        return new THttpRequest(this, 'PUT', this.BuildUri(Path, Queries), Content);
    }

    // Connect()
    // {

    // }

    // Options()
    // {

    // }

    // Trace()
    // {

    // }

    // Patch()
    // {

    // }

    Authorization(Type: THttpAuthroizationType, Token: string)
    {
        this.Headers.Set('Authorization', Type + ' ' + Token);
    }

    UrlEncode(Queries: Object |  TypeInfo.TKeyValueHash<any>): string
    {
        return (this.constructor as typeof THttpClient).UrlEncode(Queries);
    }

    static UrlEncode(Queries: Object | TypeInfo.TKeyValueHash<any>): string
    {
        const Builder = new TStringBuilder();

        for (const Key in Queries)
        {
            // TODO: test setter only properties
            const Value = (Queries as any)[Key];

            if (TypeInfo.IsPrimitive(Value))
                Builder.Append(Key, '=', encodeURIComponent(Value.toString()), '&');
            else
                Builder.Append(Key, '=', encodeURIComponent(JSON.stringify(Value)), '&');
        }
        // pop '&'
        Builder.Pop();

        return Builder.toString();
    }

    protected SetContentType(Content?: any): void
    {
        // if set
        if (TypeInfo.Assigned(this.Headers.Get('Content-Type')))
            return;

        const ContentType = typeof Content;
        switch (ContentType)
        {
        case TypeInfo.BOOLEAN:
        case TypeInfo.NUMBER:
        case TypeInfo.STRING:
            if (this.ResponseType === 'document')
                this.Headers.Set('Content-Type', 'text/html;charset=utf-8');
            else
                this.Headers.Set('Content-Type', 'text/plain;charset=utf-8');
            break;

        case TypeInfo.OBJECT:
            if (Content instanceof FormData)
            {
                // this.Headers.Set('Content-Type', 'multipart/form;charset=utf-8');
            }
            else
                this.Headers.Set('Content-Type', 'application/json;charset=utf-8');
            break;

        case TypeInfo.UNDEFINED:
        case TypeInfo.FUNCTION:
        default:
            break;
        }
    }

    protected BuildUri(Path: string, Queries?: Object | string): string
    {
        const Builder = new TStringBuilder();

        if (TypeInfo.Assigned(this.BaseUrl))
        {
            if (this.BaseUrl.length > 1 && this.BaseUrl[this.BaseUrl.length - 1] !== '/' && Path[0] !== '/')
                Builder.Append(this.BaseUrl, '/', Path);
            else
                Builder.Append(this.BaseUrl, Path);
        }
        else
            Builder.Append(Path);

        if (TypeInfo.Assigned(Queries))
        {
            Builder.Append('?');

            if (! TypeInfo.IsString(Queries))
            {
                for (const Key in Queries)
                {
                    // TODO: test setter only properties
                    const Value = (Queries as TypeInfo.TKeyValueHash<any>)[Key];

                    if (TypeInfo.IsPrimitive(Value))
                        Builder.Append(Key, '=', encodeURIComponent(Value.toString()), '&');
                    else
                        Builder.Append(Key, '=', encodeURIComponent(JSON.stringify(Value)), '&');
                }
                // pop '?' or '&'
                Builder.Pop();
            }
            else
                Builder.Append(encodeURIComponent(Queries));
        }

        const RetVal = Builder.toString();

        if (RetVal.length > 1024)
            console.warn('request url is above 1024 length');

        // console.log(RetVal);
        return RetVal;
    }

    Headers = new THttpHeaders();
    WithCredentials: boolean = true;
    Timeout: number = 8000;
}

/* THttpRequest */

export class THttpRequest extends Subject<THttpResponse>
{
    constructor(Owner: THttpClient, Method: THttpMethod, Url: string, Content?: any)
    {
        super();

        this.xhr = new XMLHttpRequest();
        this.xhr.responseType = Owner.ResponseType;
        this.xhr.withCredentials = Owner.WithCredentials;
        this.xhr.timeout = Owner.Timeout;

        this.Response = new THttpResponse(this.xhr);
        THttpRequest.StartMonitor(this.xhr, this, this.Response);

        this.xhr.open(Method, Url);
        Owner.Headers.AssignTo(this.xhr, Method);

        if (TypeInfo.Assigned(Content) && (Method === 'PUT' || Method === 'POST'))
        {
            if (TypeInfo.IsString(Content))
                this.xhr.send(Content);
            else if (TypeInfo.IsObject)
            {
                if (Content instanceof FormData)
                    this.xhr.send(Content);
                else
                    this.xhr.send(JSON.stringify(Content));
            }
            else
                this.xhr.send(JSON.stringify(Content));
        }
        else
            this.xhr.send(null);
    }

    Abort(): void
    {
        this.xhr.abort();
    }

    get Status(): number
    {
        return this.xhr.status;
    }

    get StatusText(): string
    {
        return this.xhr.statusText;
    }

    private static StartMonitor(xhr: XMLHttpRequest, Request: THttpRequest, Response: THttpResponse)
    {
        xhr.onabort = function (this: XMLHttpRequestEventTarget, ev: Event)
        {
            Request.OnAbort.next();
        };

        xhr.onprogress = function (this: XMLHttpRequestEventTarget, ev: ProgressEvent)
        {
            Request.OnProgress.next(ev);
        };

        xhr.onload = function (this: XMLHttpRequestEventTarget, ev: Event)
        {
            // console.log('XMLHttpRequest.onload: status ' + Request.status);
            if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 0 /* ? ios bug */)
            {
                Request.next(Response);
                Request.complete();
            }
            else
                Request.error(new EHttpClient(Response));
        };

        xhr.onerror = function (this: XMLHttpRequestEventTarget, ev: ErrorEvent)
        {
            Request.error(new EHttpRequest());
        };

        xhr.ontimeout = function (this: XMLHttpRequestEventTarget, ev: ProgressEvent)
        {
            Request.error(new EHttpRequestTimeout());
        };

        xhr.onreadystatechange = function (this: XMLHttpRequest, ev: Event)
        {
            Request.OnReadyStateChange.next(xhr.readyState);
        };
    }

    private Disponse()
    {
        this.OnReadyStateChange.complete();
        this.OnProgress.complete();
        this.OnAbort.complete();
    }

    OnReadyStateChange = new Subject<number>();
    OnProgress = new Subject<ProgressEvent>();
    OnAbort = new Subject<void>();

    private xhr: XMLHttpRequest;
    private Response: THttpResponse;

/* Subject */

    complete(): void
    {
        this.Disponse();
        return super.complete();
    }

    error(err: any)
    {
        this.Disponse();
        return super.error(err);
    }
}

/* THttpResponse */

export class THttpResponse
{
    constructor(public xhr: XMLHttpRequest)
    {
    }

    get Type(): XMLHttpRequestResponseType
    {
        return this.xhr.responseType;
    }

    get URL(): string
    {
        return this.xhr.responseURL;
    }

    get Status(): number
    {
        return this.xhr.status;
    }

    Header(Name: THttpResponseHeaderNames): string
    {
        return this.xhr.getResponseHeader(Name);
    }

    get Content(): any
    {
        return this.xhr.response;
    }

    get Text(): string
    {
        return this.xhr.responseText;
    }
}
