"use strict";
/* (C) Stefan John / Stenway / ReliableTXT.com / 2023 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReverseLineIterator = exports.SyncReliableTxtStreamWriter = exports.SyncReliableTxtStreamReader = exports.ReliableTxtFile = void 0;
const fs = __importStar(require("fs"));
const reliabletxt_1 = require("@stenway/reliabletxt");
// ----------------------------------------------------------------------
class ReliableTxtFile {
    static getEncodingOrNullSync(filePath) {
        const handle = fs.openSync(filePath, "r");
        let buffer = new Uint8Array(4);
        const numBytesRead = fs.readSync(handle, buffer);
        buffer = buffer.slice(0, numBytesRead);
        fs.closeSync(handle);
        return reliabletxt_1.ReliableTxtDecoder.getEncodingOrNull(buffer);
    }
    static getEncodingSync(filePath) {
        const encoding = ReliableTxtFile.getEncodingOrNullSync(filePath);
        if (encoding === null) {
            throw new reliabletxt_1.NoReliableTxtPreambleError();
        }
        return encoding;
    }
    static loadSync(filePath) {
        const handle = fs.openSync(filePath, "r");
        const fileSize = fs.fstatSync(handle).size;
        const buffer = new Uint8Array(fileSize);
        const numBytesRead = fs.readSync(handle, buffer);
        if (numBytesRead !== fileSize) {
            throw new Error(`File was not fully read`);
        }
        fs.closeSync(handle);
        return reliabletxt_1.ReliableTxtDocument.fromBytes(buffer);
    }
    static appendAllTextSync(content, filePath, createWithEncoding = reliabletxt_1.ReliableTxtEncoding.Utf8) {
        if (fs.existsSync(filePath)) {
            const detectedEncoding = ReliableTxtFile.getEncodingSync(filePath);
            const bytes = reliabletxt_1.ReliableTxtEncoder.encodePart(content, detectedEncoding);
            fs.appendFileSync(filePath, bytes);
        }
        else {
            ReliableTxtFile.writeAllTextSync(content, filePath, createWithEncoding);
        }
    }
    static appendAllLinesSync(lines, filePath, createWithEncoding = reliabletxt_1.ReliableTxtEncoding.Utf8) {
        if (fs.existsSync(filePath)) {
            const detectedEncoding = ReliableTxtFile.getEncodingSync(filePath);
            const fileSize = fs.statSync(filePath).size;
            const isEmpty = reliabletxt_1.ReliableTxtEncodingUtil.getPreambleSize(detectedEncoding) === fileSize;
            let content = reliabletxt_1.ReliableTxtLines.join(lines);
            if (!isEmpty) {
                content = "\n" + content;
            }
            const bytes = reliabletxt_1.ReliableTxtEncoder.encodePart(content, detectedEncoding);
            fs.appendFileSync(filePath, bytes);
        }
        else {
            ReliableTxtFile.writeAllLinesSync(lines, filePath, createWithEncoding);
        }
    }
    static readAllTextSync(filePath) {
        return ReliableTxtFile.loadSync(filePath).text;
    }
    static readAllLinesSync(filePath) {
        return ReliableTxtFile.loadSync(filePath).getLines();
    }
    static saveSync(document, filePath) {
        const bytes = document.getBytes();
        fs.writeFileSync(filePath, bytes);
    }
    static writeAllTextSync(content, filePath, encoding = reliabletxt_1.ReliableTxtEncoding.Utf8) {
        const document = new reliabletxt_1.ReliableTxtDocument(content, encoding);
        ReliableTxtFile.saveSync(document, filePath);
    }
    static writeAllLinesSync(lines, filePath, encoding = reliabletxt_1.ReliableTxtEncoding.Utf8) {
        const document = reliabletxt_1.ReliableTxtDocument.fromLines(lines, encoding);
        ReliableTxtFile.saveSync(document, filePath);
    }
}
exports.ReliableTxtFile = ReliableTxtFile;
// ----------------------------------------------------------------------
class SyncReliableTxtStreamReader {
    constructor(filePath, chunkSize = 4096) {
        this.rest = new Uint8Array(0);
        this._encoding = ReliableTxtFile.getEncodingSync(filePath);
        if (this._encoding !== reliabletxt_1.ReliableTxtEncoding.Utf8) {
            throw new Error("Not implemented");
        }
        if (chunkSize < 2) {
            throw new RangeError("Chunk size too small");
        }
        this.buffer = new Uint8Array(chunkSize);
        this.handle = fs.openSync(filePath, "r");
        this.position = reliabletxt_1.ReliableTxtEncodingUtil.getPreambleSize(this._encoding);
    }
    get encoding() {
        return this._encoding;
    }
    get isClosed() {
        return this.handle === null;
    }
    readLine() {
        if (this.handle === null) {
            throw new Error("Stream reader is closed");
        }
        if (this.rest === null) {
            return null;
        }
        let lastStartIndex = 0;
        let current = this.rest;
        for (;;) {
            const newlineIndex = current.indexOf(0x0A, lastStartIndex);
            if (newlineIndex >= 0) {
                const lineBytes = current.slice(0, newlineIndex);
                const lineStr = reliabletxt_1.ReliableTxtDecoder.decodePart(lineBytes, this._encoding);
                this.rest = current.slice(newlineIndex + 1);
                return lineStr;
            }
            else {
                lastStartIndex = current.length;
                const numBytesRead = fs.readSync(this.handle, this.buffer, 0, this.buffer.length, this.position);
                if (numBytesRead === 0) {
                    const lineStr = reliabletxt_1.ReliableTxtDecoder.decodePart(current, this._encoding);
                    this.rest = null;
                    return lineStr;
                }
                this.position += numBytesRead;
                const newCurrent = new Uint8Array(current.length + numBytesRead);
                newCurrent.set(current, 0);
                if (numBytesRead < this.buffer.length) {
                    newCurrent.set(this.buffer.subarray(0, numBytesRead), current.length);
                }
                else {
                    newCurrent.set(this.buffer, current.length);
                }
                current = newCurrent;
            }
        }
    }
    close() {
        if (this.handle !== null) {
            fs.closeSync(this.handle);
            this.handle = null;
        }
    }
}
exports.SyncReliableTxtStreamReader = SyncReliableTxtStreamReader;
// ----------------------------------------------------------------------
class SyncReliableTxtStreamWriter {
    constructor(filePath, createWithEncoding = reliabletxt_1.ReliableTxtEncoding.Utf8, append = false) {
        if (fs.existsSync(filePath) && append) {
            this.encoding = ReliableTxtFile.getEncodingSync(filePath);
        }
        else {
            ReliableTxtFile.writeAllTextSync("", filePath, createWithEncoding);
            this.encoding = createWithEncoding;
        }
        this.handle = fs.openSync(filePath, "a");
        const fileSize = fs.fstatSync(this.handle).size;
        this.isEmpty = reliabletxt_1.ReliableTxtEncodingUtil.getPreambleSize(this.encoding) === fileSize;
    }
    get isClosed() {
        return this.handle === null;
    }
    write(text) {
        if (this.handle === null) {
            throw new Error("Stream writer is closed");
        }
        if (text.length === 0) {
            return;
        }
        else {
            this.isEmpty = false;
        }
        const bytes = reliabletxt_1.ReliableTxtEncoder.encodePart(text, this.encoding);
        fs.writeSync(this.handle, bytes);
    }
    writeLine(line) {
        if (!this.isEmpty) {
            line = "\n" + line;
        }
        if (line.length === 0) {
            this.isEmpty = false;
        }
        this.write(line);
    }
    writeLines(lines) {
        for (const line of lines) {
            this.writeLine(line);
        }
    }
    close() {
        if (this.handle !== null) {
            fs.closeSync(this.handle);
            this.handle = null;
        }
    }
}
exports.SyncReliableTxtStreamWriter = SyncReliableTxtStreamWriter;
// ----------------------------------------------------------------------
class ReverseLineIterator {
    constructor(filePath, encoding) {
        this.buffer = new Uint8Array(128);
        this.handle = fs.openSync(filePath, "r");
        this.index = fs.fstatSync(this.handle).size - 1;
        this.encoding = encoding;
        if (encoding !== reliabletxt_1.ReliableTxtEncoding.Utf8) {
            throw new Error("Not implemented");
        }
    }
    getLine() {
        if (this.handle === null) {
            throw new Error("File handle closed");
        }
        const start = Math.max(this.index - this.buffer.length + 1, 0);
        const length = this.index - start + 1;
        const numBytesRead = fs.readSync(this.handle, this.buffer, 0, length, start);
        if (numBytesRead !== length) {
            throw new Error("Not supported");
        }
        for (let i = length - 1; i >= 0; i--) {
            const currentByte = this.buffer[i];
            if (currentByte === 0x0A) {
                this.index = start + i - 1;
                const sliceStart = i + 1;
                const sliceLength = length - i - 1;
                const lineBytes = this.buffer.slice(sliceStart, sliceStart + sliceLength);
                return reliabletxt_1.Utf16String.fromUtf8Bytes(lineBytes, false);
            }
        }
        throw new Error("Not supported");
    }
    getPosition() {
        return this.index;
    }
    close() {
        if (this.handle === null) {
            return;
        }
        fs.closeSync(this.handle);
        this.handle = null;
    }
}
exports.ReverseLineIterator = ReverseLineIterator;
//# sourceMappingURL=reliabletxt-io.js.map