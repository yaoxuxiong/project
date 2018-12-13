import {UnitConv} from '../Core/Conv';

/**
 *  length measure units
 */
// base
UnitConv.Register('length', {Name: 'meter', Symbol: 'm'});
// converters
UnitConv.Register('length', {Name: 'meter', Symbol: 'm'}, [
    [{Name: 'centimeter',   Symbol: 'cm'}, (value: number) => value * 100],
    [{Name: 'millimeter',   Symbol: 'mm'}, (value: number) => value * 1000],
    [{Name: 'micrometer',   Symbol: 'µm'}, (value: number) => value * 1000000],
    [{Name: 'nanometer',    Symbol: 'nm'}, (value: number) => value * 1000000000],
    [{Name: 'kilo meter',   Symbol: 'km'}, (value: number) => value / 1000]
]);

/**
 *  temperature unit
 */
UnitConv.Register('temperature', {Name: 'celsius', Symbol: '°C'});

/**
 *  relative humidity unit
 */
UnitConv.Register('relative_humidity', {Name: 'RH', Symbol: '%'});
