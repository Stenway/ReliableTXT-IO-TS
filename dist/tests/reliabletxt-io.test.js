"use strict";
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
const reliabletxt_1 = require("@stenway/reliabletxt");
const src_1 = require("../src");
const fs = __importStar(require("fs"));
function getFilePath(name) {
    return "test_files/" + name;
}
const testFilePath = getFilePath("Test.txt");
function writeBytes(bytes, filePath) {
    fs.writeFileSync(filePath, bytes);
}
function deleteFile(filePath) {
    try {
        fs.unlinkSync(filePath);
    }
    catch (_a) {
        return false;
    }
    return true;
}
describe("ReliableTxtFile.getEncodingOrNullSync", () => {
    test.each([
        [[], null],
        [[0xEF], null],
        [[0xEF, 0xBB], null],
        [[0x00, 0x00, 0xFE], null],
        [[0xEF, 0xBB, 0xBF], reliabletxt_1.ReliableTxtEncoding.Utf8],
        [[0xFE, 0xFF], reliabletxt_1.ReliableTxtEncoding.Utf16],
        [[0xFF, 0xFE], reliabletxt_1.ReliableTxtEncoding.Utf16Reverse],
        [[0x00, 0x00, 0xFE, 0xFF], reliabletxt_1.ReliableTxtEncoding.Utf32],
        [[0xFE, 0xFF, 0x00, 0x00], reliabletxt_1.ReliableTxtEncoding.Utf16],
    ])("Given %p returns %p", (input, encoding) => {
        writeBytes(new Uint8Array(input), testFilePath);
        expect(src_1.ReliableTxtFile.getEncodingOrNullSync(testFilePath)).toEqual(encoding);
    });
});
describe("ReliableTxtFile.getEncodingSync", () => {
    test.each([
        [[0xEF, 0xBB, 0xBF], reliabletxt_1.ReliableTxtEncoding.Utf8],
        [[0xFE, 0xFF], reliabletxt_1.ReliableTxtEncoding.Utf16],
        [[0xFF, 0xFE], reliabletxt_1.ReliableTxtEncoding.Utf16Reverse],
        [[0x00, 0x00, 0xFE, 0xFF], reliabletxt_1.ReliableTxtEncoding.Utf32],
        [[0xFE, 0xFF, 0x00, 0x00], reliabletxt_1.ReliableTxtEncoding.Utf16],
    ])("Given %p return %p", (input, encoding) => {
        writeBytes(new Uint8Array(input), testFilePath);
        expect(src_1.ReliableTxtFile.getEncodingSync(testFilePath)).toEqual(encoding);
    });
    test.each([
        [[], null],
        [[0xEF], null],
        [[0xEF, 0xBB], null],
        [[0x00, 0x00, 0xFE], null],
    ])("Given %p throws", (input) => {
        writeBytes(new Uint8Array(input), testFilePath);
        try {
            src_1.ReliableTxtFile.getEncodingSync(testFilePath);
        }
        catch (error) {
            expect(error).toBeInstanceOf(reliabletxt_1.NoReliableTxtPreambleError);
        }
        //expect(ReliableTxtFile.getEncodingSync(testFilePath)).toThrowError(NoReliableTxtPreambleError)
    });
});
describe("ReliableTxtFile.writeAllTextSync + readAllTextSync", () => {
    test.each([
        ["", reliabletxt_1.ReliableTxtEncoding.Utf8],
        ["", reliabletxt_1.ReliableTxtEncoding.Utf16],
        ["", reliabletxt_1.ReliableTxtEncoding.Utf16Reverse],
        ["", reliabletxt_1.ReliableTxtEncoding.Utf32],
        ["Test", reliabletxt_1.ReliableTxtEncoding.Utf8],
        ["Test", reliabletxt_1.ReliableTxtEncoding.Utf16],
        ["Test", reliabletxt_1.ReliableTxtEncoding.Utf16Reverse],
        ["Test", reliabletxt_1.ReliableTxtEncoding.Utf32],
    ])("Given %p returns %p", (input, encoding) => {
        src_1.ReliableTxtFile.writeAllTextSync(input, testFilePath, encoding);
        expect(src_1.ReliableTxtFile.readAllTextSync(testFilePath)).toEqual(input);
    });
    test("Without encoding", () => {
        src_1.ReliableTxtFile.writeAllTextSync("Test", testFilePath);
        expect(src_1.ReliableTxtFile.readAllTextSync(testFilePath)).toEqual("Test");
    });
});
describe("ReliableTxtFile.writeAllLinesSync + readAllLinesSync", () => {
    test.each([
        [[], reliabletxt_1.ReliableTxtEncoding.Utf8, [""]],
        [[], reliabletxt_1.ReliableTxtEncoding.Utf16, [""]],
        [[], reliabletxt_1.ReliableTxtEncoding.Utf16Reverse, [""]],
        [[], reliabletxt_1.ReliableTxtEncoding.Utf32, [""]],
        [[""], reliabletxt_1.ReliableTxtEncoding.Utf8, [""]],
        [[""], reliabletxt_1.ReliableTxtEncoding.Utf16, [""]],
        [[""], reliabletxt_1.ReliableTxtEncoding.Utf16Reverse, [""]],
        [[""], reliabletxt_1.ReliableTxtEncoding.Utf32, [""]],
        [["Line1"], reliabletxt_1.ReliableTxtEncoding.Utf8, ["Line1"]],
        [["Line1"], reliabletxt_1.ReliableTxtEncoding.Utf16, ["Line1"]],
        [["Line1"], reliabletxt_1.ReliableTxtEncoding.Utf16Reverse, ["Line1"]],
        [["Line1"], reliabletxt_1.ReliableTxtEncoding.Utf32, ["Line1"]],
        [["Line1", "Line2"], reliabletxt_1.ReliableTxtEncoding.Utf8, ["Line1", "Line2"]],
        [["Line1", "Line2"], reliabletxt_1.ReliableTxtEncoding.Utf16, ["Line1", "Line2"]],
        [["Line1", "Line2"], reliabletxt_1.ReliableTxtEncoding.Utf16Reverse, ["Line1", "Line2"]],
        [["Line1", "Line2"], reliabletxt_1.ReliableTxtEncoding.Utf32, ["Line1", "Line2"]],
    ])("Given %p and %p returns %p", (input, encoding, output) => {
        src_1.ReliableTxtFile.writeAllLinesSync(input, testFilePath, encoding);
        expect(src_1.ReliableTxtFile.readAllLinesSync(testFilePath)).toEqual(output);
    });
    test("Without encoding", () => {
        src_1.ReliableTxtFile.writeAllLinesSync(["Line1"], testFilePath);
        expect(src_1.ReliableTxtFile.readAllLinesSync(testFilePath)).toEqual(["Line1"]);
    });
});
describe("ReliableTxtFile.appendAllTextSync", () => {
    test.each([
        ["", reliabletxt_1.ReliableTxtEncoding.Utf8, "", reliabletxt_1.ReliableTxtEncoding.Utf8, ""],
        ["Test1", reliabletxt_1.ReliableTxtEncoding.Utf8, "", reliabletxt_1.ReliableTxtEncoding.Utf8, "Test1"],
        ["", reliabletxt_1.ReliableTxtEncoding.Utf8, "Test2", reliabletxt_1.ReliableTxtEncoding.Utf8, "Test2"],
        ["Test1", reliabletxt_1.ReliableTxtEncoding.Utf8, "Test2", reliabletxt_1.ReliableTxtEncoding.Utf8, "Test1Test2"],
        ["Test1", reliabletxt_1.ReliableTxtEncoding.Utf8, "Test2", reliabletxt_1.ReliableTxtEncoding.Utf16, "Test1Test2"],
        ["Test1", reliabletxt_1.ReliableTxtEncoding.Utf8, "Test2", reliabletxt_1.ReliableTxtEncoding.Utf16Reverse, "Test1Test2"],
        ["Test1", reliabletxt_1.ReliableTxtEncoding.Utf8, "Test2", reliabletxt_1.ReliableTxtEncoding.Utf32, "Test1Test2"],
        ["Test1", reliabletxt_1.ReliableTxtEncoding.Utf16, "Test2", reliabletxt_1.ReliableTxtEncoding.Utf8, "Test1Test2"],
        ["Test1", reliabletxt_1.ReliableTxtEncoding.Utf16, "Test2", reliabletxt_1.ReliableTxtEncoding.Utf16, "Test1Test2"],
        ["Test1", reliabletxt_1.ReliableTxtEncoding.Utf16, "Test2", reliabletxt_1.ReliableTxtEncoding.Utf16Reverse, "Test1Test2"],
        ["Test1", reliabletxt_1.ReliableTxtEncoding.Utf16, "Test2", reliabletxt_1.ReliableTxtEncoding.Utf32, "Test1Test2"],
        ["Test1", reliabletxt_1.ReliableTxtEncoding.Utf16Reverse, "Test2", reliabletxt_1.ReliableTxtEncoding.Utf8, "Test1Test2"],
        ["Test1", reliabletxt_1.ReliableTxtEncoding.Utf16Reverse, "Test2", reliabletxt_1.ReliableTxtEncoding.Utf16, "Test1Test2"],
        ["Test1", reliabletxt_1.ReliableTxtEncoding.Utf16Reverse, "Test2", reliabletxt_1.ReliableTxtEncoding.Utf16Reverse, "Test1Test2"],
        ["Test1", reliabletxt_1.ReliableTxtEncoding.Utf16Reverse, "Test2", reliabletxt_1.ReliableTxtEncoding.Utf32, "Test1Test2"],
        ["Test1", reliabletxt_1.ReliableTxtEncoding.Utf32, "Test2", reliabletxt_1.ReliableTxtEncoding.Utf8, "Test1Test2"],
        ["Test1", reliabletxt_1.ReliableTxtEncoding.Utf32, "Test2", reliabletxt_1.ReliableTxtEncoding.Utf16, "Test1Test2"],
        ["Test1", reliabletxt_1.ReliableTxtEncoding.Utf32, "Test2", reliabletxt_1.ReliableTxtEncoding.Utf16Reverse, "Test1Test2"],
        ["Test1", reliabletxt_1.ReliableTxtEncoding.Utf32, "Test2", reliabletxt_1.ReliableTxtEncoding.Utf32, "Test1Test2"],
        ["Test1", reliabletxt_1.ReliableTxtEncoding.Utf8, "\uFEFFTest2", reliabletxt_1.ReliableTxtEncoding.Utf8, "Test1\uFEFFTest2"],
    ])("Given %p, %p, %p and %p returns %p", (input1, encoding1, input2, encoding2, output) => {
        const filePath = testFilePath;
        deleteFile(filePath);
        src_1.ReliableTxtFile.appendAllTextSync(input1, filePath, encoding1);
        let loaded = src_1.ReliableTxtFile.loadSync(filePath);
        expect(loaded.text).toEqual(input1);
        expect(loaded.encoding).toEqual(encoding1);
        src_1.ReliableTxtFile.appendAllTextSync(input2, filePath, encoding2);
        loaded = src_1.ReliableTxtFile.loadSync(filePath);
        expect(loaded.text).toEqual(output);
        expect(loaded.encoding).toEqual(encoding1);
    });
    test("Without encoding", () => {
        const filePath = testFilePath;
        deleteFile(filePath);
        src_1.ReliableTxtFile.appendAllTextSync("Test", filePath);
        const loaded = src_1.ReliableTxtFile.loadSync(filePath);
        expect(loaded.text).toEqual("Test");
        expect(loaded.encoding).toEqual(reliabletxt_1.ReliableTxtEncoding.Utf8);
    });
});
describe("ReliableTxtFile.appendAllLinesSync", () => {
    test.each([
        [[""], reliabletxt_1.ReliableTxtEncoding.Utf8, "", [""], reliabletxt_1.ReliableTxtEncoding.Utf8, ""],
        [[""], reliabletxt_1.ReliableTxtEncoding.Utf8, "", ["Line2"], reliabletxt_1.ReliableTxtEncoding.Utf8, "Line2"],
        [["Line1"], reliabletxt_1.ReliableTxtEncoding.Utf8, "Line1", [""], reliabletxt_1.ReliableTxtEncoding.Utf8, "Line1\n"],
        [["Line1"], reliabletxt_1.ReliableTxtEncoding.Utf8, "Line1", ["Line2"], reliabletxt_1.ReliableTxtEncoding.Utf8, "Line1\nLine2"],
        [["Line1"], reliabletxt_1.ReliableTxtEncoding.Utf8, "Line1", ["Line2"], reliabletxt_1.ReliableTxtEncoding.Utf16, "Line1\nLine2"],
        [["Line1"], reliabletxt_1.ReliableTxtEncoding.Utf8, "Line1", ["Line2"], reliabletxt_1.ReliableTxtEncoding.Utf16Reverse, "Line1\nLine2"],
        [["Line1"], reliabletxt_1.ReliableTxtEncoding.Utf8, "Line1", ["Line2"], reliabletxt_1.ReliableTxtEncoding.Utf32, "Line1\nLine2"],
        [["Line1"], reliabletxt_1.ReliableTxtEncoding.Utf16, "Line1", ["Line2"], reliabletxt_1.ReliableTxtEncoding.Utf8, "Line1\nLine2"],
        [["Line1"], reliabletxt_1.ReliableTxtEncoding.Utf16, "Line1", ["Line2"], reliabletxt_1.ReliableTxtEncoding.Utf16, "Line1\nLine2"],
        [["Line1"], reliabletxt_1.ReliableTxtEncoding.Utf16, "Line1", ["Line2"], reliabletxt_1.ReliableTxtEncoding.Utf16Reverse, "Line1\nLine2"],
        [["Line1"], reliabletxt_1.ReliableTxtEncoding.Utf16, "Line1", ["Line2"], reliabletxt_1.ReliableTxtEncoding.Utf32, "Line1\nLine2"],
        [["Line1"], reliabletxt_1.ReliableTxtEncoding.Utf16Reverse, "Line1", ["Line2"], reliabletxt_1.ReliableTxtEncoding.Utf8, "Line1\nLine2"],
        [["Line1"], reliabletxt_1.ReliableTxtEncoding.Utf16Reverse, "Line1", ["Line2"], reliabletxt_1.ReliableTxtEncoding.Utf16, "Line1\nLine2"],
        [["Line1"], reliabletxt_1.ReliableTxtEncoding.Utf16Reverse, "Line1", ["Line2"], reliabletxt_1.ReliableTxtEncoding.Utf16Reverse, "Line1\nLine2"],
        [["Line1"], reliabletxt_1.ReliableTxtEncoding.Utf16Reverse, "Line1", ["Line2"], reliabletxt_1.ReliableTxtEncoding.Utf32, "Line1\nLine2"],
        [["Line1"], reliabletxt_1.ReliableTxtEncoding.Utf32, "Line1", ["Line2"], reliabletxt_1.ReliableTxtEncoding.Utf8, "Line1\nLine2"],
        [["Line1"], reliabletxt_1.ReliableTxtEncoding.Utf32, "Line1", ["Line2"], reliabletxt_1.ReliableTxtEncoding.Utf16, "Line1\nLine2"],
        [["Line1"], reliabletxt_1.ReliableTxtEncoding.Utf32, "Line1", ["Line2"], reliabletxt_1.ReliableTxtEncoding.Utf16Reverse, "Line1\nLine2"],
        [["Line1"], reliabletxt_1.ReliableTxtEncoding.Utf32, "Line1", ["Line2"], reliabletxt_1.ReliableTxtEncoding.Utf32, "Line1\nLine2"],
        [["Line1", "Line2"], reliabletxt_1.ReliableTxtEncoding.Utf8, "Line1\nLine2", ["Line3", "Line4"], reliabletxt_1.ReliableTxtEncoding.Utf8, "Line1\nLine2\nLine3\nLine4"],
    ])("Given %p, %p, %p and %p returns %p", (input1, encoding1, output1, input2, encoding2, output2) => {
        const filePath = testFilePath;
        deleteFile(filePath);
        src_1.ReliableTxtFile.appendAllLinesSync(input1, filePath, encoding1);
        let loaded = src_1.ReliableTxtFile.loadSync(filePath);
        expect(loaded.text).toEqual(output1);
        expect(loaded.encoding).toEqual(encoding1);
        src_1.ReliableTxtFile.appendAllLinesSync(input2, filePath, encoding2);
        loaded = src_1.ReliableTxtFile.loadSync(filePath);
        expect(loaded.text).toEqual(output2);
        expect(loaded.encoding).toEqual(encoding1);
    });
    test("Without encoding", () => {
        const filePath = testFilePath;
        deleteFile(filePath);
        src_1.ReliableTxtFile.appendAllLinesSync(["Line1"], filePath);
        const loaded = src_1.ReliableTxtFile.loadSync(filePath);
        expect(loaded.text).toEqual("Line1");
        expect(loaded.encoding).toEqual(reliabletxt_1.ReliableTxtEncoding.Utf8);
    });
});
// ----------------------------------------------------------------------
describe("SyncReliableTxtStreamWriter Constructor", () => {
    test.each([
        [reliabletxt_1.ReliableTxtEncoding.Utf8],
        [reliabletxt_1.ReliableTxtEncoding.Utf16],
        [reliabletxt_1.ReliableTxtEncoding.Utf16Reverse],
        [reliabletxt_1.ReliableTxtEncoding.Utf32],
    ])("Given %p", (encoding) => {
        const writer = new src_1.SyncReliableTxtStreamWriter(testFilePath, encoding);
        writer.close();
        const loaded = src_1.ReliableTxtFile.loadSync(testFilePath);
        expect(loaded.text).toEqual("");
        expect(loaded.encoding).toEqual(encoding);
    });
    test("Without encoding", () => {
        const writer = new src_1.SyncReliableTxtStreamWriter(testFilePath);
        writer.close();
        const loaded = src_1.ReliableTxtFile.loadSync(testFilePath);
        expect(loaded.text).toEqual("");
        expect(loaded.encoding).toEqual(reliabletxt_1.ReliableTxtEncoding.Utf8);
    });
});
describe("SyncReliableTxtStreamWriter Constructor Append", () => {
    test.each([
        [reliabletxt_1.ReliableTxtEncoding.Utf8, reliabletxt_1.ReliableTxtEncoding.Utf8],
        [reliabletxt_1.ReliableTxtEncoding.Utf8, reliabletxt_1.ReliableTxtEncoding.Utf16],
        [reliabletxt_1.ReliableTxtEncoding.Utf8, reliabletxt_1.ReliableTxtEncoding.Utf16Reverse],
        [reliabletxt_1.ReliableTxtEncoding.Utf8, reliabletxt_1.ReliableTxtEncoding.Utf32],
    ])("Given %p", (encoding1, encoding2) => {
        src_1.ReliableTxtFile.writeAllTextSync("Test1", testFilePath, encoding1);
        const writer = new src_1.SyncReliableTxtStreamWriter(testFilePath, encoding2, true);
        writer.write("Test2");
        writer.close();
        const loaded = src_1.ReliableTxtFile.loadSync(testFilePath);
        expect(loaded.text).toEqual("Test1Test2");
        expect(loaded.encoding).toEqual(encoding1);
    });
});
test("SyncReliableTxtStreamWriter.isClosed", () => {
    const writer = new src_1.SyncReliableTxtStreamWriter(testFilePath);
    expect(writer.isClosed).toEqual(false);
    writer.close();
    expect(writer.isClosed).toEqual(true);
});
describe("SyncReliableTxtStreamWriter.write", () => {
    test("Multiple writes", () => {
        const writer = new src_1.SyncReliableTxtStreamWriter(testFilePath);
        writer.write("Test1");
        writer.write("Test2");
        writer.close();
        expect(src_1.ReliableTxtFile.readAllTextSync(testFilePath)).toEqual("Test1Test2");
    });
    test("Empty", () => {
        const writer = new src_1.SyncReliableTxtStreamWriter(testFilePath);
        writer.write("");
        writer.close();
        expect(src_1.ReliableTxtFile.readAllTextSync(testFilePath)).toEqual("");
    });
    test("Closed", () => {
        const writer = new src_1.SyncReliableTxtStreamWriter(testFilePath);
        writer.close();
        expect(() => writer.write("Test")).toThrowError();
    });
});
describe("SyncReliableTxtStreamWriter.writeLine", () => {
    test.each([
        ["", "Line2", "Line2"],
        ["Line1", "", "Line1\n"],
        ["Line1", "Line2", "Line1\nLine2"],
    ])("Given %p", (content, line, output) => {
        const writer = new src_1.SyncReliableTxtStreamWriter(testFilePath);
        writer.write(content);
        writer.writeLine(line);
        writer.close();
        expect(src_1.ReliableTxtFile.readAllTextSync(testFilePath)).toEqual(output);
    });
    test("Multiple writes", () => {
        const writer = new src_1.SyncReliableTxtStreamWriter(testFilePath);
        writer.writeLine("");
        writer.writeLine("Line2");
        writer.writeLine("");
        writer.writeLine("Line4");
        writer.close();
        expect(src_1.ReliableTxtFile.readAllTextSync(testFilePath)).toEqual("\nLine2\n\nLine4");
    });
    test("Multiple writes + first write", () => {
        const writer = new src_1.SyncReliableTxtStreamWriter(testFilePath);
        writer.write("");
        writer.writeLine("Line2");
        writer.writeLine("");
        writer.writeLine("Line4");
        writer.close();
        expect(src_1.ReliableTxtFile.readAllTextSync(testFilePath)).toEqual("Line2\n\nLine4");
    });
});
test("SyncReliableTxtStreamWriter.writeLines", () => {
    const writer = new src_1.SyncReliableTxtStreamWriter(testFilePath);
    writer.writeLines(["Line1", "Line2", "Line3"]);
    writer.close();
    expect(src_1.ReliableTxtFile.readAllTextSync(testFilePath)).toEqual("Line1\nLine2\nLine3");
});
// ----------------------------------------------------------------------
describe("SyncReliableTxtStreamReader Constructor", () => {
    test.each([
        [reliabletxt_1.ReliableTxtEncoding.Utf8],
    ])("Given %p", (encoding) => {
        src_1.ReliableTxtFile.writeAllTextSync("Test", testFilePath, encoding);
        const reader = new src_1.SyncReliableTxtStreamReader(testFilePath);
        expect(reader.encoding).toEqual(encoding);
        reader.close();
    });
    test.each([
        [reliabletxt_1.ReliableTxtEncoding.Utf16],
        [reliabletxt_1.ReliableTxtEncoding.Utf16Reverse],
        [reliabletxt_1.ReliableTxtEncoding.Utf32],
    ])("Given %p throws", (encoding) => {
        src_1.ReliableTxtFile.writeAllTextSync("Test", testFilePath, encoding);
        expect(() => new src_1.SyncReliableTxtStreamReader(testFilePath)).toThrowError();
    });
    test("Chunk size", () => {
        src_1.ReliableTxtFile.writeAllTextSync("Test", testFilePath, reliabletxt_1.ReliableTxtEncoding.Utf8);
        expect(() => new src_1.SyncReliableTxtStreamReader(testFilePath, 1)).toThrowError("Chunk size too small");
    });
});
test("SyncReliableTxtStreamReader.isClosed", () => {
    src_1.ReliableTxtFile.writeAllTextSync("Test", testFilePath, reliabletxt_1.ReliableTxtEncoding.Utf8);
    const writer = new src_1.SyncReliableTxtStreamReader(testFilePath);
    expect(writer.isClosed).toEqual(false);
    writer.close();
    expect(writer.isClosed).toEqual(true);
});
describe("SyncReliableTxtStreamReader.readLine", () => {
    test("Null", () => {
        src_1.ReliableTxtFile.writeAllTextSync("Line1\nLine2", testFilePath);
        const reader = new src_1.SyncReliableTxtStreamReader(testFilePath);
        expect(reader.readLine()).toEqual("Line1");
        expect(reader.readLine()).toEqual("Line2");
        expect(reader.readLine()).toEqual(null);
        reader.close();
    });
    test("Closed", () => {
        src_1.ReliableTxtFile.writeAllTextSync("Line1\nLine2", testFilePath);
        const reader = new src_1.SyncReliableTxtStreamReader(testFilePath);
        reader.close();
        expect(() => reader.readLine()).toThrowError();
    });
    test("Buffer", () => {
        src_1.ReliableTxtFile.writeAllTextSync("Line1\nLine2", testFilePath);
        const reader = new src_1.SyncReliableTxtStreamReader(testFilePath, 2);
        expect(reader.readLine()).toEqual("Line1");
        expect(reader.readLine()).toEqual("Line2");
        expect(reader.readLine()).toEqual(null);
        reader.close();
    });
});
// ----------------------------------------------------------------------
describe("ReverseLineIterator Constructor", () => {
    test.each([
        [reliabletxt_1.ReliableTxtEncoding.Utf8],
    ])("Given %p", (encoding) => {
        src_1.ReliableTxtFile.writeAllTextSync("Test", testFilePath, encoding);
        const reader = new src_1.ReverseLineIterator(testFilePath, encoding);
        reader.close();
    });
    test.each([
        [reliabletxt_1.ReliableTxtEncoding.Utf16],
        [reliabletxt_1.ReliableTxtEncoding.Utf16Reverse],
        [reliabletxt_1.ReliableTxtEncoding.Utf32],
    ])("Given %p throws", (encoding) => {
        src_1.ReliableTxtFile.writeAllTextSync("Test", testFilePath, encoding);
        expect(() => new src_1.ReverseLineIterator(testFilePath, encoding)).toThrowError();
    });
});
test("ReverseLineIterator.close", () => {
    src_1.ReliableTxtFile.writeAllTextSync("Test", testFilePath, reliabletxt_1.ReliableTxtEncoding.Utf8);
    const reader = new src_1.ReverseLineIterator(testFilePath, reliabletxt_1.ReliableTxtEncoding.Utf8);
    reader.close();
    reader.close();
});
describe("ReverseLineIterator.getLine", () => {
    test("Normal", () => {
        src_1.ReliableTxtFile.writeAllTextSync("Line1\nLine2\nLine3", testFilePath);
        const reader = new src_1.ReverseLineIterator(testFilePath, reliabletxt_1.ReliableTxtEncoding.Utf8);
        expect(reader.getLine()).toEqual("Line3");
        expect(reader.getLine()).toEqual("Line2");
        reader.close();
    });
    test("First line", () => {
        src_1.ReliableTxtFile.writeAllTextSync("Line1\nLine2", testFilePath);
        const reader = new src_1.ReverseLineIterator(testFilePath, reliabletxt_1.ReliableTxtEncoding.Utf8);
        expect(reader.getLine()).toEqual("Line2");
        expect(() => reader.getLine()).toThrowError();
        reader.close();
    });
    test("Closed", () => {
        src_1.ReliableTxtFile.writeAllTextSync("Line1\nLine2", testFilePath);
        const reader = new src_1.ReverseLineIterator(testFilePath, reliabletxt_1.ReliableTxtEncoding.Utf8);
        reader.close();
        expect(() => reader.getLine()).toThrowError();
    });
});
test("ReverseLineIterator.getPosition", () => {
    src_1.ReliableTxtFile.writeAllTextSync("Line1\nLine2", testFilePath);
    const reader = new src_1.ReverseLineIterator(testFilePath, reliabletxt_1.ReliableTxtEncoding.Utf8);
    expect(reader.getLine()).toEqual("Line2");
    expect(reader.getPosition()).toEqual(7);
    reader.close();
});
//# sourceMappingURL=reliabletxt-io.test.js.map