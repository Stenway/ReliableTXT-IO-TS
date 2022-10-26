/* (C) Stefan John / Stenway / ReliableTXT.com / 2022 */

import * as fs from 'fs'
import { NoReliableTxtPreambleError, ReliableTxtDecoder, ReliableTxtDocument, ReliableTxtEncoder, ReliableTxtEncoding, ReliableTxtEncodingUtil, ReliableTxtLines, Utf16String } from '@stenway/reliabletxt'

// ----------------------------------------------------------------------

export abstract class ReliableTxtFile {
	static getEncodingOrNullSync(filePath: string): ReliableTxtEncoding | null {
		let handle: number = fs.openSync(filePath, "r")
		let buffer: Uint8Array = new Uint8Array(4)
		let numBytesRead: number = fs.readSync(handle, buffer)
		buffer = buffer.slice(0, numBytesRead)
		fs.closeSync(handle)
		return ReliableTxtDecoder.getEncodingOrNull(buffer)
	}

	static getEncodingSync(filePath: string): ReliableTxtEncoding {
		let encoding: ReliableTxtEncoding | null = ReliableTxtFile.getEncodingOrNullSync(filePath)
		if (encoding === null) {
			throw new NoReliableTxtPreambleError()
		}
		return encoding!
	}

	static loadSync(filePath: string): ReliableTxtDocument {
		let handle: number = fs.openSync(filePath, "r")
		let fileSize: number = fs.fstatSync(handle).size
		let buffer: Uint8Array = new Uint8Array(fileSize)
		let numBytesRead: number = fs.readSync(handle, buffer)
		fs.closeSync(handle)
		return ReliableTxtDocument.fromBytes(buffer)
	}

	static appendAllTextSync(content: string, filePath: string, createWithEncoding: ReliableTxtEncoding = ReliableTxtEncoding.Utf8) {
		if (fs.existsSync(filePath)) {
			let detectedEncoding: ReliableTxtEncoding = ReliableTxtFile.getEncodingSync(filePath)
			let bytes: Uint8Array = ReliableTxtEncoder.encodePart(content, detectedEncoding)
			fs.appendFileSync(filePath, bytes)
		} else {
			ReliableTxtFile.writeAllTextSync(content, filePath, createWithEncoding)
		}
	}

	static appendAllLinesSync(lines: string[], filePath: string, createWithEncoding: ReliableTxtEncoding = ReliableTxtEncoding.Utf8) {
		if (fs.existsSync(filePath)) {
			let detectedEncoding: ReliableTxtEncoding = ReliableTxtFile.getEncodingSync(filePath)
			let fileSize: number = fs.statSync(filePath).size
			let isEmpty: boolean = ReliableTxtEncodingUtil.getPreambleSize(detectedEncoding) === fileSize
			
			let content: string = ReliableTxtLines.join(lines)
			if (!isEmpty) { content = "\n" + content }
			let bytes: Uint8Array = ReliableTxtEncoder.encodePart(content, detectedEncoding)

			fs.appendFileSync(filePath, bytes)
		} else {
			ReliableTxtFile.writeAllLinesSync(lines, filePath, createWithEncoding)
		}
	}

	static readAllTextSync(filePath: string): string {
		return ReliableTxtFile.loadSync(filePath).text
	}

	static readAllLinesSync(filePath: string): string[] {
		return ReliableTxtFile.loadSync(filePath).getLines()
	}

	static saveSync(document: ReliableTxtDocument, filePath: string) {
		let bytes: Uint8Array = document.getBytes()
		fs.writeFileSync(filePath, bytes)
	}

	static writeAllTextSync(content: string, filePath: string, encoding: ReliableTxtEncoding = ReliableTxtEncoding.Utf8) {
		let document: ReliableTxtDocument = new ReliableTxtDocument(content, encoding)
		ReliableTxtFile.saveSync(document, filePath)
	}

	static writeAllLinesSync(lines: string[], filePath: string, encoding: ReliableTxtEncoding = ReliableTxtEncoding.Utf8) {
		let content: string = ReliableTxtLines.join(lines)
		let document: ReliableTxtDocument = new ReliableTxtDocument(content, encoding)
		ReliableTxtFile.saveSync(document, filePath)
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

		this.buffer = new Uint8Array(chunkSize)

		this.handle = fs.openSync(filePath, "r")
		this.position = ReliableTxtEncodingUtil.getPreambleSize(this._encoding)
	}

	readLine(): string | null {
		if (this.isClosed) { throw new Error("Stream reader is closed") }
		if (this.rest === null) { return null }

		let lastStartIndex: number = 0
		let current: Uint8Array = this.rest!
		while (true) {
			let newlineIndex: number = current.indexOf(0x0A, lastStartIndex)
			if (newlineIndex >= 0) {
				let lineBytes: Uint8Array = current.slice(0, newlineIndex)
				let lineStr: string = ReliableTxtDecoder.decodePart(lineBytes, this._encoding)
				this.rest = current.slice(newlineIndex+1)
				return lineStr
			} else {
				lastStartIndex = current.length
				let numBytesRead: number = fs.readSync(this.handle!, this.buffer, 0, this.buffer.length, this.position)
				if (numBytesRead === 0) {
					let lineStr: string = ReliableTxtDecoder.decodePart(current, this._encoding)
					this.rest = null
					return lineStr
				}
				this.position += numBytesRead

				let newCurrent: Uint8Array = new Uint8Array(current.length + numBytesRead)
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
		if (!this.isClosed) {
			fs.closeSync(this.handle!)
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
		let fileSize: number = fs.fstatSync(this.handle).size
		this.isEmpty = ReliableTxtEncodingUtil.getPreambleSize(this.encoding) === fileSize
	}

	write(text: string) {
		this.validateIsOpen()
		if (text.length === 0) { return }
		else { this.isEmpty = false }
		let bytes: Uint8Array = ReliableTxtEncoder.encodePart(text, this.encoding)
		fs.writeSync(this.handle!, bytes)
	}

	writeLine(line: string) {
		if (!this.isEmpty) { line = "\n" + line }
		if (line.length === 0) { this.isEmpty = false }
		this.write(line)
	}

	writeLines(lines: string[]) {
		for (let line of lines) {
			this.writeLine(line)
		}
	}

	private validateIsOpen() {
		if (this.isClosed) { throw new Error("Stream writer is closed") }
	}

	close() {
		if (!this.isClosed) {
			fs.closeSync(this.handle!)
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
		
		let start: number = Math.max(this.index - this.buffer.length + 1, 0)
		let length: number = this.index - start + 1
		let numBytesRead: number = fs.readSync(this.handle, this.buffer, 0, length, start)
		
		if (numBytesRead !== length) { throw new Error("Not supported") }
		for (let i=length-1; i>=0; i--) {
			let currentByte: number = this.buffer[i]
			if (currentByte === 0x0A) {
				this.index = start + i - 1
				let sliceStart: number = i+1
				let sliceLength: number = length-i-1
				let lineBytes: Uint8Array = this.buffer.slice(sliceStart, sliceStart+sliceLength)
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
	}
}