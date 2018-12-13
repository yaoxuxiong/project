import {TIdentify} from './common';

export interface IFile
{
    Id: TIdentify;
    Name?: string;
    Type: string;
    Path?: string;
    Timestamp: Date;
}
