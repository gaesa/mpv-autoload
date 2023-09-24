var utils = mp.utils;
var msg = mp.msg;

interface String {
  startsWith(prefix: string): boolean;
  trimEnd(): string;
}
if (String.prototype.startsWith === undefined) {
  String.prototype.startsWith = function (prefix: string): boolean {
    return this.match("^" + prefix) !== null;
  };
}
if (String.prototype.trimEnd === undefined) {
  String.prototype.trimEnd = function (): string {
    return this.replace(/\s+$/, "");
  };
}

interface Array<T> {
  remove(index: number): [T, Array<T>];
}
Array.prototype.remove = function (index: number): [any, any[]] {
  var copy = this.slice();
  return [copy.splice(index, 1)[0], copy];
};

function sorted(
  list: any[],
  key: (arg: any) => any = function (x) {
    x;
  },
) {
  return list.slice().sort(function (a, b) {
    var keyA = key(a);
    var keyB = key(b);
    if (Array.isArray(keyA) && Array.isArray(keyB)) {
      for (var i = 0; i < keyA.length && i < keyB.length; i++) {
        if (keyA[i] < keyB[i]) {
          return -1;
        } else if (keyA[i] > keyB[i]) {
          return 1;
        }
      }
      if (keyA.length < keyB.length) {
        return -1;
      } else if ((keyA.length = keyB.length)) {
        return 0;
      } else {
        return 1;
      }
    } else {
      if (keyA < keyB) {
        return -1;
      } else if ((keyA = keyB)) {
        return 0;
      } else {
        return 1;
      }
    }
  });
}

function natsort(s: string, _nsRe: RegExp = /(\d+)/, _digRe: RegExp = /^\d+$/) {
  function isDigit(n: string) {
    return _digRe.test(n);
  }

  var splitList = s.split(_nsRe);
  if (splitList[0] === "") {
    splitList.shift();
  }
  if (splitList[splitList.length - 1] === "") {
    splitList.pop();
  }
  return splitList.map(function (text: string) {
    return isDigit(text) ? parseInt(text, 10) : text;
  });
}

function subprocess(args: string[]) {
  return mp.command_native({
    args: args,
    name: "subprocess",
    playback_only: false,
    capture_stdout: true,
  });
}

function keysToTable(keys: any[]) {
  var table: { [key: string]: any } = {}; //in js, object can only have string keys
  keys.forEach(function (key) {
    table[key] = true;
  });
  return table;
}

function splitExt(path: string): [string, string] {
  var [dir, file] = utils.split_path(path) as [string, string];
  var lastDotIndex = file.lastIndexOf(".");
  if (lastDotIndex === 0 || lastDotIndex == -1) {
    return [path, ""];
  } else {
    return [
      utils.join_path(dir, file.slice(0, lastDotIndex)),
      file.slice(lastDotIndex),
    ];
  }
}

function getMimetype(file: string): string {
  var extension = splitExt(file)[1];
  return keysToTable([".ts", ".bak"])[extension]
    ? subprocess(["/usr/bin/file", "-Lb", "--mime-type", file]).stdout.trimEnd()
    : subprocess([
        "/usr/bin/xdg-mime",
        "query",
        "filetype",
        file,
      ]).stdout.trimEnd();
}

function getVideos(dir: string): string[] {
  var files = utils.readdir(dir, "files") as string[];
  return sorted(
    files.filter(function (file: string) {
      return getMimetype(file).startsWith("video");
    }),
    natsort,
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
  var current = files.indexOf(file);
  if (current === -1) {
    return null;
  } else {
    msg.trace("current file position in files: " + current);
    return current;
  }
}

function main() {
  var path = mp.get_property("path", "");
  var [dir, file] = utils.split_path(path) as [string, string];
  msg.trace("dir: " + dir + ", file: " + file);

  var files = getVideos(dir);
  if (files.length === 0) {
    msg.verbose("no other files or directories in directory");
    return;
  } else {
    var current = fdCurrentEntryPos(files, file);
    if (current === null) {
      return;
    } else {
      files.remove(current)[1].forEach(function (file) {
        mp.commandv("loadfile", file, "append");
      });
      mp.commandv("playlist-move", 0, current + 1);
    }
  }
}

mp.register_event("start-file", function () {
  var pl_count = mp.get_property_number("playlist-count", 1) as number;
  if (checkPlaylist(pl_count)) {
    main();
  } else return;
});
