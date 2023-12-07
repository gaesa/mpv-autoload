import "core-js/es/string/starts-with";
import "core-js/es/string/ends-with";
import "core-js/es/string/trim-end";
import "core-js/es/set";

const utils = mp.utils;
const msg = mp.msg;

namespace Config {
    type Opts = {
        // mpv only supports boolean, number and string conversions
        [key: string]: string;
    };

    export const opts: Opts = {
        commonVideo: JSON.stringify([".mp4", ".mkv", ".webm"]),
        commonAudio: JSON.stringify([".mp3", ".flac"]),
        allowedMimeTypes: JSON.stringify(["video", "audio"]),
        ignoreHidden: JSON.stringify(true),
    };

    mp.options.read_options(opts, mp.get_script_name());
    Object.keys(opts).forEach((key) => {
        opts[key] = JSON.parse(opts[key]);
    });
}

function sort(array: any[], key?: (arg: any) => any) {
    array.sort((a, b) => {
        const [keyA, keyB] = key === void 0 ? [a, b] : [key(a), key(b)];
        if (Array.isArray(keyA) && Array.isArray(keyB)) {
            for (let i = 0; i < keyA.length && i < keyB.length; i++) {
                if (keyA[i] < keyB[i]) {
                    return -1;
                } else if (keyA[i] > keyB[i]) {
                    return 1;
                }
            }
            if (keyA.length < keyB.length) {
                return -1;
            } else if (keyA.length === keyB.length) {
                return 0;
            } else {
                return 1;
            }
        } else {
            if (keyA < keyB) {
                return -1;
            } else if (keyA === keyB) {
                return 0;
            } else {
                return 1;
            }
        }
    });
}

function natsort(strings: string[]): string[] {
    function isDigit(n: string) {
        return /^\d+$/.test(n);
    }

    function key(s: string) {
        const splitArr = s.split(/(\d+)/);
        splitArr[0] === "" ? splitArr.shift() : void 0;
        splitArr.length > 0 && splitArr[splitArr.length - 1] === ""
            ? splitArr.pop()
            : void 0;
        return splitArr.map((text: string) => {
            return isDigit(text) ? parseInt(text, 10) : text;
        });
    }

    sort(strings, key);
    return strings;
}

function subprocess(args: string[], check: boolean = false) {
    const p = mp.command_native({
        args: args,
        name: "subprocess",
        playback_only: false,
        capture_stdout: true,
    });
    if (check) {
        const status = p.status as number;
        if (status === 0) {
            return p;
        } else {
            throw new Error(
                p.stderr +
                    "Command " +
                    JSON.stringify(args) +
                    " returned non-zero exit status " +
                    JSON.stringify(status),
            );
        }
    } else {
        return p;
    }
}

function splitExt(path: string): [string, string] {
    const [dir, file] = utils.split_path(path) as [string, string];
    const lastDotIndex = file.lastIndexOf(".");
    if (lastDotIndex === 0) {
        return [path, ""];
    } else {
        return [
            utils.join_path(dir, file.slice(0, lastDotIndex)),
            file.slice(lastDotIndex),
        ];
    }
}

function getOS() {
    function isdir(file: string): boolean {
        const info = utils.file_info(file);
        if (info === void 0) {
            return false;
        } else {
            return info.is_dir;
        }
    }

    function detectNonWindows() {
        const unameOutput = subprocess(
            ["uname", "-s"],
            true,
        ).trimEnd() as string;
        if (unameOutput === "Darwin") {
            return "darwin";
        } else if (unameOutput === "Linux") {
            return "linux";
        } else {
            return unameOutput;
        }
    }

    const platform = mp.get_property_native("platform") as string | undefined;
    if (platform === void 0) {
        if (utils.getenv("OS") === "Windows_NT") {
            const HOMEDRIVE = utils.getenv("HOMEDRIVE") as string | undefined;
            if (HOMEDRIVE !== void 0 && isdir(HOMEDRIVE)) {
                return "windows";
            } else {
                return detectNonWindows();
            }
        } else {
            return detectNonWindows();
        }
    } else {
        return platform;
    }
}

const getMimetype =
    getOS() === "linux"
        ? (file: string, extension?: string) => {
              function getCheckedMime(
                  mimeType: string[],
                  args: string[],
                  onError?: () => [string, string],
              ): [string, string] {
                  if (mimeType.length !== 2) {
                      if (onError === void 0) {
                          throw new Error(
                              JSON.stringify(args) + " returns: " + mimeType,
                          );
                      } else {
                          return onError();
                      }
                  } else {
                      return mimeType as [string, string];
                  }
              }

              const ext = extension === void 0 ? splitExt(file)[1] : extension;
              const fileArgs = ["file", "-Lb", "--mime-type", "--", file];
              const args = new Set([".ts", ".bak", ".txt", ".TXT"]).has(ext)
                  ? fileArgs
                  : [
                        "xdg-mime",
                        "query",
                        "filetype",
                        file.startsWith("-") ? "./" + file : file,
                    ];

              const str: string = subprocess(args, true).stdout.trimEnd();
              const mimeType = str.split("/", 2);
              return getCheckedMime(mimeType, args, () => {
                  if (args[0] === "xdg-mime") {
                      const str = subprocess(
                          fileArgs,
                          true,
                      ).stdout.trimEnd() as string;
                      return getCheckedMime(str.split("/", 2), fileArgs);
                  } else {
                      throw new Error(
                          JSON.stringify(fileArgs) + " returns: " + str,
                      );
                  }
              });
          }
        : (file: string, _?: string) => {
              // `file` command on Windows:
              // https://github.com/julian-r/file-windows
              // note: `-L` option isn't supported in this version
              const args = ["file", "-b", "--mime-type", "--", file];
              const str: string = subprocess(args, true).stdout.trimEnd();
              const mimeType = str.split("/", 2);
              if (mimeType.length !== 2) {
                  throw new Error(JSON.stringify(args) + " returns: " + str);
              } else {
                  return mimeType as [string, string];
              }
          };

function unionSet<T>(...sets: Set<T>[]): Set<T> {
    const mergedSet = new Set<T>();
    sets.forEach((set) => {
        set.forEach((elem) => {
            mergedSet.add(elem);
        });
    });
    return mergedSet;
}

function getFiles(dir: string, joinFlag: boolean = false): string[] {
    const commonMedia = unionSet(
        new Set(Config.opts.commonVideo),
        new Set(Config.opts.commonAudio),
    );
    const allowedTypes = new Set(Config.opts.allowedMimeTypes);
    const ignoreHidden = Config.opts.ignoreHidden as unknown as boolean;

    const files = utils.readdir(dir, "files") as string[];
    const toBeFiltered = joinFlag
        ? files.map((file: string) => {
              return utils.join_path(dir, file) as string;
          })
        : files;
    const filterFn = (file: string) => {
        const ext = splitExt(file)[1];
        if (commonMedia.has(ext)) {
            return true;
        } else {
            return allowedTypes.has(getMimetype(file, ext)[0]);
        }
    };
    return natsort(
        toBeFiltered.filter(
            ignoreHidden
                ? (file: string) => {
                      if (file.startsWith(".")) {
                          return false;
                      } else {
                          return filterFn(file);
                      }
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
        msg.trace("current file position in files: " + current);
        return current;
    }
}

function stripTrailingSlash(path: string) {
    return path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;
}

function splitPath(path: string): [string, string] {
    const [dir, file] = utils.split_path(path) as [string, string];
    return [stripTrailingSlash(dir), file];
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
        msg.warn("Fail to get the path of the currently played file");
        return;
    }
}

function main() {
    const path: string | undefined = mp.get_property_native("path");
    validateInput(path, (path: string) => {
        let [dir, file] = splitPath(path);
        const joinFlag = utils.getcwd() !== dir;
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
