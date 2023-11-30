# autoload

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

For Windows users, you can install `file` using Chocolatey with the command: `choco install file`. Alternatively, you can manually download it from the _Releases_ section of [https://github.com/julian-r/file-windows](https://github.com/julian-r/file-windows), then update `Path` as necessary.

## Installation

### Direct Download

1. Download the **latest** version of `autoload.js` from the _Releases_.
2. Move the downloaded `autoload.js` to your mpv `scripts` folder.

### Building from source

```shell
git clone https://github.com/gaesa/mpv-autoload
cd mpv-autoload
pnpm install --frozen-lockfile && pnpm run build
cp dist/autoload.js ~/.config/mpv/scripts
```

## Usage

Just move `autoload.js` to your mpv `scripts` folder and it will work out of the box. Enjoy your video and audio without any hassle!

### Customization

You may want to modify some of the default options. Currently, there are three available options: `commonVideo`, `commonAudio`, and `allowedMimeTypes`. The program first uses `commonVideo` and `commonAudio` to filter files in a directory. If a file passes this filter, it is added to the list. If not, the program checks the file’s mimetype. If the mimetype is in `allowedMimeTypes`, the file is also added to the list. Files that do not meet these criteria are not added to the list.

You can add more extensions to `commonVideo` or `commonAudio` to speed up this process. Alternatively, you can assign an empty array `[]` to `commonAudio` and then assign `["video"]` to `allowedMimeTypes` to disable support for audio files.

Here is the default configuration. You can copy it to `~/.config/mpv/script-opts/autoload.conf` and modify it to suit your needs:

```
# It's okay to leave spaces between the elements of the array.
commonVideo=[".mp4", ".mkv", ".webm"]
commonAudio=[".mp3", ".flac"]

# The main type (e.g., 'video' in 'video/mp4')
allowedMimeTypes=["video", "audio"]

# This option, either `true` or `false`, controls whether files beginning with a `.` are ignored.
ignoreHidden=true
```

## Improvements Over [ `autoload.lua` ](https://github.com/mpv-player/mpv/blob/master/TOOLS/lua/autoload.lua)

`autoload.ts` is a refactored and optimized version of the original `autoload.lua` script from the mpv player. Here are some key improvements:

- **Readability and Simplicity**: The code has been restructured and simplified, making it easier to understand and maintain.
- **Modularity**: Unnecessary options have been removed and the code has been made more modular, enhancing its flexibility.
- **Efficiency**: Complex nested loops and lengthy functions have been eliminated, resulting in a more efficient script.
- **Simplified Logic**: The main logic of the script has been simplified, making it more straightforward and easier to follow.

With these improvements, `autoload.ts` provides a cleaner, more efficient, and ready to use approach to automatically loading video and audio files into the mpv player’s playlist.

## Known Limitations

The `autoload.ts` script leverages the `getMimetype` function to filter all video and audio files within a directory. It’s important to note that this operation is not recursive. This is because the `mp.utils.readdir` function does not recursively return files.

The `getMimetype` function employs the `mp.command_native` function to call an external command and obtain the precise mime type of each file. As this operation is performed individually for each file, it can take over 3 seconds to return results for a directory containing more than 200 files. (However, by using the mixed method, this task is finished within 0.4 seconds if most of files are common media files)

Although MPV provides the `mp.command_native_async` function for asynchronous commands, when using this single approach users may perceive a delay of approximately 1 second when there are around 200 files, prior to the commencement of media playback by mpv. In reality, the delay measured with `mp.get_time` is less than 0.1 second. The good news is that current implementation of this program will not block your MPV player, even though it currently does not utilize `mp.command_native_async`.

### More Info On Previous Experiments Using `mp.command_native_async`:

`mp.register_event("start-file")` serves as the initial entry point for orchestrating the timing of the program’s execution. The reason for this delay remains ambiguous as mpv appears to wait for the script to complete within a single event. On the other hand, when `mp.register_event("file_loaded")` is used, the delay is postponed until after mpv begins media playback. This leads to a pause in playback and a warning message `Audio device underrun detected`, which could be disruptive for users.

Any suggestions or contributions on how to mitigate this issue are welcome.
