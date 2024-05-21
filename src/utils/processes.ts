import {
    ProcessExitCodeError,
    ProcessInitiationError,
    ProcessInterruptedError,
} from "./errors";

export function run(args: string[], check: boolean = false) {
    const p = mp.command_native({
        args: args,
        name: "subprocess",
        playback_only: false,
        capture_stdout: true,
        capture_stderr: true,
    });
    if (check) {
        const status = p.status;
        if (p.error_string === "init") {
            throw new ProcessInitiationError(
                `Failed to initialize ${JSON.stringify(args)}`,
            );
        } else if (p.error_string == "killed") {
            throw new ProcessInterruptedError(
                `Failed to finish ${JSON.stringify(args)}`,
            );
        } else {
            if (status === 0) {
                return p;
            } else {
                throw new ProcessExitCodeError(
                    p.stderr +
                        `Command ${JSON.stringify(args)} returned non-zero exit code ${status}`,
                );
            }
        }
    } else {
        return p;
    }
}
