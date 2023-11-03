import { randomUUID } from "crypto"
import { RemoveAdditionalPropsError } from "./errors"
import { JSONSchema } from "./json-schema.base"
import { JSONSchema7 } from 'json-schema';

describe('JSONSchema', () => {
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

    it('includes a typed reference to the input in the output', () => {
      type MySpecialType = { in: 'out' }

      const jsonSchema = new JSONSchema<MySpecialType>({
        type: 'object',
        required: ['in'],
        properties: {
          in: {
            type: 'string',
            enum: [ 'out' ]
          }
        }
      })

      const input = { in: 'out' }

      const result = jsonSchema.validate(input)

      expect(result.valid).toEqual(true)

      // Use a conditional on valid to narrow the result type down for the TS compiler.
      // The conditional will always be true if the tests are passing.
      if (result.valid) {
        // This is a compile-time test to ensure that result.output is of type MySpecialType
        const typedOutput: MySpecialType = result.output

        expect(typedOutput).toBe(input)
      }
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
})