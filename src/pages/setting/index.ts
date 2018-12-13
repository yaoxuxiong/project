import {NgModule} from '@angular/core';

import {SharedModule} from '../shared/index';
import {AuthorizeModule} from '../../shared_module/authorize';

import {SettingPage} from './setting';

import {FeedbackPage} from './feedback/feedback';
import {GuidePage} from './guide/guide';

@NgModule({
    imports: [
        SharedModule,
        AuthorizeModule
    ],
    declarations: [
        SettingPage,
        FeedbackPage,
        GuidePage,
    ],
    entryComponents: [
        SettingPage,
        FeedbackPage,
        GuidePage,
    ],
    exports : [
        SettingPage
    ]
})
export class SettingModule
{
}

export {SettingPage, };
