import {Observable} from 'rxjs/Observable';

import {TypeInfo} from '../../../UltraCreation/Core/TypeInfo';
import {TStringBuilder} from '../../../UltraCreation/Core/StringBuilder';
import {Exception} from '../../../UltraCreation/Core/Exception';
import {SocketAPI, TUDPTranscever} from './Socket';
import {TUtf8Encoding} from '../../Encoding/Utf8';

import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/from';
import 'rxjs/add/operator/concatMap';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/toArray';
import 'rxjs/add/operator/filter';


class EHttp extends Exception
{
    constructor(public Status: number)
    {
        super();

        // http server error
        if (Status >= 500 && Status < 600)
            this.message = 'HTTP Server Error: ' + Status;
        // http client error
        else if (Status >= 400)
            this.message = 'HTTP Client Error: ' + Status;
        // http redirection
        else if (Status >= 300)
            this.message = 'HTTP Redirection: ' + Status;
        // http successful
        else if (Status >= 200)
            this.message = 'HTTP Successful: ' + Status;
        // http informational
        else if (Status >= 100)
            this.message = 'HTTP Informational: ' + Status;
        else if (Status === -1)
            this.message = 'HTTP Request Error';
        else if (Status === -2)
            this.message = 'HTTP Request Timeout';
        else
            this.message = 'HTTP Unknown Status: ' + Status;
    }
}

function HttpRequest(Url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    ResponseType: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text',
    Timeout: number,
    Header?: Map<string, string>, Body?: string): Observable<any>
{
    console.log('url = ' + Url);
    return Observable.create((observer: any) =>
    {
        const req = new XMLHttpRequest();
        req.timeout = Timeout;

        req.onprogress = function (this: XMLHttpRequestEventTarget, ev: ProgressEvent)
        {
            console.log('XMLHttpRequest loading ' + ev.loaded + ' of ' + ev.total);
        };
        req.onload = function (this: XMLHttpRequestEventTarget, ev: Event)
        {
            // console.log('XMLHttpRequest done');

            if (req.status === 200 || req.status === 0)
            {
                observer.next(req.response);
                observer.complete();
            }
            else
                observer.error(new EHttp(req.status));
        };
        req.onerror = function (this: XMLHttpRequestEventTarget, ev: ErrorEvent)
        {
            observer.error(new EHttp(-1));
        };
        req.ontimeout = function (this: XMLHttpRequestEventTarget, ev: ProgressEvent)
        {
            observer.error(new EHttp(-2));
        };

        req.open(method, Url, true);
        console.log('XMLHttpRequest opened, readyState:', req.readyState);

        if (TypeInfo.Assigned(Header))
        {
            for (const [key, value] of Array.from(Header.entries()))
            {
                console.log('http key = ' + key);
                console.log('http value = ' + value);
                req.setRequestHeader(key, value);
            }
        }

        req.responseType = ResponseType;
        if (!TypeInfo.Assigned(Body))
            req.send(null);
        else
        {
            console.log('body = ' + Body);
            req.send(Body);
        }
    });
}

/**
 * A TPortMappingEntry is the class used to represent port mappings on
 * the GatewayDevice.
 *
 * A port mapping on the GatewayDevice will allow all packets directed to port
 * externalPort of the external IP address of the GatewayDevice
 * using the specified protocolto be redirected to port
 * internalPort of internalClient
 * **/
export class TPortMappingEntry
{
    /**
     * The internal port
     */
    internalPort: number;
    /**
     * The external port of the mapping (the one on the GatewayDevice)
     */
    externalPort: number;
    /**
     * The remote host this mapping is associated with
     */
    remoteHost: string;
    /**
     * The internal host this mapping is associated with
     */
    internalClient: string;
    /**
     * The protocol associated with this mapping (i.e. <tt>TCP</tt> or
     * <tt>UDP</tt>)
     */
    protocol: string;
    /**
     * A flag that tells whether the mapping is enabled or not
     * (<tt>"1"</tt> for enabled, <tt>"0"</tt> for disabled)
     */
    enabled: string;
    /**
     * A human readable description of the port mapping (used for display
     * purposes)
     */
    portMappingDescription: string;
}

/*
*  Task class for sending a search datagram and process the response.
*/
export class TSendDiscoveryTask
{
    constructor(private LocalIp: string, private Msg: string)
    {

    }

    start(): Promise<string>
    {
        return new Promise<string>((resolve, reject) =>
        {
            const timeoutTask = setTimeout(() =>
            {
                reject('http timeout');
                // reject();
            }, 10 * 1000);

            let SSDP = new TUDPTranscever({ Host: this.LocalIp, Port: 0 });
            SSDP.OnReadReady.subscribe(conn =>
            {
                const data = new Uint8Array(1024);

                conn.Read(data, 1024).then(result =>
                {
                    if (result <= 0)
                        return;

                    const temp = new Uint8Array(data.buffer, 0, data.buffer.byteLength);
                    const response = TUtf8Encoding.Decode(temp);
                    console.log('result = ' + response);
                    resolve(response);
                    SSDP.Close();
                    SSDP = null;
                    clearTimeout(timeoutTask);
                });
            });

            SSDP.Open()
                .then(() =>
                {
                    console.log('ssdp startted.');
                })
                .catch(err =>
                {
                    console.error(err.message);
                    SSDP.Close();
                    SSDP = null;
                    clearTimeout(timeoutTask);
                    reject(err.message);
                });

            const MsgBuffer = TUtf8Encoding.Encode(this.Msg);
            const RemoteAddr = TGatewayDiscover.IP + ':' + TGatewayDiscover.PORT;
            SSDP.SendTo(MsgBuffer.buffer, RemoteAddr);
        });
    }
}

export class TGatewayDevice
{

    toString()
    {
        return 'GatewayDevice{' +
            'st=\'' + this.st + '\'' +
            ', location=\'' + this.location + '\'' +
            ', serviceType=\'' + this.serviceType + '\'' +
            ', serviceTypeCIF=\'' + this.serviceTypeCIF + '\'' +
            ', urlBase=\'' + this.urlBase + '\'' +
            ', controlURL=\'' + this.controlURL + '\'' +
            ', controlURLCIF=\'' + this.controlURLCIF + '\'' +
            ', eventSubURL=\'' + this.eventSubURL + '\'' +
            ', eventSubURLCIF=\'' + this.eventSubURLCIF + '\'' +
            ', sCPDURL=\'' + this.sCPDURL + '\'' +
            ', sCPDURLCIF=\'' + this.sCPDURLCIF + '\'' +
            ', deviceType=\'' + this.deviceType + '\'' +
            ', deviceTypeCIF=\'' + this.deviceTypeCIF + '\'' +
            ', friendlyName=\'' + this.friendlyName + '\'' +
            ', manufacturer=\'' + this.manufacturer + '\'' +
            ', modelDescription=\'' + this.modelDescription + '\'' +
            ', presentationURL=\'' + this.presentationURL + '\'' +
            ', localAddress=' + this.localAddress +
            ', modelNumber=\'' + this.modelNumber + '\'' +
            ', modelName=\'' + this.modelName + '\'' +
            '}';
    }

    /**
     * Retrieves the properties and description of the GatewayDevice.
     * <p/>
     * Connects to the device's location and parses the response
     * using a TGatewayDeviceHandler to populate the fields of this
     * class
     **/
    loadDescription(): Observable<TGatewayDevice>
    {
        console.log('this.location = ' + this.location);


        return HttpRequest(this.location, 'GET', 'text', TGatewayDevice.httpReadTimeout).map(res =>
        {
            console.log('res = ' + res);
            const parser = new TGatewayDeviceParser(this);
            parser.parse(res);
            console.log('parse end');
            let ipConDescURL: string;
            if (this.urlBase !== null && (this.urlBase.trim()).length > 0)
            {
                ipConDescURL = this.urlBase;
            } else
            {
                ipConDescURL = this.location;
            }

            const lastSlashIndex: number = ipConDescURL.indexOf('/', 7);
            if (lastSlashIndex > 0)
            {
                ipConDescURL = ipConDescURL.substring(0, lastSlashIndex);
            }

            this.sCPDURL = this.copyOrCatUrl(ipConDescURL, this.sCPDURL);
            this.controlURL = this.copyOrCatUrl(ipConDescURL, this.controlURL);
            this.controlURLCIF = this.copyOrCatUrl(ipConDescURL, this.controlURLCIF);
            this.presentationURL = this.copyOrCatUrl(ipConDescURL, this.presentationURL);
            return this;
        });
    }
    /**
     * Retrieves the connection status of this device
     **/
    isConnected(): Promise<boolean>
    {
        return this.simpleUPnPcommand(this.controlURL, this.serviceType, 'GetStatusInfo', null)
            .then((nameValue) =>
            {
                if (!TypeInfo.Assigned(nameValue))
                    return false;
                const connectionStatus = nameValue.get('NewConnectionStatus');
                if (TypeInfo.Assigned(connectionStatus) &&
                    connectionStatus.toLowerCase() === 'connected')
                {
                    return true;
                }
                return false;
            });
    }

    /**
    * Retrieves the number of port mappings that are registered on the
    * GatewayDevice.
    **/
    getPortMappingNumberOfEntries(): Promise<number>
    {
        return new Promise<number>((resolve, reject) =>
        {
            this.simpleUPnPcommand(this.controlURL, this.serviceType, 'GetPortMappingNumberOfEntries', null)
                .then((nameValue) =>
                {
                    if (!TypeInfo.Assigned(nameValue))
                        resolve(0);
                    const portMappingNumber = nameValue.get('NewPortMappingNumberOfEntries');
                    if (TypeInfo.Assigned(portMappingNumber))
                    {
                        resolve(parseInt(portMappingNumber, 10));
                    }
                    resolve(0);
                })
                .catch(e =>
                {
                    resolve(0);
                });
        });
    }

    /**
    * Adds a new port mapping to the GatewayDevices using the supplied
    * parameters.
    *
    * @param externalPort   the external associated with the new mapping
    * @param internalPort   the internal port associated with the new mapping
    * @param internalClient the internal client associated with the new mapping
    * @param protocol       the protocol associated with the new mapping
    * @param description    the mapping description
    * @return true if the mapping was successfully added, false otherwise
    */
    addPortMapping(externalPort: number, internalPort: number,
        internalClient: string, protocol: string, description: string): Promise<boolean>
    {
        const args = new Map<string, string>();
        args.set('NewRemoteHost', '');
        args.set('NewExternalPort', externalPort.toString());
        args.set('NewProtocol', protocol);
        args.set('NewInternalPort', internalPort.toString());
        args.set('NewInternalClient', internalClient);
        args.set('NewEnabled', '1');
        args.set('NewPortMappingDescription', description);
        args.set('NewLeaseDuration', '0');

        return new Promise<boolean>((resolve, reject) =>
        {
            this.simpleUPnPcommand(this.controlURL, this.serviceType, 'AddPortMapping', args)
                .then((nameValue) =>
                {
                    if (!TypeInfo.Assigned(nameValue))
                        resolve(false);

                    const isSuccess = !nameValue.has('errorCode');
                    resolve(isSuccess);
                })
                .catch(e =>
                {
                    resolve(false);
                });
        });
    }

    /**
    * Deletes the port mapping associated to <tt>externalPort</tt> and
    * <tt>protocol</tt>
    *
    * @param externalPort the external port
    * @param protocol     the protocol
    * @return true if removal was successful
    */

    deletePortMapping(externalPort: number, protocol: string): Promise<boolean>
    {
        const args = new Map<string, string>();
        args.set('NewRemoteHost', '');
        args.set('NewExternalPort', externalPort.toString());
        args.set('NewProtocol', protocol);

        return new Promise<boolean>((resolve, reject) =>
        {
            this.simpleUPnPcommand(this.controlURL, this.serviceType, 'DeletePortMapping', args)
                .then((nameValue) =>
                {
                    if (!TypeInfo.Assigned(nameValue))
                        resolve(false);

                    resolve(true);
                })
                .catch(e =>
                {
                    resolve(false);
                });
        });
    }
    /**
    * Returns a specific port mapping entry, depending on a the supplied index.
    *
    * @param index            the index of the desired port mapping
    * @param portMappingEntry the entry containing the details, in any is
    *                         present, <i>null</i> otherwise. <i>(used as return value)</i>
    * @return true if a valid mapping is found
    **/

    getGenericPortMappingEntry(index: number, portMapEntry: TPortMappingEntry): Promise<boolean>
    {
        const args = new Map<string, string>();
        args.set('NewPortMappingIndex', index.toString());

        return new Promise<boolean>((resolve, reject) =>
        {
            this.simpleUPnPcommand(this.controlURL, this.serviceType, 'GetGenericPortMappingEntry', args)
                .then((nameValue) =>
                {
                    if (!TypeInfo.Assigned(nameValue) || nameValue.has('errorCode'))
                        resolve(false);

                    portMapEntry.remoteHost = nameValue.get('NewRemoteHost');
                    portMapEntry.internalClient = nameValue.get('NewInternalClient');
                    portMapEntry.protocol = nameValue.get('NewProtocol');
                    portMapEntry.enabled = nameValue.get('NewEnabled');
                    portMapEntry.portMappingDescription = nameValue.get('NewPortMappingDescription');
                    portMapEntry.internalPort = parseInt(nameValue.get('NewInternalPort'), 10);
                    portMapEntry.externalPort = parseInt(nameValue.get('NewExternalPort'), 10);

                    resolve(true);
                })
                .catch(e =>
                {
                    resolve(false);
                });
        });
    }
    /**
     * Retrieves the external IP address associated with this device
     * <p/>
     * The external address is the address that can be used to connect to the
     * GatewayDevice from the external network
     *
     * @return the external IP
     **/
    getExternalIPAddress(): Promise<string>
    {
        return this.simpleUPnPcommand(this.controlURL, this.serviceType, 'GetExternalIPAddress', null)
            .then((nameValue) =>
            {
                if (!TypeInfo.Assigned(nameValue))
                    return null;

                return nameValue.get('NewExternalIPAddress');
            });
    }


    getSpecificPortMappingEntry(externalPort: number, protocol: string, portMapEntry: TPortMappingEntry): Promise<boolean>
    {
        portMapEntry.externalPort = externalPort;
        portMapEntry.protocol = protocol;
        const args = new Map<string, string>();
        args.set('NewRemoteHost', '');
        args.set('NewExternalPort', externalPort.toString());
        args.set('NewProtocol', protocol);

        return new Promise<boolean>((resolve, reject) =>
        {
            this.simpleUPnPcommand(this.controlURL, this.serviceType, 'GetSpecificPortMappingEntry', args)
                .then((nameValue) =>
                {
                    if (!TypeInfo.Assigned(nameValue) || nameValue.has('errorCode'))
                        resolve(false);
                    if (!nameValue.has('NewInternalClient') || !nameValue.has('NewInternalPort'))
                        resolve(false);

                    portMapEntry.protocol = protocol;
                    portMapEntry.enabled = nameValue.get('NewEnabled');
                    portMapEntry.internalClient = nameValue.get('NewInternalClient');
                    portMapEntry.externalPort = externalPort;
                    portMapEntry.portMappingDescription = nameValue.get('NewPortMappingDescription');
                    portMapEntry.internalPort = parseInt(nameValue.get('NewInternalPort'), 10);
                    portMapEntry.remoteHost = nameValue.get('NewRemoteHost');

                    resolve(true);
                })
                .catch(e =>
                {
                    resolve(false);
                });
        });
    }
    /**
    * Issues UPnP commands to a GatewayDevice that can be reached at the
    * specified url
    *
    * The command is identified by a service and an action
    * and can receive arguments
    * */
    simpleUPnPcommand(url: string, service: string, action: string, args: Map<string, string>): Promise<Map<string, string>>
    {
        const soapAction = '"' + service + '#' + action + '"';
        const builder = new TStringBuilder();
        builder.Append('<?xml version="1.0"?>\r\n' +
            '<SOAP-ENV:Envelope ' +
            'xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" ' +
            'SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">' +
            '<SOAP-ENV:Body>' +
            '<m:' + action + ' xmlns:m="' + service + '">');

        if (TypeInfo.Assigned(args) && args.size > 0)
        {
            for (const [key, value] of Array.from(args.entries()))
            {
                console.log('key = ' + key);
                console.log('value = ' + value);
                builder.Append('<' + key + '>' + value + '</' + key + '>');
            }
        }

        builder.Append('</m:' + action + '>');
        builder.Append('</SOAP-ENV:Body></SOAP-ENV:Envelope>');

        const bodyStr = builder.toString();

        const Header = new Map<string, string>();
        Header.set('Content-Type', 'text/xml');
        Header.set('SOAPAction', soapAction);
        return HttpRequest(url, 'POST', 'text', TGatewayDevice.httpReadTimeout, Header, bodyStr).toPromise()
            .then((res) =>
            {
                console.log(url + ' res = ' + res);
                const nameValue = new Map<string, string>();
                const parser = new TNameValueParser(nameValue);
                parser.parse(res);
                return nameValue;
            });

    }

    private copyOrCatUrl(dst: string, src: string): string
    {
        if (TypeInfo.Assigned(src))
        {
            if (src.startsWith('http://'))
            {
                dst = src;
            } else
            {
                if (!src.startsWith('/'))
                {
                    dst += '/';
                }
                dst += src;
            }
        }
        return dst;
    }

    st: string;
    location: string;
    serviceType: string;
    serviceTypeCIF: string;
    urlBase: string;
    controlURL: string;
    controlURLCIF: string;
    eventSubURL: string;
    eventSubURLCIF: string;
    sCPDURL: string;
    sCPDURLCIF: string;
    deviceType: string;
    deviceTypeCIF: string;

    // description data

    /**
     * The friendly (human readable) name associated with this device
     */
    friendlyName: string;

    /**
     * The device manufacturer name
     */
    manufacturer: string;

    /**
     * The model description as a string
     */
    modelDescription: string;

    /**
     * The URL that can be used to access the IGD interface
     */
    presentationURL: string;

    /**
     * The address used to reach this machine from the GatewayDevice
     */
    localAddress: string;

    /**
     * The model number (used by the manufacturer to identify the product)
     */
    modelNumber: string;

    /**
     * The model name
     */
    modelName: string;

    /**
     * Timeout in milliseconds for HTTP reads
     */
    private static httpReadTimeout = 7000;

}

export class TNameValueParser
{
    constructor(nameValue: Map<string, string>)
    {
        this.nameValue = nameValue;
    }

    public parse(xml: string): void
    {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'text/xml');
        this.handle(doc.documentElement);
    }

    private handle(node: Node)
    {
        if (node.hasChildNodes())
        {

            if (node.childNodes.length === 1 && node.childNodes[0].nodeType === 3)
            {
                this.getOther(node.nodeName, false, node.textContent);
                return;
            }
            this.getOther(node.nodeName, true, null);

            for (let i = 0; i < node.childNodes.length; i++)
            {
                this.handle(node.childNodes[i]);
            }
        }
    }

    private getOther(name: string, hasChild: boolean, data: string)
    {
        if (!hasChild)
        {
            const oldValue = this.nameValue.get(name);
            if (oldValue)
            {
                this.nameValue.set(name, oldValue + data);
            }
            else
            {
                this.nameValue.set(name, data);
            }

        }
    }

    private nameValue: Map<string, string>;
}

export class TGatewayDeviceParser
{
    constructor(device: TGatewayDevice)
    {
        this.device = device;
    }

    public parse(xml: string): void
    {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'text/xml');
        this.handle(doc.documentElement);
    }

    private handle(node: Node)
    {
        if (node.hasChildNodes())
        {
            if (node.childNodes.length === 1 && node.childNodes[0].nodeType === 3)
            {
                this.getOther(node.nodeName, false, node.textContent);
                return;
            }
            if (node.nodeName === 'serviceList')
            {
                this.getServiceList(node);
                return;
            }
            else
                this.getOther(node.nodeName, true, null);

            for (let i = 0; i < node.childNodes.length; i++)
            {
                this.handle(node.childNodes[i]);
            }
        }
    }

    private getServiceList(node: Node)
    {
        for (let i = 0; i < node.childNodes.length; i++)
        {

            const item = node.childNodes[i];
            if (item.nodeName !== 'service')
                continue;
            this.getService(item);
        }
    }

    private getService(node: Node)
    {
        const cif = 'urn:schemas-upnp-org:service:WANCommonInterfaceConfig:1';
        const type1 = 'urn:schemas-upnp-org:service:WANIPConnection:';
        const type2 = 'urn:schemas-upnp-org:service:WANPPPConnection:';

        let serviceType;
        let SCPDURL;
        let controlURL;
        let eventSubURL;
        for (let i = 0; i < node.childNodes.length; i++)
        {
            const name = node.childNodes[i].nodeName;
            const data = node.childNodes[i].textContent;
            if ('serviceType' === name)
            {
                serviceType = data;
            }
            else if ('SCPDURL' === name)
            {
                SCPDURL = data;
            }
            else if ('controlURL' === name)
            {
                controlURL = data;
            }
            else if ('eventSubURL' === name)
            {
                eventSubURL = data;
            }
        }

        if (TypeInfo.Assigned(this.device.serviceTypeCIF) && this.device.serviceTypeCIF.indexOf(cif) === 0)
        {
            if (TypeInfo.Assigned(this.device.serviceType) &&
                (this.device.serviceType.indexOf(type1) >= 0 || this.device.serviceType.indexOf(type2) >= 0))
                return;
            this.device.serviceType = serviceType;
            this.device.controlURL = controlURL;
            this.device.eventSubURL = eventSubURL;
            this.device.sCPDURL = SCPDURL;
        }
        else
        {
            this.device.serviceTypeCIF = serviceType;
            this.device.controlURLCIF = controlURL;
            this.device.eventSubURLCIF = eventSubURL;
            this.device.sCPDURLCIF = SCPDURL;
        }
    }

    private getOther(name: string, hasChild: boolean, data: string)
    {
        if (!hasChild)
        {
            if ('URLBase' === name)
                this.device.urlBase = data;
            else if ('friendlyName' === name)
                this.device.friendlyName = data;
            else if ('manufacturer' === name)
                this.device.manufacturer = data;
            else if ('modelDescription' === name)
                this.device.modelDescription = data;
            else if ('presentationURL' === name)
                this.device.presentationURL = data;
            else if ('modelNumber' === name)
                this.device.modelNumber = data;
            else if ('modelName' === name)
                this.device.modelName = data;
            else if ('deviceType' === name)
            {
                const cif = 'urn:schemas-upnp-org:service:WANCommonInterfaceConfig:1';
                const type1 = 'urn:schemas-upnp-org:service:WANIPConnection:';
                const type2 = 'urn:schemas-upnp-org:service:WANPPPConnection:';
                if (TypeInfo.Assigned(this.device.serviceTypeCIF) && this.device.serviceTypeCIF.indexOf(cif) === 0)
                {
                    if (TypeInfo.Assigned(this.device.serviceType) &&
                        (this.device.serviceType.indexOf(type1) >= 0 || this.device.serviceType.indexOf(type2) >= 0))
                        return;
                    this.device.deviceType = data;
                } else
                {
                    this.device.deviceTypeCIF = data;
                }
            }
        }
    }
    private device: TGatewayDevice;
}

/**
 * Handles the discovery of GatewayDevices, via the {@link TGatewayDiscover#discover()} method.
 */
export class TGatewayDiscover
{
    constructor(types: string[] = TGatewayDiscover.DEFAULT_SEARCH_TYPES)
    {
        this.searchTypes = types;
        this.deviceList = [];
    }

    getLocalInetAddresses(): Promise<string[]>
    {
        return SocketAPI.GetIfAddrs();
    }
    /**
    * Discovers Gateway Devices on the network(s) the executing machine is
    * connected to.
    * <p>
    * The host may be connected to different networks via different network
    * interfaces.
    * Assumes that each network interface has a different InetAddress and
    * returns a map associating every GatewayDevice (responding to a broadcast
    * discovery message) with the InetAddress it is connected to.
    *
    * @return a map containing a GatewayDevice per Address
    */
    async discover(): Promise<TGatewayDevice[]>
    {
        const address = await this.getLocalInetAddresses();
        this.deviceList = [];
        for (const type of this.searchTypes)
        {
            for (const addr of address)
            {
                const Msg: string = 'M-SEARCH * HTTP/1.1\r\n' +
                    'HOST: ' + TGatewayDiscover.IP + ':' + TGatewayDiscover.PORT + '\r\n' +
                    'ST: ' + type + '\r\n' +
                    'MAN: \"ssdp:discover\"\r\n' +
                    'MX: 2\r\n\r\n';
                const response = await new TSendDiscoveryTask(addr, Msg).start();
                if (!TypeInfo.Assigned(response))
                    continue;
                const device = this.parseMSearchReply(response);
                device.localAddress = addr;
                await device.loadDescription().toPromise();
                this.deviceList.push(device);
            }
            if (this.deviceList.length > 0)
                break;
        }

        return this.deviceList;
    }
    /**
    * Parses the reply from UPnP devices
    */
    parseMSearchReply(info: string): TGatewayDevice
    {
        const device = new TGatewayDevice();
        const array = info.split('\n');
        for (let index = 0; index < array.length; index++)
        {
            const line = array[index].trim();
            if (line.length === 0)
                continue;

            if (line.startsWith('HTTP/1.') || line.startsWith('NOTIFY *'))
                continue;

            let key = line.substring(0, line.indexOf(':'));
            console.log('key = ' + key);
            let value = line.length > key.length + 1 ? line.substring(key.length + 1) : null;
            // console.log("value = " + value);

            key = key.trim();
            if (value !== null)
                value = value.trim();
            if (key.toLowerCase() === 'location')
                device.location = value;

            if (key.toLowerCase() === 'st')
                device.st = value;
        }
        return device;
    }

    public async getValidGateway(): Promise<TGatewayDevice>
    {
        for (const device of this.deviceList)
        {
            const isConnected = await device.isConnected();
            if (isConnected)
                return device;
        }
        return null;
    }

    static PORT: number = 1900;
    static IP: string = '239.255.255.250';
    static DEFAULT_SEARCH_TYPES: string[] = [
        'urn:schemas-upnp-org:device:InternetGatewayDevice:1',
        'urn:schemas-upnp-org:service:WANIPConnection:1',
        'urn:schemas-upnp-org:service:WANPPPConnection:1'
    ];

    private searchTypes: string[];
    private deviceList: TGatewayDevice[] = [];
}
