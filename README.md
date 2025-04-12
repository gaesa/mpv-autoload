# autoload

> [!NOTE]
> The basic functionality of this program has already been independently implemented in the upstream through `--autocreate-playlist`. The most important difference is that the native feature modifies the autoload behavior for both directory arguments and single file arguments, while this program is designed exclusively for single file input. For instance, when you pass a directory, the native feature can include all files within it, including those in subfolders, in the playlist; when you pass a file, it will also include files from subfolders in the playlist. Changing this latter behavior will also alter the previous behavior, as they share the same option, `--directory-mode`. Currently, when using the native feature, you cannot enable recursion for directory arguments while ignoring subfolders for a single file argument. For more details, see: [mpv v0.39.0](https://github.com/mpv-player/mpv/discussions/14903), [`--autocreate-playlist`](https://mpv.io/manual/stable/#options-autocreate-playlist), [`--directory-mode`](https://mpv.io/manual/stable/#options-directory-mode).

## Features

- **Automatic Playlist Generation**: The script automatically identifies and loads video and audio files from the same directory into your playlist.
- **Mixed Method for File Type Identification**: The script now uses a combination of file extension checks and mimetype checks to identify file types. This approach is more reliable and still fast, as it uses extension checks for common media files and mimetype checks for the rest.
- **Easy Setup with Sensible Defaults**: The program works immediately upon installation with a default configuration that should be suitable for most use cases. However, it also offers flexible configuration options for advanced users who wish to customize their experience.

## Non-Features

1. **Include Files from Subdirectories**: This feature is not implemented because it could make the resulting playlist unexpected and inflexible. I want to ensure that users have full control over the files that are included in the playlist.

2. **Limit Number of Files in Playlist**: This feature is not implemented because it could limit the flexibility of the program. I believe that users should have the freedom to include as many files in the playlist as they want.

3. **Absence of Image Support**: The program does not support images, as mpv is primarily intended for video playback, not image viewing. For image viewing, there are other tools that are more suitable in this context, such as `imv`, `gwenview`, or various file managers which support the preview functionality.

## Requirements

Ensure `mpv` can access the required dependencies:

- **Linux:** The `file` and `xdg-mime` executables should be located in a directory listed in your `PATH`.
- **Other Operating Systems:** The `file` executable should be located in a directory listed in your `PATH`.

For Windows users, you can install `file` by first installing `git` using Chocolatey with the command: `choco install git`. Alternatively, you can manually download `git` from https://git-scm.com/download/win. After that, add `<Git_Installed_Directory>\usr\bin` to your `PATH` as necessary. This will make use of the `file` command that comes with `git`. Please note that installing `file` directly via Chocolatey is not recommended as it cannot handle unicode filenames properly. ([See also for more details](https://yazi-rs.github.io/docs/installation/#requirements))

## Installation

### Direct Download

1. Download the **latest** version of `autoload.js` from the _Releases_.
2. Move the downloaded `autoload.js` to your mpv `scripts` folder.

### Building from source

```sh
git clone https://github.com/gaesa/mpv-autoload
cd mpv-autoload
pnpm install --frozen-lockfile && pnpm run build
cp dist/autoload.js ~/.config/mpv/scripts
```

## Usage

Just move `autoload.js` to your mpv `scripts` folder and it will work out of the box. Enjoy your video and audio without any hassle!

### Customization

You may want to modify some of the default options. Currently, there are 5 available options: `commonVideo`, `commonAudio`, `allowedMimeTypes`, `ignoreHidden`, and `sortCaseSensitive`. The program first utilizes `commonVideo` and `commonAudio` to filter files in a directory. If a file passes this filter, it is added to the list. If not, the program checks whether the file's extension typically represents a non-media file, such as subtitles, executables, or archives. If it does not, it then examines the file’s mimetype. If the mimetype is in `allowedMimeTypes`, the file is also added to the list. Files that do not meet these criteria are not included in the list.

You can add more extensions (they are case-insensitive) to `commonVideo` or `commonAudio` to speed up this process. Alternatively, you can assign an empty array `[]` to `commonAudio` and then assign `["video"]` to `allowedMimeTypes` to disable support for audio files.

Here is the default configuration. You can copy it to `~/.config/mpv/script-opts/autoload.conf` and modify it to suit your needs:

```
# It's okay to leave spaces between the elements of the array.
commonVideo=[".flv", ".mkv", ".mov", ".mp4", ".mpeg", ".mpg", ".ogv", ".webm", ".wmv"]
commonAudio=[".flac", ".m4a", ".mp3", ".oga", ".ogg", ".opus", ".wav"]

# The main type (e.g., 'video' in 'video/mp4')
allowedMimeTypes=["video", "audio"]

# This option, either `true` or `false`, controls whether files beginning with a `.` are ignored.
ignoreHidden=true

# Enable case-sensitive playlist entries sorting
sortCaseSensitive=true
```

## Improvements Over [ `autoload.lua` ](https://github.com/mpv-player/mpv/blob/master/TOOLS/lua/autoload.lua)

`autoload.ts` is a refactored and optimized version of the original `autoload.lua` script from the mpv player. Here are some key improvements:

- **Readability and Simplicity**: The code has been restructured and simplified, making it easier to understand and maintain.
- **Modularity**: Unnecessary options have been removed and the code has been made more modular, enhancing its flexibility.
- **Efficiency**: Complex nested loops and lengthy functions have been eliminated, resulting in a more efficient script.
- **Simplified Logic**: The main logic of the script has been simplified, making it more straightforward and easier to follow.

With these improvements, `autoload.ts` provides a cleaner, more efficient, and ready to use approach to automatically loading video and audio files into the mpv player’s playlist.

## Known Limitations

### Size

- TypeScript is used to manage complexity. However, `ts-loader` brings in some polyfills, increasing the final file size.
- Due to MuJS's limitations, `core.js` is chosen as a supporting dependency to reduce maintenance burden. It provides necessary polyfills but further increases the file size.

### Performance

MuJS is slow, and MPV's JS API is significantly slower than its Lua counterpart. Actual business logic may account for less than 10% of total execution time, even with more efficient algorithms and process design compared to the Lua version.
