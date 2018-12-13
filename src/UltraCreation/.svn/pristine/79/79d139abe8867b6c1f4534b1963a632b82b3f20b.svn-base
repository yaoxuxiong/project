export namespace Initializer
{
    export async function Execute(): Promise<void>
    {
        for (const iter of Registry)
            await iter.Callback(iter.argv);

        Registry = [];
    }

    export function Register(Callback: (...argv: any[]) => Promise<void>,
        ...argv: any[]): void
    {
        Registry.push({Callback: Callback, argv: argv});
    }

    let Registry = new Array<Initialize>();

    interface Initialize
    {
        Callback: (...argv: any[]) => Promise<void>;
        argv: any[];
    }
}
