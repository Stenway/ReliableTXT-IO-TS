/* (C) Stefan John / Stenway / ReliableTXT.com / 2023 */

import * as fs from 'fs'
import { NoReliableTxtPreambleError, ReliableTxtDecoder, ReliableTxtDocument, ReliableTxtEncoder, ReliableTxtEncoding, ReliableTxtEncodingUtil, ReliableTxtLines, Utf16String } from '@stenway/reliabletxt'

// ----------------------------------------------------------------------

export abstract class ReliableTxtFile {
	static isValidSync(filePath: string): boolean {
		const bytes = this.readAllBytesSync(filePath)
		try {
			ReliableTxtDocument.fromBytes(bytes)
		} catch (error) {
			return false
		}
		return true
	}
	
	private static getEncodingOrNullWithHandleSync(handle: number): ReliableTxtEncoding | null {
		let buffer: Uint8Array = new Uint8Array(4)
		const numBytesRead: number = fs.readSync(handle, buffer)
		buffer = buffer.slice(0, numBytesRead)
		return ReliableTxtDecoder.getEncodingOrNull(buffer)
	}

	static getEncodingOrNullSync(filePath: string): ReliableTxtEncoding | null {
		const handle: number = fs.openSync(filePath, "r")
		try {
			return this.getEncodingOrNullWithHandleSync(handle)
		} finally {
			fs.closeSync(handle)
		}
	}

	static getEncodingSync(filePath: string): ReliableTxtEncoding {
		const encoding: ReliableTxtEncoding | null = this.getEncodingOrNullSync(filePath)
		if (encoding === null) {
			throw new NoReliableTxtPreambleError()
		}
		return encoding
	}

	private static readAllBytesSync(filePath: string): Uint8Array {
		const handle: number = fs.openSync(filePath, "r")
		try {
			const fileSize: number = fs.fstatSync(handle).size
			const buffer: Uint8Array = new Uint8Array(fileSize)
			const numBytesRead: number = fs.readSync(handle, buffer)
			if (numBytesRead !== fileSize) { throw new Error(`File was not fully read`) }
			return buffer
		} finally {
			fs.closeSync(handle)
		}
	}

	static loadSync(filePath: string): ReliableTxtDocument {
		const bytes = this.readAllBytesSync(filePath)
		return ReliableTxtDocument.fromBytes(bytes)
	}

	private static appendToExistingFileSync(content: string, filePath: string, prependLineBreakIfNotEmpty: boolean) {
		const handle: number = fs.openSync(filePath, "r+")
		try {
			const encodingOrNull = this.getEncodingOrNullWithHandleSync(handle)
			if (encodingOrNull === null) { throw new NoReliableTxtPreambleError() }
			const fileSize: number = fs.fstatSync(handle).size
			const isEmpty: boolean = ReliableTxtEncodingUtil.getPreambleSize(encodingOrNull) === fileSize
			if (prependLineBreakIfNotEmpty && !isEmpty) {
				content = "\n" + content
			}
			const bytes: Uint8Array = ReliableTxtEncoder.encodePart(content, encodingOrNull)
			const numBytesWritten: number = fs.writeSync(handle, bytes, 0, bytes.length, fileSize)
			if (numBytesWritten !== bytes.length) { throw new Error(`File was not fully written`) }
		} finally {
			fs.closeSync(handle)
		}
	}

	static appendAllTextSync(content: string, filePath: string, createWithEncoding: ReliableTxtEncoding = ReliableTxtEncoding.Utf8) {
		try {
			this.appendToExistingFileSync(content, filePath, false)
		} catch (error) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			if ((error as any).code === "ENOENT") {
				this.writeAllTextSync(content, filePath, createWithEncoding, false)
			} else {
				throw error
			}
		}
	}

	static appendAllLinesSync(lines: string[], filePath: string, createWithEncoding: ReliableTxtEncoding = ReliableTxtEncoding.Utf8) {
		const content: string = ReliableTxtLines.join(lines)
		try {
			this.appendToExistingFileSync(content, filePath, true)
		} catch (error) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			if ((error as any).code === "ENOENT") {
				this.writeAllTextSync(content, filePath, createWithEncoding, false)
			} else {
				throw error
			}
		}
	}

	static readAllTextSync(filePath: string): string {
		return this.loadSync(filePath).text
	}

	static readAllLinesSync(filePath: string): string[] {
		return this.loadSync(filePath).getLines()
	}

	static saveSync(document: ReliableTxtDocument, filePath: string, overwriteExisting: boolean = true) {
		const bytes: Uint8Array = document.getBytes()
		fs.writeFileSync(filePath, bytes, { flag: overwriteExisting ? "w" : "wx" })
	}

	static writeAllTextSync(content: string, filePath: string, encoding: ReliableTxtEncoding = ReliableTxtEncoding.Utf8, overwriteExisting: boolean = true) {
		const document: ReliableTxtDocument = new ReliableTxtDocument(content, encoding)
		this.saveSync(document, filePath, overwriteExisting)
	}

	static writeAllLinesSync(lines: string[], filePath: string, encoding: ReliableTxtEncoding = ReliableTxtEncoding.Utf8, overwriteExisting: boolean = true) {
		const document: ReliableTxtDocument = ReliableTxtDocument.fromLines(lines, encoding)
		this.saveSync(document, filePath, overwriteExisting)
	}
}

// ----------------------------------------------------------------------

export class SyncReliableTxtStreamReader {
	private handle: number | null
	private position: number
	private buffer: Uint8Array
	private _encoding: ReliableTxtEncoding
	private rest: Uint8Array | null = new Uint8Array(0)

	get encoding(): ReliableTxtEncoding {
		return this._encoding
	}

	get isClosed(): boolean {
		return this.handle === null
	}

	constructor(filePath: string, chunkSize: number = 4096) {
		this._encoding = ReliableTxtFile.getEncodingSync(filePath)
		if (this._encoding !== ReliableTxtEncoding.Utf8) { throw new Error("Not implemented") }
		if (chunkSize < 2) { throw new RangeError("Chunk size too small") }

		this.buffer = new Uint8Array(chunkSize)

		this.handle = fs.openSync(filePath, "r")
		this.position = ReliableTxtEncodingUtil.getPreambleSize(this._encoding)
	}

	readLine(): string | null {
		if (this.handle === null) { throw new Error("Stream reader is closed") }
		if (this.rest === null) { return null }

		let lastStartIndex: number = 0
		let current: Uint8Array = this.rest
		for (;;) {
			const newlineIndex: number = current.indexOf(0x0A, lastStartIndex)
			if (newlineIndex >= 0) {
				const lineBytes: Uint8Array = current.slice(0, newlineIndex)
				const lineStr: string = ReliableTxtDecoder.decodePart(lineBytes, this._encoding)
				this.rest = current.slice(newlineIndex+1)
				return lineStr
			} else {
				lastStartIndex = current.length
				const numBytesRead: number = fs.readSync(this.handle, this.buffer, 0, this.buffer.length, this.position)
				if (numBytesRead === 0) {
					const lineStr: string = ReliableTxtDecoder.decodePart(current, this._encoding)
					this.rest = null
					return lineStr
				}
				this.position += numBytesRead

				const newCurrent: Uint8Array = new Uint8Array(current.length + numBytesRead)
				newCurrent.set(current, 0)
				if (numBytesRead < this.buffer.length) {
					newCurrent.set(this.buffer.subarray(0, numBytesRead), current.length)
				} else {
					newCurrent.set(this.buffer, current.length)
				}
				current = newCurrent
			}
		}
	}

	close() {
		if (this.handle !== null) {
			fs.closeSync(this.handle)
			this.handle = null
		}
	}
}

// ----------------------------------------------------------------------

export class SyncReliableTxtStreamWriter {
	private handle: number | null
	readonly encoding: ReliableTxtEncoding
	private isEmpty: boolean
	
	get isClosed(): boolean {
		return this.handle === null
	}

	constructor(filePath: string, createWithEncoding: ReliableTxtEncoding = ReliableTxtEncoding.Utf8, append: boolean = false) {
		if (fs.existsSync(filePath) && append) {
			this.encoding = ReliableTxtFile.getEncodingSync(filePath)
		} else {
			ReliableTxtFile.writeAllTextSync("", filePath, createWithEncoding)
			this.encoding = createWithEncoding
		}
		this.handle = fs.openSync(filePath, "a")
		const fileSize: number = fs.fstatSync(this.handle).size
		this.isEmpty = ReliableTxtEncodingUtil.getPreambleSize(this.encoding) === fileSize
	}

	write(text: string) {
		if (this.handle === null) { throw new Error("Stream writer is closed") }
		if (text.length === 0) { return }
		else { this.isEmpty = false }
		const bytes: Uint8Array = ReliableTxtEncoder.encodePart(text, this.encoding)
		fs.writeSync(this.handle, bytes)
	}

	writeLine(line: string) {
		if (!this.isEmpty) { line = "\n" + line }
		if (line.length === 0) { this.isEmpty = false }
		this.write(line)
	}

	writeLines(lines: string[]) {
		for (const line of lines) {
			this.writeLine(line)
		}
	}

	close() {
		if (this.handle !== null) {
			fs.closeSync(this.handle)
			this.handle = null
		}
	}
}

// ----------------------------------------------------------------------

export class ReverseLineIterator {
	private handle: number | null
	private index: number
	private encoding: ReliableTxtEncoding
	private buffer: Uint8Array = new Uint8Array(128)
			
	constructor(filePath: string, encoding: ReliableTxtEncoding) {
		this.handle = fs.openSync(filePath, "r")
		this.index = fs.fstatSync(this.handle).size-1
		this.encoding = encoding
		if (encoding !== ReliableTxtEncoding.Utf8) { throw new Error("Not implemented") }
	}
	
	getLine(): string {
		if (this.handle === null) { throw new Error("File handle closed") }
		
		const start: number = Math.max(this.index - this.buffer.length + 1, 0)
		const length: number = this.index - start + 1
		const numBytesRead: number = fs.readSync(this.handle, this.buffer, 0, length, start)
		
		if (numBytesRead !== length) { throw new Error("Not supported") }
		for (let i=length-1; i>=0; i--) {
			const currentByte: number = this.buffer[i]
			if (currentByte === 0x0A) {
				this.index = start + i - 1
				const sliceStart: number = i+1
				const sliceLength: number = length-i-1
				const lineBytes: Uint8Array = this.buffer.slice(sliceStart, sliceStart+sliceLength)
				return Utf16String.fromUtf8Bytes(lineBytes, false)
			}
		}
		throw new Error("Not supported")
	}

	getPosition(): number {
		return this.index
	}

	close() {
		if (this.handle === null) { return }
		fs.closeSync(this.handle)
		this.handle = null
	}
}