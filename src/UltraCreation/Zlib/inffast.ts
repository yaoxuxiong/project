import {z_stream} from './Types/zlib';
import {inflate_state} from './inflate';

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

// See state defs from inflate.js
const BAD = 30;       /* got a data error -- remain here until reset */
const TYPE = 12;      /* i: waiting for type bits, including last-flag bit */

/*
   Decode literal, length, and distance codes and write out the resulting
   literal and match bytes until either not enough input or output is
   available, an end-of-block is encountered, or a data error is encountered.
   When large enough input and output buffers are supplied to inflate(), for
   example, a 16K input buffer and a 64K output buffer, more than 95% of the
   inflate execution time is spent in this routine.

   Entry assumptions:

        state.mode === LEN
        strm.avail_in >= 6
        strm.avail_out >= 258
        start >= strm.avail_out
        state.bits < 8

   On return, state.mode is one of:

        LEN -- ran out of enough output space or enough available input
        TYPE -- reached end of block code, inflate() to interpret next block
        BAD -- error in block data

   Notes:

    - The maximum input bits used by a length/distance pair is 15 bits for the
      length code, 5 bits for the length extra, 15 bits for the distance code,
      and 13 bits for the distance extra.  This totals 48 bits, or six bytes.
      Therefore if strm.avail_in >= 6, then there is enough input to avoid
      checking for available input while decoding.

    - The maximum bytes that a single length/distance pair can output is 258
      bytes, which is the maximum length that can be coded.  inflate_fast()
      requires strm.avail_out >= 258 for each loop to avoid checking for
      output space.
 */
function inflate_fast(strm: z_stream, start: number): void
{
    let state: inflate_state;
    let in_position: number;            /* local strm.next_in */
    let input: Uint8Array;
    let last: number;                   /* have enough input while in < last */

    let out_position: number;           /* local strm.next_out */
    let output: Uint8Array;

    let beg: number;                    /* inflate()'s initial strm.next_out */
    let end: number;                    /* while out < end, enough space available */
    // #ifdef INFLATE_STRICT
    let dmax: number;                   /* maximum distance from zlib header */
    // #endif
    let wsize: number;                  /* window size or zero if not using window */
    let whave: number;                  /* valid bytes in the window */
    let wnext: number;                  /* window write index */
    // Use `s_window` instead `window`, avoid conflict with instrumentation tools
    let s_window: Uint8Array;           /* allocated sliding window, if wsize != 0 */
    let hold: number;                   /* local strm.hold */
    let bits: number;                   /* local strm.bits */
    let lcode: Int32Array;              /* local strm.lencode */
    let dcode: Int32Array;              /* local strm.distcode */
    let lmask: number;                  /* mask for first level of length codes */
    let dmask: number;                  /* mask for first level of distance codes */
    let here: number;                   /* retrieved table entry */
    let op: number;                     /* code bits, operation, extra bits, or */
    /*  window position, window bytes to copy */
    let len: number;                    /* match length, unused bytes */
    let dist: number;                   /* match distance */
    let from: number;                   /* where to copy match from */
    let from_source: Uint8Array;


    /* copy state to local variables */
    state = strm.state as inflate_state;
    // here = state.here;
    in_position = strm.next_in_position;
    input = strm.next_in;
    last = in_position + (strm.avail_in - 5);
    out_position = strm.next_out_position;
    output = strm.next_out;
    beg = out_position - (start - strm.avail_out);
    end = out_position + (strm.avail_out - 257);
    // #ifdef INFLATE_STRICT
    dmax = state.dmax;
    // #endif
    wsize = state.wsize;
    whave = state.whave;
    wnext = state.wnext;
    s_window = state.window;
    hold = state.hold;
    bits = state.bits;
    lcode = state.lencode;
    dcode = state.distcode;
    lmask = (1 << state.lenbits) - 1;
    dmask = (1 << state.distbits) - 1;

    /* decode literals and length/distances until end-of-block or not enough
       input data or output space */
    top:
    do
    {
        if (bits < 15)
        {
            hold += input[in_position++] << bits;
            bits += 8;
            hold += input[in_position++] << bits;
            bits += 8;
        }

        here = lcode[hold & lmask];

        dolen:
        for (; ;)
        { // Goto emulation
            op = here >>> 24/*here.bits*/;
            hold >>>= op;
            bits -= op;
            op = (here >>> 16) & 0xff/*here.op*/;
            if (op === 0)
            {                          /* literal */
                // Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
                //        "inflate:         literal '%c'\n" :
                //        "inflate:         literal 0x%02x\n", here.val));
                output[out_position++] = here & 0xffff/*here.val*/;
            }
            else if (op & 16)
            {                     /* length base */
                len = here & 0xffff/*here.val*/;
                op &= 15;                           /* number of extra bits */
                if (op)
                {
                    if (bits < op)
                    {
                        hold += input[in_position++] << bits;
                        bits += 8;
                    }
                    len += hold & ((1 << op) - 1);
                    hold >>>= op;
                    bits -= op;
                }
                // Tracevv((stderr, "inflate:         length %u\n", len));
                if (bits < 15)
                {
                    hold += input[in_position++] << bits;
                    bits += 8;
                    hold += input[in_position++] << bits;
                    bits += 8;
                }
                here = dcode[hold & dmask];

                dodist:
                for (; ;)
                { // goto emulation
                    op = here >>> 24/*here.bits*/;
                    hold >>>= op;
                    bits -= op;
                    op = (here >>> 16) & 0xff/*here.op*/;

                    if (op & 16)
                    {                      /* distance base */
                        dist = here & 0xffff/*here.val*/;
                        op &= 15;                       /* number of extra bits */
                        if (bits < op)
                        {
                            hold += input[in_position++] << bits;
                            bits += 8;
                            if (bits < op)
                            {
                                hold += input[in_position++] << bits;
                                bits += 8;
                            }
                        }
                        dist += hold & ((1 << op) - 1);
                        // #ifdef INFLATE_STRICT
                        if (dist > dmax)
                        {
                            strm.msg = 'invalid distance too far back';
                            state.mode = BAD;
                            break top;
                        }
                        // #endif
                        hold >>>= op;
                        bits -= op;
                        // Tracevv((stderr, "inflate:         distance %u\n", dist));
                        op = out_position - beg;                /* max distance in output */
                        if (dist > op)
                        {
                            /* see if copy from window */
                            op = dist - op;               /* distance back in window */
                            if (op > whave)
                            {
                                if (state.sane)
                                {
                                    strm.msg = 'invalid distance too far back';
                                    state.mode = BAD;
                                    break top;
                                }
                                // (!) This block is disabled in zlib defaults,
                                // don't enable it for binary compatibility
                                // #ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
                                //                if (len <= op - whave) {
                                //                  do {
                                //                    output[out_position++] = 0;
                                //                  } while (--len);
                                //                  continue top;
                                //                }
                                //                len -= op - whave;
                                //                do {
                                //                  output[out_position++] = 0;
                                //                } while (--op > whave);
                                //                if (op === 0) {
                                //                  from = out_position - dist;
                                //                  do {
                                //                    output[out_position++] = output[from++];
                                //                  } while (--len);
                                //                  continue top;
                                //                }
                                // #endif
                            }
                            from = 0; // window index
                            from_source = s_window;
                            if (wnext === 0)
                            {           /* very common case */
                                from += wsize - op;
                                if (op < len)
                                {         /* some from window */
                                    len -= op;
                                    do
                                    {
                                        output[out_position++] = s_window[from++];
                                    } while (--op);
                                    from = out_position - dist;  /* rest from output */
                                    from_source = output;
                                }
                            }
                            else if (wnext < op)
                            {      /* wrap around window */
                                from += wsize + wnext - op;
                                op -= wnext;
                                if (op < len)
                                {         /* some from end of window */
                                    len -= op;
                                    do
                                    {
                                        output[out_position++] = s_window[from++];
                                    } while (--op);
                                    from = 0;
                                    if (wnext < len)
                                    {  /* some from start of window */
                                        op = wnext;
                                        len -= op;
                                        do
                                        {
                                            output[out_position++] = s_window[from++];
                                        } while (--op);
                                        from = out_position - dist;      /* rest from output */
                                        from_source = output;
                                    }
                                }
                            }
                            else
                            {                      /* contiguous in window */
                                from += wnext - op;
                                if (op < len)
                                {         /* some from window */
                                    len -= op;
                                    do
                                    {
                                        output[out_position++] = s_window[from++];
                                    } while (--op);
                                    from = out_position - dist;  /* rest from output */
                                    from_source = output;
                                }
                            }
                            while (len > 2)
                            {
                                output[out_position++] = from_source[from++];
                                output[out_position++] = from_source[from++];
                                output[out_position++] = from_source[from++];
                                len -= 3;
                            }
                            if (len)
                            {
                                output[out_position++] = from_source[from++];
                                if (len > 1)
                                {
                                    output[out_position++] = from_source[from++];
                                }
                            }
                        }
                        else
                        {
                            from = out_position - dist;          /* copy direct from output */
                            do
                            {                        /* minimum length is three */
                                output[out_position++] = output[from++];
                                output[out_position++] = output[from++];
                                output[out_position++] = output[from++];
                                len -= 3;
                            } while (len > 2);
                            if (len)
                            {
                                output[out_position++] = output[from++];
                                if (len > 1)
                                {
                                    output[out_position++] = output[from++];
                                }
                            }
                        }
                    }
                    else if ((op & 64) === 0)
                    {          /* 2nd level distance code */
                        here = dcode[(here & 0xffff) /*here.val*/ + (hold & ((1 << op) - 1))];
                        continue dodist;
                    }
                    else
                    {
                        strm.msg = 'invalid distance code';
                        state.mode = BAD;
                        break top;
                    }

                    break; // need to emulate goto via "continue"
                }
            }
            else if ((op & 64) === 0)
            {              /* 2nd level length code */
                here = lcode[(here & 0xffff) /*here.val*/ + (hold & ((1 << op) - 1))];
                continue dolen;
            }
            else if (op & 32)
            {                     /* end-of-block */
                // Tracevv((stderr, "inflate:         end of block\n"));
                state.mode = TYPE;
                break top;
            }
            else
            {
                strm.msg = 'invalid literal/length code';
                state.mode = BAD;
                break top;
            }

            break; // need to emulate goto via "continue"
        }
    } while (in_position < last && out_position < end);

    /* return unused bytes (on entry, bits < 8, so in won't go too far back) */
    len = bits >> 3;
    in_position -= len;
    bits -= len << 3;
    hold &= (1 << bits) - 1;

    /* update state and return */
    strm.next_in_position = in_position;
    strm.next_out_position = out_position;
    strm.avail_in = (in_position < last ? 5 + (last - in_position) : 5 - (in_position - last));
    strm.avail_out = (out_position < end ? 257 + (end - out_position) : 257 - (out_position - end));
    state.hold = hold;
    state.bits = bits;
    return;
}

export default inflate_fast;
