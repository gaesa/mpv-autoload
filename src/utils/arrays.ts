type Comparable = number | string | Date;

function sort<T extends Comparable, U extends Comparable>(
    array: T[],
    key?: (arg: T) => U | U[],
): void {
    type Mapped = T | U | U[];
    array.sort((a, b): number => {
        const [keyA, keyB]: [Mapped, Mapped] =
            key === void 0 ? [a, b] : [key(a), key(b)];
        if (Array.isArray(keyA)) {
            if (Array.isArray(keyB)) {
                for (let i = 0; i < keyA.length && i < keyB.length; i++) {
                    if (keyA[i] < keyB[i]) {
                        return -1;
                    } else if (keyA[i] > keyB[i]) {
                        return 1;
                    }
                }
                if (keyA.length < keyB.length) {
                    return -1;
                } else if (keyA.length === keyB.length) {
                    return 0;
                } else {
                    return 1;
                }
            } else {
                throw new Error("Can't compare array and non-array");
            }
        } else {
            if (!Array.isArray(keyB)) {
                if (keyA < keyB) {
                    return -1;
                } else if (keyA === keyB) {
                    return 0;
                } else {
                    return 1;
                }
            } else {
                throw new Error("Can't compare array and non-array");
            }
        }
    });
}

export function natsort(
    strings: string[],
    caseSensitive: boolean = true,
): string[] {
    function isDigit(n: string) {
        return /^\d+$/.test(n);
    }

    const split = caseSensitive
        ? (s: string) => s.split(/(\d+)/)
        : (s: string) => s.toLowerCase().split(/(\d+)/);

    function key(s: string) {
        const splitArr = split(s);
        splitArr[0] === "" ? splitArr.shift() : void 0;
        splitArr.length > 0 && splitArr[splitArr.length - 1] === ""
            ? splitArr.pop()
            : void 0;
        return splitArr.map((text: string) =>
            isDigit(text) ? parseInt(text, 10) : text,
        );
    }

    sort(strings, key);
    return strings;
}
