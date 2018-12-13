import {isDevMode} from '@angular/core';
import {EAbort} from '../UltraCreation/Core/Exception';
import {InitializeStorage, TSqliteEngine} from '../UltraCreation/Storage/Engine/cordova.sqlite';
import {TAssetService, TApplication} from '.';

export namespace Initialization
{
    export async function Execute(): Promise<void>
    {
        const db_version = '8';
        const db = InitializeStorage(new TSqliteEngine('bbmon.sqlite'));
        db.DebugTracing = isDevMode();
        const conn = await db.GetConnection();

        const DataSet = await conn.ExecQuery('SELECT name FROM sqlite_master WHERE type="table" AND name="Asset"');
        if (DataSet.RecordCount === 1)
        {
            const Value = await conn.Get('db_version').catch(err => 'destroying');
            if (Value !== db_version)
                await Reconstruct();
            else
                console.log('skipping init data');
        }
        else
            await Reconstruct();

        await conn.Set('db_version', db_version).catch((err) => {});
        conn.Release();

        await TAssetService.Initialize();

        async function Reconstruct()
        {
            console.log('Reconstruct');
            await conn.DropEveryThing();

            await conn.ExecQuery(InitTableSQL);
            await conn.ExecQuery(InitDataSQL);
        }
    }
    const InitTableSQL: string[] =
    [
    // Assets
        'CREATE TABLE IF NOT EXISTS Asset(' +
            'Id VARCHAR(38) NOT NULL PRIMARY KEY,' +
            'ObjectName VARCHAR(50) NOT NULL,' +
            'Name VARCHAR(100) NOT NULL,' +
            'Owner VARCHAR(38) NULL,' +
            'Desc TEXT,' +
            'ExtraProp TEXT,' +                 // extra properties persist in json
            'Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP);',
        'CREATE INDEX IF NOT EXISTS IDX_Asset_ObjectName ON Asset(ObjectName, Name);',
        'CREATE INDEX IF NOT EXISTS IDX_Asset_Name ON Asset(Name);',
        'CREATE INDEX IF NOT EXISTS IDX_Asset_Owner ON Asset(Owner);',

    // Profile
        'CREATE TABLE IF NOT EXISTS Profile(' +
            'Id VARCHAR(38) NOT NULL PRIMARY KEY,' +
            'Type VARCHAR(50) NOT NULL,' +
            'Name VARCHAR(255) NOT NULL,' +
            'Avatar VARCHAR(255),' +
            'ExtraProp TEXT)',

        'CREATE TABLE IF NOT EXISTS Sampling(' +
            'Profile_Id VARCHAR(38),' +
            'Type TINYINT NOT NULL,' +
            'Value DECIMAL(10, 2),' +
            'Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,' +
            'FOREIGN KEY(Profile_Id) REFERENCES Profile(Id) ON UPDATE CASCADE ON DELETE CASCADE);',
        'CREATE INDEX IF NOT EXISTS IDX_Sampling ON Sampling(Profile_Id, Type, Timestamp);',

    // Medicine
        'CREATE TABLE IF NOT EXISTS Medicine(' +
            'Id VARCHAR(38),' +
            'Picture VARCHAR(255),' +
            'Note TEXT,' +
            'Start INT NOT NULL,' +
            'End INT NOT NULL,' +
            'Interval INT NOT NULL,' +
            'TS DATETIME DEFAULT CURRENT_TIMESTAMP);' ,
    ];


    const InitDataSQL: string[] =
    [
    ];
}
