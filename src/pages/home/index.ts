import {NgModule} from '@angular/core';

import {SharedModule} from '../shared';


import {HomePage} from './home';


@NgModule({
    imports: [
        SharedModule,
    ],
    declarations: [
        HomePage,
    ],
    entryComponents: [
        HomePage,
    ]
})
export class HomeModule
{
}

export {HomePage};
