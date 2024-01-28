// noinspection JSUnusedGlobalSymbols

export function assert(condition: boolean, message?: string): void {
    if (!condition) {
        throw new Error(message !== void 0 ? message : "Assertion failed");
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
    message?: string,
): T2[] {
    assert(
        Array.isArray(value),
        message !== void 0 ? message : "Value must be an array",
    );
    (value as unknown[]).forEach((ele, index) => {
        assert(
            typeof ele === type,
            message !== void 0
                ? message
                : `Element '${ele}' at index ${index} is not of type ${type}`,
        );
    });
    return value as T2[];
}
