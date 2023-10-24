const utils = mp.utils;
const msg = mp.msg;

interface String {
  trimEnd(): string;
}
if (String.prototype.trimEnd === undefined) {
  String.prototype.trimEnd = function(): string {
    return this.replace(/\s+$/, "");
  };
}

interface Array<T> {
  remove(index: number): [T, Array<T>];
}
Array.prototype.remove = function(index: number): [any, any[]] {
  const copy = this.slice();
  return [copy.splice(index, 1)[0], copy];
};

function sorted(
  list: any[],
  key: (arg: any) => any = function(x) {
    return x;
  },
) {
  return list.slice().sort(function(a, b) {
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
    return splitList.map(function(text: string) {
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

function keysToTable(keys: any[], value: any = true) {
  const table: { [key: string]: any } = {}; //in js, object can only have string keys
  keys.forEach(function(key) {
    table[key] = value;
  });
  return table;
}

function splitExt(path: string): [string, string] {
  const [dir, file] = utils.split_path(path) as [string, string];
  const lastDotIndex = file.lastIndexOf(".");
  if (lastDotIndex === 0 || lastDotIndex === -1) {
    return [path, ""];
  } else {
    return [
      utils.join_path(dir, file.slice(0, lastDotIndex)),
      file.slice(lastDotIndex),
    ];
  }
}

function getMimetype(file: string): [string, string] {
  const extension = splitExt(file)[1];

  const fileArgs = ["file", "-Lb", "--mime-type", file];
  const xdgArgs = ["xdg-mime", "query", "filetype", file];
  const args =
    extension in keysToTable([".ts", ".bak", ".txt", ".TXT"])
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

function getFiles(dir: string): string[] {
  const allowedTypes = ["video", "audio"];
  const allowedTypesTable = keysToTable(allowedTypes);
  const files = utils.readdir(dir, "files") as string[];
  return natsort(
    files.filter(function(file: string) {
      const mimeType = getMimetype(file);
      return mimeType[0] in allowedTypesTable;
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

function main() {
  const path = mp.get_property("path", "");
  const [dir, file] = utils.split_path(path) as [string, string];
  msg.trace("dir: " + dir + ", file: " + file);

  const files = getFiles(dir);
  if (files.length === 0) {
    msg.verbose("no other files or directories in directory");
    return;
  } else {
    const current = fdCurrentEntryPos(files, file);
    if (current === null) {
      return;
    } else {
      files.remove(current)[1].forEach(function(file) {
        mp.commandv("loadfile", file, "append");
      });
      mp.commandv("playlist-move", 0, current + 1);
    }
  }
}

mp.register_event("start-file", function() {
  const pl_count = mp.get_property_number("playlist-count", 1) as number;
  if (checkPlaylist(pl_count)) {
    main();
  } else {
    return;
  }
});
