export class ProcessError extends Error {
    constructor(message = "Process error occurred") {
        super(message);
        this.name = "ProcessError";
    }
}

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
        if (status === 0) {
            return p;
        } else {
            throw new ProcessError(
                p.stderr +
                    `Command ${JSON.stringify(args)} returned non-zero exit status ${status}`,
            );
        }
    } else {
        return p;
    }
}
