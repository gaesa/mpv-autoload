import * as Paths from "./paths";

export function isWindows(): boolean {
    const platform = mp.get_property("platform");
    if (platform !== void 0) {
        return platform === "windows";
    } else {
        return Paths.exists("\\");
    }
}
