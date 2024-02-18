import * as Paths from "./paths";

export function isWindows(): boolean {
    const platform = mp.get_property("platform");
    return platform !== void 0 ? platform === "windows" : Paths.exists("\\");
}
