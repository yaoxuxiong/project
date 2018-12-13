/**
 *  TODO: how to extend or implement a Error ?
 *      this simple task impossable to done in JSP
 *
 *  more information:
 *      https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
 *
 *  predefined errors:
 *      EvalError
 *          Creates an instance representing an error that occurs regarding the global function eval().
 *      InternalError
 *          Creates an instance representing an error that occurs when an internal error in the JavaScript engine is thrown. E.g. "too much recursion".
 *      RangeError
 *          Creates an instance representing an error that occurs when a numeric variable or parameter is outside of its valid range.
 *      ReferenceError
 *          Creates an instance representing an error that occurs when de-referencing an invalid reference.
 *      SyntaxError
 *          Creates an instance representing a syntax error that occurs while parsing code in eval().
 *      TypeError
 *          Creates an instance representing an error that occurs when a variable or parameter is not of a valid type.
 *      URIError
 *          Creates an instance representing an error that occurs when encodeURI() or decodeURI() are passed invalid parameters.
 */
export class Exception extends Error
{
    static Throw(...args: any[]): void
    {
        throw this.Create(...args);
    }

    static Create(...args: any[]): Exception
    {
        return new (this as any)(...args);
    }

    constructor(message: string = '')
    {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
    }

    toString(): string
    {
        return this.name + ': ' + this.message;
    }

    name: string;
    message: string;
}

/**
 *  abort executing only
 */
export class EAbort extends Exception
{
    constructor(message: string = '')
    {
        if (message === '')
            message = 'e_abort';
        super(message);
    }
}

/**
 *  invalid argument
 */
export class EInvalidArg extends Exception
{
    constructor(message: string = '')
    {
        if (message === '')
            message = 'e_invalid_arg';
        super(message);
    }
}

/**
 *  not implemented yet.
 */

export class ENotImplemented extends Exception
{
    constructor(message: string = '')
    {
        if (message === '')
            message = 'e_not_implemented';
        super(message);
    }
}

/**
 *  not use by this way...
 */
export class EUsage extends Exception
{
    constructor(message: string = '')
    {
        if (message === '')
            message = 'e_usage';
        super(message);
    }
}
