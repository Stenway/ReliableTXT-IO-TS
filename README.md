# ReliableTXT-IO

## About

[ReliableTXT Documentation/Specification](https://www.reliabletxt.com)

## Installation

Using NPM:
```
npm install @stenway/reliabletxt-io
```

## Getting started

```ts
import { ReliableTxtDocument } from '@stenway/reliabletxt'
import { ReliableTxtFile } from '@stenway/reliabletxt-io'

let filePath: string = "Test.txt"
ReliableTxtFile.saveSync(new ReliableTxtDocument("Hello world"), filePath)
console.log(ReliableTxtFile.loadSync(filePath))
```

## Videos
* [Package Usage](https://www.youtube.com/watch?v=a7dLaMv6F7Y)
* [Why I like the UTF-8 Byte Order Mark (BOM)](https://www.youtube.com/watch?v=VgVkod9HQTo)
* [Stop Using Windows Line Breaks (CRLF)](https://www.youtube.com/watch?v=YPtMCiHj7F8)

Others:
* [Convert To ReliableTXT](https://www.youtube.com/watch?v=wqQ5bkW2L6A)
* [ReliableTXT Editor in your browser - Stenway Notepad](https://www.youtube.com/watch?v=sh_hGzdnUUs)

## Examples

```ts
import { ReliableTxtDocument, ReliableTxtEncoding } from "@stenway/reliabletxt"
import { ReliableTxtFile } from "@stenway/reliabletxt-io"

// read/write text

let content = "A\nB"
ReliableTxtFile.writeAllTextSync(content, "TestUtf8.txt")
ReliableTxtFile.writeAllTextSync(content, "TestUtf16.txt", ReliableTxtEncoding.Utf16)
ReliableTxtFile.writeAllTextSync(content, "TestUtf16R.txt", ReliableTxtEncoding.Utf16Reverse)
ReliableTxtFile.writeAllTextSync(content, "TestUtf32.txt", ReliableTxtEncoding.Utf32)

let text1 = ReliableTxtFile.readAllTextSync("TestUtf8.txt")
let text2 = ReliableTxtFile.readAllTextSync("TestUtf16.txt")
let text3 = ReliableTxtFile.readAllTextSync("TestUtf16R.txt")
let text4 = ReliableTxtFile.readAllTextSync("TestUtf32.txt")

// read/write lines

ReliableTxtFile.writeAllLinesSync(["A", "B"], "TestUtf8.txt")
ReliableTxtFile.writeAllLinesSync(["A", "B"], "TestUtf16.txt")

text1 = ReliableTxtFile.readAllTextSync("TestUtf8.txt")
text2 = ReliableTxtFile.readAllTextSync("TestUtf16.txt")

// document class

let document = new ReliableTxtDocument("A\nB", ReliableTxtEncoding.Utf16)
ReliableTxtFile.saveSync(document, "TestUtf16.txt")

let loadedDocument = ReliableTxtFile.loadSync("TestUtf16.txt")

// encoding

let encoding1 = ReliableTxtFile.getEncodingSync("TestUtf8.txt")
let encoding2 = ReliableTxtFile.getEncodingSync("TestUtf16.txt")
let encoding3 = ReliableTxtFile.getEncodingSync("TestUtf16R.txt")
let encoding4 = ReliableTxtFile.getEncodingSync("TestUtf32.txt")

// no ReliableTXT error

try {
	let encodingX = ReliableTxtFile.getEncodingSync("Test.txt")
} catch (err) {
	console.log("Error: No ReliableTXT preamble error")
}
let encoding = ReliableTxtFile.getEncodingOrNullSync("Test.txt")

// append

ReliableTxtFile.writeAllTextSync("A\nB", "Append.txt")
ReliableTxtFile.appendAllTextSync("C\nD", "Append.txt")
ReliableTxtFile.appendAllLinesSync(["E", "F"], "Append.txt")

console.log("ReliableTXT IO usage")
```
Big files:
```ts
import { ReliableTxtEncoding } from "@stenway/reliabletxt"
import { ReliableTxtFile } from "@stenway/reliabletxt-io"

function writeBigFiles() {
	// create a big string

	console.log("Creating string")
	let maxStringLength = 512 * 1024 * 1024 - 24 // (1 << 29) - 24
	let maxUtf16DecoderStringLength = 128 * 1024 * 1024 - 1 // 134_217_727 
	let text: string = "a".repeat(maxStringLength-1)

	// write big files

	console.log("Write Utf8")
	ReliableTxtFile.writeAllTextSync(text, "BigUtf8.txt")

	console.log("Write Utf16")
	ReliableTxtFile.writeAllTextSync(text, "BigUtf16.txt", ReliableTxtEncoding.Utf16)

	console.log("Write Utf32")
	ReliableTxtFile.writeAllTextSync(text, "BigUtf32.txt", ReliableTxtEncoding.Utf32)
}

// writeBigFiles()

function readBigFiles() {
	let text = ReliableTxtFile.readAllTextSync("BigUtf8.txt")
	console.log(text.length)

	text = ReliableTxtFile.readAllTextSync("BigUtf16.txt")
	console.log(text.length)

	text = ReliableTxtFile.readAllTextSync("BigUtf32.txt")
	console.log(text.length)
}

readBigFiles()

console.log("Done")
```
Streaming classes:
```ts
import { SyncReliableTxtStreamWriter, SyncReliableTxtStreamReader } from "@stenway/reliabletxt-io"

let longLine = "a".repeat(1024*1024)

// write

let writer = new SyncReliableTxtStreamWriter("Test.txt")
for (let i: number = 0; i<1000; i++) {
	writer.writeLine(`Line ${(i+1).toString().padStart(10, "0")}: ${longLine}`)
}
writer.close()

// read

let reader = new SyncReliableTxtStreamReader("Test.txt")
let count = 0
while (true) {
	let line = reader.readLine()
	if (line === null) { break }
	count++
}
console.log(`Count: ${count}`)

console.log("Done")
```