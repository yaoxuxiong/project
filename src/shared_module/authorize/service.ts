import {Injectable} from '@angular/core';
import {TBasicAuthService} from '../cloud/basic_auth';

@Injectable()
export class TAuthService extends TBasicAuthService
{
    constructor()
    {
        super(Config.API_ENDPOINT);
    }
}
