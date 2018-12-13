import {Injectable, Injector, isDevMode} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

import {Platform} from 'ionic-angular/platform/platform';
import {App} from 'ionic-angular/components/app/app';
import {NavController} from 'ionic-angular/navigation/nav-controller';
import {ViewController} from 'ionic-angular/navigation/view-controller';

import {Toast} from 'ionic-angular/components/toast/toast';
import {ToastOptions} from 'ionic-angular/components/toast/toast-options';
import {ToastController} from 'ionic-angular/components/toast/toast-controller';

import {Alert} from 'ionic-angular/components/alert/alert';
import {AlertOptions} from 'ionic-angular/components/alert/alert-options';
import {AlertController} from 'ionic-angular/components/alert/alert-controller';

import {Modal} from 'ionic-angular/components/modal/modal';
import {ModalOptions} from 'ionic-angular/components/modal/modal-options';
import {ModalController} from 'ionic-angular/components/modal/modal-controller';

import {Loading} from 'ionic-angular/components/loading/loading';
import {LoadingOptions} from 'ionic-angular/components/loading/loading-options';
import {LoadingController} from 'ionic-angular/components/loading/loading-controller';

import {ActionSheet} from 'ionic-angular/components/action-sheet/action-sheet';
import {ActionSheetOptions} from 'ionic-angular/components/action-sheet/action-sheet-options';
import {ActionSheetController} from 'ionic-angular/components/action-sheet/action-sheet-controller';

import {Popover} from 'ionic-angular/components/popover/popover';
import {PopoverOptions} from 'ionic-angular/components/popover/popover-options';
import {PopoverController} from 'ionic-angular/components/popover/popover-controller';

import {TypeInfo} from '../Core/TypeInfo';
import {Exception, EAbort} from '../Core/Exception';

@Injectable()
export class TAppController
{
    constructor(public Injector: Injector)
    {
        this.Instance = Injector.get(App);
        this.Platform = Injector.get(Platform);

        this.ToastCtrl = Injector.get(ToastController);
        this.AlertCtrl = Injector.get(AlertController);
        this.ModalCtrl = Injector.get(ModalController);
        this.LoadingCtrl = Injector.get(LoadingController);
        this.ActionSheetCtrl = Injector.get(ActionSheetController);
        this.PopoverCtrl = Injector.get(PopoverController);

        this.Translation = Injector.get(TranslateService);
    }

    get IsAndroid(): boolean
    {
        return this.Platform.is('android');
    }

    get IsIos(): boolean
    {
        return this.Platform.is('ios');
    }

    get IsWindowPhone()
    {
        return this.Platform.is('wp');
    }

    get Nav(): NavController
    {
        return this.Instance.getActiveNavs()[0] as NavController;
    }

    get ActiveView(): ViewController
    {
        return this.Nav.getActive(true);
    }

    IconFont(Index: number): string
    {
        return String.fromCharCode(Index);
    }

    ShowError(err: any, ...args: any[]): Promise<void>;
    async ShowError(err: any, config?: {duration?: number, position?: 'top' | 'bottom' | 'middle',
        style?: string, prefix_lang?: string}): Promise<void>
    {
        if (! TypeInfo.Assigned(config))
            config = {};

        if (isDevMode())
        {
            if (err instanceof Error)
                console.error(err.stack);
            else
            {
                const trace = new Error();
                console.error(trace.stack);
            }
        }

        if (err instanceof EAbort)
        {
            console.warn(err.message);
            return;
        }

        let msg: string;

        if (TypeInfo.IsString(err))
            msg = err;
        else if (err instanceof Error)
            msg = err.message;
        else if (err instanceof Exception)
            msg = err.message;
        else
            msg = '';

        if (msg !== '')
        {
            if (TypeInfo.Assigned(config) && TypeInfo.Assigned(config.prefix_lang))
            {
                const lang_id = config.prefix_lang + msg;
                const localize_msg = this.Translate(lang_id);

                if (localize_msg !== lang_id)
                    msg = localize_msg;
            }

            try
            {
                await this.ShowToast({message: msg, position: config.position, duration: config.duration,
                    cssClass: config.style});
            }
            catch (e)
            {
                console.log(e);
            }
        }
    }

    /**
     *  @params PageType class of PageType
     *  @param opts: ModalOptions
     *      showBackdrop?: boolean;
     *      enableBackdropDismiss?: boolean;
    */
    async ShowModal(PageType: any, data?: any, opts?: ModalOptions): Promise<Modal>
    {
        const modal = this.ModalCtrl.create(PageType, data, opts);

        await modal.present();
        return modal;
    }

    /**
     *  Display an alert with a title, inputs, and buttons
     *
     *  @param opts: AlertOptions
     *      title?: string;
     *      subTitle?: string;
     *      message?: string;
     *      cssClass?: string;
     *      inputs?: Array<AlertInputOptions>;
     *      buttons?: Array<any>;
     *      enableBackdropDismiss?: boolean;
     *
     *  @param opts.inputs
     *      type?: string;
     *      name?: string;
     *      placeholder?: string;
     *      value?: string;
     *      label?: string;
     *      checked?: boolean;
     *      disabled?: boolean;
     *      id?: string;
     *
     *  @param opt.buttons
     *      text?: string;
     *      icon?: icon;
     *      handler?: any;  // function false => dismiss
     *      cssClass: string;
     *      role: 'destructive' | 'cancel'
     */
    async ShowAlert(opts: AlertOptions): Promise<Alert>
    {
        if (! TypeInfo.Assigned(opts.enableBackdropDismiss))
            opts.enableBackdropDismiss = false;

        const alert = this.AlertCtrl.create(opts);
        await alert.present();
        return alert;
    }

    /** @param opt: ToastOptions
     *      message?: string;
     *      cssClass?: string;
     *      duration?: number;  // default by platform
     *      showCloseButton?: boolean = false;
     *      closeButtonText?: string = false;
     *      dismissOnPageChange?: boolean = true;
     *      position?: "top" | "bottom" | "middle"; // default by platform
     */
    ShowToast(...args: any[]): Promise<Toast>;
    async ShowToast(opt: ToastOptions): Promise<Toast>
    {
        /* bug for chain call, toast2 will display forever
            .ShowToast('toast1');
            .ShowToast('toast2');
        */

        if (TypeInfo.Assigned(this.Toast))
            await this.Toast.dismiss();

        this.Toast = this.ToastCtrl.create(opt);
        this.Toast.onDidDismiss(() => this.Toast = undefined);

        await this.Toast.present();
        return this.Toast;
    }

    /**
     *  @paramm opt: LoadingOptions
     *      spinner?: "ios" | "ios-small" | "bubbles" | "circles" | "crescent" | "dots";    // default "ios"
     *      content?: string;
     *      cssClass?: string;
     *      showBackdrop?: boolean;
     *      dismissOnPageChange?: boolean = true;
     *      delay?: number = 0;
     *      duration?: number = 0;  // 0 = forever
     */
    ShowLoading(...args: any[]): Promise<Loading>;
    async ShowLoading(opt?: LoadingOptions, timeout?: () => void): Promise<Loading>
    {
        if (TypeInfo.Assigned(this.Loading))
            return;

        if (! TypeInfo.Assigned(opt.spinner))
            opt.spinner = 'ios';

        this.IsManualHideLoading = false;
        this.Loading = this.LoadingCtrl.create(opt);
        this.Loading.onDidDismiss(() =>
        {
            if (TypeInfo.Assigned(this.Loading))
                this.Loading = undefined;
            if (! this.IsManualHideLoading && TypeInfo.Assigned(timeout))
                timeout();
        });
        await this.Loading.present();
        return this.Loading;
    }

    async HideLoading(): Promise<void>
    {
        if (TypeInfo.Assigned(this.Loading))
        {
            this.IsManualHideLoading = true;
            try
            {
                await this.Loading.dismiss();
            }
            catch (err)
            {
                console.log(err);
            }
            this.Loading = undefined;
        }
    }

    /**
     *  @param opt: ActionSheetOptions
     *      title?: string;
     *      subTitle?: string;
     *      cssClass?: string;
     *      buttons?: Array<any>;
     *      enableBackdropDismiss?: boolean;
     *
     *  @param opt.buttons
     *      text?: string;
     *      icon?: icon;
     *      handler?: any;  // function false => dismiss
     *      cssClass: string;
     *      role: 'destructive' | 'cancel'
     */
    async ShowActionSheet(opts?: ActionSheetOptions): Promise<ActionSheet>
    {
        if (! TypeInfo.Assigned(opts))
            opts = {};

        const actionSheet = this.ActionSheetCtrl.create(opts);
        await actionSheet.present();
        return actionSheet;
    }

    /**
     *  @params PageType class of PageType
     *  @params event to get the top and left prop of current page
     *  @param opts: ModalOptions
     *      cssClass?: string;
     *      showBackdrop?: boolean;
     *      enableBackdropDismiss?: boolean;
    */
    async ShowPopover(PageType: any, event: Event, data?: any, opts?: PopoverOptions): Promise<Popover>
    {
        const popover = this.PopoverCtrl.create(PageType, data, opts);
        await popover.present({ev: event});
        return popover;
    }

/* langulage support */

    SetDefaultLanguage(lang: string)
    {
        this.Translation.setDefaultLang(lang);
    }

    get Languages(): string[]
    {
        return this.Translation.getLangs();
    }

    AddLanguage(Name: string, Translation?: Object, Merge: boolean = false)
    {
        if (TypeInfo.Assigned(Translation))
            this.Translation.setTranslation(Name, Translation, Merge);
        else
            this.Translation.addLangs([Name]);

        if (this.Languages.length === 1)
            this.Translation.setDefaultLang(Name);
    }

    get Language(): string
    {
        const RetVal = this.Translation.currentLang;

        if (TypeInfo.Assigned(RetVal))
            return RetVal;
        else
            return 'en';
    }

    set Language(Value: string)
    {
        this.Translation.use(Value);
    }

    Translate(Key: string | string[]): any
    {
        return this.Translation.instant(Key);
    }

    Instance: App;
    Platform: Platform;
    Translation: TranslateService;

    protected ActionSheetCtrl: ActionSheetController;
    protected AlertCtrl: AlertController;
    protected ModalCtrl: ModalController;
    protected LoadingCtrl: LoadingController;
    protected ToastCtrl: ToastController;
    protected PopoverCtrl: PopoverController;

    private Loading: Loading | undefined;
    private IsManualHideLoading: boolean;
    private Toast: Toast | undefined;
}
