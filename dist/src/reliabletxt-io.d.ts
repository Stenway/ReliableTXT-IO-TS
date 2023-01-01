import { ReliableTxtDocument, ReliableTxtEncoding } from '@stenway/reliabletxt';
export declare abstract class ReliableTxtFile {
    static getEncodingOrNullSync(filePath: string): ReliableTxtEncoding | null;
    static getEncodingSync(filePath: string): ReliableTxtEncoding;
    static loadSync(filePath: string): ReliableTxtDocument;
    static appendAllTextSync(content: string, filePath: string, createWithEncoding?: ReliableTxtEncoding): void;
    static appendAllLinesSync(lines: string[], filePath: string, createWithEncoding?: ReliableTxtEncoding): void;
    static readAllTextSync(filePath: string): string;
    static readAllLinesSync(filePath: string): string[];
    static saveSync(document: ReliableTxtDocument, filePath: string): void;
    static writeAllTextSync(content: string, filePath: string, encoding?: ReliableTxtEncoding): void;
    static writeAllLinesSync(lines: string[], filePath: string, encoding?: ReliableTxtEncoding): void;
}
export declare class SyncReliableTxtStreamReader {
    private handle;
    private position;
    private buffer;
    private _encoding;
    private rest;
    get encoding(): ReliableTxtEncoding;
    get isClosed(): boolean;
    constructor(filePath: string, chunkSize?: number);
    readLine(): string | null;
    close(): void;
}
export declare class SyncReliableTxtStreamWriter {
    private handle;
    readonly encoding: ReliableTxtEncoding;
    private isEmpty;
    get isClosed(): boolean;
    constructor(filePath: string, createWithEncoding?: ReliableTxtEncoding, append?: boolean);
    write(text: string): void;
    writeLine(line: string): void;
    writeLines(lines: string[]): void;
    close(): void;
}
export declare class ReverseLineIterator {
    private handle;
    private index;
    private encoding;
    private buffer;
    constructor(filePath: string, encoding: ReliableTxtEncoding);
    getLine(): string;
    getPosition(): number;
    close(): void;
}
//# sourceMappingURL=reliabletxt-io.d.ts.map