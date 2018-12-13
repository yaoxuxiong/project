import {Component, OnInit, OnDestroy, ViewChild, ElementRef} from '@angular/core';
import {UnitConv} from '../../UltraCreation/Core/Conv';

import * as Svc from '../../providers';

import {LoginPage, RegisterPage} from '../../shared_module/authorize';
import {GuidePage} from './guide/guide';
import {FeedbackPage} from './feedback/feedback';

@Component({selector: 'page-setting', templateUrl: 'setting.html'})
export class SettingPage implements OnInit, OnDestroy
{
    constructor(private Asset: Svc.TAssetService,
        private Auth: Svc.TAuthService, private Discover: Svc.TDiscoverService)
    {
    }

    ngOnInit(): void
    {
        this.TemperatureUnits = UnitConv.Convertibles('temperature');
        this.UnitDefaults.Temperature = UnitConv.GetConvertDefault('temperature').Name;
    }

    ngOnDestroy(): void
    {
        UnitConv.SetConvertDefault('temperature', this.UnitDefaults.Temperature);
        this.Asset.SaveDefaultConverts();
    }

    Register(): void
    {
        App.Nav.push(RegisterPage);
    }

    Login(): void
    {
        App.Nav.push(LoginPage);
    }

    Logout(): void
    {
        this.Auth.Logout();
    }

    Feedback(): void
    {
        App.Nav.push(FeedbackPage);
    }

    UserGuide()
    {
        App.Nav.push(GuidePage);
    }

    App = window.App;

    TemperatureUnits: Array<UnitConv.IUnit>;
    UnitDefaults: {Temperature: string} = {Temperature: ''};
}
