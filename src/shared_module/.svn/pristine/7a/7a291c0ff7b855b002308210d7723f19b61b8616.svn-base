import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular/module';
import {TranslateModule} from '@ngx-translate/core';
import {SwiperComp} from '../../UltraCreation/ng-ion/swiper';

import {UnitConvertPipeModule} from '../../UltraCreation/ng-ion/unitconv.pipe';
import {MathPipeModule} from '../../UltraCreation/ng-ion/math.pipe';

import {LoadConfig} from './config';

@NgModule({
    imports: [
        IonicPageModule,
        TranslateModule,
        UnitConvertPipeModule,
        MathPipeModule,
    ],
    declarations: [
        SwiperComp,
    ],
    entryComponents: [
    ],
    exports: [
        IonicPageModule,
        TranslateModule,

        UnitConvertPipeModule,
        MathPipeModule,

        SwiperComp,
    ]
})
export class GlobalSharedModule
{
}

export {LoadConfig, SwiperComp};
