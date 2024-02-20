import * as Paths from "./paths";

export const isWindows: boolean = (() => {
    const platform = mp.get_property("platform");
    return platform !== void 0
        ? platform === "windows"
        : Paths.exists("\\") && !Paths.exists("//");
})();
