/**
 *  https://github.com/apache/cordova-plugin-network-information
 *      cordova plugin add cordova-plugin-network-information --save
 */
import {TypeInfo} from '../Core/TypeInfo';

declare var navigator: any;

export enum ConnectionType
{
    bluetooth,
    cellular,
    ethernet,
    mixed,
    none,
    other,
    unknown,
    wifi,
    wimax
}

export class Network
{
    static get Type(): string
    {
        if (! TypeInfo.Assigned(navigator.connection))
        {
            console.error('NetWork Plugin not Installed.');
            return ConnectionType[ConnectionType.unknown];
        }

        return navigator.connection.type;
    }

    static get IsOnline(): boolean
    {
        const Type = this.Type;
        return Type !== ConnectionType[ConnectionType.none];
    }

    static get IsWifi(): boolean
    {
        return (this.Type === ConnectionType[ConnectionType.wifi]);
    }

    static get IsEthernet(): boolean
    {
        return (this.Type === ConnectionType[ConnectionType.ethernet]);
    }
}
