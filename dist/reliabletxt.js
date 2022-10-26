"use strict";
/* (C) Stefan John / Stenway / ReliableTXT.com / 2022 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReliableTxtDocument = exports.ReliableTxtDecoder = exports.ReliableTxtEncoder = exports.Utf16String = exports.NoReliableTxtPreambleError = exports.StringDecodingError = exports.InvalidUtf16StringError = exports.ReliableTxtLines = exports.ReliableTxtEncodingUtil = exports.ReliableTxtEncoding = void 0;
var ReliableTxtEncoding;
(function (ReliableTxtEncoding) {
    ReliableTxtEncoding[ReliableTxtEncoding["Utf8"] = 0] = "Utf8";
    ReliableTxtEncoding[ReliableTxtEncoding["Utf16"] = 1] = "Utf16";
    ReliableTxtEncoding[ReliableTxtEncoding["Utf16Reverse"] = 2] = "Utf16Reverse";
    ReliableTxtEncoding[ReliableTxtEncoding["Utf32"] = 3] = "Utf32";
})(ReliableTxtEncoding = exports.ReliableTxtEncoding || (exports.ReliableTxtEncoding = {}));
// ----------------------------------------------------------------------
class ReliableTxtEncodingUtil {
    static getPreambleSize(encoding) {
        if (encoding === ReliableTxtEncoding.Utf8) {
            return 3;
        }
        else if (encoding === ReliableTxtEncoding.Utf16) {
            return 2;
        }
        else if (encoding === ReliableTxtEncoding.Utf16Reverse) {
            return 2;
        }
        else if (encoding === ReliableTxtEncoding.Utf32) {
            return 4;
        }
        else {
            throw new RangeError();
        }
    }
}
exports.ReliableTxtEncodingUtil = ReliableTxtEncodingUtil;
// ----------------------------------------------------------------------
class ReliableTxtLines {
    static join(lines) {
        return lines.join("\n");
    }
    static split(text) {
        return text.split("\n");
    }
}
exports.ReliableTxtLines = ReliableTxtLines;
// ----------------------------------------------------------------------
class InvalidUtf16StringError extends Error {
    constructor() {
        super("Invalid UTF16 string");
    }
}
exports.InvalidUtf16StringError = InvalidUtf16StringError;
// ----------------------------------------------------------------------
class StringDecodingError extends Error {
    constructor() {
        super("Could not decode string");
    }
}
exports.StringDecodingError = StringDecodingError;
// ----------------------------------------------------------------------
class NoReliableTxtPreambleError extends Error {
    constructor() {
        super("Document does not have a ReliableTXT preamble");
    }
}
exports.NoReliableTxtPreambleError = NoReliableTxtPreambleError;
// ----------------------------------------------------------------------
class Utf16String {
    static isValid(str) {
        for (let i = 0; i < str.length; i++) {
            let firstCodeUnit = str.charCodeAt(i);
            if (firstCodeUnit >= 0xD800 && firstCodeUnit <= 0xDFFF) {
                if (firstCodeUnit >= 0xDC00) {
                    return false;
                }
                i++;
                if (i >= str.length) {
                    return false;
                }
                let secondCodeUnit = str.charCodeAt(i);
                if (!(secondCodeUnit >= 0xDC00 && secondCodeUnit <= 0xDFFF)) {
                    return false;
                }
            }
        }
        return true;
    }
    static validate(str) {
        if (!Utf16String.isValid(str)) {
            throw new InvalidUtf16StringError();
        }
    }
    static getCodePointCount(str) {
        let count = 0;
        for (let i = 0; i < str.length; i++) {
            let firstCodeUnit = str.charCodeAt(i);
            if (firstCodeUnit >= 0xD800 && firstCodeUnit <= 0xDFFF) {
                if (firstCodeUnit >= 0xDC00) {
                    throw new InvalidUtf16StringError();
                }
                i++;
                if (i >= str.length) {
                    throw new InvalidUtf16StringError();
                }
                let secondCodeUnit = str.charCodeAt(i);
                if (!(secondCodeUnit >= 0xDC00 && secondCodeUnit <= 0xDFFF)) {
                    throw new InvalidUtf16StringError();
                }
            }
            count++;
        }
        return count;
    }
    static getCodePointArray(str) {
        let numCodePoints = Utf16String.getCodePointCount(str);
        let codePoints = new Array(numCodePoints);
        let codePointIndex = 0;
        for (let i = 0; i < str.length; i++) {
            let codePoint = str.charCodeAt(i);
            if (codePoint >= 0xD800 && codePoint <= 0xDBFF) {
                i++;
                let secondCodeUnit = str.charCodeAt(i);
                codePoint = (codePoint - 0xD800) * 0x400 + secondCodeUnit - 0xDC00 + 0x10000;
            }
            codePoints[codePointIndex] = codePoint;
            codePointIndex++;
        }
        return codePoints;
    }
    static getCodePoints(str) {
        let numCodePoints = Utf16String.getCodePointCount(str);
        let codePoints = new Uint32Array(numCodePoints);
        let codePointIndex = 0;
        for (let i = 0; i < str.length; i++) {
            let codePoint = str.charCodeAt(i);
            if (codePoint >= 0xD800 && codePoint <= 0xDBFF) {
                i++;
                let secondCodeUnit = str.charCodeAt(i);
                codePoint = (codePoint - 0xD800) * 0x400 + secondCodeUnit - 0xDC00 + 0x10000;
            }
            codePoints[codePointIndex] = codePoint;
            codePointIndex++;
        }
        return codePoints;
    }
    static toUtf8Bytes(text) {
        Utf16String.validate(text);
        let utf8Encoder = new TextEncoder();
        return utf8Encoder.encode(text);
    }
    static toUtf16Bytes(text, littleEndian = false) {
        let byteArray = new Uint8Array(text.length * 2);
        let dataView = new DataView(byteArray.buffer);
        let wasHighSurrogate = false;
        for (let i = 0; i < text.length; i++) {
            let codeUnit = text.charCodeAt(i);
            if (wasHighSurrogate) {
                if (!(codeUnit >= 0xDC00 && codeUnit <= 0xDFFF)) {
                    throw new InvalidUtf16StringError();
                }
                wasHighSurrogate = false;
            }
            else if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
                if (codeUnit >= 0xDC00) {
                    throw new InvalidUtf16StringError();
                }
                wasHighSurrogate = true;
            }
            dataView.setUint16(i * 2, codeUnit, littleEndian);
        }
        if (wasHighSurrogate) {
            throw new InvalidUtf16StringError();
        }
        return byteArray;
    }
    static toUtf32Bytes(str, littleEndian = false) {
        let numCodePoints = Utf16String.getCodePointCount(str);
        let byteArray = new Uint8Array(numCodePoints * 4);
        let dataView = new DataView(byteArray.buffer);
        let codePointIndex = 0;
        for (let i = 0; i < str.length; i++) {
            let codePoint = str.charCodeAt(i);
            if (codePoint >= 0xD800 && codePoint <= 0xDBFF) {
                i++;
                let secondCodeUnit = str.charCodeAt(i);
                codePoint = (codePoint - 0xD800) * 0x400 + secondCodeUnit - 0xDC00 + 0x10000;
            }
            dataView.setUint32(codePointIndex * 4, codePoint, littleEndian);
            codePointIndex++;
        }
        return byteArray;
    }
    static fromUtf8Bytes(bytes, skipFirstBom = false) {
        let utf8Decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: !skipFirstBom });
        try {
            return utf8Decoder.decode(bytes);
        }
        catch (error) {
            if (error instanceof TypeError) {
                throw new StringDecodingError();
            }
            else {
                throw error;
            }
        }
    }
    static fromUtf16Bytes(bytes, littleEndian, skipFirstBom = false) {
        let utf16Decoder = new TextDecoder("utf-16" + (littleEndian ? "le" : "be"), { fatal: true, ignoreBOM: !skipFirstBom });
        try {
            return utf16Decoder.decode(bytes);
        }
        catch (error) {
            if (error instanceof TypeError) {
                console.log(error);
                throw new StringDecodingError();
            }
            else {
                throw error;
            }
        }
    }
    static fromUtf32Bytes(bytes, littleEndian, skipFirstBom = false) {
        let numCodePoints = bytes.length / 4;
        let numCodeUnits = 0;
        let bytesDataView = new DataView(bytes.buffer);
        let startIndex = 0;
        if (skipFirstBom && bytesDataView.byteLength >= 4 && bytesDataView.getUint32(0, littleEndian) == 0xFEFF) {
            startIndex = 1;
        }
        for (let i = startIndex; i < numCodePoints; i++) {
            let codePoint = bytesDataView.getUint32(4 * i, littleEndian);
            if (codePoint > 0x010000) {
                numCodeUnits++;
            }
            if (codePoint > 0x10FFFF || (codePoint >= 0xD800 && codePoint <= 0xDFFF)) {
                throw new StringDecodingError();
            }
            numCodeUnits++;
        }
        let utf16Bytes = new Uint8Array(numCodeUnits * 2);
        let dataView = new DataView(utf16Bytes.buffer);
        let codeUnitIndex = 0;
        for (let i = startIndex; i < numCodePoints; i++) {
            let codePoint = bytesDataView.getUint32(4 * i, littleEndian);
            if (codePoint > 0x010000) {
                codePoint -= 0x010000;
                let highSurrogate = (codePoint >> 10) + 0xD800;
                dataView.setUint16(codeUnitIndex * 2, highSurrogate, false);
                codeUnitIndex++;
                let lowSurrogate = (codePoint % 0x400) + 0xDC00;
                dataView.setUint16(codeUnitIndex * 2, lowSurrogate, false);
            }
            else {
                dataView.setUint16(codeUnitIndex * 2, codePoint, false);
            }
            codeUnitIndex++;
        }
        return Utf16String.fromUtf16Bytes(utf16Bytes, false);
    }
    static fromCodePointArray(codePoints) {
        let numCodeUnits = 0;
        for (let i = 0; i < codePoints.length; i++) {
            let codePoint = codePoints[i];
            if (codePoint > 0x010000) {
                numCodeUnits++;
            }
            if (codePoint > 0x10FFFF || (codePoint >= 0xD800 && codePoint <= 0xDFFF)) {
                throw new StringDecodingError();
            }
            numCodeUnits++;
        }
        let utf16Bytes = new Uint8Array(numCodeUnits * 2);
        let dataView = new DataView(utf16Bytes.buffer);
        let codeUnitIndex = 0;
        for (let i = 0; i < codePoints.length; i++) {
            let codePoint = codePoints[i];
            if (codePoint > 0x010000) {
                codePoint -= 0x010000;
                let highSurrogate = (codePoint >> 10) + 0xD800;
                dataView.setUint16(codeUnitIndex * 2, highSurrogate, false);
                codeUnitIndex++;
                let lowSurrogate = (codePoint % 0x400) + 0xDC00;
                dataView.setUint16(codeUnitIndex * 2, lowSurrogate, false);
            }
            else {
                dataView.setUint16(codeUnitIndex * 2, codePoint, false);
            }
            codeUnitIndex++;
        }
        return Utf16String.fromUtf16Bytes(utf16Bytes, false);
    }
}
exports.Utf16String = Utf16String;
// ----------------------------------------------------------------------
class ReliableTxtEncoder {
    static encode(text, encoding) {
        let textWithPreamble = "\uFEFF" + text;
        return ReliableTxtEncoder.encodePart(textWithPreamble, encoding);
    }
    static encodePart(text, encoding) {
        if (encoding === ReliableTxtEncoding.Utf8) {
            return Utf16String.toUtf8Bytes(text);
        }
        else if (encoding === ReliableTxtEncoding.Utf16) {
            return Utf16String.toUtf16Bytes(text, false);
        }
        else if (encoding === ReliableTxtEncoding.Utf16Reverse) {
            return Utf16String.toUtf16Bytes(text, true);
        }
        else if (encoding === ReliableTxtEncoding.Utf32) {
            return Utf16String.toUtf32Bytes(text, false);
        }
        else {
            throw new RangeError();
        }
    }
}
exports.ReliableTxtEncoder = ReliableTxtEncoder;
// ----------------------------------------------------------------------
class ReliableTxtDecoder {
    static getEncodingOrNull(bytes) {
        if (bytes.length >= 3
            && bytes[0] == 0xEF
            && bytes[1] == 0xBB
            && bytes[2] == 0xBF) {
            return ReliableTxtEncoding.Utf8;
        }
        else if (bytes.length >= 2
            && bytes[0] == 0xFE
            && bytes[1] == 0xFF) {
            return ReliableTxtEncoding.Utf16;
        }
        else if (bytes.length >= 2
            && bytes[0] == 0xFF
            && bytes[1] == 0xFE) {
            return ReliableTxtEncoding.Utf16Reverse;
        }
        else if (bytes.length >= 4
            && bytes[0] == 0
            && bytes[1] == 0
            && bytes[2] == 0xFE
            && bytes[3] == 0xFF) {
            return ReliableTxtEncoding.Utf32;
        }
        else {
            return null;
        }
    }
    static getEncoding(bytes) {
        let encoding = ReliableTxtDecoder.getEncodingOrNull(bytes);
        if (encoding === null) {
            throw new NoReliableTxtPreambleError();
        }
        return encoding;
    }
    static decode(bytes) {
        let encoding = ReliableTxtDecoder.getEncoding(bytes);
        let text;
        if (encoding === ReliableTxtEncoding.Utf8) {
            text = Utf16String.fromUtf8Bytes(bytes, true);
        }
        else if (encoding === ReliableTxtEncoding.Utf16) {
            text = Utf16String.fromUtf16Bytes(bytes, false, true);
        }
        else if (encoding === ReliableTxtEncoding.Utf16Reverse) {
            text = Utf16String.fromUtf16Bytes(bytes, true, true);
        }
        else if (encoding === ReliableTxtEncoding.Utf32) {
            text = Utf16String.fromUtf32Bytes(bytes, false, true);
        }
        else {
            throw new RangeError();
        }
        return new ReliableTxtDocument(text, encoding);
    }
    static decodePart(bytes, encoding) {
        if (encoding === ReliableTxtEncoding.Utf8) {
            return Utf16String.fromUtf8Bytes(bytes, false);
        }
        else if (encoding === ReliableTxtEncoding.Utf16) {
            return Utf16String.fromUtf16Bytes(bytes, false);
        }
        else if (encoding === ReliableTxtEncoding.Utf16Reverse) {
            return Utf16String.fromUtf16Bytes(bytes, true);
        }
        else if (encoding === ReliableTxtEncoding.Utf32) {
            return Utf16String.fromUtf32Bytes(bytes, false);
        }
        else {
            throw new RangeError();
        }
    }
}
exports.ReliableTxtDecoder = ReliableTxtDecoder;
// ----------------------------------------------------------------------
class ReliableTxtDocument {
    constructor(text = "", encoding = ReliableTxtEncoding.Utf8) {
        this.text = text;
        this.encoding = encoding;
    }
    getBytes() {
        return ReliableTxtEncoder.encode(this.text, this.encoding);
    }
    setLines(lines) {
        this.text = ReliableTxtLines.join(lines);
    }
    getLines() {
        return ReliableTxtLines.split(this.text);
    }
    getCodePoints() {
        return Utf16String.getCodePointArray(this.text);
    }
    setCodePoints(codePoints) {
        this.text = Utf16String.fromCodePointArray(codePoints);
    }
    static fromBytes(bytes) {
        return ReliableTxtDecoder.decode(bytes);
    }
    static fromLines(lines) {
        let document = new ReliableTxtDocument();
        document.setLines(lines);
        return document;
    }
}
exports.ReliableTxtDocument = ReliableTxtDocument;
