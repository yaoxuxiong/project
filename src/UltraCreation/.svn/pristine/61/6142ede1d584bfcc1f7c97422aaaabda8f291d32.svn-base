/**
 *  Cordova Plugins Abstract
 *      npm i @types/cordova -D
 */
// import 'cordova';
import {TypeInfo} from '../Core/TypeInfo';
import {EAbort} from '../Core/Exception';

declare var window: any;
declare var navigator: any;

export type TSuccessfulCallback = (msg?: any) => void;
export type TFailureCallback = (msg?: any) => void;

export type TPluginFunction = (...argv: any[]) => void;

export class ECordovaPlugin extends EAbort
{
    constructor(msg?: string)
    {
        if (TypeInfo.Assigned(msg))
            super(msg);
        else
            super('e_cordova_plugin');
    }
}

export class ECordovaPluginNotInstalled extends ECordovaPlugin
{
    constructor()
    {
        super('e_cordova_plugin_not_installed');
    }
}

export class TCordovaPlugin
{
    static readonly Name: string = '';
    static readonly Repository?: string;

    static get IsPluginInstalled(): boolean
    {
        return TypeInfo.Assigned(this.Instance);
    }

    static get Instance(): any
    {
        if (this.Name === '')
        {
            console.error(this.name.toString() + ' has no Name defined.');
            return undefined;
        }

        if (! TypeInfo.Assigned(this._Instance))
        {
            this._Instance = this._GetInstance(this.Name);

            if (! TypeInfo.Assigned(this._Instance))
            {
                if (TypeInfo.Assigned(this.Repository))
                    console.error(this.Repository + ' is not installed.');
                else
                    console.error('cordova plugin: ' + this.Name + ' is not installed.');
            }
            else
                this.OnCreateInstance(this._Instance);
        }

        return this._Instance;
    }

    static async InstancePromise(): Promise<any>
    {
        const Instance = this.Instance;

        if (! TypeInfo.Assigned(Instance))
            throw new ECordovaPluginNotInstalled();
        else
            return Instance;
    }

    static GetProperty<T>(propname: string): T
    {
        const Instance = this.Instance;

        if (TypeInfo.Assigned(Instance))
            return Instance[propname];
        else
            return undefined;
    }

    static CallFunction<T>(func: string, ...argv: any[]): T
    {
        const Instance = this.Instance;

        if (TypeInfo.Assigned(Instance))
        {
            const PluginFunction: Function = Instance[func];
            return PluginFunction.call(Instance, ...argv);
        }
    }

    static async CallbackToPromise<T>(func: string): Promise<T>
    {
        const Instance = await this.InstancePromise();

        return new Promise<T>((resolve, reject) =>
        {
            const PluginFunction: Function = Instance[func];
            PluginFunction.call(this, succ, err);

            function succ(msg: any): void
            {
                resolve(msg);
            }

            function err(msg: any): void
            {
                if (TypeInfo.IsString(msg))
                {
                    console.warn('cordova plugin error: ' + msg);
                    reject(new ECordovaPlugin(msg));
                }
                else if (msg instanceof Error)
                {
                    console.warn('cordova plugin error: ' + msg.message + ' error class: ' + typeof msg);
                    reject(msg);
                }
            }
        });
    }

    static async CallbackToPromise_RightParam<T>(func: string, ...argv: any[]): Promise<T>
    {
        const Instance = await this.InstancePromise();

        return new Promise<T>((resolve, reject) =>
        {
            argv = [succ, err].concat(argv);

            const PluginFunction: Function = Instance[func];
            PluginFunction.call(this, ...argv);

            function succ(msg: any): void
            {
                resolve(msg);
            }

            function err(msg: any): void
            {
                if (TypeInfo.IsString(msg))
                {
                    console.warn('cordova plugin error: ' + msg);
                    reject(new ECordovaPlugin(msg));
                }
                else if (msg instanceof Error)
                {
                    console.warn('cordova plugin error: ' + msg.message + ' error class: ' + typeof msg);
                    reject(msg);
                }
            }
        });
    }

    static async CallbackToPromise_LeftParam<T>(func: string, ...argv: any[]): Promise<T>
    {
        const Instance = await this.InstancePromise();
        const PluginFunction: Function = Instance[func];

        return new Promise<T>((resolve, reject) =>
        {
            argv.push(succ, err);
            PluginFunction.call(this, ...argv);

            function succ(msg: any): void
            {
                resolve(msg);
            }

            function err(msg: any): void
            {
                if (TypeInfo.IsString(msg))
                {
                    console.warn('cordova plugin error: ' + msg);
                    reject(new ECordovaPlugin(msg));
                }
                else if (msg instanceof Error)
                {
                    console.warn('cordova plugin error: ' + msg.message + ' error class: ' + typeof msg);
                    reject(msg);
                }
            }
        });
    }

    protected static _GetInstance(PluginName: string): any
    {
        if (! TypeInfo.Assigned(window.cordova))
            return undefined;

        let Plugin = undefined;

        if (TypeInfo.Assigned(window.cordova.plugins))
            Plugin = window.cordova.plugins[PluginName];
        if (! TypeInfo.Assigned(Plugin))
            Plugin = window.cordova[PluginName];
        if (! TypeInfo.Assigned(Plugin))
            Plugin = window[PluginName];
        if (! TypeInfo.Assigned(Plugin))
            Plugin = navigator[PluginName];

        return Plugin;
    }

    protected static OnCreateInstance(Instance: any): void
    {
    }

    private static _Instance: any = undefined;

    protected constructor()
    {
    }
}
