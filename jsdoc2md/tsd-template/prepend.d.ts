import {Readable, Writable, Transform} from "stream";

import {EventEmitter} from "events";

type AsyncGeneratorFunction<T=any> = (...args: any[]) => {[Symbol.asyncIterator]: {next(): Promise<{value: T, done: boolean}>}}
type AsyncFunction = (...args: any[]) => Promise<any>;
type ThenFunction = (arg: any) => any;

declare class PromiseTransform implements Readable, Writable {
    writableEnded: boolean;
    writableFinished: boolean;
    writableHighWaterMark: number;
    writableLength: number;
    writableObjectMode: boolean;
    writableCorked: number;
    _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error) => void): void;
    _writev?(chunks: { chunk: any; encoding: BufferEncoding; }[], callback: (error?: Error) => void): void;
    _final(callback: (error?: Error) => void): void;
    setDefaultEncoding(encoding: BufferEncoding): this;
    cork(): void;
    uncork(): void;
    readableAborted: boolean
    readableDidRead: boolean
    readableEncoding: BufferEncoding;
    readableEnded: boolean;
    readableFlowing: boolean;
    readableHighWaterMark: number;
    readableLength: number;
    readableObjectMode: boolean;
    destroyed: boolean;
    _read(size: number): void;
    push(chunk: any, encoding?: BufferEncoding): boolean;
    _destroy(error: Error, callback: (error?: Error) => void): void;
    destroy(error?: Error): void;
    readable: boolean;
    read(size?: number | undefined): string | Buffer;
    setEncoding(encoding: string): this;
    pause(): this;
    resume(): this;
    isPaused(): boolean;
    pipe<T extends NodeJS.WritableStream>(destination: T, options?: { end?: boolean | undefined; } | undefined): T;
    unpipe(destination?: NodeJS.WritableStream | undefined): this;
    unshift(chunk: string | Uint8Array, encoding?: "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex" | undefined): void;
    wrap(oldStream: NodeJS.ReadableStream): this;
    [Symbol.asyncIterator](): AsyncIterableIterator<string | Buffer>;
    addListener(event: string | symbol, listener: (...args: any[]) => void): this;
    on(event: string | symbol, listener: (...args: any[]) => void): this;
    once(event: string | symbol, listener: (...args: any[]) => void): this;
    removeListener(event: string | symbol, listener: (...args: any[]) => void): this;
    off(event: string | symbol, listener: (...args: any[]) => void): this;
    removeAllListeners(event?: string | symbol | undefined): this;
    setMaxListeners(n: number): this;
    getMaxListeners(): number;
    listeners(event: string | symbol): Function[];
    rawListeners(event: string | symbol): Function[];
    emit(event: string | symbol, ...args: any[]): boolean;
    listenerCount(type: string | symbol): number;
    prependListener(event: string | symbol, listener: (...args: any[]) => void): this;
    prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;
    eventNames(): (string | symbol)[];
    writable: boolean;
    write(buffer: string | Uint8Array, cb?: ((err?: Error | null | undefined) => void) | undefined): boolean;
    write(str: string, encoding?: string | undefined, cb?: ((err?: Error | null | undefined) => void) | undefined): boolean;
    end(cb?: (() => void) | undefined): void;
    end(data: string | Uint8Array, cb?: (() => void) | undefined): void;
    end(str: string, encoding?: string | undefined, cb?: (() => void) | undefined): void;
    addListener(event: string | symbol, listener: (...args: any[]) => void): this;
    on(event: string | symbol, listener: (...args: any[]) => void): this;
    once(event: string | symbol, listener: (...args: any[]) => void): this;
    removeListener(event: string | symbol, listener: (...args: any[]) => void): this;
    off(event: string | symbol, listener: (...args: any[]) => void): this;
    removeAllListeners(event?: string | symbol | undefined): this;
    setMaxListeners(n: number): this;
    getMaxListeners(): number;
    listeners(event: string | symbol): Function[];
    rawListeners(event: string | symbol): Function[];
    emit(event: string | symbol, ...args: any[]): boolean;
    listenerCount(type: string | symbol): number;
    prependListener(event: string | symbol, listener: (...args: any[]) => void): this;
    prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;
    eventNames(): (string | symbol)[];
}
