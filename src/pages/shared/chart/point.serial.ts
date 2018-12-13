import {TypeInfo} from '../../../UltraCreation/Core/TypeInfo';
import {TSerial, ICoordinate} from './intf';

export class TPointSerial extends TSerial
{
    Size = 10;

    Paint(Coord: ICoordinate): void
    {
        const Canvas = Coord.Canvas;
        const Ctx = Coord.Ctx;

        const Font = TypeInfo.Assigned(this.TextAttr.Font) ? this.TextAttr.Font : Coord.TextAttr.Font;
        const TextColor = TypeInfo.Assigned(this.TextAttr.Color) ? this.TextAttr.Color : Coord.TextAttr.Color;
        const TextAlign = TypeInfo.Assigned(this.TextAttr.Align) ? this.TextAttr.Align : 'center';

        const HalfSize = this.Size / 2 * window.devicePixelRatio;
        const DataSource = TypeInfo.Assigned(this.DataSource) ? this.DataSource : Coord.DataSource;
        Ctx.font = Font.toString();

        for (const iter of DataSource)
        {
            const pos = Coord.ValueToPixel(iter);

            let Label = iter.toString();
            if (Label.length === 0 || Label[0] === '[')
                Label = iter.Y.toString();
            const TextWidth = Ctx.measureText(Label).width;
            const TextPad = 2 * window.devicePixelRatio;

            // dot
            Ctx.beginPath();
            Ctx.strokeStyle = '#49AEFF';
            Ctx.arc(pos.X, pos.Y, HalfSize, 0, 2 * Math.PI);
            Ctx.fillStyle = '#49AEFF';
            Ctx.fill();

            // label area
            Ctx.fillRect(pos.X - TextWidth / 2 - TextPad,
                pos.Y - HalfSize - Font.Height -  2 * TextPad,
                TextWidth + 2 * TextPad, Font.Height + TextPad);
            // label
            Ctx.fillStyle = '#fff';
            Ctx.fillText(Label, pos.X, pos.Y - HalfSize - 2 * TextPad);


            Ctx.beginPath();


            /*
            // indicator
            Ctx.beginPath();
            Ctx.moveTo(pos.X - HalfSize, pos.Y - HalfSize);
            Ctx.lineTo(pos.X + HalfSize, pos.Y - HalfSize);
            Ctx.lineTo(pos.X, pos.Y - HalfSize - TextPad);
            Ctx.fillStyle = '#3AA7FF';
            Ctx.fill();
            */
        }
    }
}
