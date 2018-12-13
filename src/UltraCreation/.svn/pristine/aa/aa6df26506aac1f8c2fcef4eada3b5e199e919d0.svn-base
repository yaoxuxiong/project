import {TypeInfo} from '../Core/TypeInfo';
import {IEncodingStatic, TBaseEncoding, EEncoding} from './Abstract';

export class EInvalidAscii extends EEncoding
    {}

@TypeInfo.StaticImplements<IEncodingStatic>()
export class TAsciiEncoding extends TBaseEncoding
{
    static Encode(Str: string, Start = 0, End?: number): Uint8Array
    {
        if (! TypeInfo.Assigned(Str) || Str.length === 0)
            End = Start;
        else if (! TypeInfo.Assigned(End) || End > Str.length)
            End = Str.length;

        const buf = new Uint8Array(End - Start);

        for (let I = Start; I < End; I ++)
        {
            const c = Str.charCodeAt(I);
            if (c > 0x7F)
                throw new EInvalidAscii();

            buf[I] = c;
        }
        return buf;
    }

    static Decode(buf: Uint8Array, Start = 0, End?: number): string
    {
        if (! TypeInfo.Assigned(End) || End > buf.byteLength)
            End = buf.byteLength;

        let RetVal = '';

        for (let I = Start; I < End; I ++)
        {
            const c = buf[I];
            if (c > 0x7F)
                throw new EInvalidAscii();

            RetVal += String.fromCharCode(c);
        }
        return RetVal;
    }
}

export enum ASCII
{
    /** Null char */
    NUL = 0,
    /** Start of Heading */
    SOH = 1,
    /** Start of Text */
    STX = 2,
    /** End of Text */
    ETX = 3,
    /** End of Transmission */
    EOT = 4,
    /** Enquiry */
    ENQ = 5,
    /** Acknowledgment */
    ACK = 6,
    /** Bell */
    BEL = 7,
    /** Back Space */
    BS = 8,
    /** Horizontal Tab */
    HT = 9,
    /** Line Feed */
    LF = 10,
    /** Vertical Tab */
    VT = 11,
    /** Form Feed */
    FF = 12,
    /** Carriage Return */
    CR = 13,
    /** Shift Out / X-On */
    SO = 14,
    /** Shift In / X-Off */
    SI = 15,
    /** Data Line Escape */
    DLE = 16,
    /** Device Control 1 (oft. XON) */
    DC1 = 17,
    /** Device Control 2 */
    DC2 = 18,
    /** Device Control 3 (oft. XOFF) */
    DC3 = 19,
    /** Device Control 4 */
    DC4 = 20,
    /** Negative Acknowledgement */
    NAK = 21,
    /** Synchronous Idle */
    SYN = 22,
    /** End of Transmit Block */
    ETB = 23,
    /** Cancel */
    CAN = 24,
    /** End of Medium */
    EM = 25,
    /** Substitute */
    SUB = 26,
    /** Escape */
    ESC = 27,
    /** File Separator */
    FS = 28,
    /** Group Separator */
    GS = 29,
    /** Record Separator */
    RS = 30,
    /** Unit Separator */
    US = 31,

    Space = 32,
    /** ! */
    Exclamation = 33,
    /** " */
    DoubleQuotes = 34,
    /** # */
    Number = 35,
    /** $ */
    Dollar = 36,
    /** % */
    Percent = 37,
    /** & */
    Ampersand = 38,
    /** ' */
    SingleQuote = 39,
    /** ( */
    LeftParenthesis = 40,
    /** ) */
    RightParenthesis = 41,
    /** * */
    Asterik = 42,
    /** + */
    Plus = 43,
    /** , */
    Comma = 44,
    /** - */
    Minus = 45,
    /** . */
    Period = 46,
    /** / */
    Divide = 47,

    Zero = 48,  // 0 ~ 9
    One = 49,
    Two = 50,
    Three = 51,
    Four = 52,
    Five = 53,
    Six = 54,
    Seven = 55,
    Eight = 56,
    Nine = 57,

    /** : */
    Colon = 58,
    /** , */
    Semicolon = 59,
    /**< */
    LessThan = 60,
    /** = */
    Equality = 61,
    /** > */
    GreaterThan = 62,
    /** ? */
    Question = 63,
    /** @ */
    At = 64,

    UPPER_A = 65,   // A~Z
    UPPER_B = 66,
    UPPER_C = 67,
    UPPER_D = 68,
    UPPER_E = 69,
    UPPER_F = 70,
    UPPER_G = 71,
    UPPER_H = 72,
    UPPER_I = 73,
    UPPER_J = 74,
    UPPER_K = 75,
    UPPER_L = 76,
    UPPER_M = 77,
    UPPER_N = 78,
    UPPER_O = 79,
    UPPER_P = 80,
    UPPER_Q = 81,
    UPPER_R = 82,
    UPPER_S = 83,
    UPPER_T = 84,
    UPPER_U = 85,
    UPPER_V = 86,
    UPPER_W = 87,
    UPPER_X = 88,
    UPPER_Y = 89,
    UPPER_Z = 90,

    /** [ */
    LeftSquareBracket = 91,
    /** \ */
    Backslash = 92,
    /** ] */
    RightSquareBracket = 93,
    /** ^ */
    Circumflex = 94,
    /** _ */
    Underscore = 95,
    /** ` */
    Accent = 96,

    LOWER_A = 97,   // a~z
    LOWER_B = 98,
    LOWER_C = 99,
    LOWER_D = 100,
    LOWER_E = 101,
    LOWER_F = 102,
    LOWER_G = 103,
    LOWER_H = 104,
    LOWER_I = 105,
    LOWER_J = 106,
    LOWER_K = 107,
    LOWER_L = 108,
    LOWER_M = 109,
    LOWER_N = 110,
    LOWER_O = 111,
    LOWER_P = 112,
    LOWER_Q = 113,
    LOWER_R = 114,
    LOWER_S = 115,
    LOWER_T = 116,
    LOWER_U = 117,
    LOWER_V = 118,
    LOWER_W = 119,
    LOWER_X = 120,
    LOWER_Y = 121,
    LOWER_Z = 122,

    /** { */
    LeftBrace = 123,
    /** | */
    VerticalBar = 124,
    /** } */
    RightBrace = 125,
    /** ~ */
    Tidle = 126,
    /** DEL */
    Delete = 127
}
