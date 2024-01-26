function sort(array: any[], key?: (arg: any) => any) {
    array.sort((a, b) => {
        const [keyA, keyB] = key === void 0 ? [a, b] : [key(a), key(b)];
        if (Array.isArray(keyA) && Array.isArray(keyB)) {
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
            if (keyA < keyB) {
                return -1;
            } else if (keyA === keyB) {
                return 0;
            } else {
                return 1;
            }
        }
    });
}

export function natsort(strings: string[]): string[] {
    function isDigit(n: string) {
        return /^\d+$/.test(n);
    }

    function key(s: string) {
        const splitArr = s.split(/(\d+)/);
        splitArr[0] === "" ? splitArr.shift() : void 0;
        splitArr.length > 0 && splitArr[splitArr.length - 1] === ""
            ? splitArr.pop()
            : void 0;
        return splitArr.map((text: string) => {
            return isDigit(text) ? parseInt(text, 10) : text;
        });
    }

    sort(strings, key);
    return strings;
}
