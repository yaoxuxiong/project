/** from zutils.h */

import {Z_NEED_DICT} from './Constant/zlib';

/* The three kinds of block type */
export const STORED_BLOCK               = 0;
export const STATIC_TREES               = 1;
export const DYN_TREES                  = 2;

/* The minimum and maximum match lengths */
export const MIN_MATCH                  = 3;
export const MAX_MATCH                  = 258;

 /* preset dictionary flag in zlib header */
export const PRESET_DICT                = 0x20;

const z_errmsg = [
    'need dictionary',                  /* Z_NEED_DICT       2  */
    'stream end',                       /* Z_STREAM_END      1  */
    '',                                 /* Z_OK              0  */
    'file error',                       /* Z_ERRNO         (-1) */
    'stream error',                     /* Z_STREAM_ERROR  (-2) */
    'data error',                       /* Z_DATA_ERROR    (-3) */
    'insufficient memory',              /* Z_MEM_ERROR     (-4) */
    'buffer error',                     /* Z_BUF_ERROR     (-5) */
    'incompatible version',             /* Z_VERSION_ERROR (-6) */
    ''
];

export function ERR_MSG(err: number): string
{
    return z_errmsg[Z_NEED_DICT - err];
}
