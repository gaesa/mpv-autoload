# autoload

## Features

- **Automatic Playlist Generation**: The script automatically identifies and loads video and audio files from the same directory into your playlist.
- **Mimetype Checks**:Instead of relying on file extensions, the script uses mimetype checks for more accurate file type identification.

## Installation

### Direct Download

1. Download the `autoload.js` from the _Releases_.
2. Move the downloaded `autoload.js` to your mpv `scripts` folder.

### Building from source

#### Using Nix (Recommended)

```shell
git clone https://github.com/gaesa/mpv-autoload
cd mpv-autoload
nix build
cp result/autoload.js ~/.config/mpv/scripts
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
