import {TIdentify} from './common';
import {IPublished} from './publish';
import { IGift } from './gift_intf';

export enum TReceiptStatus
{
    Done                    = 0,

    WaitForPayment          = 0x40,
    Paid,
    Delivering              = 0x60,
    Delivered,

    Refound                 = 0x80,
    Refunding               = 0x81,

    Cancel                  = 0xFF,
}

export interface IReceipt
{
    Id: TIdentify;
    RefId?: TIdentify;
    Seller_Id?: TIdentify;
    ToAddress: string;      // of JSON address redundancy storage
    Memo?: string;
    Status: TReceiptStatus;
    Amount: number;
    readonly Timestamp: Date;

    ChildReceipts: IReceipt[];
    Manifests: IManifest[];
}

export interface IReceiptLog
{
    Receipt_Id: TIdentify;
    Status: TReceiptStatus;
    Message?: string;
    Timestamp: Date;
}

export interface IManifest extends IPublished
{
    Qty: number;
    Price: number;
    Memo?: string;
}

export interface IGiftReceipting
{
    Gifts: Array<IGift>;
    ToAddress: string;
    Memo?: string;
}
