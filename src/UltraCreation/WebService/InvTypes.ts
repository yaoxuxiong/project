import {TypeInfo} from '../Core/TypeInfo';
import * as HttpTypes from '../Core/Http/Types';

/** Cookie Manager */

export interface InvCookies extends TypeInfo.TReadonyKeyValueHash<any>
{
    SetCookie(Name: string, Value: string | Object): void;
    SetCookie(Name: string, Value: string | Object, Timeout: number): void;
    SetCookie(Name: string, Value: string | Object, Opts: InvCookieOptions): void;

    Remove(Name: string): void;
    Clear(): void;

    readonly [Name: string]: string | Object | any;
}

/** Cookie */

export interface InvCookieOptions
{
    Domain?: string;
    Path?: string;
    Expires?: Date;
    Age?: number;
    Secure?: true;
    HttpOnly?: true;
    SameSite?: string;
}

export interface InvCookie
{
    Name: string;
    Value: string;
    Opts?: InvCookieOptions;
}

/** Authorization */

declare global
{
/* extends StorageEngine to window global variable */

    let Authorization: InvAuth | undefined;

    module NodeJS
    {
        interface Global
        {
            Authorization: InvAuth | undefined;
        }
    }
}
declare var global: any;

export interface InvAuthConstructor
{
    new (Password: string, Algorithm: string): InvAuth;
}

export interface InvAuth
{
    readonly Header: string;
    readonly Type: string;

    Generate(Timeout: number, Ctx: InvTokenContext): string;

    Get(Token: string): InvTokenContext;
    Get(Headers: InvHttp.Headers): InvTokenContext | undefined;

    Update(Timeout: number, Token: string): string;
    Update(Timeout: number, Ctx: InvTokenContext): string;
}

export namespace InvAuth
{
    export function Initialize(AuthorizeType: InvAuthConstructor,
        Password: string, Algorithm: string = 'aes128'): void
    {
        global.Authorization = new AuthorizeType(Password, Algorithm);
        console.log('Authorization Initialized: ' + global.Authorization.Type);
    }
}

export interface InvTokenContext
{
    Id: string;
    [Name: string]: TypeInfo.Primitive;
}

export namespace InvHttp
{
    export enum InvSuccess
    {
        OK                              = 200,
        Created                         = 201,
        Accepted                        = 202,
        // Non-Authoritative Information (since HTTP/1.1)   203
        NoContent                       = 204,
        ResetContent                    = 205,  // plus to 204, this response requires that the requester reset the document view.
        PartialContent                  = 206,
        MultiStatus                     = 207,
        AlreadyReported                 = 208,
        IMUsed                          = 226
    }

    export type Headers = TypeInfo.TKeyValueHash<any>;
    export type Queries = TypeInfo.TKeyValueHash<string> | undefined;
    export type ContentType = XMLHttpRequestResponseType;
    export type Content = string | Document | Object | undefined;

    export type Method = HttpTypes.THttpMethod;
    export type Methods = 'ALL' | Method | Method[];

    export function ParseRequestContentType(ContentType: string): ContentType
    {
        let Types = ContentType.toLowerCase().split(';');
        if (! TypeInfo.Assigned(Types))
            return '';

        /** todo deal with Optional */
        /*
        let Optional: string;
        if (Types.length > 1)
            Optional = Types[1].trim();
        else
            Optional = '';
        */

        Types = Types[0].split('/');
        if (! TypeInfo.Assigned(Types))
            return '';

        const Type = Types[0].trim();
        const SubType = Types[1].trim();

        if (Type === 'text')
        {
            if (SubType === 'html')
                return 'document';
            else
                return 'text';
        }

        if (Type === 'application')
        {
            switch (SubType)
            {
            case 'json':
                return 'json';
            case 'xml':
                return 'document';

            default:
                return 'arraybuffer';
            }
        }

        if (Type === 'audio' || Type === 'video')
            return 'blob';
        else
            return 'arraybuffer';
    }
}
