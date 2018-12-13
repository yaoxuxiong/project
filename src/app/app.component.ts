import {Component} from '@angular/core';
import {SplashScreen} from '../UltraCreation/Native/SplashScreen';
import {StatusBar} from '../UltraCreation/Native/StatusBar';

import * as Svc from '../providers';
import {HomePage} from '../pages/home';
import {LoadConfig} from '../pages/shared';

@Component({template: '<ion-nav [root]="rootPage"></ion-nav>'})
export class MyApp
{
    constructor(app: Svc.TApplication)
    {
        app.Platform.ready()
            .then(() =>
            {
                SplashScreen.show();
                StatusBar.hide();

                if (App.IsIos)
                    StatusBar.styleBlackTranslucent();

                return LoadConfig('assets/config.json')
                    .then(() => Svc.Initialization.Execute());
            })
            .then(() =>
            {
                setTimeout(() => {
                    SplashScreen.hide();
                }, 500);

                this.rootPage = HomePage;
            });
    }

    rootPage: any;
}
