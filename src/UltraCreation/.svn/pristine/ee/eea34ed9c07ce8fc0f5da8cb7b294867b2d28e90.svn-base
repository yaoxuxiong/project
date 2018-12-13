/**
 *  Native Setting Support, using multiple Plugins
 *
 *  Install Cordova Types
 *      npm i @types/cordova -D
 *
 *  Install NativeSettings Plugin for Open system native settings
 *      cordova plugin add cordova-open-native-settings --save
 *      https://github.com/guyromb/Cordova-open-native-settings
 *
 *  Install Cordova Network Manager Plugin for Enable/Disable Wifi
 *      cordova plugin add cordovanetworkmanager
 *      https://github.com/arsenal942/Cordova-Network-Manager
 *
 *  Install Network Interface for Get IP & Proxy Information
 *      cordova plugin add cordova-plugin-networkinterface
 *      https://github.com/salbahra/cordova-plugin-networkinterface
 *
 *  Install Diagnostic Plugin
 *      cordova plugin add cordova.plugins.diagnostic --save
 *      npm i @types/cordova.plugins.diagnostic -D
 *      https://github.com/dpa99c/cordova-diagnostic-plugin
 *
 *  Install Diagnostic Modules(config.xml):
 *      <preference name="cordova.plugins.diagnostic.modules" value="[list of modules]" />
 *  Available modules:
 *      LOCATION - Android, iOS, Windows 10 UWP
 *      BLUETOOTH - Android, iOS, Windows 10 UWP
 *      WIFI - Android, iOS, Windows 10 UWP
 *      CAMERA - Android, iOS, Windows 10 UWP NOTIFICATIONS - Android, iOS
 *      MICROPHONE - Android, iOS
 *      CONTACTS - Android, iOS
 *      CALENDAR - Android, iOS
 *      REMINDERS - iOS
 *      MOTION - iOS
 *      NFC - Android
 *      EXTERNAL_STORAGE - Android
 *
 *  for user manually open related Settings
 *      cordova plugin add cordova-open-native-settings --save
 */
import {TCordovaPlugin} from './Abstract.Plugin';
import {Subject} from 'rxjs/Subject';

import {TypeInfo} from '../Core/TypeInfo';
import {EAbort} from '../Core/Exception';
import {Platform} from '../Core/Platform';

const DEF_WIFI_CONNECT_TIMEOUT = 15000;

export namespace NativeSetting
{
/* LocationService */

    export class LocationService extends TCordovaPlugin
    {
        static readonly Name: string = 'diagnostic';
        static readonly Repository: string = 'cordova.plugins.diagnostic';

        static IsEnabled(): Promise<boolean>
        {
            return this.CallbackToPromise_LeftParam<boolean>('isLocationEnabled').catch(err => false);
        }

        static GoSetting(): void
        {
            this.CallFunction<void>('switchToLocationSettings');
        }

        static async WaitForEnable(): Promise<void>
        {
            if (! await this.IsEnabled())
            {
                await new Promise<void>((resolve, reject) =>
                {
                    this.OnStateChange.subscribe(next =>
                    {
                        if (next !== this.Instance.locationMode.LOCATION_OFF)
                            resolve();
                    },
                    err => {}, () => {});
                });
            }
        }

        protected static OnCreateInstance(Instance: any): void /**@override */
        {
            Instance.registerLocationStateChangeHandler((state: string) =>
            {
                console.log(state);
                this.OnStateChange.next(state);
            });
        }

        static OnStateChange = new Subject<string>();
    }

/* Network */

    export class TIpInformation
    {
        constructor ();
        constructor (obj: any);
        constructor (obj?: any)
        {
            if (TypeInfo.Assigned(obj))
            {
                if (TypeInfo.Assigned(obj.ip))
                    this.Ip = obj.ip;
                if (TypeInfo.Assigned(obj.subnet))
                    this.Subnet = obj.subnet;

                if (this.Ip !== '0.0.0.0')
                    this.IpAddr = this.ResolveAddr(this.Ip);

                if (this.Subnet !== '255.255.255.255')
                {
                    this.SubnetMask = this.ResolveAddr(this.Subnet);
                    if (this.SubnetMask === 0)
                        this.SubnetMask = 0xFFFFFFFF;
                }
            }
        }

        private ResolveAddr(Addr: string): number
        {
            let RetVal = 0;
            let LastIdx: number;
            let Idx = -1;

            while (true)
            {
                LastIdx = Idx + 1;
                Idx = Addr.indexOf('.', LastIdx);

                if (Idx !== -1)
                    RetVal = (RetVal << 8) + parseInt(Addr.substring(LastIdx, Idx));
                else
                    break;
            }
            RetVal = (RetVal * 256) + parseInt(Addr.substring(LastIdx, Idx));
            return RetVal;
        }

        Ip: string = '0.0.0.0';
        IpAddr: number = -1;

        Subnet: string = '255.255.255.255';
        SubnetMask: number = 0xFFFFFFFF;
    }

    export class Network extends TCordovaPlugin
    {
        static readonly Name: string = 'networkinterface';
        static readonly Repository: string = 'cordova-plugin-networkinterface';

        static GetWiFiIpInfomration(): Promise<TIpInformation>
        {
            return this.CallbackToPromise<any>('getWiFiIPAddress')
                .then(addr => new TIpInformation(addr));
        }

        static GetCarrierIpInfomration(): Promise<any>
        {
            return this.CallbackToPromise<any>('getCarrierIPAddress')
                .then(addr => new TIpInformation(addr));
        }
    }

/* Wifi */
    export let WifiConnectTimeout = DEF_WIFI_CONNECT_TIMEOUT;

    export class EWifi extends EAbort
    {
    }

    export class EWifiConnectTimeout extends EWifi
    {
    }

    export type TWifiAlgorithm = 'WPA' | 'WEP';
    export class Wifi extends TCordovaPlugin
    {
        static readonly Name: string = 'cordovaNetworkManager';
        static readonly Repository: string = 'cordovanetworkmanager';

        static async GetConnectedSSID(): Promise<string | undefined>
        {
            return this.CallbackToPromise<string>('getCurrentSSID')
                .then(ssid => JSON.parse(ssid))
                .catch((err: string) => Promise.resolve(undefined));
        }

        static async GetConnectedBSSID(): Promise<string | undefined>
        {
            return this.CallbackToPromise<string>('getCurrentBSSID')
            .then(bssid => JSON.parse(bssid))
            .catch((err: string) => Promise.resolve(undefined));
        }

        static Connect(ssid: string): Promise<void>;
        static Connect(ssid: string, password: string): Promise<void>;
        static Connect(ssid: string, password: string, algorithm: TWifiAlgorithm): Promise<void>;
        static async Connect(ssid: string, password?: string, algorithm: TWifiAlgorithm = 'WPA'): Promise<void>
        {
            const Tick = new Date().getTime();

            if (Platform.IsAndroid)
            {
                await this.Enable();

                let old_ssid = await this.GetConnectedSSID().then(ssid => ssid === undefined ? '' : ssid);

                if (old_ssid !== ssid)
                {
                    console.log('addNetwork ' + ssid);
                    const config = (await this.InstancePromise()).formatWifiConfig(ssid, password, algorithm);
                    await this.CallbackToPromise_LeftParam<void>('addNetwork', config);
                }
                else
                    old_ssid = '';

                const succ = await this.AndroidConnect(ssid, old_ssid);
                if (! succ)
                {
                    await new Promise<void>((resolve, reject) =>
                    {
                        const Intv = setInterval(() =>
                        {
                            if (new Date().getTime() - Tick > WifiConnectTimeout)
                            {
                                clearInterval(Intv);
                                reject(new EWifiConnectTimeout());
                            }

                            this.AndroidConnect(ssid, old_ssid)
                                .then(val =>
                                {
                                    if (val)
                                    {
                                        clearInterval(Intv);
                                        resolve();
                                    }
                                })
                                .catch(err =>
                                {
                                    clearInterval(Intv);
                                    reject(new EWifi(err.message));
                                });
                        }, 2900);
                    });
                }
            }
            else if (Platform.IsiOS)
            {
                await this.CallbackToPromise_LeftParam<string>('iOSConnectNetwork', ssid, password)
                    .then(val =>
                        console.log('iOSConnectNetwork: ' + val))
                    .catch((err: string) =>
                        Promise.reject(new EWifi(err)));
            }
            else
                throw new EWifi('unsupported platform');

            // wait ip to ensure connection is completed
            await new Promise<void>((resolve, reject) =>
            {
                const Intv = setInterval(() =>
                {
                    if (new Date().getTime() - Tick > WifiConnectTimeout)
                    {
                        clearInterval(Intv);
                        reject(new EWifiConnectTimeout());
                    }

                    Network.GetWiFiIpInfomration().then(IpInfo =>
                    {
                        if (TypeInfo.Assigned(IpInfo))
                        {
                            clearInterval(Intv);
                            resolve();
                        }
                    })
                    .catch(err => {});
                }, 1000);
            });
        }

        static Disconnect(ssid: string): Promise<void>
        {
            if (Platform.IsAndroid)
            {
                return this.CallbackToPromise_LeftParam<void>('androidDisconnectNetwork', ssid, '')
                    .catch((err: string) => Promise.reject(new EWifi(err)));
            }
            else if (Platform.IsiOS)
            {
                return this.CallbackToPromise_LeftParam<void>('iOSDisconnectNetwork', ssid)
                    .catch((err: string) => Promise.reject(new EWifi(err)));
            }
            else
                return Promise.reject(new EWifi('unsupported platform'));
        }

        static GoSetting(): void
        {
            return this.CallFunction<void>('switchToWifiSettings');
        }

    /** Android Only */
        private static AndroidConnect(ssid: string, old_ssid: string = ''): Promise<boolean>
        {
            return this.CallbackToPromise_LeftParam('androidConnectNetwork', ssid, old_ssid)
                .then(val =>
                {
                    console.log('wifi connect to ' + ssid + ': ' + val);
                    return val === 'COMPLETED';
                });
        }
        /*
        private static async IsEnabled(): Promise<boolean>
        {
            return this.CallbackToPromise<boolean>('isWifiEnabled');
        }
        */

        private static async Enable(): Promise<boolean>
        {
            return this.CallbackToPromise_LeftParam<boolean>('setWifiEnabled', true);
        }

        /*
        private static async Disable(): Promise<void>
        {
            return this.CallbackToPromise_LeftParam<void>('setWifiEnabled', false);
        }

        private static async Remove(ssid: string): Promise<void>
        {
            return this.CallbackToPromise_LeftParam<void>('removeNetwork', ssid);
        }
        */
    }

/* Setting */

    export class Setting extends TCordovaPlugin
    {
        static readonly Name: string = 'settings';
        static readonly Repository: string = 'cordova-open-native-settings';

        static Go(Setting: TAndroidSettings): Promise<void>;
        static Go(Setting: TIosSettings): Promise<void>;
        static Go(Setting: TAndroidSettings | TIosSettings): Promise<void>
        {
            return this.CallbackToPromise_LeftParam<void>('open', Setting)
                .catch(err => {});
        }
    }

    export type TAndroidSettings =
        'accessibility' |           // Show settings for accessibility modules
        'account' |                 // Show add account screen for creating a new account
        'airplane_mode' |           // Show settings to allow entering/exiting airplane mode
        'apn' |                     // Show settings to allow configuration of APNs
        'application_details' |     // Show screen of details about a particular application
        'application_development' | // Show settings to allow configuration of application development-related settings
        'application' |             // Show settings to allow configuration of application-related settings
        'battery_optimization' |    // Show screen for controlling which apps can ignore battery optimizations
        'bluetooth' |               // Show settings to allow configuration of Bluetooth
        'captioning' |              // Show settings for video captioning
        'cast' |                    // Show settings to allow configuration of cast endpoints
        'data_roaming' |            // Show settings for selection of 2G/3G
        'date' |                    // Show settings to allow configuration of date and time
        'display' |                 // Show settings to allow configuration of display
        'dream' |                   // Show Daydream settings
        'home' |                    // Show Home selection settings
        'keyboard' |                // Show settings to configure input methods, in particular allowing the user to enable input methods
        'keyboard_subtype' |        // Show settings to enable/disable input method subtypes
        'locale' |                  // Show settings to allow configuration of locale
        'location' |                // Show settings to allow configuration of current location sources
        'manage_all_applications' | // Show settings to manage all applications
        'manage_applications' |     // Show settings to manage installed applications
        'memory_card' |             // Show settings for memory card storage
        'network' |                 // Show settings for selecting the network operator
        'nfcsharing' |              // Show NFC Sharing settings
        'nfc_payment' |             // Show NFC Tap & Pay settings
        'nfc_settings' |            // Show NFC settings
        'print' |                   // Show the top level print settings
        'privacy' |                 // Show settings to allow configuration of privacy options
        'quick_launch' |            // Show settings to allow configuration of quick launch shortcuts
        'search' |                  // Show settings for global search
        'security' |                // Show settings to allow configuration of security and location privacy
        'settings' |                // Show system settings
        'show_regulatory_info' |    // Show the regulatory information screen for the device
        'sound' |                   // Show settings to a llow configuration of sound and volume
        'storage' |                 // Show settings for internal storage
        'store' |                   // Open the Play Store page of the current application;
        'sync' |                    // Show settings to allow configuration of sync settings
        'usage' |                   // Show settings to control access to usage information
        'user_dictionary' |         // Show settings to manage the user input dictionary
        'voice_input' |             // Show settings to configure input methods, in particular allowing the user to enable input methods
        'wifi_ip' |                 // Show settings to allow configuration of a static IP address for Wi-Fi
        'wifi' |                    // Show settings to allow configuration of Wi-Fi
        'wireless';                 // Show settings to allow configuration of wireless controls such as Wi-Fi, Bluetooth and Mobile networks;

    export type TIosSettings =
        'about' |  // Settings > General > About
        'accessibility' |  // Settings > General > Accessibility
        'account' |  // Settings > Your name
        'airplane_mode' |  // Settings > Airplane Mode
        'application_details' |  // Settings
        'autolock' |  // Settings > General > Auto-Lock (before iOS 10)
        'battery' |  // Settings > Battery
        'bluetooth' |  // Settings > General > Bluetooth (before iOS 9) Settings > Bluetooth (after iOS 9)
        'browser' |  // Settings > Safari
        'castle' |  // Settings > iCloud
        'cellular_usage' |  // Settings > General > Cellular Usage
        'configuration_list' |  // Settings > General > Profile
        'date' |  // Settings > General > Date & Time
        'display' |  // Settings > Display & Brightness
        'do_not_disturb' |  // Settings > Do Not Disturb
        'facetime' |  // Settings > Facetime
        'keyboard' |  // Settings > General > Keyboard
        'keyboards' |  // Settings > General > Keyboard > Keyboards
        'locale' |  // Settings > General > Language & Region
        'location' |  // Settings > Location Services (in older versions of iOS)
        'locations' |  // Settings > Privacy > Location Services (in newer versions of iOS)
        'mobile_data' |  // Settings > Mobile Data (after iOS 10)
        'music' |  // Settings > iTunes
        'music_equalizer' |  // Settings > Music > EQ
        'music_volume' |  // Settings > Music > Volume Limit
        'network' |  // Settings > General > Network
        'nike_ipod' |  // Settings > Nike + iPod
        'notes' |  // Settings > Notes
        'notification_id' |  // Settings > Notifications
        'passbook' |  // Settings > Passbook & Apple Pay
        'phone' |  // Settings > Phone
        'photos' |  // Settings > Photo & Camera
        'privacy' |  // Settings > Privacy
        'reset' |  // Settings > General > Reset
        'ringtone' |  // Settings > Sounds > Ringtone
        'search' |  // Settings > General > Assistant (before iOS 10) Settings > Siri (after iOS 10)
        'settings' |  // Settings > General
        'sound' |  // Settings > Sounds
        'software_update' |  // Settings > General > Software Update
        'storage' |  // Settings > iCloud > Storage & Backup
        'store' |  // Settings > iTunes & App Store
        'tethering' |  // Settings > Personal Hotspot
        'touch' |  // Settings > Touch ID & Passcode
        'twitter' |  // Settings > Twitter
        'usage' |  // Settings > General > Storage & iCloud Usage
        'video' |  // Settings > Video
        'vpn' |  // Settings > General > VPN
        'wallpaper' |  // Settings > Wallpaper
        'wifi';  // Settings > WIFI
}
