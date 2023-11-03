/* eslint-disable */
/**
 * This file was automatically generated.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema in the source OAS file,
 * and use `yarn brij dto` to regenerate this file.
 */

import { JSONSchema } from '@kong/brij'

export interface ApiResponse {
  code?: number
  type?: string
  message?: string
  [k: string]: unknown
}


class ApiResponseSchema extends JSONSchema<ApiResponse> {
  constructor() {
    super({
      "type": "object",
      "properties": {
        "code": {
          "type": "integer"
        },
        "type": {
          "type": "string"
        },
        "message": {
          "type": "string"
        }
      }
    })
  }
}

export const ApiResponse = new ApiResponseSchema()
