import { GenDTOs } from "./gen-dtos"

describe('GenDTOs', () => {
  describe('removeCircularReferences', () => {
    it('does nothing if there are no circular refs', () => {
      const input = { a: 1 }
      const info = GenDTOs.removeCircularReferences(input)

      expect(info.length).toBe(0)
      expect(input).toEqual(input)
    })

    it('replaces circular refs with generic object', () => {
      const input: any = {
        a: 1,
       }

       input.circ = input

      const info = GenDTOs.removeCircularReferences(input)

      expect(info.length).toBe(1)
      expect(info[0]).toEqual({
        original: '.',
        reference: './circ'
      })

      expect(input).toEqual({
        a: 1,
        circ: { type: 'object', _circularRef: '.' }
      })
    })

    it('finds and replaces multiple circular refs', () => {
      const ref1: any = {
        b: 2
      }

      const ref2: any = {
        c: 3
      }

      ref1.x = ref1
      ref2.x = ref2

      const input: any = {
        a: 1,
        ref1,
        ref2,
      }

      const info = GenDTOs.removeCircularReferences(input)

      expect(info.length).toBe(2)

      expect(info[0]).toEqual({
        original: './ref1',
        reference: './ref1/x'
      })

      expect(info[1]).toEqual({
        original: './ref2',
        reference: './ref2/x'
      })

      expect(input).toEqual({
        a: 1,
        ref1: {
          b: 2,
          x: { type: 'object', _circularRef: './ref1' },
        },
        ref2: {
          c: 3,
          x: { type: 'object', _circularRef: './ref2' },
        },
      })
    })

    it('finds and replaces cross-circular refs', () => {
      const ref1: any = {
        b: 2
      }

      const ref2: any = {
        c: 3
      }

      ref1.x = ref2
      ref2.x = ref1

      const input: any = {
        a: 1,
        ref1,
        ref2,
        y: ref2,
      }

      const info = GenDTOs.removeCircularReferences(input)

      expect(info.length).toBe(1)

      expect(info[0]).toEqual({
        original: './ref1',
        reference: './ref1/x/x'
      })

      expect(input).toEqual({
        a: 1,
        ref1: {
          b: 2,
          x: {
            c: 3,
            x: { type: 'object', _circularRef: './ref1' },
          }
        },
        ref2: {
          c: 3,
          x: { type: 'object', _circularRef: './ref1' },
        },
        y: {
          c: 3,
          x: { type: 'object', _circularRef: './ref1' },
        }
      })
    })
  })

  describe('replaceNullables', () => {
    it('finds nullable objects in top-level and replaces with oneOf', () => {
      const input = {
        nullable: true,
        type: 'object',
        properties: {
          a: {
            type: 'string'
          }
        },
      }

      expect(GenDTOs.replaceNullables(input)).toEqual({
        oneOf: [
          { type: 'null' },
          {
            type: 'object',
            properties: {
              a: {
                type: 'string'
              }
            }
          }
        ]
      })
    })

    it('finds nullable objects in nested-levels and replaces with oneOf', () => {
      const input = {
        type: 'object',
        properties: {
          a: {
            type: 'string',
            nullable: true,
            format: 'date',
          },
          b: {
            type: 'object',
            nullable: true,
            properties: {
              x: {
                oneOf: [
                  {
                    nullable: true,
                    type: 'string',
                    maxLength: 4,
                  },
                  {
                    nullable: true,
                    type: 'number',
                    minimum: 100,
                  }
                ]
              }
            }
          }
        },
      }

      expect(GenDTOs.replaceNullables(input)).toEqual({
        type: 'object',
        properties: {
          a: {
            oneOf: [
              { type: 'null' },
              { type: 'string', format: 'date' }
            ]
          },
          b: {
            oneOf: [
              { type: 'null' },
              {
                type: 'object',
                properties: {
                  x: {
                    oneOf: [
                      {
                        oneOf: [
                          { type: 'null' },
                          { type: 'string', maxLength: 4 },
                        ],
                      },
                      {
                        oneOf: [
                          { type: 'null' },
                          { type: 'number', minimum: 100 },
                        ],
                      },
                    ]
                  }
                }
              }
            ]
          }
        }
      })
    })

    it('finds nullable objects in arrays and replaces with oneOf', () => {
      const input = {
        anyOf: [
          {
            nullable: true,
            type: 'object',
            properties: {
              a: {
                type: 'string'
              }
            },
          },
          {
            type: 'string'
          }
        ]
      }

      expect(GenDTOs.replaceNullables(input)).toEqual({
        anyOf: [
          {
            oneOf: [
              { type: 'null' },
              {
                type: 'object',
                properties: {
                  a: {
                    type: 'string'
                  }
                }
              }
            ]
          },
          {
            type: 'string'
          }
        ]
      })
    })

    it('only replaces when nullable property is true', () => {
      const input = {
        anyOf: [
          {
            nullable: true,
            type: 'string'
          },
          {
            nullable: false,
            type: 'string'
          },
          {
            nullable: 'eh',
            type: 'string'
          },
          {
            type: 'string'
          },
          {
            nullable: null,
            type: 'string'
          },
          {
            nullable: undefined,
            type: 'string'
          },
        ]
      }

      expect(GenDTOs.replaceNullables(input)).toEqual({
        anyOf: [
          {
            oneOf: [
              { type: 'null'},
              { type: 'string' },
            ]
          },
          {
            nullable: false,
            type: 'string'
          },
          {
            nullable: 'eh',
            type: 'string'
          },
          {
            type: 'string'
          },
          {
            nullable: null,
            type: 'string'
          },
          {
            nullable: undefined,
            type: 'string'
          },
        ]
      })
    })

    it('skips replacing property definitions with key name "nullable"', () => {
      const input = {
        type: 'object',
        properties: {
          nullable: {
            type: 'boolean',
            nullable: true,
          }
        }
      }

      expect(GenDTOs.replaceNullables(input)).toEqual({
        type: 'object',
        properties: {
          nullable: {
            oneOf: [
              { type: 'null' },
              { type: 'boolean' },
            ]
          }
        }
      })
    })
  })
})