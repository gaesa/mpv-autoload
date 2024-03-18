// noinspection JSUnusedGlobalSymbols

import "core-js/es/set";
import "core-js/es/string/ends-with";
import "core-js/es/string/starts-with";
import "core-js/es/string/trim-end";

import * as Processes from "./processes";
import * as System from "./system";
import { ArrayStack } from "./collection";
import { UnexpectedError } from "./errors";

const utils = mp.utils;

export function splitExt(path: string): readonly [string, string] {
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
    return info != void 0 ? info.is_dir : false;
}

export function exists(file: string): boolean {
    return utils.file_info(file) !== void 0;
}

function join_many(path: string, ...paths: string[]): string {
    return paths.reduce(utils.join_path, path);
}

/**
 * A wrapper for `mp.utils.join_path` to not always use `/` as path separator.
 *
 * Reason: The behaviour of `mp.utils.join_path` is different with `mp.utils.getcwd` and `mp.get_property("path")`.
 *
 * @see https://github.com/mpv-player/mpv/issues/6565
 */
export const join = System.isWindows
    ? (path: string, ...paths: string[]): string =>
          join_many(path, ...paths).replace(/\//g, "\\")
    : join_many;

const stripTrailingSlash = System.isWindows
    ? (path: string): string =>
          (path.endsWith("\\") && !path.endsWith(":\\")) ||
          (path.endsWith("/") && !path.endsWith(":/"))
              ? path.slice(0, -1)
              : path
    : (path: string): string =>
          path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;

export function split(path: string): readonly [string, string] {
    const [dir, file] = utils.split_path(path);
    return [stripTrailingSlash(dir), file];
}

export function isUNC(path: string): boolean {
    return path.length > 2 && path.startsWith("\\\\");
}

/**
 * Converts a Windows-style file path to a POSIX-style file path
 * by replacing backslashes `\` with forward slashes `/`.
 */
const winToPosix = System.isWindows
    ? (path: string): string =>
          isUNC(path)
              ? `\\\\${path.slice(2).replace(/\\/g, "/")}`
              : path.replace(/\\/g, "/")
    : (path: string) => path;

const isAbsolute = System.isWindows
    ? (path: string) =>
          // mpv treats `C://` as a protocol instead of a path
          new RegExp("^[A-Za-z]:(?!/{2})").test(path) ||
          path.startsWith("/") ||
          path.startsWith("\\")
    : (path: string) => path.startsWith("/");

/**
 * Checks if the given string represents a path rather than a non-`file://` URI.
 */
export function isPath(path: string): boolean {
    return (
        isAbsolute(path) ||
        // `file://` is already stripped by `mp.get_property("path")`
        // path.startsWith("file://") ||
        !new RegExp("^[a-zA-Z][a-zA-Z0-9+-.]*://").test(path) //relative path
    );
}

/**
 * Normalizes a given file path by eliminating `.`, `..` and redundant separators.
 * On Windows backslashes are converted to `/`.
 *
 * @param {string} path - The file path to normalize.
 * @param {string} [cwd] - The current working directory. Optional.
 * @returns {string} The normalized file path.
 */
export function normalize(path: string, cwd?: string): string {
    const normSep = (path: string) =>
        stripTrailingSlash(winToPosix(path).replace(/\/{2,}/g, "/"));
    const parts = normSep(path).split("/");
    const normalizedParts = new ArrayStack<string>(() =>
        // `isAbsolute` already includes UNC paths check
        cwd !== void 0 && !isAbsolute(path) ? winToPosix(cwd).split("/") : [],
    );

    parts.forEach((part) => {
        if (part === ".") {
            return;
        } else if (part === "..") {
            normalizedParts.popOrPushIf((top) => top !== "..", part);
        } else {
            normalizedParts.push(part);
        }
    });
    return normalizedParts.collect((parts) => parts.join("/"));
}

export const getMimetype =
    mp.get_property("platform") === "linux"
        ? (() => {
              function getCheckedMime(
                  mimeType: readonly string[],
                  lengthMismatchHandler: () => readonly [string, string],
              ): readonly [string, string] {
                  return mimeType.length !== 2
                      ? lengthMismatchHandler()
                      : (mimeType as readonly [string, string]);
              }

              const extsForFileCmd = new Set([".ts", ".bak", ".txt", ".TXT"]);
              return (
                  file: string,
                  extension: string,
              ): readonly [string, string] => {
                  const fileArgs = ["file", "-Lb", "--mime-type", "--", file];
                  const args = extsForFileCmd.has(extension)
                      ? fileArgs
                      : [
                            "xdg-mime",
                            "query",
                            "filetype",
                            file.startsWith("-") ? `./${file}` : file,
                        ];

                  const str: string = Processes.run(
                      args,
                      true,
                  ).stdout.trimEnd();
                  const mimeType = str.split("/", 2);
                  return getCheckedMime(mimeType, () => {
                      if (args[0] === "xdg-mime") {
                          const str = Processes.run(
                              fileArgs,
                              true,
                          ).stdout.trimEnd();
                          return getCheckedMime(str.split("/", 2), () => {
                              throw new UnexpectedError(
                                  `${JSON.stringify(fileArgs)} returns: ${JSON.stringify(mimeType)}`,
                              );
                          });
                      } else {
                          throw new UnexpectedError(
                              `${JSON.stringify(fileArgs)} returns: ${str}`,
                          );
                      }
                  });
              };
          })()
        : (file: string, _: string): readonly [string, string] => {
              // `file` command on Windows:
              // https://github.com/julian-r/file-windows
              // note: `-L` option isn't supported in this version
              const args = ["file", "-b", "--mime-type", "--", file];
              const str: string = Processes.run(args, true).stdout.trimEnd();
              const mimeType = str.split("/", 2);
              if (mimeType.length !== 2) {
                  throw new UnexpectedError(
                      `${JSON.stringify(args)} returns: ${str}`,
                  );
              } else {
                  return mimeType as unknown as readonly [string, string];
              }
          };
