import {UnitConv} from '../Core/Conv';
import './iso_measure_unit';

export namespace ISO_British
{
    export function CelsiusToFahrenheit(Value: number): number
    {
        return Value * 1.8 + 32;
    }

    export function FahrenheitToCelsius(Value: number): number
    {
        return (Value - 32) / 1.8;
    }
}

UnitConv.Register('temperature', {Name: 'celsius', Symbol: '°C'}, [
    [{Name: 'fahrenheit',   Symbol: '°F'}, ISO_British.CelsiusToFahrenheit]
]);

UnitConv.Register('temperature', {Name: 'fahrenheit',  Symbol: '°F'}, [
    [{Name: 'celsius', Symbol: '°C'}, ISO_British.FahrenheitToCelsius]
]);
