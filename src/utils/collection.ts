// noinspection JSUnusedGlobalSymbols

import { NoSuchElementError } from "./errors";

/**
 * An interface representing a stack data structure.
 * @template T - The type of elements stored in the stack.
 */
export interface Stack<T> {
    /**
     * Pushes an element onto the stack.
     * @param {T} element - The element to push onto the stack.
     */
    push(element: T): void;

    /**
     * Pops and returns the top element from the stack.
     * @returns {T} - The popped element.
     * @throws NoSuchElementError if the stack is empty and no default argument is provided.
     */
    pop(): T;

    /**
     * Returns the top element of the stack without removing it.
     * @returns {T} - The top element of the stack.
     * @throws NoSuchElementError if the stack is empty and no default argument is provided.
     */
    peek(): T;

    /**
     * Returns the number of elements in the stack.
     * @returns {number} - The number of elements in the stack.
     */
    size(): number;

    /**
     * Checks if the stack is empty.
     * @returns {boolean} - True if the stack is empty, false otherwise.
     */
    isEmpty(): boolean;

    /**
     * Returns a string representation of the stack.
     * @returns {string} - A string representation of the stack.
     */
    toString(): string;
}

class MissingDefault {}

/**
 * An array-based implementation of Stack.
 * @template T - The type of elements stored in the stack.
 */
export class ArrayStack<T> implements Stack<T> {
    // noinspection TypeScriptFieldCanBeMadeReadonly
    private storage: T[];

    /**
     * Constructs a new ArrayStack.
     * @param {(() => T[])} [seed] - Optional seed function to initialize the stack.
     */
    constructor(seed?: () => T[]) {
        this.storage = seed !== void 0 ? seed() : [];
    }

    push(element: T): void {
        this.storage.push(element);
    }

    pop(): T;
    // noinspection JSValidateJSDoc
    /**
     * Pops and returns the top element from the stack, or returns a default value if the stack is empty.
     * @param {U} defaultValue - The default value to return if the stack is empty.
     * @returns {T | U} - The popped element or the default value.
     * @template U - The type of the default value.
     */
    pop<U>(defaultValue: U): T | U;

    pop<U>(defaultValue: U | typeof MissingDefault = MissingDefault): T | U {
        if (!this.isEmpty()) {
            return this.storage.pop() as T;
        } else if (defaultValue !== MissingDefault) {
            return defaultValue as U;
        } else {
            throw new NoSuchElementError("Cannot pop from an empty stack");
        }
    }

    peek(): T;
    // noinspection JSValidateJSDoc
    /**
     * Returns the top element of the stack without removing it, or returns a default value if the stack is empty.
     * @param {U} defaultValue - The default value to return if the stack is empty.
     * @returns {T | U} - The top element of the stack or the default value.
     * @template U - The type of the default value.
     */
    peek<U>(defaultValue: U): T | U;

    peek<U>(defaultValue: U | typeof MissingDefault = MissingDefault): T | U {
        if (!this.isEmpty()) {
            return this.storage[this.size() - 1];
        } else if (defaultValue !== MissingDefault) {
            return defaultValue as U;
        } else {
            throw new NoSuchElementError("Cannot peek an empty stack");
        }
    }

    /**
     * Conditionally pops the top element from the stack if the provided predicate evaluates to true,
     * or pushes the specified element onto the stack if the predicate evaluates to false.
     * If the stack is empty, the specified element will always be pushed onto the stack.
     * @param {(stackTop: T) => boolean} predicate - The predicate function.
     * @param {T} pushedElement - The element to push onto the stack if the predicate evaluates to false.
     */
    popOrPushIf(predicate: (stackTop: T) => boolean, pushedElement: T): void {
        if (!this.isEmpty()) {
            if (predicate(this.storage[this.storage.length - 1])) {
                this.storage.pop();
            } else {
                this.push(pushedElement);
            }
        } else {
            this.push(pushedElement);
        }
    }

    // noinspection JSValidateJSDoc
    /**
     * Collects the elements of the stack into a result using the provided operation.
     * @param {(storage: readonly T[]) => U} operation - The operation to apply to the array representation of the stack.
     * @returns {U} - The result of applying the operation.
     * @template U - The type of the result.
     */
    collect<U>(operation: (storage: readonly T[]) => U): U {
        return operation(this.storage);
    }

    size(): number {
        return this.storage.length;
    }

    isEmpty(): boolean {
        return this.size() === 0;
    }

    toString(): string {
        return `Stack([${this.storage.join(", ")}])`;
    }
}
