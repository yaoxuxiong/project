import {Component} from '@angular/core';
import {LoginPage} from '../login/login';
import {RegisterPage} from '../register/register';

@Component({selector: 'page-welcome', templateUrl: 'welcome.html'})
export class WelcomePage
{
    constructor()
    {
    }

    Login()
    {
        App.Nav.push(LoginPage);
    }

    Register()
    {
        App.Nav.push(RegisterPage);
    }

    App = window.App;
}
