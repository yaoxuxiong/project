import {THttpClient} from '../../UltraCreation/Core/Http';

declare global
{
    var Config: IConfig;

    interface Window
    {
        Config: IConfig | undefined;
    }
}

export interface IConfig
{
    API_ENDPOINT: string;
    [key: string]: any;
}

export async function LoadConfig(Path: string): Promise<void>
{
    const Http = new THttpClient('json');
    window.Config = await Http.Get(Path).toPromise().then(res => res.Content);
}
