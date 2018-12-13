import {Exception} from './Exception';

export class EEndian extends Exception
{
    constructor()
    {
        super('e_endian');
    }
}

export namespace Endianness
{
    export function Swap32(n: number): number
    {
        return ((n >>> 24) & 0xFF) +
            ((n >>> 8) & 0xFF00) +
            ((n & 0xFF00) << 8) +
            ((n & 0xFF) << 24);
    }

    export function Swap16(n: number): number
    {
        return ((n >> 8) & 0xFF) +
            ((n << 8) & 0xFF00);
    }

    export enum TEndian {Little, Big}

    export let HostEndian = CalculateHostEndian();
    export let NetEndian = TEndian.Big;
    export let BigEndian = TEndian.Big;
    export let LittleEndian = TEndian.Little;

    export function ToNet(buf: Uint8Array, FromEndian: TEndian = HostEndian)
    {
        if (FromEndian !== NetEndian)
            SwapEndian(buf);
    }

    export function ToHost(buf: Uint8Array, FromEndian: TEndian = NetEndian)
    {
        if (FromEndian !== HostEndian)
            SwapEndian(buf);
    }

    export function SwapEndian(buf: Uint8Array)
    {
        switch (buf.byteLength)
        {
        case 2:
            [buf[0], buf[1]] = [buf[1], buf[0]];
            break;
        case 3:
            [buf[0], buf[1], buf[2]] = [buf[2], buf[1], buf[0]];
            break;
        case 4:
            [buf[0], buf[1], buf[2], buf[3]] = [buf[3], buf[2], buf[1], buf[0]];
            break;
        case 6:
            [buf[0], buf[1], buf[2], buf[3], buf[4], buf[5]] = [buf[5], buf[4], buf[3], buf[2], buf[1], buf[0]];
            break;
        case 8:
            [buf[0], buf[1], buf[2], buf[3], buf[4], buf[5], buf[6], buf[7]] = [buf[7], buf[6], buf[5], buf[4], buf[3], buf[2], buf[1], buf[0]];
            break;
        default:
            for (let Idx = 0; Idx < buf.byteLength / 2; Idx ++)
            {
                const tmp = buf[buf.byteLength - Idx - 1];
                buf[buf.byteLength - Idx - 1] = buf[Idx];
                buf[Idx] = tmp;
            }
            break;
        }
    }

    function CalculateHostEndian()
    {
        const a = new ArrayBuffer(4);
        const b = new Uint8Array(a);
        const c = new Uint32Array(a);
        b[0] = 0xa1;
        b[1] = 0xb2;
        b[2] = 0xc3;
        b[3] = 0xd4;

        if (c[0] === 0xd4c3b2a1)
            return TEndian.Little;
        else // if (c[0] === 0xa1b2c3d4)
            return TEndian.Big;
    }
}
