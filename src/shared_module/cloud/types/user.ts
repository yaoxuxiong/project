import {ITokenResponse, IIdRequest, TIdentify} from './common';

export interface IUser
{
    Id: TIdentify;
    RefId?: TIdentify;
    RefSource?: string;
    Email: string;
    EmailValidated?: boolean;

    FirstName?: string;
    SurName?: string;
    AvatarUrl?: string;

    Balance?: number;
    Roles?: string;
    ExtraProp?: string;
}

export interface IUserResponse extends IUser, ITokenResponse
{
}

export interface IUserAddress extends IIdRequest
{
    Country?: string;
    City?: string;
    Street?: string;
    Recipient?: string;
    Zip?: string;
    Tel?: string;

    IsDefault?: boolean;
}
