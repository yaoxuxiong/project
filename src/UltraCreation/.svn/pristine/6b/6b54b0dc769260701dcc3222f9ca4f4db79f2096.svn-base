import {TypeInfo} from '../Core/TypeInfo';

/* Position(3D) */

export interface IPosition
{
    X: number;
    Y: number;
}

export class TPosition implements IPosition
{
    X: number;
    Y: number;
}

export interface IPosition3D extends IPosition
{
    Z: number;
}

export class TPosition3D extends TPosition implements IPosition3D
{
    Z: number;
}

/* Size(3D) */

export interface ISize
{
    Width: number;
    Height: number;
}

export class TSize implements ISize
{
    Width: number;
    Height: number;
}

export interface ISize3D extends ISize
{
    Depth: number;
}

export class TSize3D extends TSize implements ISize3D
{
    Depth: number;
}

/* TFont */

export enum TFontStyle {Normal, Italic, Oblique}
export enum TFontWeight {Normal, Bold, Bolder, Lighter}
export enum TFontVariant {Normal, SmallCaps}

export class TFont
{
    constructor(Family: string, Size?: number, Style?: TFontStyle, Weight?: TFontWeight, Variant?: TFontVariant)
    constructor(Ref: TFont)
    constructor(FamilyOrRef: string | TFont, Size?: number, Style?: TFontStyle, Weight?: TFontWeight, Variant?: TFontVariant)
    {
        if (FamilyOrRef instanceof TFont)
        {
            this.Family = FamilyOrRef.Family;
            this.Size = FamilyOrRef.Size;
            this.Style = FamilyOrRef.Style;
            this.Weight = FamilyOrRef.Weight;
            this.Variant = FamilyOrRef.Variant;
        }
        else
            this.Family = FamilyOrRef;

        if (TypeInfo.Assigned(Size))
            this.Size = Size;
        if (TypeInfo.Assigned(Style))
            this.Style = Style;
        if (TypeInfo.Assigned(Weight))
            this.Weight = Weight;
        if (TypeInfo.Assigned(Variant))
            this.Variant = Variant;
    }

    toString(): string
    {
        let Font: string = '';

        switch (this.Style)
        {
        case TFontStyle.Italic:
            Font += 'italic ';
            break;
        case TFontStyle.Oblique:
            Font += 'oblique ';
            break;
        /*
        case TFontStyle.Normal:
            break;
        */
        }

        switch (this.Weight)
        {
        case TFontWeight.Bold:
            Font += 'bold ';
            break;
        case TFontWeight.Bolder:
            Font += 'bolder ';
            break;
        case TFontWeight.Lighter:
            Font += 'lighter ';
            break;
        /*
        case TFontWeight.Normal:
            break;
        */
        }

        switch (this.Variant)
        {
        case TFontVariant.SmallCaps:
            Font += 'small-caps ';
        }

        // assume Size is point its fixed at 72 DPI
        // screen is fixed 96 DPI
        const Ratio = TypeInfo.Assigned(window.devicePixelRatio) ? window.devicePixelRatio : 1;
        Font += Math.trunc(this.Size * 96 * Ratio / 72) + 'px ' + this.Family;

        return Font;
    }

    Family: string;
    Size: number = 12;

    Style: TFontStyle;
    Weight: TFontWeight;
    Variant: TFontVariant;
}
