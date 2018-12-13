import {TypeInfo} from './TypeInfo';

export class TLoopBuffer
{
    constructor(Size: number)
    {
        this.ReadIndex = this.WriteIndex = 0;
        this._Memory = new Uint8Array(Size);
    }

    get Size(): number
    {
        return this._Memory.byteLength;
    }

    get Count(): number
    {
        return (this.WriteIndex + this._Memory.byteLength - this.ReadIndex) % this._Memory.byteLength;
    }

    get Avail(): number
    {
        // mod loopbuffer method, avail element should be -1
        return this._Memory.byteLength - this.Count - 1;
    }

    get IsEmpty(): boolean
    {
        return this.ReadIndex === this.WriteIndex;
    }

    get IsFull(): boolean
    {
        return (this.WriteIndex + 1) % this._Memory.byteLength === this.ReadIndex;
    }

    get Memory(): ArrayBuffer
    {
        return this._Memory.buffer;
    }

    Clear(): void
    {
        this.ReadIndex = this.WriteIndex = 0;
    }

    Push(Buf: Uint8Array | ArrayBuffer, Count?: number): boolean
    {
        if (! TypeInfo.Assigned(Count) || Count > Buf.byteLength)
            Count = Buf.byteLength;
        if (Buf instanceof ArrayBuffer)
            Buf = new Uint8Array(Buf, 0, Count);

        if (Count > this.Avail)
            return false;

        let RightSize = this._Memory.byteLength - this.WriteIndex;
        RightSize = RightSize > Count ? Count : RightSize;

        // fill right side of buffer
        let src = new Uint8Array(Buf.buffer, Buf.byteOffset, RightSize);
        this._Memory.set(src, this.WriteIndex);
        // fill left side of buffer
        if (RightSize !== Count)
        {
            src = new Uint8Array(Buf.buffer, Buf.byteOffset + RightSize, Count - RightSize);
            this._Memory.set(src);
        }
        // update write index
        this.WriteIndex = (this.WriteIndex + Count) % this._Memory.byteLength;

        return true;
    }

    ExtractTo(Buf: Uint8Array | ArrayBuffer, Count?: number): number
    {
        if (! TypeInfo.Assigned(Count) || Count > Buf.byteLength)
            Count = Buf.byteLength;
        if (Buf instanceof ArrayBuffer)
            Buf = new Uint8Array(Buf, 0, Count);

        Count = Count > this.Count ? this.Count : Count;

        if (Count > 0)
        {
            let RightSize = this._Memory.byteLength - this.ReadIndex;
            RightSize = RightSize > Count ? Count : RightSize;

            // extract right side of buffer
            let src = new Uint8Array(this._Memory.buffer, this.ReadIndex, RightSize);
            Buf.set(src);

            // extract left side of buffer
            if (RightSize !== Count)
            {
                src = new Uint8Array(this._Memory.buffer, 0, Count - RightSize);
                Buf.set(src, RightSize);
            }
            // update read index
            this.ReadIndex = (this.ReadIndex + Count) % this._Memory.byteLength;
        }
        return Count;
    }

    Extract(Count: number): Uint8Array
    {
        Count = Count > this.Count ? this.Count : Count;
        if (Count === 0)
            return new Uint8Array(0);

        const Buf = new Uint8Array(Count);
        this.ExtractTo(Buf);
        return Buf;
    }

    private _Memory: Uint8Array;
    private ReadIndex: number;
    private WriteIndex: number;
}
