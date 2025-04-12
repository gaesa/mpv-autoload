type Ordering = -1 | 0 | 1;

/**
 * Finds the first non-zero character in `slice`, skipping over leading zeros.
 *
 * It continues skipping zeros until it reaches:
 * - a non-zero character.
 * - The end of `slice`.
 *
 * @param index - The starting index to check.
 *
 * @param slice - The full string being processed.
 *
 * @returns The index of the first non-zero character, or the length of `slice` if none found.
 *
 * @remarks
 * The caller must ensure that `slice[index]` is the first leading zero of the numeric section
 * before calling this function.
 */
function getFirstNonZeroChar(index: number, slice: string): number {
    let i = index;
    const len = slice.length;
    while (true) {
        i += 1; // skip the first zero since it's already checked
        if (i < len && slice[i] === "0") {
            continue;
        } else {
            return i;
        }
    }
}

/**
 * Checks whether a character is an ASCII digit ('0'-'9').
 *
 * @param c - The character to check.
 *
 * @returns `true` if `s` is a digit, otherwise `false`.
 *
 * @remarks This function assumes `s` is a single-character string.
 *          If `s` contains more than one character, the behavior is undefined.
 */
function isAsciiDigit(c: string): boolean {
    return "0" <= c && c <= "9";
}

/**
 * Compares two single characters lexicographically.
 *
 * @param s1 - The first character.
 * @param s2 - The second character.
 *
 * @returns `-1` if `s1 < s2`, `0` if `s1 === s2`, and `1` if `s1 > s2`.
 *
 * @remarks This function assumes both `s1` and `s2` are strings of length 1.
 *          It does not enforce this constraint at runtime.
 *
 * @example
 * cmpChar("a", "b"); // -1
 * cmpChar("z", "z"); // 0
 * cmpChar("9", "5"); // 1
 */
function cmpChar(s1: string, s2: string): Ordering {
    if (s1 < s2) {
        return -1;
    } else if (s1 === s2) {
        return 0;
    } else {
        return 1;
    }
}

/**
 * Compares the **single pair** of numeric sections from two character slices (`s1` and `s2`),
 * starting at `index1` and `index2`.
 *
 * The function compares the numeric values of `s1` and `s2` character-by-character until it reaches:
 * - a non-digit char, or
 * - the end of either slice.
 *
 * It handles both:
 * - **Different lengths**: The slice with more digits is considered larger.
 * - **Same length**: The comparison continues until a difference is found.
 *   If no difference is found, the last comparison result (based on the most significant unequal
 *   character) is returned.
 *
 * @param s1 - The first string to compare.
 * @param s2 - The second string to compare.
 * @param index1 - A reference to the current position in `s1`.
 * @param index2 - A reference to the current position in `s2`.
 *
 * @returns `Ordering` value (`-1`, `0`, or `1`) indicating the sorting order.
 *
 * @remarks
 * - The caller **must** ensure that `s1[index1..]` and `s2[index2..]` are *potential* numeric sections.
 *   This simplifies branching logic and improves performance at the cost of elegance.
 * - It is the caller’s responsibility to ensure that neither number has a leading zero.
 * - It still performs digit checks at the starting indices,
 *   because `getFirstNonZeroChar` may land on a non-digit character.
 * - Skipping the initial digit check here may seem cleaner, but would result in higher overhead elsewhere,
 *   negating the performance benefits of the current structure.
 */
function compareNumericParts(
    s1: string,
    s2: string,
    index1: [number],
    index2: [number],
): Ordering {
    let prevOrd: Ordering = 0;
    let i1 = index1[0];
    let i2 = index2[0];
    const s1_len = s1.length;
    const s2_len = s2.length;

    while (true) {
        const c1_is_some = i1 < s1_len;
        const c2_is_some = i2 < s2_len;
        const c1: string | undefined = s1[i1];
        const c2: string | undefined = s2[i2];
        const c1_is_some_and_is_digit = c1_is_some
            ? // SAFETY: `c1` and `c2` are immutable and have already passed the `is_some` checks
              isAsciiDigit(c1 as string)
            : false;
        const c2_is_some_and_is_digit = c2_is_some
            ? isAsciiDigit(c2 as string)
            : false;

        if (c1_is_some_and_is_digit) {
            // `(true, true)`
            if (c2_is_some_and_is_digit) {
                // to avoid subsequent modification because a more significant digit takes priority
                if (prevOrd === 0) {
                    // SAFETY: `c1` and `c2` are immutable and have already passed the `is_some` checks
                    // REASON: Removing these `as` by refactoring would require additional branching and code,
                    //         which not only fails to improve performance but may also
                    //         introduce instability due to increased complexity in hot paths.
                    prevOrd = cmpChar(c1 as string, c2 as string);
                }
                i1 += 1;
                i2 += 1;
            } else {
                // `(true, false)`
                index1[0] = i1;
                index2[0] = i2;
                return 1; // handle numbers with different lengths
            }
        } else {
            // `(false, true)`
            if (c2_is_some_and_is_digit) {
                index1[0] = i1;
                index2[0] = i2;
                return -1; // because a shorter number is smaller
            } else {
                // `(false, false)`
                // No more consecutive digits in either side.
                // Only if the numbers have the same length does `prevOrd` determine the result.
                index1[0] = i1;
                index2[0] = i2;
                return prevOrd;
            }
        }
    }
}

/**
 * Compares two strings using natural sorting order, without creating intermediate number buffers.
 *
 * - Numeric sequences are compared as whole numbers, ignoring leading zeros.
 * - Non-digit characters are compared using the `cmpNonDigit` function.
 * - Whitespace characters (including spaces) are treated as ordinary bytes;
 *   this matches the behavior of major file managers like KDE Dolphin and Windows Explorer,
 *   and avoids introducing ambiguity or performance overhead.
 *
 * This implementation is tested to match KDE Dolphin's natural sorting behavior.
 *
 * @param s1 - The first string to compare.
 * @param s2 - The second string to compare.
 * @param cmpNonDigit - The function used to compare characters when either is a non-digit character.
 *
 * @returns An `Ordering` value (`-1`, `0`, or `1`) indicating the relative natural order between `s1` and `s2`.
 *
 * @example
 * naturalCompare("file1", "file2", cmpChar); // -1
 * naturalCompare("file10", "file2", cmpChar); // 1
 * naturalCompare("image9", "image09", cmpChar); // 0
 */
function naturalCompare(
    s1: string,
    s2: string,
    cmpNonDigit: (a: string, b: string) => Ordering,
): Ordering {
    let index1 = 0;
    let index2 = 0;
    const indexP1: [number] = [0];
    const indexP2: [number] = [0];
    const s1_len = s1.length;
    const s2_len = s2.length;

    while (true) {
        if (index1 < s1_len) {
            // (Some(c1), Some(c2))
            if (index2 < s2_len) {
                const c1 = s1[index1];
                const c2 = s2[index2];

                // Intentional: checking for zero after confirming digit reduces branches and improves branch prediction.
                if (isAsciiDigit(c1) && isAsciiDigit(c2)) {
                    // prettier-ignore
                    { if (c1 === "0") { indexP1[0] = getFirstNonZeroChar(index1, s1); }
                      if (c2 === "0") { indexP2[0] = getFirstNonZeroChar(index2, s2); } }

                    const numOrd = compareNumericParts(
                        s1,
                        s2,
                        indexP1,
                        indexP2,
                    );
                    if (numOrd == 0) {
                        index1 = indexP1[0];
                        index2 = indexP2[0];
                    } else {
                        return numOrd; // return when unequal (`Ordering::Less` or `Ordering::Greater`)
                    }
                } else {
                    const nonNumOrd = cmpNonDigit(c1, c2);
                    if (nonNumOrd != 0) {
                        return nonNumOrd; // return when unequal (`Ordering::Less` or `Ordering::Greater`)
                    } else {
                        index1 += 1;
                        index2 += 1;
                        indexP1[0] = index1;
                        indexP2[0] = index2;
                    }
                }
            } else {
                // (Some(_), None)
                return 1; // longer means larger
            }
        } else {
            // (None, Some(_))
            if (index2 < s2_len) {
                return -1; // shorter means smaller
            } else {
                // (None, None)
                return 0; // fully compared without finding inequality
            }
        }
    }
}

/**
 * Sorts an array of strings in place using natural sorting order.
 *
 * @param strings - The array of strings to sort.
 * @param caseSensitive - Whether to use case-sensitive comparison (default: `true`).
 * @returns The sorted array of strings.
 *
 * @remarks
 * Whitespace characters (such as spaces) are not specially treated,
 * as there is no consistent definition of what should be considered a "space",
 * and handling them specially offers no clear benefit in real-world usage.
 */
export function naturalSort(
    strings: string[],
    caseSensitive: boolean = true,
): string[] {
    let cmpNonDigit = caseSensitive
        ? cmpChar
        : (a: string, b: string) => cmpChar(a.toLowerCase(), b.toLowerCase());
    strings.sort((a, b) => naturalCompare(a, b, cmpNonDigit));
    return strings;
}
