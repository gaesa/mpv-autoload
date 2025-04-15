// @ts-ignore
import { naturalSort } from "./arrays.ts";
// @ts-ignore
import { assertEquals } from "../../vendor/deno.land/std@0.224.0/assert/assert_equals.ts";

function check(expected: string[]) {
    let actual = expected.slice();
    assertEquals(naturalSort(actual, true), expected);
}

Deno.test("test_dates", () => {
    check(["1999-3-3", "1999-12-25", "2000-1-2", "2000-1-10", "2000-3-23"]);
});

Deno.test("test_fractions", () => {
    check([
        "1.002.01",
        "1.002.03",
        "1.002.08",
        "1.009.02",
        "1.009.10",
        "1.009.20",
        "1.010.12",
        "1.011.02",
    ]);
});

Deno.test("test_words", () => {
    // consistent with KDE Dolphin
    check([
        "1-(",
        "1-02",
        "1-2",
        "1-20",
        "10-20",
        "Pic4",
        "fred",
        "jane",
        "pic   7",
        "pic 4 else",
        "pic 5",
        "pic 5 ",
        "pic 5 something",
        "pic 6",
        "pic01",
        "pic02",
        "pic2", // different: Windows 10 File Explorer thinks `"pic02a"` is less than `"pic2"`
        "pic02a",
        "pic3",
        "pic4",
        "pic05",
        "pic100",
        "pic100a",
        "pic120",
        "pic121",
        "pic02000",
        "tom",
        "x2-g8",
        "x2-y7",
        "x2-y08",
        "x8-y8",
    ]);
});
