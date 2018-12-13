import {Exception} from '../Core/Exception';

export class EEncoding extends Exception
    {}

/** IEncodingStatic */

export interface IEncodingStatic
{
    Encode(In: any): any;
    Decode(In: any): any;
}

/** TBaseEncoding */

export class TBaseEncoding
{
    /**
     *  protected constructor limit caller to new
     */
    protected constructor()
    {
    }
}

/**
 *  TEncoding
 */

 export class TEncoding
 {
 }
