import {TIdentify} from '../common';
import {IPublished} from '../publish';

export enum TStreamServerStatus
{
    Online = 0,
    Maintenance,
}

export interface IStreamServer
{
    Id: TIdentify;
    URL: string;
    params: string;
    BandWidth: number;
    Status: number;

    RoomCount?: number;
}

export enum TRoomStatus
{
    Online = 0,
    Maintenance,
    Error,
}

export interface IRoom
{
    Id: TIdentify;
    Server_Id: TIdentify;
    Doll: IPublished | TIdentify;

    Name: string;
    DeviceId: string;

    Coin: number;
    Status: number;

    UpStreams?: string[];
    Streams: string[];

    // runtime property
    Queued?: Array<TIdentify>;
    // runtime property
    Crowd?: Array<TIdentify>;
}

export interface IRoomLog
{
    Room_Id: TIdentify;
    Action: 'start' | 'win' | 'err';
    Message?: string;
    Timestamp: Date;
}

export interface IDeviceCtrl
{
    action: 'start' | 'left' | 'right' | 'up' | 'down' | 'go' | 'query';
    param?: number;
}
