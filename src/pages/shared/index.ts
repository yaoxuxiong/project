import {NgModule} from '@angular/core';

import {GlobalSharedModule} from '../../shared_module/global';

import {DiscoverComp} from './discover/discover.comp';
import {ChartComp} from './chart';
import {CalendarComp} from './calendar';


@NgModule({
    imports: [
        GlobalSharedModule,
    ],
    declarations: [
        DiscoverComp,
        ChartComp,
        CalendarComp,
    ],
    entryComponents: [
        ChartComp,
    ],
    exports: [
        GlobalSharedModule,
        DiscoverComp,
        ChartComp,
        CalendarComp
    ]
})
export class SharedModule
{
}

export {ChartComp, CalendarComp};
export * from '../../shared_module/global';

