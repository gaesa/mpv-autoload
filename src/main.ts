import "core-js/es/set";
import "core-js/es/string/starts-with";

import * as Arrays from "./utils/arrays";
import * as Asserts from "./utils/asserts";
import * as Paths from "./utils/paths";
import * as Sets from "./utils/sets";
import * as Strings from "./utils/strings";
import * as System from "./utils/system";

const utils = mp.utils;
const msg = mp.msg;

namespace Config {
    // mpv only supports boolean, number and string conversions
    const strOpts = {
        commonVideo: JSON.stringify([".mp4", ".mkv", ".webm"]),
        commonAudio: JSON.stringify([".mp3", ".flac"]),
        allowedMimeTypes: JSON.stringify(["video", "audio"]),
        ignoreHidden: JSON.stringify(true),
        sortCaseSensitive: JSON.stringify(true),
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

    export const sortCaseSensitive = Asserts.requireBoolean(
        JSON.parse(strOpts.sortCaseSensitive),
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
 *
 * Note: The current implementation utilizes `mp.utils.join_path`,
 * which would result in paths containing `/` even on Windows.
 * Due to the complexity and potential performance implications of
 * fixing issues related to the `file` command,
 * `mp.utils.join_path` is not wrapped to support `\` on Windows.
 *
 * See also: https://github.com/mpv-player/mpv/issues/6565
 *
 * @throws {Error} 'utils.readdir' occurred error
 */
function getFiles(dir: string, joinFlag: boolean = false): string[] {
    const files = utils.readdir(dir, "files");
    if (files !== void 0) {
        return joinFlag
            ? files.map((file: string) => {
                  return utils.join_path(dir, file);
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
            msg.verbose("Path is a directory; skip for pre-existing playlist");
        } else {
            const pl_count = mp.get_property_number("playlist-count", 1);
            if (pl_count > 1) {
                msg.verbose(
                    "Path isn't a directory; skip for pre-existing playlist",
                );
            } else {
                continuation(path);
            }
        }
    }

    if (path !== void 0) {
        if (new RegExp("^.*://").test(path)) {
            msg.verbose("Skip for remote media");
        } else {
            if (Paths.exists(path)) {
                validateExistingPath(path);
            } else {
                msg.verbose("Skip for non-existing path");
            }
        }
    } else {
        msg.warn("Fail to get the path of the currently played file");
    }
}

const stripLeadingDotSlash = System.isWindows
    ? (path: string): string => Strings.lstrip(path, ".\\")
    : (path: string): string => Strings.lstrip(path, "./");

function main(): void {
    validatePath(mp.get_property("path"), (path: string) => {
        const preProcessedPath = stripLeadingDotSlash(path);
        let [dir, file] = Paths.split(preProcessedPath);
        const joinFlag = dir === "." ? false : utils.getcwd() !== dir;
        file = joinFlag ? preProcessedPath : file;
        // HACK: Both `Paths.split` and `utils.getcwd` are cross-platform,
        // but `utils.join_path` isn't; it always uses `/` as the path separator.
        // To find the currently played media in the playlist,
        // we can either change the `file` variable or wrap/fix `utils.join_path`.
        // The latter option is also related to another issue:
        // the dependent `file` command doesn't support `\` as a path separator.
        // To work around this new issue,
        // we would have to wrap/fix again for the `file` command,
        // which would require significant effort and could introduce performance issues.
        // For now, we'll just change the `file` variable.
        file = System.isWindows ? file.replace(/\\/g, "/") : file;

        const files = Arrays.natsort(
            filterMediaFiles(getFiles(dir, joinFlag), Config.ignoreHidden),
            Config.sortCaseSensitive,
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
