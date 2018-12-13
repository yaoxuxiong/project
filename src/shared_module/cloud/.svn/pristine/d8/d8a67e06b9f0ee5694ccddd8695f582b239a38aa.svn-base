import {TIdentify, TRegionName} from './common';
import {IItem, IPricing} from './item';

export interface IRegion
{
    readonly Name: string;              // ISO country code
    readonly Currency: string;          // currency name

    readonly AvatarUrl?: string;
}

export interface IDomain
{
    readonly Region: IRegion;
    readonly RegionName?: TRegionName;  // returns Region.Name
    readonly Internal?: boolean;        // is export to WebService

    readonly Id: TIdentify;
    readonly Name: string;

    readonly AvatarUrl?: string;
}

export interface IPublished
{
    Id: TIdentify;
    RefId: string;

    Domain?: IDomain | TIdentify;
    Item?: IItem | TIdentify;

    Pricing?: IPricing;
}

export interface IPublishedSnap extends IPublished
{
    Item_Id: TIdentify;
    Name: string;
    AvatarUrl?: string;
}

export interface IPublishing
{
    Domain_Id: TIdentify;
    ItemIds: Array<TIdentify>;
}

export interface IUnpublishing
{
    Domain_Id: TIdentify;
    PublishedIds: Array<TIdentify>;
}
