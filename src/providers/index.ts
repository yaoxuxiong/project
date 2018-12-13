import {NgModule} from '@angular/core';
import {TranslateModule, TranslateLoader} from '@ngx-translate/core';
import {Observable} from 'rxjs/Observable';

import {THttpClient} from '../UltraCreation/Core/Http';
import {TApplication} from './application';
import {TAuthService} from '../shared_module/authorize';
import {TAssetService} from './asset';
import {TDiscoverService} from './bbmon.discover';

import {TSamplingService} from './sampling';
import {TMedicineService} from './medicine';

export class TranslateHttpLoader extends TranslateLoader
{
    getTranslation(Lang: string): Observable<any>
    {
        const Http = new THttpClient('json');
        return Http.Get('assets/i18n/' + Lang + '/' + 'ui.json').map(res => res.Content);
    }
}

export function HttpLoaderFactory()
{
    return new TranslateHttpLoader();
}

@NgModule({
    imports: [
        TranslateModule.forRoot({loader: {provide: TranslateLoader, useClass: TranslateHttpLoader}})
    ],
    exports: [
        TranslateModule
    ],
    providers: [
        TApplication,
        TAssetService,
        TAuthService,
        TDiscoverService,
        TSamplingService,
        TMedicineService
    ]
})
export class ServiceModule
{
}

export * from './init';
export * from './shared_service';
export * from './application';
export * from './asset';

export * from './bbmon.discover';
export * from './sampling';
export * from './medicine';

export * from '../shared_module/authorize/service';
