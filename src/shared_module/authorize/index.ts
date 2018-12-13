
import {NgModule} from '@angular/core';

import {GlobalSharedModule} from '../global';

import {WelcomePage} from './welcome/welcome';
import {LoginPage} from './login/login';
import {RegisterPage} from './register/register';

import {TAuthService} from './service';

@NgModule({
    imports: [
        GlobalSharedModule
    ],
    declarations: [
        WelcomePage,
        LoginPage,
        RegisterPage,
    ],
    entryComponents: [
        WelcomePage,
        LoginPage,
        RegisterPage,
    ],
    exports : [
        WelcomePage,
        LoginPage,
        RegisterPage,
    ],
    providers: [
        TAuthService,
    ]
})
export class AuthorizeModule
{
}

export {TAuthService, WelcomePage, LoginPage, RegisterPage};
