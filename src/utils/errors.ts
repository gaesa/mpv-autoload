export class NoSuchElementError extends Error {
    constructor(message: string = "No such element exists") {
        super(message);
        this.name = "NoSuchElementError";
    }
}

export class UnexpectedError extends Error {
    constructor(message = "An unexpected error occurred") {
        super(message);
        this.name = "UnexpectedError";
    }
}

export class ProcessExitCodeError extends Error {
    constructor(message = "Process return non-zero exit code") {
        super(message);
        this.name = "ProcessExitCodeError";
    }
}

export class ProcessInitiationError extends Error {
    constructor(message = "Process failed to initialize") {
        super(message);
        this.name = "ProcessInitiationError";
    }
}

export class ProcessInterruptedError extends Error {
    constructor(message = "Process was interrupted") {
        super(message);
        this.name = "ProcessInterruptedError";
    }
}
