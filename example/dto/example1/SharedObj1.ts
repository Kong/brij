/* eslint-disable */
/**
 * This file was automatically generated.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema in the source OAS file,
 * and use `yarn brij dto` to regenerate this file.
 */

import { JSONSchema } from '@kong/brij'

export interface SharedObj1 {
  prop1?: string
  propReadOnly?: string
  propWriteOnly?: string
  nested?: {
    propReadOnly?: string
    propWriteOnly?: string
    [k: string]: unknown
  }
  [k: string]: unknown
}


class SharedObj1Schema extends JSONSchema {
  constructor() {
    super({
      "title": "SharedObj1",
      "type": "object",
      "properties": {
        "prop1": {
          "type": "string"
        },
        "propReadOnly": {
          "type": "string",
          "readOnly": true
        },
        "propWriteOnly": {
          "type": "string",
          "writeOnly": true
        },
        "nested": {
          "type": "object",
          "properties": {
            "propReadOnly": {
              "type": "string",
              "readOnly": true
            },
            "propWriteOnly": {
              "type": "string",
              "writeOnly": true
            }
          }
        }
      }
    })
  }
}

export const SharedObj1 = new SharedObj1Schema()
