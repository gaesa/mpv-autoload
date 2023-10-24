# autoload

## Features

- **Automatic Playlist Generation**: The script automatically identifies and loads video and audio files from the same directory into your playlist.
- **Mimetype Checks**: Instead of relying on file extensions, the script uses mimetype checks for more accurate file type identification.

## Non-Features

1. **Include Files from Subdirectories**: This feature is not implemented because it could make the resulting playlist unexpected and inflexible. I want to ensure that users have full control over the files that are included in the playlist.

2. **Use Extension Instead of MIME Type to Filter Files**: This program uses MIME types instead of file extensions to filter files. This is because file extensions are not always accurate. For instance, a `.ts` file could be a video file or a TypeScript file. However, I am considering making this an option in the future to provide more flexibility.

3. **Limit Number of Files in Playlist**: This feature is not implemented because it could limit the flexibility of the program. I believe that users should have the freedom to include as many files in the playlist as they want.

## Requirements

Ensure `file` and `xdg-mime` are accessible in your system's `PATH`.

## Installation

### Direct Download

1. Download the **latest** version of `autoload.js` from the _Releases_.
2. Move the downloaded `autoload.js` to your mpv `scripts` folder.

## Building from source

```shell
git clone https://github.com/gaesa/mpv-autoload
cd mpv-autoload
npm ci && npm run build
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

## Known Limitations

The `autoload.ts` script leverages the `getMimetype` function to filter all video and audio files within a directory. It’s important to note that this operation is not recursive. This is because the `mp.utils.readdir` function does not recursively return files.

The `getMimetype` function employs the `mp.command_native` function to call an external command and obtain the precise mime type of each file. As this operation is performed individually for each file, it can take over 3 seconds to return results for a directory containing more than 200 files.

Although MPV provides the `mp.command_native_async` function for asynchronous commands, when using this approach users may perceive a delay of approximately 1 second when there are around 200 files, prior to the commencement of media playback by mpv. In reality, the delay measured with `mp.get_time` is less than 0.1 second. The good news is that current implementation of this program will not block your MPV player, even though it currently does not utilize `mp.command_native_async`.

### More Info On Previous Experiments Using `mp.command_native_async`:

`mp.register_event("start-file")` serves as the initial entry point for orchestrating the timing of the program’s execution. The reason for this delay remains ambiguous as mpv appears to wait for the script to complete within a single event. On the other hand, when `mp.register_event("file_loaded")` is used, the delay is postponed until after mpv begins media playback. This leads to a pause in playback and a warning message `Audio device underrun detected`, which could be disruptive for users.

Any suggestions or contributions on how to mitigate this issue are welcome.
