import {TypeInfo} from '../../Core/TypeInfo';

export namespace InvCrypto
{
    declare var require: any;
    declare var window: any;
    let Crypto: any;

    export function Initialize()
    {
        if (TypeInfo.Assigned(Crypto))
            return;

        if (TypeInfo.UNDEFINED !== typeof window)
        {
            console.log('initialize InvCrypto = window.crypto');
            Crypto = window.crypto || window.msCrypto;
        }
        else if (TypeInfo.FUNCTION === typeof require)
        {
            console.log('initialize InvCrypto = reuire("crypto")');
            Crypto = require('crypto');
        }
        else
            console.warn('InvMath.Crypto not usable..');
    }

    export function Encrypt(Algorithm: string, Password: string, Txt: string): string
    {
        const iv = (Password + '0000000000000000').substring(0, 16);
        Password = iv;
        const cipher = Crypto.createCipheriv(Algorithm, Password, iv);

        let enc = cipher.update(Txt, 'utf8', 'base64');
        enc += cipher.final('base64');
        return enc;
    }

    export function Decrypt(Algorithm: string, Password: string, Txt: string): string
    {
        const iv = (Password + '0000000000000000').substring(0, 16);
        Password = iv;
        const decipher = Crypto.createDecipheriv(Algorithm, Password, iv);

        let dec = decipher.update(Txt, 'base64', 'utf8');
        dec += decipher.final('utf8');

        return dec;
    }
}
InvCrypto.Initialize();
