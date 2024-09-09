/* eslint-disable */
/**
 * This file was automatically generated.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema in the source OAS file,
 * and use `yarn brij dto` to regenerate this file.
 */

import { JSONSchema } from '@kong/brij'

export interface GetItemsIdPartsPartIdResponseBody {
  responseProp1?: string
  [k: string]: unknown
}


class GetItemsIdPartsPartIdResponseBodySchema extends JSONSchema {
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

export const GetItemsIdPartsPartIdResponseBody = new GetItemsIdPartsPartIdResponseBodySchema()
