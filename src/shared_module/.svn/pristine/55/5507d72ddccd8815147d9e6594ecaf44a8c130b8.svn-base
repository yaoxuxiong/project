import {Component} from '@angular/core';
import {Network} from '../../../UltraCreation/Native/Network';
import {TAuthService} from '../service';

import {LoginPage} from '../login/login';

@Component({selector: 'RegisterPage', templateUrl: 'register.html'})
export class RegisterPage
{
    constructor(public Auth: TAuthService)
    {
    }

    Submit()
    {
        if (this.Auth.IsLogin)
        {
            App.Nav.pop();
            App.EnableHardwareBackButton();
        }

        if (! Network.IsOnline)
            return App.ShowToast('network_unavailable');

        /*
        if (this.UserName === '' || this.Email === '' ||
            this.Pwd === '' || this.ComfirmPwd === '')
        {
            return App.ShowToast('hint.missing_fields');
        }
        */

        if ( ! this.IsEmail(this.Email))
            return App.ShowToast('hint.wrong_email_from');

        if ( this.Pwd !== this.ComfirmPwd)
            return App.ShowToast('hint.password_not_match');

        this.Start();
    }

    CheckUserName()
    {
        if (this.UserName.length >= 20)
        this.UserName = this.UserName.substring(0 , 20);
    }

    CheckPwd()
    {
        if (this.Pwd.length > 12)
            this.Pwd = this.Pwd.substring(0, 11);
    }

    private IsEmail(Email: string): boolean
    {
        return Email.search(/^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/) !== -1;
    }

    Start()
    {
        App.DisableHardwareBackButton();

        App.ShowLoading()
            .then(() =>
                this.Auth.SignIn(this.Email, this.Pwd , this.UserName))
            .then(() =>
                App.HideLoading().then(() => App.Nav.pop()))
            .catch(err =>
                App.HideLoading() .then(() => App.ShowError(err)))
            .then(() =>
                App.EnableHardwareBackButton());
    }

    App = window.App;

    UserName: string = '';
    Email: string = '';
    Pwd: string = '';
    ComfirmPwd: string = '';
}
