/* eslint-disable */
/**
 * This file was automatically generated.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema in the source OAS file,
 * and use `yarn brij dto` to regenerate this file.
 */

import { JSONSchema } from '@kong/brij'

export interface Order {
  id?: number
  petId?: number
  quantity?: number
  shipDate?: string
  /**
   * Order Status
   */
  status?: 'placed' | 'approved' | 'delivered'
  complete?: boolean
  [k: string]: unknown
}


class OrderSchema extends JSONSchema<Order> {
  constructor() {
    super({
      "type": "object",
      "properties": {
        "id": {
          "type": "integer"
        },
        "petId": {
          "type": "integer"
        },
        "quantity": {
          "type": "integer"
        },
        "shipDate": {
          "type": "string"
        },
        "status": {
          "type": "string",
          "description": "Order Status",
          "enum": [
            "placed",
            "approved",
            "delivered"
          ]
        },
        "complete": {
          "type": "boolean"
        }
      }
    })
  }
}

export const Order = new OrderSchema()
