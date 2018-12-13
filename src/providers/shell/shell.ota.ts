import {TypeInfo} from '../../UltraCreation/Core/TypeInfo';
import {THashCrc16} from '../../UltraCreation/Hash/Crc16';

import {TGatt} from '../../UltraCreation/Native/BluetoothLE';
import {TShellRequest} from '../../UltraCreation/Native/Abstract.Shell';

const OTA_SPLIT_PACKET_SIZE = 16;
const OTA_PACKET_SIZE = OTA_SPLIT_PACKET_SIZE + 4;

/* TOTARequest */

export class TOTARequest extends TShellRequest
{
    Start(Firmware: ArrayBuffer): void
    {
        TGatt.StrictWrite = true;
        this.CRC = this.SplitPacket(Firmware);

        this.Shell.PromiseSend('>ota -s=' + Firmware.byteLength + ' -c=' + this.CRC)
            .catch(err => this.error(err));
    }

    Notification(Line: string)
    {
        this.RefreshTimeout();

        const Strs = Line.split(':');
        let Status = 0;

        if (Strs.length > 1)
        {
            Status = parseInt(Strs[0], 10);

            if (Status === 0)
            {
                if (TypeInfo.Assigned(this.Sending))
                    setTimeout(this.complete(), 1000);
                else
                    this.Sending = this.SendingPacket().catch(err => this.error(err));
            }
            else if ((Status & 0x8000) !== 0)
            {
                console.log('OTA error ' + Line);
                this.error(new Error('e_ota_failure'));
            }
        }
        else if (Line === 'crc error')
        {
            console.log('OTA crc error');
            this.error(new Error('e_ota_failure'));
        }
    }

    SplitPacket(Firmware: ArrayBuffer): number
    {
        const Count = Math.trunc((Firmware.byteLength + OTA_SPLIT_PACKET_SIZE - 1) / OTA_SPLIT_PACKET_SIZE);
        this.PacketBuffer = new ArrayBuffer(Count * OTA_PACKET_SIZE);

        const CRC = new THashCrc16();
        for (let i = 0; i < Firmware.byteLength; i += OTA_SPLIT_PACKET_SIZE)
        {
            let ViewSRC: Uint8Array;
            if (Firmware.byteLength - i > OTA_SPLIT_PACKET_SIZE)
                ViewSRC = new Uint8Array(Firmware, i, OTA_SPLIT_PACKET_SIZE);
            else
                ViewSRC = new Uint8Array(Firmware, i, Firmware.byteLength - i);
            CRC.Update(ViewSRC);

            const Offset = i / OTA_SPLIT_PACKET_SIZE * OTA_PACKET_SIZE;
            const DataView = new Uint8Array(this.PacketBuffer, Offset + 4, OTA_SPLIT_PACKET_SIZE);
            DataView.set(ViewSRC);

            const HeadView = new Uint16Array(this.PacketBuffer, Offset, 2);
            HeadView[0] = i;
            HeadView[1] = THashCrc16.Get(DataView).Value();
        }

        CRC.Final();
        return CRC.Value();
    }

    async SendingPacket(): Promise<void>
    {
        const PackageCount = this.PacketBuffer.byteLength / OTA_PACKET_SIZE;
        console.log('ota package count: ' + PackageCount);
        console.log('ota package length: ' + this.PacketBuffer.byteLength);

        const obs = await this.Shell.ObserveSend(new Uint8Array(this.PacketBuffer));
        return new Promise<void>((resolve, reject) =>
        {
            obs.subscribe(
                next =>
                    this.next(next / this.PacketBuffer.byteLength),
                err =>
                {
                    this.error(err);
                    reject(err);
                },
                () =>
                {
                    this.complete();
                    resolve();
                });
        });

        /*
        for (let I = 0; I < PackageCount; I ++)
        {
            const View = new Uint8Array(this.PacketBuffer, I * OTA_PACKET_SIZE, OTA_PACKET_SIZE);

            if (TypeInfo.Assigned(this.Shell))
            {
                await this.Shell.PromiseSend(View);
                this.next(I / PackageCount);
            }
        }
        */
    }

    private PacketBuffer: ArrayBuffer;
    private CRC: number;
    private Sending: Promise<void>;
}
