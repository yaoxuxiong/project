import {Component, OnInit, OnDestroy, ChangeDetectorRef} from '@angular/core';
import {MenuController} from 'ionic-angular';

import {TypeInfo} from '../../UltraCreation/Core/TypeInfo';
import {PowerManagement} from '../../UltraCreation/Native/PowerManagement';
import * as Svc from '../../providers';

import {SettingPage} from '../setting';
@Component({selector: 'page-home', templateUrl: 'home.html'})
export class HomePage implements OnInit, OnDestroy
{
    constructor(private ChangeDet: ChangeDetectorRef, public MenuCtrl: MenuController,
        public Auth: Svc.TAuthService,
        public Medicine: Svc.TMedicineService,
        private Discover: Svc.TDiscoverService,
        private Sampling: Svc.TSamplingService)
    {
    }

    ngOnInit(): void
    {
        this.Tabs.push({Index: 0, Name: 'monitor', Icon: '&#xe903;'});
        this.Tabs.push({Index: 1, Name: 'calendar', Icon: '&#xe904;'});
        this.Tabs.push({Index: 2, Name: 'medicine', Icon: '&#xe90f;'});
        this.SelectTab(this.Tabs[0]);

        this.Sampling.Initialize();
        setTimeout(() => PowerManagement.Acquire(), 1000);
    }

    ngOnDestroy(): void
    {
        PowerManagement.Release();
    }

    OpenMenu(): void
    {
        this.Discover.Start();
    }

    SelectTab(Tab: ITabItem): void
    {
        this.ActiveTab = Tab;
    }

    private Tabs: Array<ITabItem> = new Array<ITabItem>();
    ActiveTab: ITabItem;
}

interface ITabItem
{
    Index: number;
    Name: string;
    Icon: string;
}
