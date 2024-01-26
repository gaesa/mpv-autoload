export function run(args: string[], check: boolean = false) {
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
                    `Command ${JSON.stringify(
                        args,
                    )} returned non-zero exit status ${JSON.stringify(status)}`,
            );
        }
    } else {
        return p;
    }
}
