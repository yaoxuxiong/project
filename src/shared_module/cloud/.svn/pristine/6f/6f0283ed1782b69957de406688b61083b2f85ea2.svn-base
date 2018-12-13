import {TIdentify} from './common';

export enum TGiftStatus
{
    Available,
    Shipped,
}

export interface IGift
{
    Id: TIdentify;
    Published_Id: TIdentify;
    Qty: number;
    ReceivedDT: Date;
    ExipreDT?: Date;
    ShippedDT?: Date;
    Status: TGiftStatus;
}

export interface IGiftSnap extends IGift
{
    Name: string;
    AvatarUrl: string;
}
