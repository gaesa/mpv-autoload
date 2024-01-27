export function union<T>(...sets: Set<T>[]): Set<T> {
    const mergedSet = new Set<T>();
    sets.forEach((set) => {
        set.forEach((elem) => {
            mergedSet.add(elem);
        });
    });
    return mergedSet;
}