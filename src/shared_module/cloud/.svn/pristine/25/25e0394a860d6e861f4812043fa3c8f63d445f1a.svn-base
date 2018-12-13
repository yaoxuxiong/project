import {TIdentify, TRegionName} from './common';
import {IFile} from './file';

export enum TItemTypeId
{
    Product,
    Package,
}

export interface IPicture extends IFile
{
}

export interface IItem
{
    Id: TIdentify;
    Category_Id?: string;
    TypeId: TItemTypeId;

    Name: string;
    Snap?: string;
    AvatarUrl?: string;

    Pictures?: Array<IPicture | TIdentify>;
    Html?: string;
    ExtraProp?: any;
    PricingList?: Array<ILocalizedPricing>;

    Timestamp: Date;
}

export interface IPricing
{
    Retail?: number;
    BulkCount?: number;
    Bulk?: number;
    Distribute?: number;
}

export interface ILocalizedPricing extends IPricing
{
    Region: TRegionName;
}

export interface IProduct extends IItem
{
    Model?: string;
    Unit?: string;
    Height?: number;
    Width?: number;
    Depth?: number;
    Weight?: number;
}

export interface IProductInfo
{
    Product: IProduct | TIdentify;
    Qty: number;
}

export interface IPackage extends IItem
{
    Discount?: number;
    ProductInfoList?: Array<IProductInfo>;
}
