/* eslint-disable */
/**
 * This file was automatically generated.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema in the source OAS file,
 * and use `yarn brij dto` to regenerate this file.
 */

import { JSONSchema } from '@kong/brij'

export interface Pet {
  id?: number
  category?: {
    id?: number
    name?: string
    [k: string]: unknown
  }
  name: string
  photoUrls: string[]
  tags?: {
    id?: number
    name?: string
    [k: string]: unknown
  }[]
  /**
   * pet status in the store
   */
  status?: 'available' | 'pending' | 'sold'
  [k: string]: unknown
}


class PetSchema extends JSONSchema<Pet> {
  constructor() {
    super({
      "type": "object",
      "required": [
        "name",
        "photoUrls"
      ],
      "properties": {
        "id": {
          "type": "integer"
        },
        "category": {
          "type": "object",
          "properties": {
            "id": {
              "type": "integer"
            },
            "name": {
              "type": "string"
            }
          }
        },
        "name": {
          "type": "string"
        },
        "photoUrls": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "tags": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "integer"
              },
              "name": {
                "type": "string"
              }
            }
          }
        },
        "status": {
          "type": "string",
          "description": "pet status in the store",
          "enum": [
            "available",
            "pending",
            "sold"
          ]
        }
      }
    })
  }
}

export const Pet = new PetSchema()
