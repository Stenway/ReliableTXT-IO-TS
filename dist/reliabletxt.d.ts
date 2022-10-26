export declare enum ReliableTxtEncoding {
    Utf8 = 0,
    Utf16 = 1,
    Utf16Reverse = 2,
    Utf32 = 3
}
export declare abstract class ReliableTxtEncodingUtil {
    static getPreambleSize(encoding: ReliableTxtEncoding): number;
}
export declare abstract class ReliableTxtLines {
    static join(lines: string[]): string;
    static split(text: string): string[];
}
export declare class InvalidUtf16StringError extends Error {
    constructor();
}
export declare class StringDecodingError extends Error {
    constructor();
}
export declare class NoReliableTxtPreambleError extends Error {
    constructor();
}
export declare abstract class Utf16String {
    static isValid(str: string): boolean;
    static validate(str: string): void;
    static getCodePointCount(str: string): number;
    static getCodePointArray(str: string): number[];
    static getCodePoints(str: string): Uint32Array;
    static toUtf8Bytes(text: string): Uint8Array;
    static toUtf16Bytes(text: string, littleEndian?: boolean): Uint8Array;
    static toUtf32Bytes(str: string, littleEndian?: boolean): Uint8Array;
    static fromUtf8Bytes(bytes: Uint8Array, skipFirstBom?: boolean): string;
    static fromUtf16Bytes(bytes: Uint8Array, littleEndian: boolean, skipFirstBom?: boolean): string;
    static fromUtf32Bytes(bytes: Uint8Array, littleEndian: boolean, skipFirstBom?: boolean): string;
    static fromCodePointArray(codePoints: number[]): string;
}
export declare abstract class ReliableTxtEncoder {
    static encode(text: string, encoding: ReliableTxtEncoding): Uint8Array;
    static encodePart(text: string, encoding: ReliableTxtEncoding): Uint8Array;
}
export declare abstract class ReliableTxtDecoder {
    static getEncodingOrNull(bytes: Uint8Array): ReliableTxtEncoding | null;
    static getEncoding(bytes: Uint8Array): ReliableTxtEncoding;
    static decode(bytes: Uint8Array): ReliableTxtDocument;
    static decodePart(bytes: Uint8Array, encoding: ReliableTxtEncoding): string;
}
export declare class ReliableTxtDocument {
    text: string;
    encoding: ReliableTxtEncoding;
    constructor(text?: string, encoding?: ReliableTxtEncoding);
    getBytes(): Uint8Array;
    setLines(lines: string[]): void;
    getLines(): string[];
    getCodePoints(): number[];
    setCodePoints(codePoints: number[]): void;
    static fromBytes(bytes: Uint8Array): ReliableTxtDocument;
    static fromLines(lines: string[]): ReliableTxtDocument;
}
