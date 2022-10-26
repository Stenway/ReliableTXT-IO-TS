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