import {UITypes} from '../../../UltraCreation/Graphic';

export interface ICoordinate
{
    readonly Canvas: HTMLCanvasElement;
    readonly Ctx: CanvasRenderingContext2D;

    readonly Viewport: IViewport;
    readonly ContainerRect: ClientRect;
    readonly CellSize: UITypes.ISize;

    TextAttr: UITypes.TTextAttr;
    AxisX: TAxis;
    AxisY: TAxis;
    DataSource: Array<UITypes.IPosition>;

    readonly Serials: Array<TSerial>;

    ValueToPixel(value: UITypes.IPosition): UITypes.IPosition;
}

export interface IViewport
{
    VisiableCountX?: number;
    VisiableCountY?: number;
}

export class TAxis
{
    constructor (public Min: number, public Max: number, public Step: number)
    {
    }

    TextAttr = new UITypes.TTextAttr();

    get StepCount(): number
    {
        return Math.trunc((this.Max - this.Min) / this.Step);
    }

    UpdateParams(...argv: any[])
    {
    }

    Label(Value: number): string
    {
        // return (this.Min + Value).toString();
        return '';
    }

    Normalized(Value: number): number
    {
        return (Value - this.Min) / Math.abs(this.Max - this.Min);
    }
}

export abstract class TSerial
{
    DataSource?: Array<UITypes.IPosition>;
    TextAttr = new UITypes.TTextAttr();

    abstract Paint(Coord: ICoordinate): void;
}
