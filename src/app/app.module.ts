import {BrowserModule} from '@angular/platform-browser';
import {ErrorHandler, NgModule } from '@angular/core';
import {IonicApp, IonicErrorHandler, IonicModule} from 'ionic-angular';

import {ServiceModule} from '../providers';
import {SharedModule} from '../pages/shared';
import {HomeModule} from '../pages/home';

import {MyApp} from './app.component';

import {Camera} from '@ionic-native/camera';
import {File} from '@ionic-native/file';

@NgModule({
    declarations: [
        MyApp,
    ],
    imports: [
        BrowserModule,
        IonicModule.forRoot(MyApp),
        ServiceModule,
        SharedModule,
        HomeModule,
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        MyApp
    ],
    providers: [
        Camera, File,
        {provide: ErrorHandler, useClass: IonicErrorHandler},
    ]
})
export class AppModule {}
