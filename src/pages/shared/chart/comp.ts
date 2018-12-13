import {Component, ViewChild, ElementRef, OnInit, OnDestroy, Input} from '@angular/core';

import {TypeInfo} from '../../../UltraCreation/Core/TypeInfo';
import {UITypes} from '../../../UltraCreation/Graphic';
// import {ICoordinate, TSerial, TAxis, IViewport} from './intf';

@Component({selector: 'chart', template: `
    <div #container style="overflow-x: auto;">
        <canvas #canvas style="height:100%;" (click)=Canvasclick($event) ></canvas>
    </div>
`})
export class ChartComp implements OnInit, OnDestroy
{
    constructor()
    {

    }

    ngOnInit()
    {
        console.log('chart initialize...');

        this.Canvas = this.CanvasRef.nativeElement;
        this.Ctx = this.Canvas.getContext('2d');
        this.downsok();
        // this.ContainerRect = this.Canvas.parentElement.getBoundingClientRect();

            }

    ngOnDestroy(): void
    {
        console.log('chart destroy');
    }

    downsok(): void
    {
        for (let r = 1; r <= this.row; r++)
        {
            for (let l = 1; l <= this.list; l++)
            {
            const x = (r - 1) * this.TableWidth;
            const y = (l - 1) * this.TableHidth;
            this.Ctx.rect(x, y, this.TableWidth, this.TableHidth);
            this.Ctx.lineWidth = 0.5;
            this.Ctx.textAlign = 'left';
            this.Ctx.fillText('125', x + 20 , y + 15);
            }
        }
        this.Ctx.stroke();
    }

    dot(): void
    {
        for (let t = 1; t <= this.row; t++)
        {
            this.TableWidth.toExponential();
            this.Ctx.moveTo(this.TableHidth, this.TableHidth);
            this.Ctx.moveTo(this.TableHidth, this.TableWidth);
        }



    }



    // Repaint(): void
    // {
    //     this.UpdateParams();
    //     this.Ctx.clearRect(0, 0, this.Canvas.width, this.Canvas.height);

    //     this.DrawAxisX();
    //     this.DrawAxisY();

    //     for (const iter of this.Serials)
    //     {
    //         if (TypeInfo.Assigned(this.DataSource) || TypeInfo.Assigned(iter.DataSource))
    //         {
    //             this.Ctx.save();
    //             iter.Paint(this);
    //             this.Ctx.restore();
    //         }
    //     }
    // }

    // ScrollTo(Value: UITypes.IPosition): void
    // {
    //     const pos = this.ValueToPixel(Value);
    //     const X = (pos.X - this.CellSize.Width * this.Viewport.VisiableCountX / 2) / window.devicePixelRatio;

    //     this.ContainerRef.nativeElement.scrollLeft = X > 0 ? X : 0;
    // }

    // ValueToPixel(Value: UITypes.IPosition): UITypes.IPosition
    // {
    //     return {
    //         X: this.AxisX.Normalized(Value.X) * this.Canvas.width + this.CellSize.Width / 2,
    //         Y: this.Canvas.height - this.AxisY.Normalized(Value.Y) * this.Canvas.height + this.CellSize.Height / 2
    //     };
    // }

    // private UpdateParams(): void
    // {
    //     let Width: number;
    //     let Height: number;

    //     if (TypeInfo.Assigned(this.Viewport.VisiableCountX) && TypeInfo.Assigned(this.AxisX))
    //         Width = this.ContainerRect.width * this.AxisX.StepCount / this.Viewport.VisiableCountX;
    //     else
    //         Width = this.ContainerRect.width;

    //     if (TypeInfo.Assigned(this.Viewport.VisiableCountY) && TypeInfo.Assigned(this.AxisY))
    //         Height = this.ContainerRect.height * this.AxisY.StepCount / this.Viewport.VisiableCountY;
    //     else
    //         Height = this.ContainerRect.height;

    //     this.Canvas.width = Width * window.devicePixelRatio;
    //     this.Canvas.height = Height * window.devicePixelRatio;

    //     this.Canvas.style.width = Width + 'px';
    //     this.Canvas.style.height = Height + 'px';

    //     this.CellSize = {Width: this.Canvas.width / this.AxisX.StepCount,
    //         Height: this.Canvas.height / this.AxisY.StepCount};
    // }

    // private DrawAxisX(): void
    // {
    //     const Font = TypeInfo.Assigned(this.AxisX.TextAttr.Font) ? this.AxisX.TextAttr.Font : this.TextAttr.Font;
    //     const TextColor = TypeInfo.Assigned(this.AxisX.TextAttr.Color) ? this.AxisX.TextAttr.Color : this.TextAttr.Color;
    //     const TextAlign = TypeInfo.Assigned(this.AxisX.TextAttr.Align) ? this.AxisX.TextAttr.Align : 'center';

    //     this.Ctx.textAlign = TextAlign;
    //     this.Ctx.font = Font.toString();
    //     this.Ctx.fillStyle = TextColor;

    //     this.Ctx.lineWidth = 1;
    //     this.Ctx.setLineDash([0 , 0]);
    //     this.Ctx.strokeStyle = '#F4F4F4';

    //     for (let I = this.AxisX.Min; I < this.AxisX.Max; I += this.AxisX.Step)
    //     {
    //         const Label = this.AxisX.Label(I);
    //         const pos = this.ValueToPixel({X: I, Y: 0});

    //         this.Ctx.fillText(Label, pos.X, this.Canvas.height);
    //         this.Ctx.stroke();

    //         this.Ctx.beginPath();
    //         this.Ctx.moveTo(pos.X , this.Canvas.height);
    //         this.Ctx.lineTo(pos.X, 0);
    //         this.Ctx.stroke();
    //     }

    //     this.Ctx.lineWidth = 2 * window.devicePixelRatio;
    //     this.Ctx.setLineDash([3 , 3]);
    //     this.Ctx.strokeStyle = '#3AA7FF';

    //     this.Ctx.beginPath();
    //     this.Ctx.moveTo(0, this.Canvas.height);
    //     this.Ctx.lineTo(this.Canvas.width, this.Canvas.height);
    //     this.Ctx.stroke();
    // }

    Canvasclick(event)
    {
        console.log(event.clientX - this.Canvas.getBoundingClientRect().left);
        console.log(event.clientY - this.Canvas.getBoundingClientRect().top);
    }

    Canvas: HTMLCanvasElement;
    Ctx: CanvasRenderingContext2D;

    row: number = 5;
    list: number = 4;
    TableWidth: number = 60;
    TableHidth: number = 20;

    @Input() DataSource: Array<UITypes.IPosition>;

    TextAttr = new UITypes.TTextAttr(new UITypes.TFont('Arial', 8), '#0', 'center');


    @ViewChild('container') private ContainerRef: ElementRef;
    @ViewChild('canvas') private CanvasRef: ElementRef;
}
