import {TypeInfo} from '../Core/TypeInfo';
import {EInvalidArg} from '../Core/Exception';
import {EEncoding, IEncodingStatic, TBaseEncoding} from './Abstract';
import {TUtf8Encoding} from './Utf8';

@TypeInfo.StaticImplements<IEncodingStatic>()
export class TBase64Encoding extends TBaseEncoding
{
    static EncodeToString(In: Uint8Array | string): string
    {
        return TUtf8Encoding.Decode(this.Encode(In));
    }

    static DecodeToString(In: Uint8Array | string): string
    {
        return TUtf8Encoding.Decode(this.Decode(In));
    }

/* IEncodingStatic */

    static Encode(In: Uint8Array | string): Uint8Array
    {
        if (TypeInfo.IsString(In))
            In = TUtf8Encoding.Encode(In);

        if (! (In instanceof Uint8Array))
            throw new EInvalidArg('In');

        // init base64 xchange table at first use
        if (! TypeInfo.Assigned(this.Xlat))
        {
            this.Xlat = new Uint8Array(65);

            for (let i = 65; i < 91; i ++)      // A~Z
                this.Xlat[i - 65] = i;
            for (let i = 97; i < 123; i ++)     // a~z
                this.Xlat[i - 97 + 26] = i;
            for (let i = 48; i < 58; i ++)      // 0~9
                this.Xlat[i - 48 + 52] = i;

            this.Xlat[62] = 43;     // +
            this.Xlat[63] = 47;     // /
            this.Xlat[64] = 61;     // =
        }

        const RetVal = new Uint8Array(Math.trunc((In.byteLength + 2) / 3) * 4);

        let i = 0, j = 0;
        let A: number, B: number, C: number;

        while (i < In.byteLength)
        {
            A = In[i ++];
            RetVal[j ++] = this.Xlat[A >> 2];

            if (i === In.byteLength)
            {
                RetVal[j ++] = this.Xlat[((A & 3) << 4)];
                RetVal[j ++] = this.Xlat[64];
                RetVal[j ++] = this.Xlat[64];
                break;
            }

            B = In[i ++];
            RetVal[j ++] = this.Xlat[((A & 3) << 4) | (B >> 4)];

            if (i === In.byteLength)
            {
                RetVal[j ++] = this.Xlat[ ((B & 15) << 2)];
                RetVal[j ++] = this.Xlat[64];
                break;
            }

            C = In[i ++];
            RetVal[j ++] = this.Xlat[ ((B & 15) << 2) | (C >> 6)];
            RetVal[j ++] = this.Xlat[C & 63];
        }

        return RetVal;
    }

    static Decode(In: Uint8Array | string): Uint8Array
    {
        if (TypeInfo.IsString(In))
            In = TUtf8Encoding.Encode(In);

        if (! (In instanceof Uint8Array))
            throw new EInvalidArg(In);

        let Size = Math.trunc((In.byteLength + 3) / 4) * 3;
        if (Size === 0)
            return new Uint8Array(0);

        switch (In.byteLength % 4)
        {
        case 1:     // not possiable 6 bits
            throw new EEncoding('Corrupted base64');
        case 2:     // 12bits
            Size -= 2;
            break;
        case 3:     // 18bits
            Size --;
            break;
        default:
            if (In[In.byteLength - 1] === 61)
                Size --;
            if (In.byteLength > 1 && In[In.byteLength - 2] === 61)
                Size --;
            break;
        }
        const RetVal = new Uint8Array(Size);

        let I = 0, J = 0;
        while (I < In.byteLength)
        {
            const A = ValueOf(In[I ++]);
            let B = 0;
            let C = 0;
            let D = 0;

            if (I < In.byteLength)
                B = ValueOf(In[I ++]);
            if (I < In.byteLength)
                C = ValueOf(In[I ++]);
            if (I < In.byteLength)
                D = ValueOf(In[I ++]);

            RetVal[J ++] = (A << 2) | (B >> 4);
            RetVal[J ++] = ((B & 15) << 4) | (C >> 2);
            RetVal[J ++] = ((C & 3) << 6) | D;
        }

        return RetVal;

        function ValueOf(base64: number): number
        {
            if (base64 === 61)  // =
                return 0;

            if (base64 === 43)  // +
                return 62;
            if (base64 === 47)  // /
                return 63;

            if (base64 >= 65 && base64 < 91)    // A-Z, 0~25
                return base64 - 65;

            if (base64 >= 97 && base64 < 123)   // a~z, 26~51
                return base64 - 97 + 26;

            if (base64 >= 48 && base64 < 58)    // 0~9, 52~61
                return base64 - 48 + 52;

            throw new EEncoding('Corrupted base64: ' + base64);
        }
    }

    private static Xlat: Uint8Array;
}
