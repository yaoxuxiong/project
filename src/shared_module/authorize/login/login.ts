import {Component} from '@angular/core';
import {Network} from '../../../UltraCreation/Native/Network';
import {TAuthService} from '../service';
import {RegisterPage} from '../register/register';

@Component({selector: 'LoginPage', templateUrl: 'login.html'})
export class LoginPage
{
    constructor(public Auth: TAuthService)
    {}

    ngOnInit()
    {
        this.Email = this.Auth.LastLogin;
    }

    Submit()
    {
        if (this.Auth.IsLogin)
            return App.Nav.popToRoot();

        if (! Network.IsOnline)
        {
            return App.ShowToast('hint.network_unavailable');
        }

        if (this.Email === '' || this.Pwd === '')
        {
            return App.ShowToast('hint.missing_fields');
        }

        if (! this.IsEmail(this.Email))
        {
            return App.ShowToast('hint.wrong_email_form');
        }
        this.Start();
    }

    private IsEmail(Email: string): boolean
    {
        return Email.search(/^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/) !== -1;
    }

    private Start()
    {
        App.DisableHardwareBackButton();

        App.ShowLoading()
            .then(() =>
                this.Auth.Login(this.Email, this.Pwd))
            .then(() =>
                App.HideLoading().then(() => App.Nav.pop()))
            .catch(err =>
                App.HideLoading().then(() => App.ShowError(err)))
            .then(() =>
                App.EnableHardwareBackButton());
    }

    showPrompt()
    {
        App.ShowAlert({
            title: 'Forgot Password',
            message: 'Never was anything great achieved without danger',
            inputs: [{
                name: 'title',
                placeholder: 'E-mail'
            }],
            buttons: [{
                text: 'Cancel',
                handler: () => {
                    console.log('Cancel clicked');
                }
            },
            {
                text: 'Save',
                handler: () => {
                    console.log('Saved clicked');
            }
            }]
        });
    }

    RegisterPage()
    {
        App.Nav.push(RegisterPage);
    }

    Email: string = '';
    Pwd: string = '';
    App = window.App;
}
