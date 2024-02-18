import "core-js/es/set";
import "core-js/es/string/ends-with";
import "core-js/es/string/starts-with";
import "core-js/es/string/trim-end";

import * as Processes from "./processes";
import * as System from "./system";

const utils = mp.utils;

export function splitExt(path: string): [string, string] {
    const [dir, file] = utils.split_path(path);
    const lastDotIndex = file.lastIndexOf(".");
    return lastDotIndex === 0
        ? [path, ""]
        : [
              utils.join_path(dir, file.slice(0, lastDotIndex)),
              file.slice(lastDotIndex),
          ];
}

export function isDir(file: string): boolean {
    const info = utils.file_info(file);
    return info === void 0 ? false : info.is_dir;
}

export function exists(file: string): boolean {
    return utils.file_info(file) !== void 0;
}

const isWindows = System.isWindows();

function join_many(path: string, ...paths: string[]): string {
    return paths.reduce(utils.join_path, path);
}

/**
 * A wrapper for `mp.utils.join_path` to not always use `/` as path separator.
 *
 * Reason: The behaviour of `mp.utils.join_path` is different with `mp.utils.getcwd` and `mp.get_property("path")`.
 * See also: https://github.com/mpv-player/mpv/issues/6565
 */
export const join = isWindows
    ? (path: string, ...paths: string[]): string =>
          join_many(path, ...paths).replace(/\//g, "\\")
    : join_many;

const stripTrailingSlash = isWindows
    ? (path: string): string => (path.endsWith("\\") ? path.slice(0, -1) : path)
    : (path: string): string =>
          path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;

export function split(path: string): [string, string] {
    const [dir, file] = utils.split_path(path);
    return [stripTrailingSlash(dir), file];
}

export const getMimetype =
    mp.get_property("platform") === "linux"
        ? (file: string, extension?: string): [string, string] => {
              function getCheckedMime(
                  mimeType: string[],
                  args: string[],
                  onError?: () => [string, string],
              ): [string, string] {
                  if (mimeType.length !== 2) {
                      if (onError === void 0) {
                          throw new Error(
                              `${JSON.stringify(args)} returns: ${mimeType}`,
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
                        file.startsWith("-") ? `./${file}` : file,
                    ];

              const str: string = Processes.run(args, true).stdout.trimEnd();
              const mimeType = str.split("/", 2);
              return getCheckedMime(mimeType, args, () => {
                  if (args[0] === "xdg-mime") {
                      const str = Processes.run(
                          fileArgs,
                          true,
                      ).stdout.trimEnd();
                      return getCheckedMime(str.split("/", 2), fileArgs);
                  } else {
                      throw new Error(
                          `${JSON.stringify(fileArgs)} returns: ${str}`,
                      );
                  }
              });
          }
        : (file: string, _?: string): [string, string] => {
              // `file` command on Windows:
              // https://github.com/julian-r/file-windows
              // note: `-L` option isn't supported in this version
              const args = ["file", "-b", "--mime-type", "--", file];
              const str: string = Processes.run(args, true).stdout.trimEnd();
              const mimeType = str.split("/", 2);
              if (mimeType.length !== 2) {
                  throw new Error(`${JSON.stringify(args)} returns: ${str}`);
              } else {
                  return mimeType as [string, string];
              }
          };
