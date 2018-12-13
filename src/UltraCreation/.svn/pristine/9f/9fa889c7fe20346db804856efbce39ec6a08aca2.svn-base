import {TypeInfo} from './TypeInfo';

export class TStringBuilder
{
    constructor(...Initial: any[])
    {
        this.Append(...Initial);
    }

    Append(...items: any[]): TStringBuilder
    {
        items.forEach(item => this.AppendSingle(item));
        return this;
    }

    AppendLine(...items: any[]): TStringBuilder
    {
        items.forEach(item =>
        {
            if (TypeInfo.Assigned(item))
                this.AppendSingle(item);
        });

        this.PartArray.push('\r\n');
        return this;
    }

    AppendLines(items: any[]): TStringBuilder
    {
        items.forEach(item =>
        {
            if (TypeInfo.Assigned(item))
            {
                this.AppendSingle(item);
                this.PartArray.push('\r\n');
            }
        });

        return this;
    }

    Pop(): TStringBuilder
    {
        this.PartArray.pop();
        return this;
    }

    get IsEmpty(): boolean
    {
        return this.PartArray.length === 0;
    }

    Clear(): void
    {
        this.PartArray = [];
        this.Latest = undefined;
    }

    toString(): string /**@override */
    {
        if (! TypeInfo.Assigned(this.Latest))
            this.Latest = this.PartArray.join('');
        return this.Latest;
    }

    private AppendSingle(item: any): void
    {
        if (TypeInfo.Assigned(item))
        {
            this.Latest = undefined;

            switch (typeof item)
            {
            case TypeInfo.OBJECT:
            case TypeInfo.FUNCTION:
                item = item.toString();
                break;
            }
            this.PartArray.push(item); // Other primitive types can keep their format since a number or boolean is a smaller footprint than a string.
        }
    }

    private PartArray: any[] = [];
    private Latest: string | undefined;
}
