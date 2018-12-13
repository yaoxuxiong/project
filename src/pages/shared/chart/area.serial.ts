import {TypeInfo} from '../../../UltraCreation/Core/TypeInfo';
import {UITypes} from '../../../UltraCreation/Graphic';
import {ICoordinate, TSerial} from './intf';

export class TAreaSerial extends TSerial
{
    Paint(Coord: ICoordinate): void
    {
        const Canvas = Coord.Canvas;
        const Ctx = Coord.Ctx;
        const AxisX = Coord.AxisX;
        const AxisY = Coord.AxisY;

        const ary = new Array<UITypes.IPosition>();

        let DataSource = TypeInfo.Assigned(this.DataSource) ? this.DataSource : Coord.DataSource;
        DataSource = DataSource.sort((a, b) => a.X - b.X);

        for (let I = 0; I < AxisX.StepCount; I ++)
            ary.push(Coord.ValueToPixel({X: AxisX.Min + AxisX.Step * I, Y: AxisY.Min}));

        for (let I = 0, Idx = 0; I < DataSource.length; I ++)
        {
            const pos = Coord.ValueToPixel(DataSource[I]);

            while (Idx < ary.length && ary[Idx].X < pos.X)
                Idx ++;
            if (Idx === ary.length)
                break;
            ary[Idx] = pos;
        }

        Ctx.beginPath();
        Ctx.moveTo(ary[0].X, ary[0].Y);

        for (const iter of ary)
            Ctx.lineTo(iter.X, iter.Y);

        Ctx.lineTo(Canvas.width, Canvas.height);
        Ctx.lineTo(40, Canvas.height);

        const gradient = Ctx.createLinearGradient(0, 0, 0, Canvas.width / 8);
        gradient.addColorStop(0, 'rgba(85, 176, 250, 0.6)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
        Ctx.fillStyle = gradient;
        Ctx.fill();

        Ctx.closePath();
    }
}
