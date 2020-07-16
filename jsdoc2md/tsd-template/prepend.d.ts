import {Readable, Writable, Transform, PassThrough, WritableOptions} from "stream";

import {EventEmitter} from "events";

type AsyncGeneratorFunction<T=any> = (...args: any[]) => {[Symbol.asyncIterator]: {next(): Promise<{value: T, done: boolean}>}}
type AsyncFunction = (...args: any[]) => Promise<any>;

declare function pipelineOverride(...a: any[]): any;
declare namespace pipelineOverride {
    function __promisify__(...a: any[]): any;
}

declare function dataStreamPipeline<T extends DataStream>(readable: any[] | Iterable<any> | AsyncGeneratorFunction | GeneratorFunction | AsyncFunction | Function | string | Readable, ...transforms: any[]): T;
declare namespace dataStreamPipeline {
    function __promisify__(...a: any[]): () => Promise<any>;
}

declare class PromiseTransform extends Transform {
    static pipeline: typeof pipelineOverride | never;
}

type PipeOptions = {
    end: boolean | undefined;
};
