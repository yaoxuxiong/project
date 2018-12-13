import {Z_UNKNOWN} from '../Constant/zlib';

// tslint:disable-next-line:class-name
export class z_stream
{
    /* next input byte */
    next_in: Uint8Array = null;
    // next_in_position of JS
    next_in_position: number = 0;
    /* number of bytes available at input */
    avail_in: number = 0;
    /* total number of input bytes read so far */
    total_in: number = 0;

    /* next output byte will go here */
    next_out: Uint8Array = null;
    // next_in_position of JS
    next_out_position: number = 0;
    /* remaining free space at output */
    avail_out: number = 0;
    /* total number of bytes output so far */
    total_out: number = 0;

    /* last error message, NULL if no error */
    msg: string = ''/*Z_NULL*/;
    /* not visible by applications */
    state: any = null;  // deflate_state | Iinflate_state;

    /* best guess about the data type: binary or text */
    data_type: number = Z_UNKNOWN;

    /* adler32 / crc32 value of the uncompressed data */
    adler: number = 0;
}

// tslint:disable-next-line:class-name
export class gz_header_s
{
    /* true if compressed data believed to be text */
    text: number = 0;
    /* modification time */
    time: number = 0;
    /* extra flags (not used when writing a gzip file) */
    xflags: number = 0;
    /* operating system */
    os: number = 0;
    /* pointer to extra field or Z_NULL if none */
    extra: Uint8Array = null;
    /* extra field length (valid if extra != Z_NULL) */
    extra_len: number = 0; // Actually, we don't need it in JS,
    // but leave for few code modifications

    //
    // Setup limits is not necessary because in js we should not preallocate memory
    // for inflate use constant limit in 65536 bytes
    //

    /* space at extra (only when reading header) */
    // extra_max  = 0;
    /* pointer to zero-terminated file name or Z_NULL */
    name: string = '';
    /* space at name (only when reading header) */
    // name_max   = 0;
    /* pointer to zero-terminated comment or Z_NULL */
    comment: string = '';
    /* space at comment (only when reading header) */
    // comm_max   = 0;
    /* true if there was or will be a header crc */
    hcrc: number = 0;
    /* true when done reading gzip header (not used when writing a gzip file) */
    done: boolean = false;
}
