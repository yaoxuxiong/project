import {THttpClient} from './Client';
// import {THttpMethod} from './Types';

export class TRestClient extends THttpClient
{
    constructor(public Endpoint: string)
    {
        super('json', Endpoint);
        this.Headers.Set('Content-Type', 'application/json; charset=utf-8');
    }
}
