# autoload

## Features

- **Automatic Playlist Generation**: The script automatically identifies and loads video and audio files from the same directory into your playlist.
- **Mimetype Checks**: Instead of relying on file extensions, the script uses mimetype checks for more accurate file type identification.

## Installation

### Direct Download

1. Download the **latest** version of `autoload.js` from the _Releases_.
2. Move the downloaded `autoload.js` to your mpv `scripts` folder.

### Building from source

#### Using Nix (Recommended)

```shell
git clone https://github.com/gaesa/mpv-autoload
cd mpv-autoload
nix build && mkdir dist && chmod -R u+rw dist && cp -r result/. dist && chmod -R u+rw dist
cp dist/autoload.js ~/.config/mpv/scripts
```

#### Manually using TypeScript

```shell
git clone https://github.com/gaesa/mpv-autoload
cd mpv-autoload
tsc
cp dist/autoload.js ~/.config/mpv/scripts
```

## Usage

Just move `autoload.js` to your mpv `scripts` folder and it will work out of the box. Enjoy your video and audio without any hassle!

## Improvements Over [ `autoload.lua` ](https://github.com/mpv-player/mpv/blob/master/TOOLS/lua/autoload.lua)

`autoload.ts` is a refactored and optimized version of the original `autoload.lua` script from the mpv player. Here are some key improvements:

- **Readability and Simplicity**: The code has been restructured and simplified, making it easier to understand and maintain.
- **Modularity**: Unnecessary options have been removed and the code has been made more modular, enhancing its flexibility.
- **Efficiency**: Complex nested loops and lengthy functions have been eliminated, resulting in a more efficient script.
- **Simplified Logic**: The main logic of the script has been simplified, making it more straightforward and easier to follow.

With these improvements, `autoload.ts` provides a cleaner, more efficient, and ready to use approach to automatically loading video and audio files into the mpv player’s playlist.

## Limitation

The `autoload.ts` script uses the `getMimetype` function to filter all video and audio files within a directory. Note that this operation is not recursive, as the `mp.utils.readdir` function does not return files recursively.

The `getMimetype` function employs the `mp.command_native` function to call an external command and obtain the precise mime type of each file. As this operation is performed individually for each file, it can take over 3 seconds to return results for a directory containing more than 200 files.

Although MPV provides the `mp.command_native_async` function for asynchronous operations, I have not found an effective way to wait for all commands to return results before proceeding. However, the good news is that this script will not block your MPV player, even though it currently does not utilize `mp.command_native_async.`

Any suggestions or contributions on how to speed up this operation are welcome.
