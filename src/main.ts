import "core-js/es/set";
import "core-js/es/string/ends-with";
import "core-js/es/string/starts-with";

import * as Arrays from "./utils/arrays";
import * as Asserts from "./utils/asserts";
import * as Paths from "./utils/paths";
import * as Sets from "./utils/sets";

const utils = mp.utils;
const msg = mp.msg;

namespace Config {
    // mpv only supports boolean, number and string conversions
    const strOpts = {
        commonVideo: JSON.stringify([".mp4", ".mkv", ".webm"]),
        commonAudio: JSON.stringify([".mp3", ".flac"]),
        allowedMimeTypes: JSON.stringify(["video", "audio"]),
        ignoreHidden: JSON.stringify(true),
    };
    mp.options.read_options(strOpts, mp.get_script_name());

    const commonVideo = Asserts.requireArray(
        JSON.parse(strOpts.commonVideo),
        "string",
    );
    const commonAudio = Asserts.requireArray(
        JSON.parse(strOpts.commonAudio),
        "string",
    );
    export const commonMedia = Sets.union(
        new Set(commonVideo),
        new Set(commonAudio),
    );

    export const allowedMimeTypes = new Set(
        Asserts.requireArray(JSON.parse(strOpts.allowedMimeTypes), "string"),
    );

    export const ignoreHidden = Asserts.requireBoolean(
        JSON.parse(strOpts.ignoreHidden),
    );
}

function isMedia(file: string): boolean {
    const ext = Paths.splitExt(file)[1];
    return Config.commonMedia.has(ext)
        ? true
        : Config.allowedMimeTypes.has(Paths.getMimetype(file, ext)[0]);
}

/**
 * Get files from a given directory, join directory and files as necessary
 * @throws {Error} 'utils.readdir' occurred error
 */
function getFiles(dir: string, joinFlag: boolean = false): string[] {
    const files = utils.readdir(dir, "files") as string[] | undefined;
    if (files !== void 0) {
        return joinFlag
            ? files.map((file: string) => {
                  return utils.join_path(dir, file) as string;
              })
            : files;
    } else {
        throw new Error("'utils.readdir' occurred error");
    }
}

function filterMediaFiles(
    files: ReadonlyArray<string>,
    ignoreHidden: boolean,
): string[] {
    return files.filter(
        ignoreHidden
            ? (file: string) => {
                  return file.startsWith(".") ? false : isMedia(file);
              }
            : isMedia,
    );
}

function getCurrentEntryPos(
    files: ReadonlyArray<string>,
    file: string,
): number {
    const current = files.indexOf(file);
    if (current !== -1) {
        msg.trace(`current file position in files: ${current}`);
        return current;
    } else {
        throw new Error(
            "Can't find the position of the currently played file in media files",
        );
    }
}

function addFilesToPlaylist(files: string[], current: number): void {
    files.splice(current, 1);
    files.forEach((file: string) => {
        mp.command_native(["loadfile", file, "append"]);
    });
    mp.command_native(["playlist-move", 0, current + 1]);
}

function validatePath(
    path: string | undefined,
    continuation: (path: string) => void,
): void {
    function validateExistingPath(path: string) {
        if (Paths.isDir(path)) {
            return; // skip for pre-existing playlist
        } else {
            const pl_count = mp.get_property_number("playlist-count", 1);
            if (pl_count > 1) {
                return; // skip for pre-existing playlist
            } else {
                continuation(path);
            }
        }
    }

    if (path !== void 0) {
        if (new RegExp("^.*://").test(path)) {
            return; // skip for remote media
        } else {
            if (Paths.exists(path)) {
                validateExistingPath(path);
            } else {
                return; // skip for non-existing path
            }
        }
    } else {
        msg.warn("Fail to get the path of the currently played file");
    }
}

function main(): void {
    const path = mp.get_property("path");
    validatePath(path, (path: string) => {
        let [dir, file] = Paths.split(path);
        const joinFlag = dir === "." ? false : utils.getcwd() !== dir;
        file = joinFlag ? path : file;

        const files = Arrays.natsort(
            filterMediaFiles(getFiles(dir, joinFlag), Config.ignoreHidden),
        );
        if (files.length === 0) {
            msg.verbose("No media files found in the directory");
        } else {
            const current = getCurrentEntryPos(files, file);
            addFilesToPlaylist(files, current);
        }
    });
}

mp.register_event("start-file", main);
