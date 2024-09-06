/* eslint-disable */
/**
 * This file was automatically generated.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema in the source OAS file,
 * and use `yarn brij dto` to regenerate this file.
 */

import { JSONSchema } from '@kong/brij'

export interface SharedObj1 {
  prop1?: string
  propWriteOnly?: string
  nested?: {
    propWriteOnly?: string
    [k: string]: unknown
  }
  [k: string]: unknown
}

export type PutThingRequestBody = SharedObj1

class PutThingRequestBodySchema extends JSONSchema {
  constructor() {
    super({
      "title": "SharedObj1",
      "type": "object",
      "properties": {
        "prop1": {
          "type": "string"
        },
        "propWriteOnly": {
          "type": "string",
          "writeOnly": true
        },
        "nested": {
          "type": "object",
          "properties": {
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

export const PutThingRequestBody = new PutThingRequestBodySchema()
