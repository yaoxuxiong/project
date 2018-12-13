import {Injectable} from '@angular/core';

import {TypeInfo} from '../../UltraCreation/Core/TypeInfo';
import {UnitConv} from '../../UltraCreation/Core/Conv';
import {TBasicAssetService} from '../shared_service/asset.basic';

// call register british units
import '../../UltraCreation/Localize/iso_british';

@Injectable()
export class TAssetService extends TBasicAssetService
{
    static async Initialize(): Promise<void>
    {
        super.Initialize();

        let lang = App.Translation.getBrowserLang();
        if (! TypeInfo.Assigned(lang))
            lang = 'en';

        App.AddLanguage(lang, await this.LoadTranslation('ui.json', lang));

        try
        {
            const ary = JSON.parse(localStorage.getItem('unit_defaults'));
            UnitConv.ImportDefaults(ary);
        }
        catch (e)
        {
        }
    }

    static async LoadFirmware(Version: number): Promise<ArrayBuffer>
    {
        let RetVal: ArrayBuffer = null;
        let FileName: string;

        if (0 !== Version && (Version > 0x1007 && Version < 0x1009))
        {
            FileName = 'BBmon.bin';
            RetVal = await this.LoadStaticFile(FileName, 'arraybuffer', 'assets/bin/');
        }

        return RetVal;
    }

    async SaveDefaultConverts(): Promise<void>
    {
        const ary = UnitConv.ExportDefaults();
        localStorage.setItem('unit_defaults', JSON.stringify(ary));
    }
}
