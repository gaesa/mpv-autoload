import "core-js/es/string/starts-with";
import "core-js/es/string/ends-with";
import "core-js/es/string/trim-end";
import "core-js/es/set";

const utils = mp.utils;
const msg = mp.msg;

function begin(...args: Array<() => any>): any {
  let value: any = void 0;
  args.forEach((arg) => {
    value = arg();
  });
  return value;
}

function sorted(
  list: any[],
  key: (arg: any) => any = function (x) {
    return x;
  },
) {
  return list.slice().sort((a, b) => {
    const [keyA, keyB] = [key(a), key(b)];
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
    const splitList = s.split(/(\d+)/);
    if (splitList[0] === "") {
      splitList.shift();
    }
    if (splitList.length > 0 && splitList[splitList.length - 1] === "") {
      splitList.pop();
    }
    return splitList.map((text: string) => {
      return isDigit(text) ? parseInt(text, 10) : text;
    });
  }
  return sorted(strings, key);
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

function getMimetype(
  file: string,
  extension: string | null = null,
): [string, string] {
  const ext = extension === null ? splitExt(file)[1] : extension;

  const fileArgs = ["file", "-Lb", "--mime-type", "--", file];
  const xdgArgs = [
    "xdg-mime",
    "query",
    "filetype",
    file.startsWith("-") ? "./" + file : file,
  ];
  const args = new Set([".ts", ".bak", ".txt", ".TXT"]).has(ext)
    ? fileArgs
    : xdgArgs;

  const str: string = subprocess(args, true).stdout.trimEnd();
  const mimeType = str.split("/");
  if (mimeType.length !== 2) {
    if (args === xdgArgs) {
      const newStr = subprocess(fileArgs, true).stdout.trimEnd() as string;
      const newType = newStr.split("/");
      if (newType.length !== 2) {
        throw new Error(JSON.stringify(fileArgs) + " returns: " + newStr);
      } else {
        return newType as [string, string];
      }
    } else {
      throw new Error(JSON.stringify(fileArgs) + " returns: " + str);
    }
  } else {
    return mimeType as [string, string];
  }
}

function mergeSets(...sets: Set<any>[]): Set<any> {
  const mergedSet = new Set<any>();
  sets.forEach((set) => {
    set.forEach((elem) => {
      mergedSet.add(elem);
    });
  });
  return mergedSet;
}

function getFiles(dir: string, joinFlag: boolean = false): string[] {
  const allowedTypes = new Set(["video", "audio"]);
  const commonVideo = new Set([".mp4", ".mkv", ".webm"]);
  const commonAudio = new Set([".mp3", ".flac"]);
  const commonMedia = mergeSets(commonVideo, commonAudio) as Set<string>;

  const files = utils.readdir(dir, "files") as string[];
  const toBeFiltered = joinFlag
    ? files.map((file: string) => {
        return utils.join_path(dir, file) as string;
      })
    : files;
  return natsort(
    toBeFiltered.filter((file: string) => {
      const ext = splitExt(file)[1];
      if (commonMedia.has(ext)) {
        return true;
      } else {
        return allowedTypes.has(getMimetype(file, ext)[0]);
      }
    }),
  );
}

function checkPlaylist(pl_count: number) {
  if (pl_count > 1) {
    msg.verbose("stopping: manually made playlist");
    return false;
  } else {
    return true;
  }
}

function fdCurrentEntryPos(files: string[], file: string) {
  const current = files.indexOf(file);
  if (current === -1) {
    return null;
  } else {
    msg.trace("current file position in files: " + current);
    return current;
  }
}

function stripTrailingSlash(path: string) {
  return path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;
}

function main() {
  const path: string | null = mp.get_property_native("path", null);
  if (path === null) {
    return;
  } else {
    let [dir, file] = utils.split_path(path) as [string, string];
    dir = stripTrailingSlash(dir);
    const joinFlag = utils.getcwd() !== dir;
    file = joinFlag ? utils.join_path(dir, file) : file;
    msg.trace("dir: " + dir + ", file: " + file);

    const files = getFiles(dir, joinFlag);
    if (files.length === 0) {
      msg.verbose("no other files or directories in directory");
      return;
    } else {
      const current = fdCurrentEntryPos(files, file);
      if (current === null) {
        return;
      } else {
        begin(
          () => {
            return files.splice(current, 1);
          },
          () => {
            return files;
          },
        ).forEach((file: string) => {
          mp.commandv("loadfile", file, "append");
        });
        mp.commandv("playlist-move", 0, current + 1);
      }
    }
  }
}

mp.register_event("start-file", () => {
  const pl_count = mp.get_property_native("playlist-count", 1) as number;
  if (checkPlaylist(pl_count)) {
    main();
  } else {
    return;
  }
});
