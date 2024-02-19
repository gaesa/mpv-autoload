import "core-js/es/set";

export function union<T>(...sets: readonly Set<T>[]): Set<T> {
    const mergedSet = new Set<T>();
    sets.forEach((set) => {
        set.forEach((elem) => {
            mergedSet.add(elem);
        });
    });
    return mergedSet;
}
