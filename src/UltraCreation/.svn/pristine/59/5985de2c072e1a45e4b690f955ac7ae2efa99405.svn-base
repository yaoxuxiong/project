import {NgModule} from '@angular/core';
import {Pipe, PipeTransform} from '@angular/core';
import {UnitConv} from '../Core/Conv';

@Pipe({name: 'conv', pure: false})
export class TUnitDefConvertPipe implements PipeTransform
{
    transform(value: number, Subject: UnitConv.TUnitSubject, To?: string): number
    {
        return UnitConv.Convert(Subject, value, To);
    }
}

@Pipe({name: 'conv_name', pure: false})
export class TUnitDefConvertNamePipe implements PipeTransform
{
    transform(Subject: UnitConv.TUnitSubject): string
    {
        return UnitConv.GetConvertDefault(Subject).Name;
    }
}

@Pipe({name: 'conv_sym', pure: false})
export class TUnitDefConvertSymbolPipe implements PipeTransform
{
    transform(Subject: UnitConv.TUnitSubject): string
    {
        return UnitConv.GetConvertDefault(Subject).Symbol;
    }
}

@Pipe({name: 'convertiables', pure: false})
export class TUnitConvertiablesPipe implements PipeTransform
{
    transform(Subject: UnitConv.TUnitSubject, Base?: UnitConv.TUnitName): Array<UnitConv.IUnit>
    {
        return UnitConv.Convertibles(Subject, Base);
    }
}

@NgModule({
    declarations: [
        TUnitDefConvertPipe,
        TUnitDefConvertNamePipe,
        TUnitDefConvertSymbolPipe,
        TUnitConvertiablesPipe,
    ],
    exports: [
        TUnitDefConvertPipe,
        TUnitDefConvertNamePipe,
        TUnitDefConvertSymbolPipe,
        TUnitConvertiablesPipe,
    ]
})
export class UnitConvertPipeModule
{
}
