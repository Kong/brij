/* eslint-disable */
/**
 * This file was automatically generated.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema in the source OAS file,
 * and use `yarn brij dto` to regenerate this file.
 */

import { JSONSchema } from '@kong/brij'

export interface SharedObj1 {
  [k: string]: unknown
}

export type Test1Response = SharedObj1

class Test1ResponseSchema extends JSONSchema {
  constructor() {
    super({
      "title": "SharedObj1",
      "type": "object"
    })
  }
}

export const Test1Response = new Test1ResponseSchema()
