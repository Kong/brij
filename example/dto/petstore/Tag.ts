/* eslint-disable */
/**
 * This file was automatically generated.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema in the source OAS file,
 * and use `yarn brij dto` to regenerate this file.
 */

import { JSONSchema } from 'brij'

export interface Tag {
  id?: number
  name?: string
  [k: string]: unknown
}


class TagSchema extends JSONSchema {
  constructor() {
    super({
      "type": "object",
      "properties": {
        "id": {
          "type": "integer"
        },
        "name": {
          "type": "string"
        }
      }
    })
  }
}

export const Tag = new TagSchema()
