/* eslint-disable */
/**
 * This file was automatically generated.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema in the source OAS file,
 * and use `yarn brij dto` to regenerate this file.
 */

import { JSONSchema } from '@kong/brij'

export interface UpdateItemResponseBody {
  responseProp1?: string
  [k: string]: unknown
}


class UpdateItemResponseBodySchema extends JSONSchema {
  constructor() {
    super({
      "type": "object",
      "properties": {
        "responseProp1": {
          "type": "string"
        }
      }
    })
  }
}

export const UpdateItemResponseBody = new UpdateItemResponseBodySchema()
