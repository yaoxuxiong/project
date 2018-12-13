import {TypeInfo} from '../Core/TypeInfo';

import * as Zlib from './Constant/zlib';
import {z_stream, gz_header_s} from './Types/zlib';

import inflate_fast from './inffast';
import inflate_table from './inftrees';
import {Endianness} from '../Core/Endian';
import {THashAdler32} from '../Hash/Adler32';
import {THashCrc32b} from '../Hash/Crc32b';

// (C) 1995-2013 Jean-loup Gailly and Mark Adler
// (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
//
// This software is provided 'as-is', without any express or implied
// warranty. In no event will the authors be held liable for any damages
// arising from the use of this software.
//
// Permission is granted to anyone to use this software for any purpose,
// including commercial applications, and to alter it and redistribute it
// freely, subject to the following restrictions:
//
// 1. The origin of this software must not be misrepresented; you must not
//   claim that you wrote the original software. If you use this software
//   in a product, an acknowledgment in the product documentation would be
//   appreciated but is not required.
// 2. Altered source versions must be plainly marked as such, and must not be
//   misrepresented as being the original software.
// 3. This notice may not be removed or altered from any source distribution.

const CODES = 0;
const LENS = 1;
const DISTS = 2;

/* STATES ====================================================================*/
/* ===========================================================================*/


const HEAD = 1;       /* i: waiting for magic header */
const FLAGS = 2;      /* i: waiting for method and flags (gzip) */
const TIME = 3;       /* i: waiting for modification time (gzip) */
const OS = 4;         /* i: waiting for extra flags and operating system (gzip) */
const EXLEN = 5;      /* i: waiting for extra length (gzip) */
const EXTRA = 6;      /* i: waiting for extra bytes (gzip) */
const NAME = 7;       /* i: waiting for end of file name (gzip) */
const COMMENT = 8;    /* i: waiting for end of comment (gzip) */
const HCRC = 9;       /* i: waiting for header crc (gzip) */
const DICTID = 10;    /* i: waiting for dictionary check value */
const DICT = 11;      /* waiting for inflateSetDictionary() call */
const TYPE = 12;      /* i: waiting for type bits, including last-flag bit */
const TYPEDO = 13;    /* i: same, but skip check to exit inflate on new block */
const STORED = 14;    /* i: waiting for stored size (length and complement) */
const COPY_ = 15;     /* i/o: same as COPY below, but only first time in */
const COPY = 16;      /* i/o: waiting for input or output to copy stored block */
const TABLE = 17;     /* i: waiting for dynamic block table lengths */
const LENLENS = 18;   /* i: waiting for code length code lengths */
const CODELENS = 19;  /* i: waiting for length/lit and distance code lengths */
const LEN_ = 20;      /* i: same as LEN below, but only first time in */
const LEN = 21;       /* i: waiting for length/lit/eob code */
const LENEXT = 22;    /* i: waiting for length extra bits */
const DIST = 23;      /* i: waiting for distance code */
const DISTEXT = 24;   /* i: waiting for distance extra bits */
const MATCH = 25;     /* o: waiting for output space to copy string */
const LIT = 26;       /* o: waiting for output space to write literal */
const CHECK = 27;     /* i: waiting for 32-bit check value */
const LENGTH = 28;    /* i: waiting for 32-bit length (gzip) */
const DONE = 29;      /* finished check, done -- remain here until reset */
const BAD = 30;       /* got a data error -- remain here until reset */
const MEM = 31;       /* got an inflate() memory error -- remain here until reset */
const SYNC = 32;      /* looking for synchronization bytes to restart inflate() */

/* ===========================================================================*/

const ENOUGH_LENS = 852;
const ENOUGH_DISTS = 592;
// var ENOUGH =  (ENOUGH_LENS+ENOUGH_DISTS);;

const MAX_WBITS = 15;
/* 32K LZ77 window */
const DEF_WBITS = MAX_WBITS;

// tslint:disable-next-line:class-name
export class inflate_state
{
    mode: number = 0;                   /* current inflate mode */
    last: number = 0;                   /* true if processing last block */
    wrap: number = 0;                   /* bit 0 true for zlib, bit 1 true for gzip */
    havedict: number = 0;               /* true if dictionary provided */
    flags: number = 0;                  /* gzip header method and flags (0 if zlib) */
    dmax: number = 0;                   /* zlib header max distance (INFLATE_STRICT) */
    check: number = 0;                  /* protected copy of check value */
    total: number = 0;                  /* protected copy of output count */
    // TODO: may be {}
    head: gz_header_s = null;           /* where to save gzip header information */

    /* sliding window */
    wbits: number = 0;                  /* log base 2 of requested window size */
    wsize: number = 0;                  /* window size or zero if not using window */
    whave: number = 0;                  /* valid bytes in the window */
    wnext: number = 0;                  /* window write index */
    window: Uint8Array = null;          /* allocated sliding window, if needed */

    /* bit accumulator */
    hold: number = 0;                   /* input bit accumulator */
    bits: number = 0;                   /* number of bits in "in" */

    /* for string and stored block copying */
    length: number = 0;                 /* literal or length of data to copy */
    offset: number = 0;                 /* distance back to copy string from */

    /* for table and code decoding */
    extra: number = 0;                  /* extra bits needed */

    /* fixed and dynamic code tables */
    lencode: Int32Array = null;         /* starting table for length/literal codes */
    distcode: Int32Array = null;        /* starting table for distance codes */
    lenbits: number = 0;                /* index bits for lencode */
    distbits: number = 0;               /* index bits for distcode */

    /* dynamic table building */
    ncode: number = 0;                  /* number of code length code lengths */
    nlen: number = 0;                   /* number of length code lengths */
    ndist: number = 0;                  /* number of distance code lengths */
    have: number = 0;                   /* number of code lengths in lens[] */
    next: number = null;                /* next available space in codes[] */

    lens: Uint16Array = new Uint16Array(320); /* temporary storage for code lengths */
    work: Uint16Array = new Uint16Array(288); /* work area for code table building */

    /*
    because we don't have pointers in js, we use lencode and distcode directly
    as buffers so we don't need codes
    */
    // codes = new utils.Buf32(ENOUGH); /* space for code tables *//
    lendyn: Int32Array = null;          /* dynamic table for length/literal codes (JS specific) */
    distdyn: Int32Array = null;         /* dynamic table for distance codes (JS specific) */
    sane: number = 0;                   /* if false, allow invalid distance too far */
    back: number = 0;                   /* bits back of last unprocessed length/lit */
    was: number = 0;                    /* initial length of match */
}

export function inflateResetKeep(strm: z_stream): number
{
    let state: inflate_state;

    if (! strm || ! strm.state)
    {
        return Zlib.Z_STREAM_ERROR;
    }

    state = strm.state as inflate_state;
    strm.total_in = strm.total_out = state.total = 0;
    strm.msg = ''; /*Z_NULL*/

    if (state.wrap)
    {
        /* to support ill-conceived Java test suite */
        strm.adler = state.wrap & 1;
    }
    state.mode = HEAD;
    state.last = 0;
    state.havedict = 0;
    state.dmax = 32768;
    state.head = null /*Z_NULL*/;
    state.hold = 0;
    state.bits = 0;
    // state.lencode = state.distcode = state.next = state.codes;;
    state.lencode = state.lendyn = new Int32Array(ENOUGH_LENS);
    state.distcode = state.distdyn = new Int32Array(ENOUGH_DISTS);

    state.sane = 1;
    state.back = -1;
    // Tracev((stderr, "inflate: reset\n"));;
    return Zlib.Z_OK;
}

export function inflateReset(strm: z_stream): number
{
    let state: inflate_state;

    if (! strm || ! strm.state)
    {
        return Zlib.Z_STREAM_ERROR;
    }

    state = strm.state as inflate_state;
    state.wsize = 0;
    state.whave = 0;
    state.wnext = 0;
    return inflateResetKeep(strm);
}

export function inflateReset2(strm: z_stream, windowBits: number): number
{
    let wrap;
    let state: inflate_state;

    /* get the state */
    if (! strm || ! strm.state) { return Zlib.Z_STREAM_ERROR; }
    state = strm.state as inflate_state;

    /* extract wrap request from windowBits parameter */
    if (windowBits < 0)
    {
        wrap = 0;
        windowBits = -windowBits;
    }
    else
    {
        wrap = (windowBits >> 4) + 1;
        if (windowBits < 48)
        {
        windowBits &= 15;
        }
    }

    /* set number of window bits, free window if different */
    if (windowBits && (windowBits < 8 || windowBits > 15))
    {
        return Zlib.Z_STREAM_ERROR;
    }
    if (state.window !== null && state.wbits !== windowBits)
    {
        state.window = null;
    }

    /* update state and reset the rest of it */
    state.wrap = wrap;
    state.wbits = windowBits;
    return inflateReset(strm);
}

export function inflateInit2(strm: z_stream, windowBits: number): number
{
    let ret;
    let state: inflate_state;

    if (! strm)
    {
        return Zlib.Z_STREAM_ERROR;
    }
    // strm.msg = Z_NULL;                 /* in case we return an error *//

    state = new inflate_state();

    // if (state === Z_NULL) return Z_MEM_ERROR;;;;;;;;;;;
    // Tracev((stderr, "inflate: allocated\n"));;;;;;;;;;;
    strm.state = state;
    state.window = null/*Z_NULL*/;
    ret = inflateReset2(strm, windowBits);
    if (ret !== Zlib.Z_OK)
    {
        strm.state = null/*Z_NULL*/;
    }
    return ret;
}

export function inflateInit(strm: z_stream): number
{
    return inflateInit2(strm, DEF_WBITS);
}

/*
 Return state with length and distance decoding tables and index sizes set to
 fixed code decoding.  Normally this returns fixed tables from inffixed.h.
 If BUILDFIXED is defined, then instead this routine builds the tables the
 first time it's called, and returns those tables the first time and
 thereafter.  This reduces the size of the code by about 2K bytes, in
 exchange for a little execution time.  However, BUILDFIXED should not be
 used for threaded applications, since the rewriting of the tables and virgin
 may not be thread-safe.
 */
let virgin = true;
let lenfix: Int32Array, distfix: Int32Array; // We have no pointers in JS, so keep tables separate

function fixedtables(state: inflate_state): void
{
    /* build fixed huffman tables if first call (may not be thread safe) */
    if (virgin)
    {
        let sym: number;

        lenfix = new Int32Array(512);
        distfix = new Int32Array(32);

        /* literal/length table */
        sym = 0;
        while (sym < 144) { state.lens[sym++] = 8; }
        while (sym < 256) { state.lens[sym++] = 9; }
        while (sym < 280) { state.lens[sym++] = 7; }
        while (sym < 288) { state.lens[sym++] = 8; }

        inflate_table(LENS, state.lens, 0, 288, lenfix, 0, state.work, { bits: 9 });

        /* distance table */
        sym = 0;
        while (sym < 32) { state.lens[sym++] = 5; }

        inflate_table(DISTS, state.lens, 0, 32, distfix, 0, state.work, { bits: 5 });

        /* do this just once */
        virgin = false;
    }

    state.lencode = lenfix;
    state.lenbits = 9;
    state.distcode = distfix;
    state.distbits = 5;
}

/*
 Update the window with the last wsize (normally 32K) bytes written before
 returning.  If window does not exist yet, create it.  This is only called
 when a window is already in use, or when output has been written during this
 inflate call, but the end of the deflate stream has not been reached yet.
 It is also called to create a window for dictionary data when a dictionary
 is loaded.

 Providing output buffers larger than 32K to inflate() should provide a speed
 advantage, since only the last 32K of output is copied to the sliding window
 upon return from inflate(), and since all distances after the first 32K of
 output will fall in the output data, making match copies simpler and faster.
 The advantage may be dependent on the size of the processor's data caches.
 */
function updatewindow(strm: z_stream, src: Uint8Array, end: number, copy: number): number
{
    let dist: number;
    const state: inflate_state = strm.state as inflate_state;

    /* if it hasn't been done already, allocate space for the window */
    if (state.window === null)
    {
        state.wsize = 1 << state.wbits;
        state.wnext = 0;
        state.whave = 0;

        state.window = new Uint8Array(state.wsize);
    }

    /* copy state->wsize or less output bytes into the circular window */
    if (copy >= state.wsize)
    {
        TypeInfo.ArrayCopy(state.window, src, end - state.wsize, state.wsize);
        state.wnext = 0;
        state.whave = state.wsize;
    }
    else
    {
        dist = state.wsize - state.wnext;
        if (dist > copy)
        {
            dist = copy;
        }

        // zmemcpy(state->window + state->wnext, end - copy, dist);;;;;;;;;;;
        TypeInfo.ArrayCopy(state.window, src, end - copy, dist, state.wnext);
        copy -= dist;
        if (copy)
        {
            // zmemcpy(state->window, end - copy, copy);;;;;;;;;;;
            TypeInfo.ArrayCopy(state.window, src, end - copy, copy);
            state.wnext = copy;
            state.whave = state.wsize;
        }
        else
        {
            state.wnext += dist;
            if (state.wnext === state.wsize) { state.wnext = 0; }
            if (state.whave < state.wsize) { state.whave += dist; }
        }
    }
    return 0;
}

export function inflate(strm: z_stream, flush: number): number
{
    let state: inflate_state;
    let input: Uint8Array, output: Uint8Array;          // input/output buffers
    let next: number;                   /* next input INDEX */
    let put: number;                    /* next output INDEX */
    let have: number, left: number;             /* available input and output */
    let hold: number;                   /* bit buffer */
    let bits: number;                   /* bits in bit buffer */
    let _in: number, _out: number;              /* save starting available input and output */
    let copy: number;                   /* number of stored or match bytes to copy */
    let from: number;                   /* where to copy match bytes from */
    let from_source: Uint8Array;
    let here = 0;               /* current decoding table entry */
    let here_bits: number, here_op: number, here_val: number; // paked "here" denormalized (JS specific)
    // var last;                   /* parent table entry *///
    let last_bits: number, last_op: number, last_val: number; // paked "last" denormalized (JS specific)
    let len: number;                    /* length to copy for repeats, bits to drop */
    let ret: number;                    /* return code */
    const hbuf = new Uint8Array(4);    /* buffer for gzip header crc calculation */
    let opts: { bits: number };

    let n: number; // temporary var for NEED_BITS

    const order = /* permutation of code lengths */
        [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];

    if (! strm || ! strm.state || ! strm.next_out || (! strm.next_in && strm.avail_in !== 0))
    {
        return Zlib.Z_STREAM_ERROR;
    }

    state = strm.state as inflate_state;
    if (state.mode === TYPE)
    {
        state.mode = TYPEDO;
    }    /* skip check */


    // --- LOAD() -----
    put = strm.next_out_position;
    output = strm.next_out;
    left = strm.avail_out;
    next = strm.next_in_position;
    input = strm.next_in;
    have = strm.avail_in;
    hold = state.hold;
    bits = state.bits;
    // -----

    _in = have;
    _out = left;
    ret = Zlib.Z_OK;

    inf_leave: // goto emulation
    for (; ;)
    {
        switch (state.mode)
        {
        case HEAD:
            if (state.wrap === 0)
            {
                state.mode = TYPEDO;
                break;
            }
            // === NEEDBITS(16);;;
            while (bits < 16)
            {
                if (have === 0) { break inf_leave; }
                have--;
                hold += input[next++] << bits;
                bits += 8;
            }
            // ===//////
            if ((state.wrap & 2) && hold === 0x8b1f)
            {
                /* gzip header */
                state.check = THashCrc32b.Update(0, null);
                // === CRC2(state.check, hold);;;;;
                hbuf[0] = hold & 0xff;
                hbuf[1] = (hold >>> 8) & 0xff;
                state.check = THashCrc32b.Update(state.check, hbuf, 2);
                // ===//////

                // === INITBITS();;;;;
                hold = 0;
                bits = 0;
                // ===//////
                state.mode = FLAGS;
                break;
            }
            state.flags = 0;            /* expect zlib header */
            if (state.head)
            {
                state.head.done = false;
            }
            if (!(state.wrap & 1) ||     /* check if zlib header allowed */
                (((hold & 0xff)          /*BITS(8)*/ << 8) + (hold >> 8)) % 31)
            {
                strm.msg = 'incorrect header check';
                state.mode = BAD;
                break;
            }
            if ((hold & 0x0f)   /*BITS(4)*/ !== Zlib.Z_DEFLATED)
            {
                strm.msg = 'unknown compression method';
                state.mode = BAD;
                break;
            }
            // --- DROPBITS(4) ---//////
            hold >>>= 4;
            bits -= 4;
            // ---//////
            len = (hold & 0x0f)   /*BITS(4)*/ + 8;
            if (state.wbits === 0)
            {
                state.wbits = len;
            }
            else if (len > state.wbits)
            {
                strm.msg = 'invalid window size';
                state.mode = BAD;
                break;
            }
            state.dmax = 1 << len;
            // Tracev((stderr, "inflate:   zlib header ok\n"));;;;;
            strm.adler = state.check = THashAdler32.Update(0, null);
            state.mode = hold & 0x200 ? DICTID : TYPE;
            // === INITBITS();;;;;
            hold = 0;
            bits = 0;
            // ===/////////
            break;
        case FLAGS:
            // === NEEDBITS(16); *////////
            while (bits < 16)
            {
                if (have === 0) { break inf_leave; }
                have--;
                hold += input[next++] << bits;
                bits += 8;
            }
            // ===/////////
            state.flags = hold;
            if ((state.flags & 0xff) !== Zlib.Z_DEFLATED)
            {
                strm.msg = 'unknown compression method';
                state.mode = BAD;
                break;
            }
            if (state.flags & 0xe000)
            {
                strm.msg = 'unknown header flags set';
                state.mode = BAD;
                break;
            }
            if (state.head)
            {
                state.head.text = ((hold >> 8) & 1);
            }
            if (state.flags & 0x0200)
            {
                // === CRC2(state.check, hold);;;;;;;;
                hbuf[0] = hold & 0xff;
                hbuf[1] = (hold >>> 8) & 0xff;
                state.check = THashCrc32b.Update(state.check, hbuf, 2);
                // ===/////////
            }
            // === INITBITS();;;;;;;;
            hold = 0;
            bits = 0;
            // ===/////////
            state.mode = TIME;
        /* falls through */
        case TIME:
            // === NEEDBITS(32); *////////
            while (bits < 32)
            {
                if (have === 0) { break inf_leave; }
                have--;
                hold += input[next++] << bits;
                bits += 8;
            }
            // ===/////////
            if (state.head)
            {
                state.head.time = hold;
            }
            if (state.flags & 0x0200)
            {
                // === CRC4(state.check, hold))))))))
                hbuf[0] = hold & 0xff;
                hbuf[1] = (hold >>> 8) & 0xff;
                hbuf[2] = (hold >>> 16) & 0xff;
                hbuf[3] = (hold >>> 24) & 0xff;
                state.check = THashCrc32b.Update(state.check, hbuf, 4);
                // ==========
            }
            // === INITBITS();;;;;;;;
            hold = 0;
            bits = 0;
            // ===/////////
            state.mode = OS;
        /* falls through */
        case OS:
            // === NEEDBITS(16); *////////
            while (bits < 16)
            {
                if (have === 0)
                {
                   break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
            }
            // ===/////////
            if (state.head)
            {
                state.head.xflags = (hold & 0xff);
                state.head.os = (hold >> 8);
            }
            if (state.flags & 0x0200)
            {
                // === CRC2(state.check, hold);;;;;;;;
                hbuf[0] = hold & 0xff;
                hbuf[1] = (hold >>> 8) & 0xff;
                state.check = THashCrc32b.Update(state.check, hbuf, 2);
                // ===/////////
            }
            // === INITBITS();
            hold = 0;
            bits = 0;
            // ===//
            state.mode = EXLEN;
        /* falls through */
        case EXLEN:
            if (state.flags & 0x0400)
            {
                // === NEEDBITS(16); */
                while (bits < 16)
                {
                    if (have === 0) { break inf_leave; }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                }
                // ===//
                state.length = hold;
                if (state.head)
                {
                    state.head.extra_len = hold;
                }
                if (state.flags & 0x0200)
                {
                    // === CRC2(state.check, hold);
                    hbuf[0] = hold & 0xff;
                    hbuf[1] = (hold >>> 8) & 0xff;
                    state.check = THashCrc32b.Update(state.check, hbuf, 2);
                    // ===//
                }
                // === INITBITS();
                hold = 0;
                bits = 0;
                // ===//
            }
            else if (state.head)
            {
                state.head.extra = null/*Z_NULL*/;
            }
            state.mode = EXTRA;
        /* falls through */
        case EXTRA:
            if (state.flags & 0x0400)
            {
                copy = state.length;
                if (copy > have)
                {
                    copy = have;
                }
                if (copy)
                {
                    if (state.head)
                    {
                        len = state.head.extra_len - state.length;
                        if (!state.head.extra)
                        {
                            // Use untyped array for more convenient processing later
                            state.head.extra = new Uint8Array(state.head.extra_len);
                        }
                        TypeInfo.ArrayCopy(state.head.extra, input, next,
                            // extra field is limited to 65536 bytes
                            // - no need for additional size check
                            copy,
                            /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
                            len
                        );
                        // zmemcpy(state.head.extra + len, next,
                        //        len + copy > state.head.extra_max ?
                        //        state.head.extra_max - len : copy);
                    }
                    if (state.flags & 0x0200)
                    {
                        state.check = THashCrc32b.Update(state.check, input, copy, next);
                    }
                    have -= copy;
                    next += copy;
                    state.length -= copy;
                }
                if (state.length)
                {
                    break inf_leave;
                }
            }
            state.length = 0;
            state.mode = NAME;
        /* falls through */
        case NAME:
            if (state.flags & 0x0800)
            {
                if (have === 0) { break inf_leave; }
                copy = 0;
                do
                {
                    // TODO: 2 or 1 bytes?
                    len = input[next + copy++];
                    /* use Zlib limit because in js we should not preallocate memory */
                    if (state.head && len &&
                    (state.length < 65536 /*state.head.name_max*/))
                    {
                    state.head.name += String.fromCharCode(len);
                    }
                } while (len && copy < have);

                if (state.flags & 0x0200)
                {
                    state.check = THashCrc32b.Update(state.check, input, copy, next);
                }
                have -= copy;
                next += copy;
                if (len)
                {
                    break inf_leave;
                }
            }
            else if (state.head)
            {
                state.head.name = null;
            }
            state.length = 0;
            state.mode = COMMENT;
        /* falls through */
        case COMMENT:
            if (state.flags & 0x1000)
            {
                if (have === 0)
                {
                    break inf_leave;
                }
                copy = 0;
                do
                {
                    len = input[next + copy++];
                    /* use Zlib limit because in js we should not preallocate memory */
                    if (state.head && len &&
                        (state.length < 65536 /*state.head.comm_max*/))
                    {
                        state.head.comment += String.fromCharCode(len);
                    }
                } while (len && copy < have);
                if (state.flags & 0x0200)
                {
                    state.check = THashCrc32b.Update(state.check, input, copy, next);
                }
                have -= copy;
                next += copy;
                if (len)
                {
                    break inf_leave;
                }
            }
            else if (state.head)
            {
                state.head.comment = null;
            }
            state.mode = HCRC;
        /* falls through */
        case HCRC:
            if (state.flags & 0x0200)
            {
                // === NEEDBITS(16); */
                while (bits < 16)
                {
                    if (have === 0) { break inf_leave; }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                }
                // ===//
                if (hold !== (state.check & 0xffff))
                {
                    strm.msg = 'header crc mismatch';
                    state.mode = BAD;
                    break;
                }
                // === INITBITS();
                hold = 0;
                bits = 0;
                // ===//
            }
            if (state.head)
            {
                state.head.hcrc = ((state.flags >> 9) & 1);
                state.head.done = true;
            }
            strm.adler = state.check = 0;
            state.mode = TYPE;
            break;

        case DICTID:
            // === NEEDBITS(32); */
            while (bits < 32)
            {
                if (have === 0) { break inf_leave; }
                have--;
                hold += input[next++] << bits;
                bits += 8;
            }
            // ===//
            strm.adler = state.check = Endianness.Swap32(hold);
            // === INITBITS();
            hold = 0;
            bits = 0;
            // ===//
            state.mode = DICT;
        /* falls through */
        case DICT:
            if (state.havedict === 0)
            {
                // --- RESTORE() ---
                strm.next_out_position = put;
                strm.avail_out = left;
                strm.next_in_position = next;
                strm.avail_in = have;
                state.hold = hold;
                state.bits = bits;
                // ---
                return Zlib.Z_NEED_DICT;
            }
            strm.adler = state.check = THashAdler32.Update(0, null);
            state.mode = TYPE;
        /* falls through */
        case TYPE:
            if (flush === Zlib.Z_BLOCK || flush === Zlib.Z_TREES)
            {
                break inf_leave;
            }
        /* falls through */
        case TYPEDO:
            if (state.last)
            {
                // --- BYTEBITS() ---//
                hold >>>= bits & 7;
                bits -= bits & 7;
                // ---//////
                state.mode = CHECK;
                break;
            }
            // === NEEDBITS(3); */////
            while (bits < 3)
            {
                if (have === 0)
                {
                    break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
            }
            // ===//////
            state.last = (hold & 0x01)/*BITS(1)*/;
            // --- DROPBITS(1) ---//////
            hold >>>= 1;
            bits -= 1;
            // ---//////

            switch ((hold & 0x03)/*BITS(2)*/)
            {
            case 0:                             /* stored block */
                // Tracev((stderr, "inflate:     stored block%s\n",,,,,
                //        state.last ? " (last)" : ""));
                state.mode = STORED;
                break;
            case 1:                             /* fixed block */
                fixedtables(state);
                // Tracev((stderr, "inflate:     fixed codes block%s\n",,,,,
                //        state.last ? " (last)" : ""));
                state.mode = LEN_;             /* decode codes */
                if (flush === Zlib.Z_TREES)
                {
                // --- DROPBITS(2) ---//////
                hold >>>= 2;
                bits -= 2;
                // ---//////
                break inf_leave;
                }
                break;
            case 2:                             /* dynamic block */
                // Tracev((stderr, "inflate:     dynamic codes block%s\n",,,,,
                //        state.last ? " (last)" : ""));
                state.mode = TABLE;
                break;
            case 3:
                strm.msg = 'invalid block type';
                state.mode = BAD;
            }
            // --- DROPBITS(2) ---//////
            hold >>>= 2;
            bits -= 2;
            // ---//////
            break;

        case STORED:
            // --- BYTEBITS() ---// /* go to byte boundary */////
            hold >>>= bits & 7;
            bits -= bits & 7;
            // ---//////
            // === NEEDBITS(32); */////
            while (bits < 32)
            {
                if (have === 0) { break inf_leave; }
                have--;
                hold += input[next++] << bits;
                bits += 8;
            }
            // ===//////
            if ((hold & 0xffff) !== ((hold >>> 16) ^ 0xffff))
            {
                strm.msg = 'invalid stored block lengths';
                state.mode = BAD;
                break;
            }
            state.length = hold & 0xffff;
            // Tracev((stderr, "inflate:       stored length %u\n",,,,,
            //        state.length));
            // === INITBITS();;;;;
            hold = 0;
            bits = 0;
            // ===//////
            state.mode = COPY_;
            if (flush === Zlib.Z_TREES)
            {
                break inf_leave;
            }
        /* falls through */
        case COPY_:
            state.mode = COPY;
        /* falls through */
        case COPY:
            copy = state.length;
            if (copy)
            {
                if (copy > have) { copy = have; }
                if (copy > left) { copy = left; }
                if (copy === 0) { break inf_leave; }
                // --- zmemcpy(put, next, copy); -------
                TypeInfo.ArrayCopy(output, input, next, copy, put);
                // ---//////
                have -= copy;
                next += copy;
                left -= copy;
                put += copy;
                state.length -= copy;
                break;
            }
            // Tracev((stderr, "inflate:       stored end\n"));;;;;
            state.mode = TYPE;
            break;

        case TABLE:
            // === NEEDBITS(14); */////
            while (bits < 14)
            {
                if (have === 0) { break inf_leave; }
                have--;
                hold += input[next++] << bits;
                bits += 8;
            }
            // ===//////
            state.nlen = (hold & 0x1f) /*BITS(5)*/ + 257;
            // --- DROPBITS(5) ---//////
            hold >>>= 5;
            bits -= 5;
            // ---//////
            state.ndist = (hold & 0x1f) /*BITS(5)*/ + 1;
            // --- DROPBITS(5) ---//////
            hold >>>= 5;
            bits -= 5;
            // ---//////
            state.ncode = (hold & 0x0f) /*BITS(4)*/ + 4;
            // --- DROPBITS(4) ---//////
            hold >>>= 4;
            bits -= 4;
            // ---//////
            // #ifndef PKZIP_BUG_WORKAROUNDDDDD
            if (state.nlen > 286 || state.ndist > 30)
            {
                strm.msg = 'too many length or distance symbols';
                state.mode = BAD;
                break;
            }
            // #endifffff
            // Tracev((stderr, "inflate:       table sizes ok\n"));;;;;
            state.have = 0;
            state.mode = LENLENS;
        /* falls through */
        case LENLENS:
            while (state.have < state.ncode)
            {
                // === NEEDBITS(3);;;;;
                while (bits < 3)
                {
                    if (have === 0) { break inf_leave; }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                }
                // ===//////
                state.lens[order[state.have++]] = (hold & 0x07); // BITS(3);;;;;
                // --- DROPBITS(3) ---//////
                hold >>>= 3;
                bits -= 3;
                // ---//////
            }
            while (state.have < 19)
            {
                state.lens[order[state.have++]] = 0;
            }
            // We have separate tables & no pointers. 2 commented lines below not needed.
            // state.next = state.codes;;
            // state.lencode = state.next;;
            // Switch to use dynamic table
            state.lencode = state.lendyn;
            state.lenbits = 7;

            opts = { bits: state.lenbits };
            ret = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
            state.lenbits = opts.bits;

            if (ret)
            {
                strm.msg = 'invalid code lengths set';
                state.mode = BAD;
                break;
            }
            // Tracev((stderr, "inflate:       code lengths ok\n"));;
            state.have = 0;
            state.mode = CODELENS;
        /* falls through */
        case CODELENS:
            while (state.have < state.nlen + state.ndist)
            {
                for (;;)
                {
                    here = state.lencode[hold & ((1 << state.lenbits) - 1)]; /*BITS(state.lenbits)*/
                    here_bits = here >>> 24;
                    here_op = (here >>> 16) & 0xff;
                    here_val = here & 0xffff;

                    if ((here_bits) <= bits) { break; }
                    // --- PULLBYTE() ---///
                    if (have === 0) { break inf_leave; }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                    // ---///
                }
                if (here_val < 16)
                {
                    // --- DROPBITS(here.bits) ---///
                    hold >>>= here_bits;
                    bits -= here_bits;
                    // ---///
                    state.lens[state.have++] = here_val;
                }
                else
                {
                    if (here_val === 16)
                    {
                        // === NEEDBITS(here.bits + 2);;
                        n = here_bits + 2;
                        while (bits < n)
                        {
                            if (have === 0) { break inf_leave; }
                            have--;
                            hold += input[next++] << bits;
                            bits += 8;
                        }
                        // ===///
                        // --- DROPBITS(here.bits) ---///
                        hold >>>= here_bits;
                        bits -= here_bits;
                        // ---///
                        if (state.have === 0)
                        {
                            strm.msg = 'invalid bit length repeat';
                            state.mode = BAD;
                            break;
                        }
                        len = state.lens[state.have - 1];
                        copy = 3 + (hold & 0x03); // BITS(2);;
                        // --- DROPBITS(2) ---///
                        hold >>>= 2;
                        bits -= 2;
                        // ---///
                    }
                    else if (here_val === 17)
                    {
                        // === NEEDBITS(here.bits + 3);;
                        n = here_bits + 3;
                        while (bits < n)
                        {
                            if (have === 0) { break inf_leave; }
                            have--;
                            hold += input[next++] << bits;
                            bits += 8;
                        }
                        // ===///
                        // --- DROPBITS(here.bits) ---///
                        hold >>>= here_bits;
                        bits -= here_bits;
                        // ---///
                        len = 0;
                        copy = 3 + (hold & 0x07); // BITS(3);;
                        // --- DROPBITS(3) ---///
                        hold >>>= 3;
                        bits -= 3;
                        // ---///
                    }
                    else
                    {
                        // === NEEDBITS(here.bits + 7);;
                        n = here_bits + 7;
                        while (bits < n)
                        {
                            if (have === 0) { break inf_leave; }
                            have--;
                            hold += input[next++] << bits;
                            bits += 8;
                        }
                        // ===///
                        // --- DROPBITS(here.bits) ---///
                        hold >>>= here_bits;
                        bits -= here_bits;
                        // ---///
                        len = 0;
                        copy = 11 + (hold & 0x7f); // BITS(7);;
                        // --- DROPBITS(7) ---///
                        hold >>>= 7;
                        bits -= 7;
                        // ---///
                    }
                    if (state.have + copy > state.nlen + state.ndist)
                    {
                        strm.msg = 'invalid bit length repeat';
                        state.mode = BAD;
                        break;
                    }
                    while (copy--)
                    {
                        state.lens[state.have++] = len;
                    }
                }
            }

            /* handle error breaks in while */
            if (state.mode === BAD)
            {
                break;
            }

            /* check for end-of-block code (better have one) */
            if (state.lens[256] === 0)
            {
                strm.msg = 'invalid code -- missing end-of-block';
                state.mode = BAD;
                break;
            }

            /* build code tables -- note: do not change the lenbits or distbits
            values here (9 and 6) without reading the comments in inftrees.h
            concerning the ENOUGH Zlibs, which depend on those values */
            state.lenbits = 9;

            opts = { bits: state.lenbits };
            ret = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
            // We have separate tables & no pointers. 2 commented lines below not needed.
            // state.next_index = opts.table_index;
            state.lenbits = opts.bits;
            // state.lencode = state.next;

            if (ret)
            {
                strm.msg = 'invalid literal/lengths set';
                state.mode = BAD;
                break;
            }

            state.distbits = 6;
            // state.distcode.copy(state.codes);;
            // Switch to use dynamic table
            state.distcode = state.distdyn;
            opts = { bits: state.distbits };
            ret = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
            // We have separate tables & no pointers. 2 commented lines below not needed.
            // state.next_index = opts.table_index;
            state.distbits = opts.bits;
            // state.distcode = state.next;

            if (ret)
            {
                strm.msg = 'invalid distances set';
                state.mode = BAD;
                break;
            }
            // Tracev((stderr, 'inflate:       codes ok\n'));;
            state.mode = LEN_;
            if (flush === Zlib.Z_TREES)
            {
                break inf_leave;
            }
        /* falls through */
        case LEN_:
            state.mode = LEN;
        /* falls through */
        case LEN:
            if (have >= 6 && left >= 258)
            {
                // --- RESTORE() ----
                strm.next_out_position = put;
                strm.avail_out = left;
                strm.next_in_position = next;
                strm.avail_in = have;
                state.hold = hold;
                state.bits = bits;
                // ----
                inflate_fast(strm, _out);
                // --- LOAD() ----
                put = strm.next_out_position;
                output = strm.next_out;
                left = strm.avail_out;
                next = strm.next_in_position;
                input = strm.next_in;
                have = strm.avail_in;
                hold = state.hold;
                bits = state.bits;
                // ----

                if (state.mode === TYPE)
                {
                    state.back = -1;
                }
                break;
            }
            state.back = 0;
            for (;;)
            {
                here = state.lencode[hold & ((1 << state.lenbits) - 1)];  /*BITS(state.lenbits)*/
                here_bits = here >>> 24;
                here_op = (here >>> 16) & 0xff;
                here_val = here & 0xffff;

                if (here_bits <= bits) { break; }
                // --- PULLBYTE() ---///
                if (have === 0) { break inf_leave; }
                have--;
                hold += input[next++] << bits;
                bits += 8;
                // ---///
            }
            if (here_op && (here_op & 0xf0) === 0)
            {
                last_bits = here_bits;
                last_op = here_op;
                last_val = here_val;
                for (;;)
                {
                    here = state.lencode[last_val +
                    ((hold & ((1 << (last_bits + last_op)) - 1))     /*BITS(last.bits + last.op)*/ >> last_bits)];
                    here_bits = here >>> 24;
                    here_op = (here >>> 16) & 0xff;
                    here_val = here & 0xffff;

                    if ((last_bits + here_bits) <= bits) { break; }
                    // --- PULLBYTE() ---///
                    if (have === 0) { break inf_leave; }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                    // ---///
                }
                // --- DROPBITS(last.bits) ---///
                hold >>>= last_bits;
                bits -= last_bits;
                // ---///
                state.back += last_bits;
            }
            // --- DROPBITS(here.bits) ---///
            hold >>>= here_bits;
            bits -= here_bits;
            // ---///
            state.back += here_bits;
            state.length = here_val;
            if (here_op === 0)
            {
                // Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ??
                //        "inflate:         literal '%c'\n" :
                //        "inflate:         literal 0x%02x\n", here.val));
                state.mode = LIT;
                break;
            }
            if (here_op & 32)
            {
                // Tracevv((stderr, "inflate:         end of block\n"));;
                state.back = -1;
                state.mode = TYPE;
                break;
            }
            if (here_op & 64)
            {
                strm.msg = 'invalid literal/length code';
                state.mode = BAD;
                break;
            }
            state.extra = here_op & 15;
            state.mode = LENEXT;
        /* falls through */
        case LENEXT:
            if (state.extra)
            {
                // === NEEDBITS(state.extra);;
                n = state.extra;
                while (bits < n)
                {
                    if (have === 0) { break inf_leave; }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                }
                // ===///
                state.length += hold & ((1 << state.extra) - 1)/*BITS(state.extra)*/;
                // --- DROPBITS(state.extra) ---///
                hold >>>= state.extra;
                bits -= state.extra;
                // ---///
                state.back += state.extra;
            }
            // Tracevv((stderr, "inflate:         length %u\n", state.length));;
            state.was = state.length;
            state.mode = DIST;
        /* falls through */
        case DIST:
            for (;;)
            {
                here = state.distcode[hold & ((1 << state.distbits) - 1)]; /*BITS(state.distbits)*/
                here_bits = here >>> 24;
                here_op = (here >>> 16) & 0xff;
                here_val = here & 0xffff;

                if ((here_bits) <= bits)
                {
                    break;
                }
                // --- PULLBYTE() ---///
                if (have === 0) { break inf_leave; }
                have--;
                hold += input[next++] << bits;
                bits += 8;
                // ---///
            }

            if ((here_op & 0xf0) === 0)
            {
                last_bits = here_bits;
                last_op = here_op;
                last_val = here_val;
                for (;;)
                {
                    here = state.distcode[last_val +
                    ((hold & ((1 << (last_bits + last_op)) - 1))     /*BITS(last.bits + last.op)*/ >> last_bits)];
                    here_bits = here >>> 24;
                    here_op = (here >>> 16) & 0xff;
                    here_val = here & 0xffff;

                    if ((last_bits + here_bits) <= bits) { break; }
                    // --- PULLBYTE() ---///
                    if (have === 0) { break inf_leave; }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                    // ---///
                }
                // --- DROPBITS(last.bits) ---///
                hold >>>= last_bits;
                bits -= last_bits;
                // ---///
                state.back += last_bits;
            }
            // --- DROPBITS(here.bits) ---///
            hold >>>= here_bits;
            bits -= here_bits;
            // ---///
            state.back += here_bits;
            if (here_op & 64)
            {
                strm.msg = 'invalid distance code';
                state.mode = BAD;
                break;
            }
            state.offset = here_val;
            state.extra = (here_op) & 15;
            state.mode = DISTEXT;
        /* falls through */
        case DISTEXT:
            if (state.extra)
            {
                // === NEEDBITS(state.extra);;
                n = state.extra;
                while (bits < n)
                {
                    if (have === 0) { break inf_leave; }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                }
                // ===///
                state.offset += hold & ((1 << state.extra) - 1)/*BITS(state.extra)*/;
                // --- DROPBITS(state.extra) ---///
                hold >>>= state.extra;
                bits -= state.extra;
                // ---///
                state.back += state.extra;
            }
            // #ifdef INFLATE_STRICTT
            if (state.offset > state.dmax)
            {
                strm.msg = 'invalid distance too far back';
                state.mode = BAD;
                break;
            }
            // #endiff
            // Tracevv((stderr, "inflate:         distance %u\n", state.offset));;
            state.mode = MATCH;
        /* falls through */
        case MATCH:
            if (left === 0) { break inf_leave; }
            copy = _out - left;
            if (state.offset > copy)
            {         /* copy from window */
                copy = state.offset - copy;
                if (copy > state.whave)
                {
                    if (state.sane)
                    {
                        strm.msg = 'invalid distance too far back';
                        state.mode = BAD;
                        break;
                    }
                    // (!) This block is disabled in zlib defaults,
                    // don't enable it for binary compatibility
                    // #ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRRR
                    //          Trace((stderr, "inflate.c too far\n"));
                    //          copy -= state.whave;
                    //          if (copy > state.length) { copy = state.length; }
                    //          if (copy > left) { copy = left; }
                    //          left -= copy;
                    //          state.length -= copy;
                    //          do {
                    //            output[put++] = 0;
                    //          } while (--copy);
                    //          if (state.length === 0) { state.mode = LEN; }
                    //          break;
                    // #endiff
                }
                if (copy > state.wnext)
                {
                    copy -= state.wnext;
                    from = state.wsize - copy;
                }
                else
                {
                    from = state.wnext - copy;
                }
                if (copy > state.length)
                {
                    copy = state.length;
                }
                from_source = state.window;
            }
            else
            {                              /* copy from output */
                from_source = output;
                from = put - state.offset;
                copy = state.length;
            }

            if (copy > left)
            {
                copy = left;
            }
            left -= copy;
            state.length -= copy;

            do
            {
                output[put++] = from_source[from++];
            } while (--copy);

            if (state.length === 0)
            {
                state.mode = LEN;
            }
            break;

        case LIT:
            if (left === 0)
            {
                break inf_leave;
            }
            output[put++] = state.length;
            left--;
            state.mode = LEN;
            break;

        case CHECK:
            if (state.wrap)
            {
            // === NEEDBITS(32);;
            while (bits < 32)
            {
                if (have === 0) { break inf_leave; }
                have--;
                // Use '|' instead of '+' to make sure that result is signed
                hold |= input[next++] << bits;
                bits += 8;
            }
            // ===///
            _out -= left;
            strm.total_out += _out;
            state.total += _out;
            if (_out)
            {
                /*UPDATE(state.check, put - _out, _out);*/
                strm.adler = state.check = state.flags ?
                    THashCrc32b.Update(state.check, output, _out, put - _out) :
                    THashAdler32.Update(state.check, output, _out, put - _out);

            }
            _out = left;
            // NB: crc32 stored as signed 32-bit int, zswap32 returns signed too
            if ((state.flags ? hold : Endianness.Swap32(hold)) !== state.check)
            {
                strm.msg = 'incorrect data check';
                state.mode = BAD;
                break;
            }
            // === INITBITS();;
            hold = 0;
            bits = 0;
            // ===///
            // Tracev((stderr, "inflate:   check matches trailer\n"));;
            }
            state.mode = LENGTH;
        /* falls through */
        case LENGTH:
            if (state.wrap && state.flags)
            {
            // === NEEDBITS(32);;
            while (bits < 32)
            {
                if (have === 0) { break inf_leave; }
                have--;
                hold += input[next++] << bits;
                bits += 8;
            }
            // ===///
            if (hold !== (state.total & 0xffffffff))
            {
                strm.msg = 'incorrect length check';
                state.mode = BAD;
                break;
            }
            // === INITBITS();;
            hold = 0;
            bits = 0;
            // ===///
            // Tracev((stderr, "inflate:   length matches trailer\n"));;
            }
            state.mode = DONE;
        /* falls through */
        case DONE:
            ret = Zlib.Z_STREAM_END;
            break inf_leave;
        case BAD:
            ret = Zlib.Z_DATA_ERROR;
            break inf_leave;
        case MEM:
            return Zlib.Z_MEM_ERROR;
        case SYNC:
        /* falls through */
        default:
            return Zlib.Z_STREAM_ERROR;
        }
    }

    // inf_leave <- here is real place for "goto inf_leave", emulated via "break inf_leave"

    /*
        Return from inflate(), updating the total counts and the check value.
        If there was no progress during the inflate() call, return a buffer
        error.  Call updatewindow() to create and/or update the window state.
        Note: a memory error from inflate() is non-recoverable.
    */

    // --- RESTORE() ----
    strm.next_out_position = put;
    strm.avail_out = left;
    strm.next_in_position = next;
    strm.avail_in = have;
    state.hold = hold;
    state.bits = bits;
    // ----

    if (state.wsize || (_out !== strm.avail_out && state.mode < BAD &&
        (state.mode < CHECK || flush !== Zlib.Z_FINISH)))
    {
        if (updatewindow(strm, strm.next_out, strm.next_out_position, _out - strm.avail_out))
        {
            state.mode = MEM;
            return Zlib.Z_MEM_ERROR;
        }
    }
    _in -= strm.avail_in;
    _out -= strm.avail_out;
    strm.total_in += _in;
    strm.total_out += _out;
    state.total += _out;
    if (state.wrap && _out)
    {
        /*UPDATE(state.check, strm.next_out_position - _out, _out);*/
        strm.adler = state.check = state.flags ?
            THashCrc32b.Update(state.check, output, _out, strm.next_out_position - _out) :
            THashAdler32.Update(state.check, output, _out, strm.next_out_position - _out);
    }
    strm.data_type = state.bits + (state.last ? 64 : 0) +
        (state.mode === TYPE ? 128 : 0) +
        (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);

    if (((_in === 0 && _out === 0) || flush === Zlib.Z_FINISH) && ret === Zlib.Z_OK)
    {
        ret = Zlib.Z_BUF_ERROR;
    }
    return ret;
}

export function inflateEnd(strm: z_stream): number
{
    if (! strm || ! strm.state /*|| strm->zfree == (free_func)0*/)
    {
        return Zlib.Z_STREAM_ERROR;
    }

    const state: inflate_state = strm.state as inflate_state;
    if (state.window)
    {
        state.window = null;
    }
    strm.state = null;
    return Zlib.Z_OK;
}

export function inflateGetHeader(strm: z_stream, head: gz_header_s): number
{
    let state: inflate_state;

    /* check state */
    if ( ! strm || ! strm.state)
    {
        return Zlib.Z_STREAM_ERROR;
    }

    state = strm.state as inflate_state;
    if ((state.wrap & 2) === 0)
    {
        return Zlib.Z_STREAM_ERROR;
    }

    /* save header structure */
    state.head = head;
    head.done = false;
    return Zlib.Z_OK;
}

export function inflateSetDictionary(strm: z_stream, dictionary: Uint8Array): number
{
    const dictLength = dictionary.length;

    let state: inflate_state;
    let dictid: number;
    let ret: number;

    /* check state */
    if (! strm /* == Z_NULL */ || ! strm.state /* == Z_NULL */) { return Zlib.Z_STREAM_ERROR; }
    state = strm.state as inflate_state;

    if (state.wrap !== 0 && state.mode !== DICT)
        return Zlib.Z_STREAM_ERROR;

    /* check for correct dictionary identifier */
    if (state.mode === DICT)
    {
        dictid = THashAdler32.Update(0, null);
        dictid = THashAdler32.Update(dictid, dictionary, dictLength);

        if (dictid !== state.check)
            return Zlib.Z_DATA_ERROR;
    }
    /* copy dictionary to window using updatewindow(), which will amend the
    existing dictionary if appropriate */
    ret = updatewindow(strm, dictionary, dictLength, dictLength);
    if (ret)
    {
        state.mode = MEM;
        return Zlib.Z_MEM_ERROR;
    }
    state.havedict = 1;
    // Tracev((stderr, "inflate:   dictionary set\n"));
    return Zlib.Z_OK;
}

/* Not implemented
exports.inflateCopy = inflateCopy;
exports.inflateGetDictionary = inflateGetDictionary;
exports.inflateMark = inflateMark;
exports.inflatePrime = inflatePrime;
exports.inflateSync = inflateSync;
exports.inflateSyncPoint = inflateSyncPoint;
exports.inflateUndermine = inflateUndermine;
*/
