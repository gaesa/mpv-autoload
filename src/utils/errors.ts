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
