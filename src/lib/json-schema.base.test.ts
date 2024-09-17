import { randomUUID } from "crypto"
import { RemoveAdditionalPropsError } from "./errors"
import { defaultAjvOptions, JSONSchema } from "./json-schema.base"
import { JSONSchema7 } from 'json-schema';

describe('JSONSchema', () => {
  beforeEach(() => {
    JSONSchema.setAjvOptions(defaultAjvOptions)
    JSONSchema.setOptions({})
  })
  describe('schema', () => {
    it('returns the schema passed in the constructor', () => {
      const s: JSONSchema7 = {
        type: 'object',
        properties: {
          the: { type: 'number' },
          schema: { type: 'number' },
          that: { type: 'boolean' },
          was: { type: 'object' },
          passed: { type: 'number' },
          in: { type: 'number' },
        }
      }

      const jsonSchema = new JSONSchema(s)

      expect(jsonSchema.schema).toEqual(s)

    })

    it('is not allowed to be set', () => {
      const s: JSONSchema7 = {
        type: 'object',
        properties: {
          the: { type: 'number' },
          schema: { type: 'number' },
          that: { type: 'boolean' },
          was: { type: 'object' },
          passed: { type: 'number' },
          in: { type: 'number' },
        }
      }

      const jsonSchema = new JSONSchema(s)

      expect(() => (jsonSchema as any).schema = 7).toThrow('Cannot set property schema')
    })
  })

  describe('validate', () => {
    it('validates anything with empty schema object', () => {
      const jsonSchema = new JSONSchema({})

      expect(jsonSchema.validate(null).valid).toBe(true)
      expect(jsonSchema.validate(undefined).valid).toBe(true)
      expect(jsonSchema.validate({}).valid).toBe(true)
      expect(jsonSchema.validate({ a: 1 }).valid).toBe(true)
      expect(jsonSchema.validate([]).valid).toBe(true)
      expect(jsonSchema.validate('hi').valid).toBe(true)
      expect(jsonSchema.validate(true).valid).toBe(true)
      expect(jsonSchema.validate(false).valid).toBe(true)
      expect(jsonSchema.validate(7).valid).toBe(true)
      expect(jsonSchema.validate(new Error()).valid).toBe(true)
    })

    it('validates correctly with an object schema', () => {
      const jsonSchema = new JSONSchema({ type: 'object' })

      expect(jsonSchema.validate(null).valid).toBe(false)
      expect(jsonSchema.validate(undefined).valid).toBe(false)
      expect(jsonSchema.validate({}).valid).toBe(true)
      expect(jsonSchema.validate({ a: 1 }).valid).toBe(true)
      expect(jsonSchema.validate([]).valid).toBe(false)
      expect(jsonSchema.validate('hi').valid).toBe(false)
      expect(jsonSchema.validate(true).valid).toBe(false)
      expect(jsonSchema.validate(false).valid).toBe(false)
      expect(jsonSchema.validate(7).valid).toBe(false)
      expect(jsonSchema.validate(new Error()).valid).toBe(true)
    })

    it('validates correctly with an array schema', () => {
      const jsonSchema = new JSONSchema({ type: 'array' })

      expect(jsonSchema.validate(null).valid).toBe(false)
      expect(jsonSchema.validate(undefined).valid).toBe(false)
      expect(jsonSchema.validate({}).valid).toBe(false)
      expect(jsonSchema.validate({ a: 1 }).valid).toBe(false)
      expect(jsonSchema.validate([]).valid).toBe(true)
      expect(jsonSchema.validate([0]).valid).toBe(true)
      expect(jsonSchema.validate('hi').valid).toBe(false)
      expect(jsonSchema.validate(true).valid).toBe(false)
      expect(jsonSchema.validate(false).valid).toBe(false)
      expect(jsonSchema.validate(7).valid).toBe(false)
      expect(jsonSchema.validate(new Error()).valid).toBe(false)
    })

    it('validates a basic object ', () => {
      const jsonSchema = new JSONSchema({
        type: 'object',
        additionalProperties: false,
        required: ['a', 'b'],
        properties: {
          a: { type: 'number' },
          b: { type: 'number' },
          c: { type: 'number' },
        }
      })

      expect(jsonSchema.validate({}).valid).toBe(false)
      expect(jsonSchema.validate({ a: 1 }).valid).toBe(false)
      expect(jsonSchema.validate({ a: 1, b: '2' }).valid).toBe(false)
      expect(jsonSchema.validate({ a: 1, b: '2', c: 3 }).valid).toBe(false)
      expect(jsonSchema.validate({ a: 1, b: 2 }).valid).toBe(true)
      expect(jsonSchema.validate({ a: 1, b: 2, c: 3 }).valid).toBe(true)
      expect(jsonSchema.validate({ a: 1, b: 2, c: '3' }).valid).toBe(false)
      expect(jsonSchema.validate({ a: 1, b: 2, c: 3, d: 4 }).valid).toBe(false)
    })

    it('validates a basic array', () => {
      const jsonSchema = new JSONSchema({
        type: 'array',
        additionalItems: false,
        minItems: 1,
        maxItems: 2,
        items: {
          type: 'object',
          required: [ 'id' ],
          properties: {
            id: { type: 'string', format: 'uuid' }
          }
        }
      })

      expect(jsonSchema.validate([]).valid).toBe(false)
      expect(jsonSchema.validate([{id: 'a'}]).valid).toBe(false)
      expect(jsonSchema.validate([{id: randomUUID() }]).valid).toBe(true)
      expect(jsonSchema.validate([{id: randomUUID() }, { id: randomUUID() }]).valid).toBe(true)
      expect(jsonSchema.validate([{id: randomUUID(), info: 'first' }, { id: randomUUID(), info: 'second' }]).valid).toBe(true)
      expect(jsonSchema.validate([{id: randomUUID() }, { id: randomUUID() }, { id: randomUUID() }]).valid).toBe(false)
    })

    it('validates uuid formats', () => {
      const jsonSchema = new JSONSchema({
        type: 'object',
        required: [ 'id' ],
        properties: {
          id: { type: 'string', format: 'uuid' },
        }
      })

      expect(jsonSchema.validate({ id: 'abc' }).valid).toBe(false)
      expect(jsonSchema.validate({ id: 7 }).valid).toBe(false)
      expect(jsonSchema.validate({}).valid).toBe(false)
      expect(jsonSchema.validate({ id: randomUUID() }).valid).toBe(true)
    })

    it('validates date-time formats', () => {
      const jsonSchema = new JSONSchema({
        type: 'object',
        required: [ 'created_at' ],
        properties: {
          created_at: { type: 'string', format: 'date-time' },
        }
      })

      expect(jsonSchema.validate({ created_at: 'tuesday' }).valid).toBe(false)
      expect(jsonSchema.validate({ created_at: new Date().getTime() }).valid).toBe(false)
      expect(jsonSchema.validate({ created_at: new Date().toISOString() }).valid).toBe(true)
    })

    it('validates oneOf with discriminator', () => {
      const jsonSchema = new JSONSchema({
        type: 'object',
        discriminator: {
          propertyName: 'foo',
        },
        required: ['foo'],
        oneOf: [
          {
            type: 'object',
            additionalProperties: false,
            properties: {
              foo: {
                enum: ['x']
              }
            },
          },
          {
            properties: {
              foo: {enum: ['y', 'z']},
              a: {type: 'string'},
            },
            required: ['a'],
          },
        ],
      })

      expect(jsonSchema.validate({ foo: 'x' }).valid).toBe(true)
      expect(jsonSchema.validate({ foo: 'x', a: 'no' }).errors).toEqual([{
        "instancePath": "",
        "keyword": "additionalProperties",
        "message": "must NOT have additional properties",
        "params": {
          "additionalProperty": "a",
        },
        "schemaPath": "#/oneOf/0/additionalProperties",
      }])
      expect(jsonSchema.validate({ foo: 'y', a: 'ok' }).valid).toBe(true)
      expect(jsonSchema.validate({ foo: 'y', b: 'no' }).errors).toEqual([{
        "instancePath": "",
        "keyword": "required",
        "message": "must have required property 'a'",
        "params": {
          "missingProperty": "a",
        },
        "schemaPath": "#/oneOf/1/required",
      }])
    })

    it('validates nullable oneOf with discriminator (from using nullable with 3.0)', () => {
      const jsonSchema = new JSONSchema({
      "oneOf": [
        {
          "type": "null"
        },
        {
          "type": "object",
          "oneOf": [
            {
              "type": "object",
              "required": [
                "name",
                "type",
              ],
              "properties": {
                "name": {
                  "type": "string",
                  "example": "name",
                  "default": "name"
                },
                "type": {
                  "type": "string",
                  "enum": [
                    "x"
                  ]
                },
              }
            },
            {
              "type": "object",
              "required": [
                "type",
                "display_name"
              ],
              "properties": {
                "display_name": {
                  "type": "string",
                  "default": "name"
                },
                "type": {
                  "type": "string",
                  "enum": [
                    "y"
                  ]
                },
              }
            }
          ],
          "discriminator": {
            "propertyName": "type"
          }
        }
      ]
      })

      expect(jsonSchema.validate(null).valid).toBe(true)
      expect(jsonSchema.validate({ type: 'x', name: 'a' }).valid).toBe(true)
      expect(jsonSchema.validate({ type: 'y', display_name: 'a' }).valid).toBe(true)
      expect(jsonSchema.validate({ type: 'z', display_name: 'a' }).valid).toBe(false)
      expect(jsonSchema.validate({ type: 'x' }).valid).toBe(false)
      expect(jsonSchema.validate({ type: 'x' }).errors).toEqual([
        {
            "instancePath": "",
            "keyword": "type",
            "message": "must be null",
            "params": {
              "type": "null",
            },
            "schemaPath": "#/oneOf/0/type",
          },
          {
            "instancePath": "",
            "keyword": "required",
            "message": "must have required property 'name'",
            "params": {
              "missingProperty": "name",
            },
            "schemaPath": "#/oneOf/1/oneOf/0/required",
          },
          {
            "instancePath": "",
            "keyword": "oneOf",
            "message": "must match exactly one schema in oneOf",
            "params": {
              "passingSchemas": null,
            },
            "schemaPath": "#/oneOf",
          },
      ])
    })
    
    it('rejects invalid string not part of a discriminator\'s enum', () => {
      const jsonSchema = new JSONSchema({
        type: 'object',
        
        allOf: [
        {
          type: 'object',
          properties: {
            foo: {
              type: 'string'
            }
          },
          required: ['foo']
        },
        {
          discriminator: {
            propertyName: 'foo',
          },
          oneOf: [
            {
              type: 'object',
              required: ['foo'],
              properties: {
                foo: {
                  enum: ['x']
                }
              },
            },
            {
              properties: {
                foo: {
                  enum: ['y']
                },
              },
              required: ['foo'],
            },
          ]
        }
        ]
      })

      expect(jsonSchema.validate({ foo: 'x' }).valid).toBe(true)
      expect(jsonSchema.validate({ foo: 'z' }).valid).toBe(false)
      expect(jsonSchema.validate({ foo: 'z' }).errors).toEqual([{
        "instancePath": "",
        "keyword": "discriminator",
        "message": "value of tag \"foo\" must be in oneOf",
        "params": {
          "error": "mapping",
          "tag": "foo",
          "tagValue": "z"
        },
        "schemaPath": "#/allOf/1/discriminator",
      }])
    })

    it('validates data uri formats', () => {
      const jsonSchema = new JSONSchema({
        type: 'object',
        required: [ 'data' ],
        properties: {
          data: { type: 'string', format: 'uri' },
        }
      })

      expect(jsonSchema.validate({ data: 'hello' }).valid).toBe(false)
      expect(jsonSchema.validate({ data: 'data:hello' }).valid).toBe(true)
      expect(jsonSchema.validate({ data: 'data:image/png,hello' }).valid).toBe(true)
      expect(jsonSchema.validate({ data: 'data:image/png;base64,hello' }).valid).toBe(true)
    })

    it('accepts x-validation-message property', () => {
      const jsonSchema = new JSONSchema({
        type: 'string',
        'x-validation-message': 'This is the error message that can be accessed when failing validation'
      })

      const { valid, customMessage } = jsonSchema.validate(false)
      expect(valid).toBe(false)
      expect(customMessage).toBe('This is the error message that can be accessed when failing validation')
    })

    it('includes error information in the output object', () => {
      const jsonSchema = new JSONSchema({
        type: 'object',
        required: [ 'created_at' ],
        properties: {
          created_at: { type: 'string', format: 'date-time' },
        }
      })

      expect(jsonSchema.validate({ created_at: 'tuesday' }).errors).toEqual([{
        instancePath: '/created_at',
        keyword: 'format',
        message: 'must match format "date-time"',
        params: { format: 'date-time' },
        schemaPath: '#/properties/created_at/format',
      }])

      expect(jsonSchema.validate({ created_at: new Date().getTime() }).errors).toEqual([{
        instancePath: '/created_at',
        keyword: 'type',
        message: 'must be string',
        params: { type: 'string' },
        schemaPath: '#/properties/created_at/type',
      }])
    })

    it('reports multiple errors', () => {
      const jsonSchema = new JSONSchema({
        type: 'object',
        required: [ 'a', 'b' ],
        properties: {
          a: { type: 'string' },
          b: { type: 'string' },
          c: { type: 'string' },
        }
      })

      expect(jsonSchema.validate({ c: true }).errors).toEqual([
        {
          instancePath: '',
          keyword: 'required',
          message: 'must have required property \'a\'',
          params: {
            missingProperty: 'a',
          },
          schemaPath: '#/required',
        },
        {
          instancePath: '',
          keyword: 'required',
          message: 'must have required property \'b\'',
          params: {
            missingProperty: 'b',
          },
          schemaPath: '#/required',
        },
        {
          instancePath: '/c',
          keyword: 'type',
          message: 'must be string',
          params: {
            type: 'string',
          },
          schemaPath: '#/properties/c/type',
        },
      ])
    })
  })

  describe('removeAdditional', () => {
    it('doesn\'t throw when input is invalid', () => {
      const jsonSchema = new JSONSchema({
        type: 'object',
        additionalProperties: false,
        required: ['a'],
        properties: {
          a: { type: 'number' },
        }
      })

      // invalid
      expect(jsonSchema.removeAdditional({})).toEqual({})
      expect(jsonSchema.removeAdditional({ yo: 'there', a: 'n', b: 7, c: 'nope' })).toEqual({ a: 'n' })
      expect(jsonSchema.removeAdditional({ a: 'n' })).toEqual({ a: 'n' })

      // valid
      expect(jsonSchema.removeAdditional({ a: 7 })).toEqual({ a: 7 })
    })

    it('throws when input is invalid and "strict" option is used', () => {
      const jsonSchema = new JSONSchema({
        type: 'object',
        additionalProperties: false,
        required: ['a'],
        properties: {
          a: { type: 'number' },
        }
      })

      // invalid
      expect(() => jsonSchema.removeAdditional({}, { strict: true })).toThrow(RemoveAdditionalPropsError)
      expect(() => jsonSchema.removeAdditional({ b: 7 }, { strict: true })).toThrow(RemoveAdditionalPropsError)
      expect(() => jsonSchema.removeAdditional({ a: 'n' }, { strict: true })).toThrow(RemoveAdditionalPropsError)

      // valid
      expect(() => jsonSchema.removeAdditional({ a: 7 })).not.toThrow(RemoveAdditionalPropsError)
    })

    it('removes disallowed properties when additionalProperties is false', () => {
      const jsonSchema = new JSONSchema({
        type: 'object',
        additionalProperties: false,
        properties: {
          a: { type: 'number' },
        }
      })

      expect(jsonSchema.removeAdditional({})).toEqual({})
      expect(jsonSchema.removeAdditional({ a: 1, b: 7, c: 4 })).toEqual({ a: 1 })
      expect(jsonSchema.removeAdditional({ b: 7 })).toEqual({})
      expect(jsonSchema.removeAdditional({ a: 7 })).toEqual({ a: 7 })
    })

    it('removes disallowed properties when additionalProperties is false and object is otherwise invalid', () => {
      const jsonSchema = new JSONSchema({
        type: 'object',
        additionalProperties: false,
        required: ['a'],
        properties: {
          a: { type: 'number' },
        }
      })

      // missing required prop a
      expect(jsonSchema.removeAdditional({})).toEqual({})

      // prop a is wrong type, still removes unallowed props b & c
      expect(jsonSchema.removeAdditional({ a: 'not_a_number', b: 7, c: 4 })).toEqual({ a: 'not_a_number' })

      // missing required prop a, still removes unallowed prop b
      expect(jsonSchema.removeAdditional({ b: 7 })).toEqual({})
    })

    it('retains additional properties when additionalProperties is not explicitly true', () => {
      const jsonSchema = new JSONSchema({
        type: 'object',
        properties: {
          a: { type: 'number' }
        }
      })

      expect(jsonSchema.removeAdditional({})).toEqual({})
      expect(jsonSchema.removeAdditional({ b: 7 })).toEqual({ b: 7 })
      expect(jsonSchema.removeAdditional({ a: 7, b: 4, c: 3 })).toEqual({ a: 7, b: 4, c: 3 })
      expect(jsonSchema.removeAdditional({ a: 7 })).toEqual({ a: 7 })
    })

    it('calls the errorLogger when input is invalid', () => {
      const jsonSchema = new JSONSchema({
        type: 'object',
        required: ['a'],
        additionalProperties: false,
        properties: {
          a: { type: 'number' },
          z: { type: 'string' }
        }
      })

      const errorLogger = jest.fn((_message: string) => {})

      // object is invalid because it prop a is the wrong type
      expect(jsonSchema.removeAdditional({ a: 'n' }, { errorLogger })).toEqual({ a: 'n' })

      expect(errorLogger).toHaveBeenCalledWith('Invalid object found when using removeAdditional(): ["#/properties/a/type: must be number"]')
      errorLogger.mockClear()

      // object is invalid because it doesn't have required prop a
      expect(jsonSchema.removeAdditional({}, { errorLogger })).toEqual({})

      expect(errorLogger).toHaveBeenCalledWith('Invalid object found when using removeAdditional(): ["#/required: must have required property \'a\'"]')
      errorLogger.mockClear()

      // object is invalid because it doesn't have required prop a and has wrong type for prop z
      expect(jsonSchema.removeAdditional({ z: 8 }, { errorLogger })).toEqual({ z: 8 })

      expect(errorLogger).toHaveBeenCalledWith('Invalid object found when using removeAdditional(): ["#/required: must have required property \'a\'","#/properties/z/type: must be string"]')
      errorLogger.mockClear()

      // object is invalid because it doesn't have required prop a
      expect(jsonSchema.removeAdditional({ b: 7 }, { errorLogger })).toEqual({})

      expect(errorLogger).toHaveBeenCalledWith('Invalid object found when using removeAdditional(): ["#/required: must have required property \'a\'"]')
      errorLogger.mockClear()

      // object is valid since additional props will be removed making it valid
      expect(jsonSchema.removeAdditional({ a: 7, b: 4, c: 3 }, { errorLogger })).toEqual({ a: 7 })

      expect(errorLogger).not.toHaveBeenCalledWith()
      errorLogger.mockClear()

      // object is valid
      expect(jsonSchema.removeAdditional({ a: 7 }, { errorLogger })).toEqual({ a: 7 })

      expect(errorLogger).not.toHaveBeenCalled()
      errorLogger.mockClear()
    })

    it('calls logger.error when input is invalid', () => {
      const jsonSchema = new JSONSchema({
        type: 'object',
        required: ['a'],
        additionalProperties: false,
        properties: {
          a: { type: 'number' },
          z: { type: 'string' }
        }
      })

      const mockFn = jest.fn()

      class Logger {
        error(s: string) { mockFn(s) }
      }

      const logger = new Logger()

      // object is invalid because it prop a is the wrong type
      expect(jsonSchema.removeAdditional({ a: 'n' }, { logger })).toEqual({ a: 'n' })

      expect(mockFn).toHaveBeenCalledWith('Invalid object found when using removeAdditional(): ["#/properties/a/type: must be number"]')
      mockFn.mockClear()

      // object is invalid because it doesn't have required prop a
      expect(jsonSchema.removeAdditional({}, { logger })).toEqual({})

      expect(mockFn).toHaveBeenCalledWith('Invalid object found when using removeAdditional(): ["#/required: must have required property \'a\'"]')
      mockFn.mockClear()

      // object is invalid because it doesn't have required prop a and has wrong type for prop z
      expect(jsonSchema.removeAdditional({ z: 8 }, { logger })).toEqual({ z: 8 })

      expect(mockFn).toHaveBeenCalledWith('Invalid object found when using removeAdditional(): ["#/required: must have required property \'a\'","#/properties/z/type: must be string"]')
      mockFn.mockClear()

      // object is invalid because it doesn't have required prop a
      expect(jsonSchema.removeAdditional({ b: 7 }, { logger })).toEqual({})

      expect(mockFn).toHaveBeenCalledWith('Invalid object found when using removeAdditional(): ["#/required: must have required property \'a\'"]')
      mockFn.mockClear()

      // object is valid since additional props will be removed making it valid
      expect(jsonSchema.removeAdditional({ a: 7, b: 4, c: 3 }, { logger })).toEqual({ a: 7 })

      expect(mockFn).not.toHaveBeenCalledWith()
      mockFn.mockClear()

      // object is valid
      expect(jsonSchema.removeAdditional({ a: 7 }, { logger })).toEqual({ a: 7 })

      expect(mockFn).not.toHaveBeenCalled()
      mockFn.mockClear()
    })

    it('correctly calls the errorLogger when it is an instance method', () => {
      const jsonSchema = new JSONSchema({
        type: 'object',
        required: ['a'],
        additionalProperties: false,
        properties: {
          a: { type: 'number' },
          z: { type: 'string' }
        }
      })

      const mockFn = jest.fn()

      class Logger {
        error(s: string) {
          mockFn()
        }
      }

      const errorLogger = new Logger()

      // object is invalid because it prop a is the wrong type
      expect(jsonSchema.removeAdditional({ a: 'n' }, { errorLogger: errorLogger.error })).toEqual({ a: 'n' })

      expect(mockFn).toBeCalled()
    })

    it('does not throw if errorLogger throws', () => {
      const jsonSchema = new JSONSchema({
        type: 'object',
        required: ['a'],
        additionalProperties: false,
        properties: {
          a: { type: 'number' },
          z: { type: 'string' }
        }
      })

      const mockFn = jest.fn()

      // object is invalid because it prop a is the wrong type
      expect(
        () => jsonSchema.removeAdditional({ a: 'n' }, {
          errorLogger: () => {
            mockFn()
            throw new Error()
          }
        })
      ).not.toThrow()

      expect(mockFn).toBeCalled()
    })

    it('does not throw if logger.error throws', () => {
      const jsonSchema = new JSONSchema({
        type: 'object',
        required: ['a'],
        additionalProperties: false,
        properties: {
          a: { type: 'number' },
          z: { type: 'string' }
        }
      })

      const mockFn = jest.fn()

      // object is invalid because it prop a is the wrong type
      expect(
        () => jsonSchema.removeAdditional({ a: 'n' }, {
          logger: {
            error: () => {
              mockFn()
              throw new Error()
            }
          }
        })
      ).not.toThrow()

      expect(mockFn).toBeCalled()
    })
  })

  describe('setAjvOptions', () => {
    it('sets the ajv options for each instance', () => {
      const schema1 = {
        type: 'string',
        minLength: 1,
        pattern: 'abc'
      }

      const schema2 = {
        type: 'object',
        additionalProperties: false,
        properties: {
          a: { type: 'number' }
        }
      }

      const jsonSchema1 = new JSONSchema(schema1)
      const jsonSchema2 = new JSONSchema(schema2)

      expect.assertions(8)

      expect(jsonSchema1.validate('').errors).toHaveLength(2)
      expect(jsonSchema2.validate({
        a: 'not a number',
        b: 'not allowed',
      }).errors).toHaveLength(2)
      try { jsonSchema1.removeAdditional('', { strict: true }) } catch (e: any) {
        expect(e.validationErrors).toHaveLength(2)
      }
      try { jsonSchema2.removeAdditional({ a: 'not a number', b: 'not allowed', }, { strict: true }) } catch (e: any) {
        expect(e.validationErrors).toHaveLength(1) // the b property is removed, so it doesn't count as an error
      }

      JSONSchema.setAjvOptions({ allErrors: false })

      const jsonSchema1Custom = new JSONSchema(schema1)
      const jsonSchema2Custom = new JSONSchema(schema2)

      expect(jsonSchema1Custom.validate('').errors).toHaveLength(1)
      expect(jsonSchema2Custom.validate({
        a: 'not a number',
        b: 'not allowed',
      }).errors).toHaveLength(1)

      try { jsonSchema1Custom.removeAdditional('', { strict: true }) } catch (e: any) {
        expect(e.validationErrors).toHaveLength(1)
      }
      try { jsonSchema2Custom.removeAdditional({ a: 'not a number', b: 'not allowed', }, { strict: true }) } catch (e: any) {
        expect(e.validationErrors).toHaveLength(1)
      }
    })
  })

  describe('oneOf/anyOf error handling', () => {
    it('reports errors for oneOf', () => {
      const jsonSchema = new JSONSchema({
        type: 'object',
        oneOf: [
          {
            required: ['a'],
            properties: {
              a: { type: 'number' }
            }
          },
          {
            required: ['b'],
            properties: {
              b: { type: 'string' }
            }
          }
        ]
      })

      expect(jsonSchema.validate({ a: 'not a number', b: 1 }).errors).toEqual([
        {
          instancePath: '/a',
          keyword: 'type',
          message: 'must be number',
          params: {
            type: 'number',
          },
          schemaPath: '#/oneOf/0/properties/a/type',
        },
        {
          instancePath: '/b',
          keyword: 'type',
          message: 'must be string',
          params: {
            type: 'string',
          },
          schemaPath: '#/oneOf/1/properties/b/type',
        },
        {
          instancePath: '',
          keyword: 'oneOf',
          message: 'must match exactly one schema in oneOf',
          params: {
            passingSchemas: null,
          },
          schemaPath: '#/oneOf',
        },
      ])
    })
    it('reports errors for oneOf with null', () => {
      const jsonSchema = new JSONSchema({
        type: 'object',
        oneOf: [
          {
            type: 'null',
          },
          {
            required: ['a'],
            properties: {
              a: { type: 'string' }
            }
          }
        ]
      })

      expect(jsonSchema.validate({ a: 1 }).errors).toEqual([
        {
          instancePath: '',
          keyword: 'type',
          message: 'must be null',
          params: {
            type: 'null',
          },
          schemaPath: '#/oneOf/0/type',
        },
        {
          instancePath: '/a',
          keyword: 'type',
          message: 'must be string',
          params: {
            type: 'string',
          },
          schemaPath: '#/oneOf/1/properties/a/type',
        },
        {
          instancePath: '',
          keyword: 'oneOf',
          message: 'must match exactly one schema in oneOf',
          params: {
            passingSchemas: null,
          },
          schemaPath: '#/oneOf',
        },
      ])
    })
    it('reports errors for anyOf with null', () => {
      const jsonSchema = new JSONSchema({
        type: 'object',
        anyOf: [
          {
            type: 'null',
          },
          {
            required: ['a'],
            properties: {
              a: { type: 'string' }
            }
          }
        ]
      })

      expect(jsonSchema.validate({ a: 1 }).errors).toEqual([
        {
          instancePath: '',
          keyword: 'type',
          message: 'must be null',
          params: {
            type: 'null',
          },
          schemaPath: '#/anyOf/0/type',
        },
        {
          instancePath: '/a',
          keyword: 'type',
          message: 'must be string',
          params: {
            type: 'string',
          },
          schemaPath: '#/anyOf/1/properties/a/type',
        },
        {
          instancePath: '',
          keyword: 'anyOf',
          message: 'must match a schema in anyOf',
          params: {},
          schemaPath: '#/anyOf',
        },
      ])
    })
    describe('option to omit null sibling errors', () => {
      it('omits null sibling errors for oneOf/anyOf', () => {
        const jsonSchemaOneOf = new JSONSchema({
          type: 'object',
          oneOf: [
            { type: 'null' },
            {
              required: ['a'],
              properties: {
                a: { type: 'string' },
              }
            }
          ]
        })

        const jsonSchemaAnyOf = new JSONSchema({
          type: 'object',
          anyOf: [
            { type: 'null' },
            {
              required: ['a'],
              properties: {
                a: { type: 'string' },
              }
            }
          ]
        })


        expect(jsonSchemaOneOf.validate({ a: 1 }).errors).toEqual([
          {"instancePath": "", "keyword": "type", "message": "must be null", "params": {"type": "null"}, "schemaPath": "#/oneOf/0/type"},
          {"instancePath": "/a", "keyword": "type", "message": "must be string", "params": {"type": "string"}, "schemaPath": "#/oneOf/1/properties/a/type"},
          {"instancePath": "", "keyword": "oneOf", "message": "must match exactly one schema in oneOf", "params": { "passingSchemas": null }, "schemaPath": "#/oneOf"}
        ])

        expect(jsonSchemaAnyOf.validate({ a: 1 }).errors).toEqual([
          {"instancePath": "", "keyword": "type", "message": "must be null", "params": {"type": "null"}, "schemaPath": "#/anyOf/0/type"},
          {"instancePath": "/a", "keyword": "type", "message": "must be string", "params": {"type": "string"}, "schemaPath": "#/anyOf/1/properties/a/type"},
          {"instancePath": "", "keyword": "anyOf", "message": "must match a schema in anyOf", "params": {}, "schemaPath": "#/anyOf"}
        ])

        JSONSchema.setOptions({ omitNullSiblingErrors: true })

        expect(jsonSchemaOneOf.validate({ a: 1 }).errors).toEqual([
          {"instancePath": "/a", "keyword": "type", "message": "must be string", "params": {"type": "string"}, "schemaPath": "#/oneOf/1/properties/a/type"},
        ])

        expect(jsonSchemaAnyOf.validate({ a: 1 }).errors).toEqual([
          {"instancePath": "/a", "keyword": "type", "message": "must be string", "params": {"type": "string"}, "schemaPath": "#/anyOf/1/properties/a/type"},
        ])
      })
      it('omits null sibling errors for oneOf/anyOf', () => {
        const jsonSchemaOneOf = new JSONSchema({
          type: 'object',
          oneOf: [
            { type: 'null' },
            {
              required: ['a'],
              properties: {
                a: {
                  oneOf: [
                    {
                      type: 'null' },
                    { type: 'string' },
                  ]
                }
              }
            }
          ]
        })

        const jsonSchemaAnyOf = new JSONSchema({
          type: 'object',
          anyOf: [
            { type: 'null' },
            {
              required: ['a'],
              properties: {
                a: { 
                  anyOf: [
                    { type: 'null' },
                    { type: 'string' },
                  ]
                }
              }
            }
          ]
        })


        expect(jsonSchemaOneOf.validate({ a: 1 }).errors).toEqual([
          {"instancePath": "", "keyword": "type", "message": "must be null", "params": {"type": "null"}, "schemaPath": "#/oneOf/0/type"},
          {"instancePath": "/a", "keyword": "type", "message": "must be null", "params": {"type": "null"}, "schemaPath": "#/oneOf/1/properties/a/oneOf/0/type"},
          {"instancePath": "/a", "keyword": "type", "message": "must be string", "params": {"type": "string"}, "schemaPath": "#/oneOf/1/properties/a/oneOf/1/type"},
          {"instancePath": "/a", "keyword": "oneOf", "message": "must match exactly one schema in oneOf", "params": { "passingSchemas": null }, "schemaPath": "#/oneOf/1/properties/a/oneOf"},
          {"instancePath": "", "keyword": "oneOf", "message": "must match exactly one schema in oneOf", "params": { "passingSchemas": null }, "schemaPath": "#/oneOf"}
        ])

        expect(jsonSchemaAnyOf.validate({ a: 1 }).errors).toEqual([
          {"instancePath": "", "keyword": "type", "message": "must be null", "params": {"type": "null"}, "schemaPath": "#/anyOf/0/type"},
          {"instancePath": "/a", "keyword": "type", "message": "must be null", "params": {"type": "null"}, "schemaPath": "#/anyOf/1/properties/a/anyOf/0/type"},
          {"instancePath": "/a", "keyword": "type", "message": "must be string", "params": {"type": "string"}, "schemaPath": "#/anyOf/1/properties/a/anyOf/1/type"},
          {"instancePath": "/a", "keyword": "anyOf", "message": "must match a schema in anyOf", "params": {}, "schemaPath": "#/anyOf/1/properties/a/anyOf"},
          {"instancePath": "", "keyword": "anyOf", "message": "must match a schema in anyOf", "params": {}, "schemaPath": "#/anyOf"}
        ])

        JSONSchema.setOptions({ omitNullSiblingErrors: true })

        expect(jsonSchemaOneOf.validate({ a: 1 }).errors).toEqual([
          {"instancePath": "/a", "keyword": "type", "message": "must be string", "params": {"type": "string"}, "schemaPath": "#/oneOf/1/properties/a/oneOf/1/type"},
        ])

        expect(jsonSchemaAnyOf.validate({ a: 1 }).errors).toEqual([
          {"instancePath": "/a", "keyword": "type", "message": "must be string", "params": {"type": "string"}, "schemaPath": "#/anyOf/1/properties/a/anyOf/1/type"},
        ])
      })
    })
  })
})