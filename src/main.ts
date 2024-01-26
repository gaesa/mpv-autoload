import "core-js/es/set";
import "core-js/es/string/ends-with";
import "core-js/es/string/starts-with";
import "core-js/es/string/trim-end";

import * as Arrays from "./utils/Arrays";
import * as Paths from "./utils/Paths";
import * as Sets from "./utils/Sets";

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

    export const opts = {
        commonVideo: JSON.parse(strOpts.commonVideo) as string[],
        commonAudio: JSON.parse(strOpts.commonAudio) as string[],
        allowedMimeTypes: JSON.parse(strOpts.allowedMimeTypes) as string[],
        ignoreHidden: JSON.parse(strOpts.ignoreHidden) as boolean,
    };
}

function getFiles(dir: string, joinFlag: boolean = false): string[] {
    const commonMedia = Sets.union(
        new Set(Config.opts.commonVideo),
        new Set(Config.opts.commonAudio),
    );
    const allowedTypes = new Set(Config.opts.allowedMimeTypes);
    const ignoreHidden = Config.opts.ignoreHidden;

    const files = utils.readdir(dir, "files") as string[];
    const toBeFiltered = joinFlag
        ? files.map((file: string) => {
              return utils.join_path(dir, file) as string;
          })
        : files;
    const filterFn = (file: string) => {
        const ext = Paths.splitExt(file)[1];
        return commonMedia.has(ext)
            ? true
            : allowedTypes.has(Paths.getMimetype(file, ext)[0]);
    };
    return Arrays.natsort(
        toBeFiltered.filter(
            ignoreHidden
                ? (file: string) => {
                      return file.startsWith(".") ? false : filterFn(file);
                  }
                : filterFn,
        ),
    );
}

function fdCurrentEntryPos(files: string[], file: string) {
    const current = files.indexOf(file);
    if (current === -1) {
        return void 0;
    } else {
        msg.trace(`current file position in files: ${current}`);
        return current;
    }
}

function addFilesToPlaylist(files: string[], current: number) {
    files.splice(current, 1);
    files.forEach((file: string) => {
        mp.command_native(["loadfile", file, "append"]);
    });
    mp.command_native(["playlist-move", 0, current + 1]);
}

function validateInput(
    path: string | undefined,
    continuation: (path: string) => void,
): void {
    if (path !== void 0) {
        if (new RegExp("^.*://").test(path)) {
            return; // skip for remote media
        } else {
            if (Paths.exists(path)) {
                if (Paths.isDir(path)) {
                    return; // skip for playlist
                } else {
                    const pl_count: number = mp.get_property_native(
                        "playlist-count",
                        1,
                    );
                    if (pl_count > 1) {
                        return; // skip for playlist
                    } else {
                        continuation(path);
                    }
                }
            } else {
                return; // skip non-existing path
            }
        }
    } else {
        msg.warn("Fail to get the path of the currently played file");
    }
}

function main() {
    const path: string | undefined = mp.get_property_native("path");
    validateInput(path, (path: string) => {
        let [dir, file] = Paths.split(path);
        const joinFlag = dir === "." ? false : utils.getcwd() !== dir;
        file = joinFlag ? path : file;

        const files = getFiles(dir, joinFlag);
        if (files.length === 0) {
            msg.verbose("No other video or audio files in the directory");
        } else {
            const current = fdCurrentEntryPos(files, file);
            if (current === void 0) {
                msg.warn(
                    "Can't find the position of the currently played file in media files",
                );
            } else {
                addFilesToPlaylist(files, current);
            }
        }
    });
}

mp.register_event("start-file", main);
