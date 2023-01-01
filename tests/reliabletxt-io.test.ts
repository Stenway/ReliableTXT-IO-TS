import { NoReliableTxtPreambleError, ReliableTxtEncoding } from "@stenway/reliabletxt"
import { ReliableTxtFile, ReverseLineIterator, SyncReliableTxtStreamReader, SyncReliableTxtStreamWriter } from "../src"
import * as fs from 'fs'

function getFilePath(name: string): string {
	return "test_files/"+name
}

const testFilePath: string = getFilePath("Test.txt")

function writeBytes(bytes: Uint8Array, filePath: string) {
	fs.writeFileSync(filePath, bytes)
}

function deleteFile(filePath: string): boolean {
	try {
		fs.unlinkSync(filePath)
	} catch {
		return false
	}
	return true
}

describe("ReliableTxtFile.getEncodingOrNullSync", () => {
	test.each([
		[[], null],
		[[0xEF], null],
		[[0xEF, 0xBB], null],
		[[0x00, 0x00, 0xFE], null],
		[[0xEF, 0xBB, 0xBF], ReliableTxtEncoding.Utf8],
		[[0xFE, 0xFF], ReliableTxtEncoding.Utf16],
		[[0xFF, 0xFE], ReliableTxtEncoding.Utf16Reverse],
		[[0x00, 0x00, 0xFE, 0xFF], ReliableTxtEncoding.Utf32],
		[[0xFE, 0xFF, 0x00, 0x00], ReliableTxtEncoding.Utf16],
	])(
		"Given %p returns %p",
		(input, encoding) => {
			writeBytes(new Uint8Array(input), testFilePath)
			expect(ReliableTxtFile.getEncodingOrNullSync(testFilePath)).toEqual(encoding)
		}
	)
})

describe("ReliableTxtFile.getEncodingSync", () => {
	test.each([
		[[0xEF, 0xBB, 0xBF], ReliableTxtEncoding.Utf8],
		[[0xFE, 0xFF], ReliableTxtEncoding.Utf16],
		[[0xFF, 0xFE], ReliableTxtEncoding.Utf16Reverse],
		[[0x00, 0x00, 0xFE, 0xFF], ReliableTxtEncoding.Utf32],
		[[0xFE, 0xFF, 0x00, 0x00], ReliableTxtEncoding.Utf16],
	])(
		"Given %p return %p",
		(input, encoding) => {
			writeBytes(new Uint8Array(input), testFilePath)
			expect(ReliableTxtFile.getEncodingSync(testFilePath)).toEqual(encoding)
		}
	)

	test.each([
		[[], null],
		[[0xEF], null],
		[[0xEF, 0xBB], null],
		[[0x00, 0x00, 0xFE], null],
	])(
		"Given %p throws",
		(input) => {
			writeBytes(new Uint8Array(input), testFilePath)
			try {
				ReliableTxtFile.getEncodingSync(testFilePath)
			} catch (error) {
				expect(error).toBeInstanceOf(NoReliableTxtPreambleError)
			}
			//expect(ReliableTxtFile.getEncodingSync(testFilePath)).toThrowError(NoReliableTxtPreambleError)
		}
	)
})

describe("ReliableTxtFile.writeAllTextSync + readAllTextSync", () => {
	test.each([
		["", ReliableTxtEncoding.Utf8],
		["", ReliableTxtEncoding.Utf16],
		["", ReliableTxtEncoding.Utf16Reverse],
		["", ReliableTxtEncoding.Utf32],
		["Test", ReliableTxtEncoding.Utf8],
		["Test", ReliableTxtEncoding.Utf16],
		["Test", ReliableTxtEncoding.Utf16Reverse],
		["Test", ReliableTxtEncoding.Utf32],
	])(
		"Given %p returns %p",
		(input, encoding) => {
			ReliableTxtFile.writeAllTextSync(input, testFilePath, encoding)
			expect(ReliableTxtFile.readAllTextSync(testFilePath)).toEqual(input)
		}
	)

	test("Without encoding", () => {
		ReliableTxtFile.writeAllTextSync("Test", testFilePath)
		expect(ReliableTxtFile.readAllTextSync(testFilePath)).toEqual("Test")
	})
})

describe("ReliableTxtFile.writeAllLinesSync + readAllLinesSync", () => {
	test.each([
		[[], ReliableTxtEncoding.Utf8, [""]],
		[[], ReliableTxtEncoding.Utf16, [""]],
		[[], ReliableTxtEncoding.Utf16Reverse, [""]],
		[[], ReliableTxtEncoding.Utf32, [""]],
		[[""], ReliableTxtEncoding.Utf8, [""]],
		[[""], ReliableTxtEncoding.Utf16, [""]],
		[[""], ReliableTxtEncoding.Utf16Reverse, [""]],
		[[""], ReliableTxtEncoding.Utf32, [""]],
		[["Line1"], ReliableTxtEncoding.Utf8, ["Line1"]],
		[["Line1"], ReliableTxtEncoding.Utf16, ["Line1"]],
		[["Line1"], ReliableTxtEncoding.Utf16Reverse, ["Line1"]],
		[["Line1"], ReliableTxtEncoding.Utf32, ["Line1"]],
		[["Line1", "Line2"], ReliableTxtEncoding.Utf8, ["Line1", "Line2"]],
		[["Line1", "Line2"], ReliableTxtEncoding.Utf16, ["Line1", "Line2"]],
		[["Line1", "Line2"], ReliableTxtEncoding.Utf16Reverse, ["Line1", "Line2"]],
		[["Line1", "Line2"], ReliableTxtEncoding.Utf32, ["Line1", "Line2"]],
	])(
		"Given %p and %p returns %p",
		(input, encoding, output) => {
			ReliableTxtFile.writeAllLinesSync(input, testFilePath, encoding)
			expect(ReliableTxtFile.readAllLinesSync(testFilePath)).toEqual(output)
		}
	)

	test("Without encoding", () => {
		ReliableTxtFile.writeAllLinesSync(["Line1"], testFilePath)
		expect(ReliableTxtFile.readAllLinesSync(testFilePath)).toEqual(["Line1"])
	})
})

describe("ReliableTxtFile.appendAllTextSync", () => {
	test.each([
		["", ReliableTxtEncoding.Utf8, "", ReliableTxtEncoding.Utf8, ""],
		["Test1", ReliableTxtEncoding.Utf8, "", ReliableTxtEncoding.Utf8, "Test1"],
		["", ReliableTxtEncoding.Utf8, "Test2", ReliableTxtEncoding.Utf8, "Test2"],
		["Test1", ReliableTxtEncoding.Utf8, "Test2", ReliableTxtEncoding.Utf8, "Test1Test2"],
		["Test1", ReliableTxtEncoding.Utf8, "Test2", ReliableTxtEncoding.Utf16, "Test1Test2"],
		["Test1", ReliableTxtEncoding.Utf8, "Test2", ReliableTxtEncoding.Utf16Reverse, "Test1Test2"],
		["Test1", ReliableTxtEncoding.Utf8, "Test2", ReliableTxtEncoding.Utf32, "Test1Test2"],
		["Test1", ReliableTxtEncoding.Utf16, "Test2", ReliableTxtEncoding.Utf8, "Test1Test2"],
		["Test1", ReliableTxtEncoding.Utf16, "Test2", ReliableTxtEncoding.Utf16, "Test1Test2"],
		["Test1", ReliableTxtEncoding.Utf16, "Test2", ReliableTxtEncoding.Utf16Reverse, "Test1Test2"],
		["Test1", ReliableTxtEncoding.Utf16, "Test2", ReliableTxtEncoding.Utf32, "Test1Test2"],
		["Test1", ReliableTxtEncoding.Utf16Reverse, "Test2", ReliableTxtEncoding.Utf8, "Test1Test2"],
		["Test1", ReliableTxtEncoding.Utf16Reverse, "Test2", ReliableTxtEncoding.Utf16, "Test1Test2"],
		["Test1", ReliableTxtEncoding.Utf16Reverse, "Test2", ReliableTxtEncoding.Utf16Reverse, "Test1Test2"],
		["Test1", ReliableTxtEncoding.Utf16Reverse, "Test2", ReliableTxtEncoding.Utf32, "Test1Test2"],
		["Test1", ReliableTxtEncoding.Utf32, "Test2", ReliableTxtEncoding.Utf8, "Test1Test2"],
		["Test1", ReliableTxtEncoding.Utf32, "Test2", ReliableTxtEncoding.Utf16, "Test1Test2"],
		["Test1", ReliableTxtEncoding.Utf32, "Test2", ReliableTxtEncoding.Utf16Reverse, "Test1Test2"],
		["Test1", ReliableTxtEncoding.Utf32, "Test2", ReliableTxtEncoding.Utf32, "Test1Test2"],
		["Test1", ReliableTxtEncoding.Utf8, "\uFEFFTest2", ReliableTxtEncoding.Utf8, "Test1\uFEFFTest2"],
	])(
		"Given %p, %p, %p and %p returns %p",
		(input1, encoding1, input2, encoding2, output) => {
			const filePath = testFilePath
			deleteFile(filePath)
			ReliableTxtFile.appendAllTextSync(input1, filePath, encoding1)
			let loaded = ReliableTxtFile.loadSync(filePath)
			expect(loaded.text).toEqual(input1)
			expect(loaded.encoding).toEqual(encoding1)

			ReliableTxtFile.appendAllTextSync(input2, filePath, encoding2)
			loaded = ReliableTxtFile.loadSync(filePath)
			expect(loaded.text).toEqual(output)
			expect(loaded.encoding).toEqual(encoding1)
		}
	)

	test("Without encoding", () => {
		const filePath = testFilePath
		deleteFile(filePath)
		ReliableTxtFile.appendAllTextSync("Test", filePath)
		const loaded = ReliableTxtFile.loadSync(filePath)
		expect(loaded.text).toEqual("Test")
		expect(loaded.encoding).toEqual(ReliableTxtEncoding.Utf8)
	})
})

describe("ReliableTxtFile.appendAllLinesSync", () => {
	test.each([
		[[""], ReliableTxtEncoding.Utf8, "", [""], ReliableTxtEncoding.Utf8, ""],
		[[""], ReliableTxtEncoding.Utf8, "", ["Line2"], ReliableTxtEncoding.Utf8, "Line2"],
		[["Line1"], ReliableTxtEncoding.Utf8, "Line1", [""], ReliableTxtEncoding.Utf8, "Line1\n"],
		[["Line1"], ReliableTxtEncoding.Utf8, "Line1", ["Line2"], ReliableTxtEncoding.Utf8, "Line1\nLine2"],
		[["Line1"], ReliableTxtEncoding.Utf8, "Line1", ["Line2"], ReliableTxtEncoding.Utf16, "Line1\nLine2"],
		[["Line1"], ReliableTxtEncoding.Utf8, "Line1", ["Line2"], ReliableTxtEncoding.Utf16Reverse, "Line1\nLine2"],
		[["Line1"], ReliableTxtEncoding.Utf8, "Line1", ["Line2"], ReliableTxtEncoding.Utf32, "Line1\nLine2"],
		[["Line1"], ReliableTxtEncoding.Utf16, "Line1", ["Line2"], ReliableTxtEncoding.Utf8, "Line1\nLine2"],
		[["Line1"], ReliableTxtEncoding.Utf16, "Line1", ["Line2"], ReliableTxtEncoding.Utf16, "Line1\nLine2"],
		[["Line1"], ReliableTxtEncoding.Utf16, "Line1", ["Line2"], ReliableTxtEncoding.Utf16Reverse, "Line1\nLine2"],
		[["Line1"], ReliableTxtEncoding.Utf16, "Line1", ["Line2"], ReliableTxtEncoding.Utf32, "Line1\nLine2"],
		[["Line1"], ReliableTxtEncoding.Utf16Reverse, "Line1", ["Line2"], ReliableTxtEncoding.Utf8, "Line1\nLine2"],
		[["Line1"], ReliableTxtEncoding.Utf16Reverse, "Line1", ["Line2"], ReliableTxtEncoding.Utf16, "Line1\nLine2"],
		[["Line1"], ReliableTxtEncoding.Utf16Reverse, "Line1", ["Line2"], ReliableTxtEncoding.Utf16Reverse, "Line1\nLine2"],
		[["Line1"], ReliableTxtEncoding.Utf16Reverse, "Line1", ["Line2"], ReliableTxtEncoding.Utf32, "Line1\nLine2"],
		[["Line1"], ReliableTxtEncoding.Utf32, "Line1", ["Line2"], ReliableTxtEncoding.Utf8, "Line1\nLine2"],
		[["Line1"], ReliableTxtEncoding.Utf32, "Line1", ["Line2"], ReliableTxtEncoding.Utf16, "Line1\nLine2"],
		[["Line1"], ReliableTxtEncoding.Utf32, "Line1", ["Line2"], ReliableTxtEncoding.Utf16Reverse, "Line1\nLine2"],
		[["Line1"], ReliableTxtEncoding.Utf32, "Line1", ["Line2"], ReliableTxtEncoding.Utf32, "Line1\nLine2"],
		[["Line1", "Line2"], ReliableTxtEncoding.Utf8, "Line1\nLine2", ["Line3", "Line4"], ReliableTxtEncoding.Utf8, "Line1\nLine2\nLine3\nLine4"],
	])(
		"Given %p, %p, %p and %p returns %p",
		(input1, encoding1, output1, input2, encoding2, output2) => {
			const filePath = testFilePath
			deleteFile(filePath)
			ReliableTxtFile.appendAllLinesSync(input1, filePath, encoding1)
			let loaded = ReliableTxtFile.loadSync(filePath)
			expect(loaded.text).toEqual(output1)
			expect(loaded.encoding).toEqual(encoding1)

			ReliableTxtFile.appendAllLinesSync(input2, filePath, encoding2)
			loaded = ReliableTxtFile.loadSync(filePath)
			expect(loaded.text).toEqual(output2)
			expect(loaded.encoding).toEqual(encoding1)
		}
	)

	test("Without encoding", () => {
		const filePath = testFilePath
		deleteFile(filePath)
		ReliableTxtFile.appendAllLinesSync(["Line1"], filePath)
		const loaded = ReliableTxtFile.loadSync(filePath)
		expect(loaded.text).toEqual("Line1")
		expect(loaded.encoding).toEqual(ReliableTxtEncoding.Utf8)
	})
})

// ----------------------------------------------------------------------

describe("SyncReliableTxtStreamWriter Constructor", () => {
	test.each([
		[ReliableTxtEncoding.Utf8],
		[ReliableTxtEncoding.Utf16],
		[ReliableTxtEncoding.Utf16Reverse],
		[ReliableTxtEncoding.Utf32],
	])(
		"Given %p",
		(encoding) => {
			const writer = new SyncReliableTxtStreamWriter(testFilePath, encoding)
			writer.close()
			const loaded = ReliableTxtFile.loadSync(testFilePath)
			expect(loaded.text).toEqual("")
			expect(loaded.encoding).toEqual(encoding)
		}
	)

	test("Without encoding", () => {
		const writer = new SyncReliableTxtStreamWriter(testFilePath)
		writer.close()
		const loaded = ReliableTxtFile.loadSync(testFilePath)
		expect(loaded.text).toEqual("")
		expect(loaded.encoding).toEqual(ReliableTxtEncoding.Utf8)
	})
})

describe("SyncReliableTxtStreamWriter Constructor Append", () => {
	test.each([
		[ReliableTxtEncoding.Utf8, ReliableTxtEncoding.Utf8],
		[ReliableTxtEncoding.Utf8, ReliableTxtEncoding.Utf16],
		[ReliableTxtEncoding.Utf8, ReliableTxtEncoding.Utf16Reverse],
		[ReliableTxtEncoding.Utf8, ReliableTxtEncoding.Utf32],
	])(
		"Given %p",
		(encoding1, encoding2) => {
			ReliableTxtFile.writeAllTextSync("Test1", testFilePath, encoding1)
			const writer = new SyncReliableTxtStreamWriter(testFilePath, encoding2, true)
			writer.write("Test2")
			writer.close()
			const loaded = ReliableTxtFile.loadSync(testFilePath)
			expect(loaded.text).toEqual("Test1Test2")
			expect(loaded.encoding).toEqual(encoding1)
		}
	)
})

test("SyncReliableTxtStreamWriter.isClosed", () => {
	const writer = new SyncReliableTxtStreamWriter(testFilePath)
	expect(writer.isClosed).toEqual(false)
	writer.close()
	expect(writer.isClosed).toEqual(true)
})

describe("SyncReliableTxtStreamWriter.write", () => {
	test("Multiple writes", () => {
		const writer = new SyncReliableTxtStreamWriter(testFilePath)
		writer.write("Test1")
		writer.write("Test2")
		writer.close()
		expect(ReliableTxtFile.readAllTextSync(testFilePath)).toEqual("Test1Test2")
	})

	test("Empty", () => {
		const writer = new SyncReliableTxtStreamWriter(testFilePath)
		writer.write("")
		writer.close()
		expect(ReliableTxtFile.readAllTextSync(testFilePath)).toEqual("")
	})

	test("Closed", () => {
		const writer = new SyncReliableTxtStreamWriter(testFilePath)
		writer.close()
		expect(() => writer.write("Test")).toThrowError()
	})
})

describe("SyncReliableTxtStreamWriter.writeLine", () => {
	test.each([
		["", "Line2", "Line2"],
		["Line1", "", "Line1\n"],
		["Line1", "Line2", "Line1\nLine2"],
	])(
		"Given %p",
		(content, line, output) => {
			const writer = new SyncReliableTxtStreamWriter(testFilePath)
			writer.write(content)
			writer.writeLine(line)
			writer.close()
			expect(ReliableTxtFile.readAllTextSync(testFilePath)).toEqual(output)
		}
	)

	test("Multiple writes", () => {
		const writer = new SyncReliableTxtStreamWriter(testFilePath)
		writer.writeLine("")
		writer.writeLine("Line2")
		writer.writeLine("")
		writer.writeLine("Line4")
		writer.close()
		expect(ReliableTxtFile.readAllTextSync(testFilePath)).toEqual("\nLine2\n\nLine4")
	})

	test("Multiple writes + first write", () => {
		const writer = new SyncReliableTxtStreamWriter(testFilePath)
		writer.write("")
		writer.writeLine("Line2")
		writer.writeLine("")
		writer.writeLine("Line4")
		writer.close()
		expect(ReliableTxtFile.readAllTextSync(testFilePath)).toEqual("Line2\n\nLine4")
	})
})

test("SyncReliableTxtStreamWriter.writeLines", () => {
	const writer = new SyncReliableTxtStreamWriter(testFilePath)
	writer.writeLines(["Line1", "Line2", "Line3"])
	writer.close()
	expect(ReliableTxtFile.readAllTextSync(testFilePath)).toEqual("Line1\nLine2\nLine3")
})

// ----------------------------------------------------------------------

describe("SyncReliableTxtStreamReader Constructor", () => {
	test.each([
		[ReliableTxtEncoding.Utf8],
	])(
		"Given %p",
		(encoding) => {
			ReliableTxtFile.writeAllTextSync("Test", testFilePath, encoding)
			const reader = new SyncReliableTxtStreamReader(testFilePath)
			expect(reader.encoding).toEqual(encoding)
			reader.close()
		}
	)

	test.each([
		[ReliableTxtEncoding.Utf16],
		[ReliableTxtEncoding.Utf16Reverse],
		[ReliableTxtEncoding.Utf32],
	])(
		"Given %p throws",
		(encoding) => {
			ReliableTxtFile.writeAllTextSync("Test", testFilePath, encoding)
			expect(() => new SyncReliableTxtStreamReader(testFilePath)).toThrowError()
		}
	)

	test("Chunk size", () => {
		ReliableTxtFile.writeAllTextSync("Test", testFilePath, ReliableTxtEncoding.Utf8)
		expect(() => new SyncReliableTxtStreamReader(testFilePath, 1)).toThrowError("Chunk size too small")
	})
})

test("SyncReliableTxtStreamReader.isClosed", () => {
	ReliableTxtFile.writeAllTextSync("Test", testFilePath, ReliableTxtEncoding.Utf8)
	const writer = new SyncReliableTxtStreamReader(testFilePath)
	expect(writer.isClosed).toEqual(false)
	writer.close()
	expect(writer.isClosed).toEqual(true)
})

describe("SyncReliableTxtStreamReader.readLine", () => {
	test("Null", () => {
		ReliableTxtFile.writeAllTextSync("Line1\nLine2", testFilePath)
		const reader = new SyncReliableTxtStreamReader(testFilePath)
		expect(reader.readLine()).toEqual("Line1")
		expect(reader.readLine()).toEqual("Line2")
		expect(reader.readLine()).toEqual(null)
		reader.close()
	})

	test("Closed", () => {
		ReliableTxtFile.writeAllTextSync("Line1\nLine2", testFilePath)
		const reader = new SyncReliableTxtStreamReader(testFilePath)
		reader.close()
		expect(() => reader.readLine()).toThrowError()
	})

	test("Buffer", () => {
		ReliableTxtFile.writeAllTextSync("Line1\nLine2", testFilePath)
		const reader = new SyncReliableTxtStreamReader(testFilePath, 2)
		expect(reader.readLine()).toEqual("Line1")
		expect(reader.readLine()).toEqual("Line2")
		expect(reader.readLine()).toEqual(null)
		reader.close()
	})
})

// ----------------------------------------------------------------------

describe("ReverseLineIterator Constructor", () => {
	test.each([
		[ReliableTxtEncoding.Utf8],
	])(
		"Given %p",
		(encoding) => {
			ReliableTxtFile.writeAllTextSync("Test", testFilePath, encoding)
			const reader = new ReverseLineIterator(testFilePath, encoding)
			reader.close()
		}
	)

	test.each([
		[ReliableTxtEncoding.Utf16],
		[ReliableTxtEncoding.Utf16Reverse],
		[ReliableTxtEncoding.Utf32],
	])(
		"Given %p throws",
		(encoding) => {
			ReliableTxtFile.writeAllTextSync("Test", testFilePath, encoding)
			expect(() => new ReverseLineIterator(testFilePath, encoding)).toThrowError()
		}
	)
})

test("ReverseLineIterator.close", () => {
	ReliableTxtFile.writeAllTextSync("Test", testFilePath, ReliableTxtEncoding.Utf8)
	const reader = new ReverseLineIterator(testFilePath, ReliableTxtEncoding.Utf8)
	reader.close()
	reader.close()
})

describe("ReverseLineIterator.getLine", () => {
	test("Normal", () => {
		ReliableTxtFile.writeAllTextSync("Line1\nLine2\nLine3", testFilePath)
		const reader = new ReverseLineIterator(testFilePath, ReliableTxtEncoding.Utf8)
		expect(reader.getLine()).toEqual("Line3")
		expect(reader.getLine()).toEqual("Line2")
		reader.close()
	})

	test("First line", () => {
		ReliableTxtFile.writeAllTextSync("Line1\nLine2", testFilePath)
		const reader = new ReverseLineIterator(testFilePath, ReliableTxtEncoding.Utf8)
		expect(reader.getLine()).toEqual("Line2")
		expect(() => reader.getLine()).toThrowError()
		reader.close()
	})

	test("Closed", () => {
		ReliableTxtFile.writeAllTextSync("Line1\nLine2", testFilePath)
		const reader = new ReverseLineIterator(testFilePath, ReliableTxtEncoding.Utf8)
		reader.close()
		expect(() => reader.getLine()).toThrowError()
	})
})

test("ReverseLineIterator.getPosition", () => {
	ReliableTxtFile.writeAllTextSync("Line1\nLine2", testFilePath)
	const reader = new ReverseLineIterator(testFilePath, ReliableTxtEncoding.Utf8)
	expect(reader.getLine()).toEqual("Line2")
	expect(reader.getPosition()).toEqual(7)
	reader.close()
})