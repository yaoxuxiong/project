import {Subject} from 'rxjs/Subject';

import {TypeInfo} from '../../UltraCreation/Core/TypeInfo';
import {THttpClient, TRestClient} from '../../UltraCreation/Core/Http';
import * as Types from './types';

const Anonymous: Types.IUserResponse =
    {Id: '---', Email: '',  EmailValidated: false, FirstName: 'anonymous', Token: ''};

export type TAuthState = 'login' | 'logout' | 'token_expired';

export class TBasicAuthService
{
    static get Me(): Types.IUserResponse
    {
        return this._Me;
    }

    static set Me(v: Types.IUserResponse)
    {
        if (! TypeInfo.Assigned(v.FirstName))
            v.FirstName = v.Email.substring(0, v.Email.lastIndexOf('@'));
        this._Me = v;
    }

    private static _Me = Anonymous;

/* Instances */

    constructor(Endpoint: string = '')
    {
        console.log('TBasicAuthService construct');


        this.Auth = new TRestClient(Endpoint + '/api/auth');
        this.Addr = new TRestClient(Endpoint + '/api/addr');

        this.UpdateToken();
    }

    get Me(): Types.IUserResponse
    {
        return (this.constructor as typeof TBasicAuthService).Me;
    }

    get LastLogin(): string
    {
        return localStorage.getItem('lastlogin');
    }

    get DefaultAddress(): Types.IUserAddress
    {
        const values = this.AddressHash.values();

        let iter = values.next();
        const first = iter.value;

        if (this.AddressHash.size === 1)
            return first;

        for (; ! iter.done; iter = values.next())
        {
            if (iter.value.IsDefault)
                return iter.value;
        }

        return first;
    }

    Grant(Client: THttpClient)
    {
        Client.Authorization('Basic', this.Me.Token);
    }

    get IsLogin()
    {
        return (this.constructor as typeof TBasicAuthService).Me.Id !== Anonymous.Id;
    }

    async SignIn(Email: string, Password: string, Name?: string): Promise<void>
    {
        const res = await this.Auth.Post('register', {Email: Email, Password: Password, FirstName: Name}).toPromise();
        const user = res.Content as Types.IUserResponse;
        localStorage.setItem('auth:user', JSON.stringify(user));

        (this.constructor as typeof TBasicAuthService).Me = user;
        this.OnStateChange.next('login');
    }

    async Login(Email: string, Password: string): Promise<void>
    {
        // 'api/wechat/callback?state=abcdef
        const res = await this.Auth.Post('login', {Email: Email, Password: Password}).toPromise();
        const user = res.Content as Types.IUserResponse;
        localStorage.setItem('auth:user', JSON.stringify(user));
        localStorage.setItem('lastlogin', Email);

        (this.constructor as typeof TBasicAuthService).Me = user;
        this.OnStateChange.next('login');
    }

    async PasswordRecovery(Email: string): Promise<void>
    {
        await this.Auth.Get('recovery', {Email: Email}).toPromise();
    }

    async Logout(): Promise<void>
    {
        (this.constructor as typeof TBasicAuthService).Me = Anonymous;

        localStorage.removeItem('auth:user');
        this.OnStateChange.next('logout');
    }

    async UpdateProfile(): Promise<void>
    {
        await this.Auth.Post('update', this.Me).toPromise();
        localStorage.setItem('auth:user', JSON.stringify(this.Me));
    }

    async Addresses(): Promise<Array<Types.IUserAddress>>
    {
        if (! TypeInfo.Assigned(this.AddressHash))
        {
            if (TypeInfo.Assigned(this.UpdatingToken))
                await this.UpdatingToken;

            this.AddressHash = new Map<string, any>();
            this.Grant(this.Addr);
            await this.Addr.Get('/').toPromise().then(res =>
            {
                for (const iter of  res.Content as Array<Types.IUserAddress>)
                    this.AddressHash.set(iter.Id, iter);
            });
        }

        return Array.from(this.AddressHash.values());
    }

    async AppendAddress(Addr: Types.IUserAddress): Promise<Array<Types.IUserAddress>>
    {
        this.Grant(this.Addr);
        const res = await this.Addr.Post('append', Addr).toPromise();

        Addr.Id = res.Content.Id;
        this.AddressHash.set(Addr.Id, Addr);

        return Array.from(this.AddressHash.values());
    }

    async UpdateAddress(Addr: Types.IUserAddress): Promise<Array<Types.IUserAddress>>
    {
        this.Grant(this.Addr);
        await this.Addr.Post('update', Addr).toPromise();
        this.AddressHash.set(Addr.Id, Addr);

        return Array.from(this.AddressHash.values());
    }

    async RemoveAddress(Addr: Types.IUserAddress): Promise<Array<Types.IUserAddress>>
    {
        this.Grant(this.Addr);
        await this.Addr.Post('remove', {Id: Addr.Id}).toPromise();
        this.AddressHash.delete(Addr.Id);

        return Array.from(this.AddressHash.values());
    }

    async SetDefaultAddress(Addr: Types.IUserAddress): Promise<Array<Types.IUserAddress>>
    {
        if (! Addr.IsDefault)
        {
            this.Grant(this.Addr);
            await this.Addr.Post('def', {Id: Addr.Id}).toPromise();
            this.AddressHash.forEach(iter => iter.IsDefault = false);
            Addr.IsDefault = true;
        }

        return Array.from(this.AddressHash.values());
    }

    private UpdateToken(): void
    {
        let user: Types.IUserResponse;
        try
        {
            user = JSON.parse(localStorage.getItem('auth:user'));
            if (! TypeInfo.Assigned(user) || ! TypeInfo.Assigned(user.Token))
                return;
        }
        catch (e)
        {
            return;
        }

        this.UpdatingToken = this.Auth.Post('/updatetoken', {Token: user.Token}).toPromise()
            .then(res => res.Content as Types.ITokenResponse)
            .then(ret =>
            {
                if (ret.Token.length > 0)
                {
                    user.Token = ret.Token;
                    localStorage.setItem('auth:user', JSON.stringify(user));
                    delete user.Token;

                    user.Token = ret.Token;
                    (this.constructor as typeof TBasicAuthService).Me = user;

                    this.OnStateChange.next('login');
                    return true;
                }
                else
                {
                    this.OnStateChange.next('token_expired');
                    return false;
                }
            })
            .catch(err =>
            {
                localStorage.removeItem('auth:user');
                this.OnStateChange.next('token_expired');

                return false;
            })
            .then(RetVal =>
            {
                this.UpdatingToken = undefined;
                return RetVal;
            });
    }

    OnStateChange = new Subject<TAuthState>();

    protected Auth: TRestClient;
    protected Addr: TRestClient;
    protected UpdatingToken: Promise<boolean> | undefined;
    protected AddressHash: Map<string, Types.IUserAddress> | undefined;
}
