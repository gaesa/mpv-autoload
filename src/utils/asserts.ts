// noinspection JSUnusedGlobalSymbols

export class AssertionError extends Error {
    constructor(message: string = "Assertion failed") {
        super(message);
        this.name = "AssertionError";
    }
}

export function assert(condition: boolean, message?: string): void {
    if (!condition) {
        throw new AssertionError(
            message !== void 0 ? message : "Assertion failed",
        );
    } else {
        return;
    }
}

export function requireNumber(value: unknown, message?: string): number {
    assert(
        typeof value === "number",
        message !== void 0 ? message : "Value must be a number",
    );
    return value as number;
}

export function requireBoolean(value: unknown, message?: string): boolean {
    assert(
        typeof value === "boolean",
        message !== void 0 ? message : "Value must be a boolean",
    );
    return value as boolean;
}

export function requireString(value: unknown, message?: string): string {
    assert(
        typeof value === "string",
        message !== void 0 ? message : "Value must be a string",
    );
    return value as string;
}

type Type = {
    undefined: undefined;
    object: object;
    boolean: boolean;
    number: number;
    bigint: bigint;
    string: string;
    symbol: symbol;
    function: Function;
};

export function requireArray<T1 extends keyof Type, T2 extends Type[T1]>(
    value: unknown,
    type: T1,
    arrayTypeMessage?: string,
    innerTypeMessage?: string,
): T2[] {
    assert(
        Array.isArray(value),
        arrayTypeMessage !== void 0
            ? arrayTypeMessage
            : "Value must be an array",
    );
    if (innerTypeMessage !== void 0) {
        (value as unknown[]).forEach((ele) => {
            assert(typeof ele === type, innerTypeMessage);
        });
    } else {
        (value as unknown[]).forEach((ele, index) => {
            assert(
                typeof ele === type,
                // prettier-ignore
                `Element '${String(ele)}' at index ${index} is not of type ${type}`,
            );
        });
    }
    return value as T2[];
}
