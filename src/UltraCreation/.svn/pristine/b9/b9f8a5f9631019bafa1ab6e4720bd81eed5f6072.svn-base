import * as zlib from '.';
import {TUtf8Encoding} from '../Encoding/Utf8';
import {HexConv} from '../Core/Conv';

const str = `12345678901234567890`;

const a = TUtf8Encoding.Encode(str);
console.log('string size is: ' + a.byteLength);

const b = new Uint8Array(a.byteLength);
const c = new Uint8Array(a.byteLength);

const d_stream = new zlib.z_stream();

d_stream.avail_in = a.byteLength;
d_stream.next_in = a;

d_stream.avail_out = b.byteLength;
d_stream.next_out = b;

console.log('init: ' + zlib.deflateInit(d_stream, zlib.Z_BEST_COMPRESSION));
console.log('deflate: ' + zlib.deflate(d_stream, zlib.Z_FINISH));
console.log('end: ' + zlib.deflateEnd(d_stream));
console.log('compress size is: ' + d_stream.total_out);
console.log('uncompress hash(   when compress): ' + HexConv.IntToHex(d_stream.adler, 8));

const i_stream = new zlib.z_stream();

i_stream.avail_in = d_stream.total_out;
i_stream.next_in = b;

i_stream.avail_out = c.byteLength;
i_stream.next_out = c;

zlib.inflateInit(i_stream);
zlib.inflate(i_stream, zlib.Z_NO_FLUSH);
zlib.inflateEnd(i_stream);
console.log('uncompress size is: ' + i_stream.total_out);
console.log('uncompress hash(after decompress): ' + HexConv.IntToHex(i_stream.adler, 8));
