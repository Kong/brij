/* eslint-disable */
/**
 * This file was automatically generated.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema in the source OAS file,
 * and use `yarn brij dto` to regenerate this file.
 */

import { JSONSchema } from '@kong/brij'

export interface Category {
  id?: number
  name?: string
  [k: string]: unknown
}


class CategorySchema extends JSONSchema<Category> {
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

export const Category = new CategorySchema()
