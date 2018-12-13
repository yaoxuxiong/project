import {TypeInfo} from '../Core/TypeInfo';
import {RandomSource} from '../Core/Random';

import {InvTokenContext, InvHttp} from './InvTypes';
import {InvClientError, EInvInvalidToken, EInvTokenExpired} from './InvError';
import {InvAbstractAuth, InvCrypto} from './Internal';

const EXPIRES_BASE = Math.trunc(new Date(2017, 1, 1).getTime() / 1000);

export class InvBasicAuth extends InvAbstractAuth
{
    static readonly Type: string = 'Basic';

    Generate(Timeout: number, Ctx: InvTokenContext): string
    {
        Ctx.R = RandomSource.RandomString(2);
        return this.Update(Timeout, Ctx);
    }

    Get(TokenOrHeaders: InvHttp.Headers | string): InvTokenContext | undefined
    {
        let Token: string;

        if (TypeInfo.IsString(TokenOrHeaders))
        {
            Token = TokenOrHeaders;
        }
        else
        {
            Token = TokenOrHeaders[this.Header.toLowerCase()];
            if (! TypeInfo.Assigned(Token))
                return undefined;

            Token = Token.split(' ')[1];
        }

        if (! TypeInfo.Assigned(Token))
            throw new InvClientError.EUnauthorized();

        let Ctx: InvTokenContext;
        try
        {
             Ctx = JSON.parse(InvCrypto.Decrypt(this.Algorithm, this.Password, Token));
        }
        catch (err)
        {
            throw new EInvInvalidToken();
        }

        if (! TypeInfo.Assigned(Ctx.Id) || ! TypeInfo.Assigned(Ctx.E))
            throw new EInvInvalidToken();

        if (this.IsTokenExpired(Ctx.E as number))
            throw new EInvTokenExpired();

        return Ctx;
    }

    Update(Timeout: number, CtxOrToken: InvTokenContext | string): string
    {
        let Ctx: InvTokenContext;

        if (TypeInfo.IsString(CtxOrToken))
            Ctx = this.Get(CtxOrToken);
        else
            Ctx = CtxOrToken;

        Ctx.E = Math.trunc(new Date().getTime() / 1000) + Timeout - EXPIRES_BASE;
        return InvCrypto.Encrypt(this.Algorithm, this.Password, JSON.stringify(Ctx));
    }

    protected IsTokenExpired(Expires: number): boolean
    {
        return (Expires + EXPIRES_BASE) * 1000 < new Date().getTime();
    }
}
