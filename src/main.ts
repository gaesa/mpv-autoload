import "core-js/es/set";
import "core-js/es/string/starts-with";

import * as Arrays from "./utils/arrays";
import * as Asserts from "./utils/asserts";
import * as Paths from "./utils/paths";
import * as Sets from "./utils/sets";
import { NoSuchElementError, UnexpectedError } from "./utils/errors";

const utils = mp.utils;
const msg = mp.msg;

namespace Config {
    // mpv only supports boolean, number and string conversions
    const rawOpts = {
        commonVideo: JSON.stringify([
            ".flv",
            ".mkv",
            ".mov",
            ".mp4",
            ".mpeg",
            ".mpg",
            ".ogv",
            ".webm",
            ".wmv",
        ]),
        commonAudio: JSON.stringify([
            ".flac",
            ".m4a",
            ".mp3",
            ".oga",
            ".ogg",
            ".opus",
            ".wav",
        ]),
        allowedMimeTypes: JSON.stringify(["video", "audio"]),
        ignoreHidden: JSON.stringify(true),
        sortCaseSensitive: JSON.stringify(true),
    };
    mp.options.read_options(rawOpts, mp.get_script_name());

    const commonVideo = Asserts.requireArray(
        JSON.parse(rawOpts.commonVideo),
        "string",
    );
    const commonAudio = Asserts.requireArray(
        JSON.parse(rawOpts.commonAudio),
        "string",
    );
    export const commonMedia = Sets.union(
        new Set(commonVideo),
        new Set(commonAudio),
    );

    export const excludedExts = new Set([
        ".vtt",
        ".ass",
        ".txt",
        ".py",
        ".js",
        ".lua",
        ".sh",
        ".bat",
        ".ps1",
        ".exe",
        ".msi",
        ".bin",
        ".zip",
        ".7z",
        ".rar",
        "",
        ".",
    ]);

    export const allowedMimeTypes = new Set(
        Asserts.requireArray(JSON.parse(rawOpts.allowedMimeTypes), "string"),
    );

    export const ignoreHidden = Asserts.requireBoolean(
        JSON.parse(rawOpts.ignoreHidden),
    );

    export const sortCaseSensitive = Asserts.requireBoolean(
        JSON.parse(rawOpts.sortCaseSensitive),
    );
}

function isMedia(file: string): boolean {
    const ext = Paths.splitExt(file)[1].toLowerCase();
    if (Config.commonMedia.has(ext)) {
        return true;
    } else {
        return Config.excludedExts.has(ext)
            ? false // since calling external command is expensive
            : Config.allowedMimeTypes.has(Paths.getMimetype(file, ext)[0]);
    }
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
 * @throws {Error} 'utils.readdir' can't get files from `dir`
 *
 * @see https://github.com/mpv-player/mpv/issues/6565
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
        throw new UnexpectedError(
            `'utils.readdir' can't get files from ${dir}`,
        );
    }
}

function filterMediaFiles(
    files: readonly string[],
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

function getCurrentEntryPos(files: readonly string[], file: string): number {
    const current = files.indexOf(file);
    if (current !== -1) {
        return current;
    } else {
        throw new NoSuchElementError(
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

    function getProtocolFromURI(uri: string): string {
        return uri.slice(0, uri.indexOf("://") + 3);
    }

    if (path !== void 0) {
        if (!Paths.isPath(path)) {
            msg.verbose(
                `Skip for the unsupported protocol '${getProtocolFromURI(path)}'`,
            );
        } else if (Paths.exists(path)) {
            validateExistingPath(path);
        } else {
            msg.verbose("Skip for non-existing path");
        }
    } else {
        msg.warn("Fail to get the path of the currently played file");
    }
}

function main(): void {
    validatePath(mp.get_property("path"), (path: string) => {
        const cwd = utils.getcwd();
        // replace `\` with `/` since `file` command can't handle `\` in path on Windows
        // remove leading dot to avoid conflict with the `ignoreHidden` feature
        const normalizedPath = Paths.normalize(path, cwd);

        const [dir, file] = Paths.split(normalizedPath);
        const joinFlag = cwd !== dir;
        const accessibleFile = joinFlag ? normalizedPath : file;

        const files = Arrays.natsort(
            filterMediaFiles(getFiles(dir, joinFlag), Config.ignoreHidden),
            Config.sortCaseSensitive,
        );
        if (files.length === 0) {
            msg.verbose("No media files found in the directory");
        } else {
            const current = getCurrentEntryPos(files, accessibleFile);
            addFilesToPlaylist(files, current);
        }
    });
}

mp.register_event("start-file", main);
