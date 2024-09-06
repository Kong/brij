import { OpenAPI } from "openapi-types"
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
  describe('getRequestBodySchemas', () => {
    it('finds schemas in operation request body', async () => {
      const oas: OpenAPI.Document = {
        openapi: '3.0.0',
        info: {
          title: 'test',
          version: '1.0.0'
        },
        paths: {
          '/test': {
            put: {
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      title: 'TestOperationRequest1',
                      type: 'object',
                    }
                  }
                }
              },
              responses: {
                200: {
                  description: 'ok',
                  content: {
                    'application/json': {
                      schema: {
                        title: 'TestOperationResponse1',
                        type: 'object',
                      }
                    }
                  }
                }
              }
            }
          }
        },
      }

      expect(await GenDTOs.getRequestBodySchemas(oas)).toEqual({
        PutTestRequestBody: {
          title: 'TestOperationRequest1',
          type: 'object',
        }
      })
    })
    it('uses operationId for schema name when available', async () => {
      const oas: OpenAPI.Document = {
        openapi: '3.0.0',
        info: {
          title: 'test',
          version: '1.0.0'
        },
        paths: {
          '/test': {
            put: {
              operationId: 'my-test-operation',
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      title: 'TestOperationRequest1',
                      type: 'object',
                    }
                  }
                }
              },
              responses: {
                200: {
                  description: 'ok',
                  content: {
                    'application/json': {
                      schema: {
                        title: 'TestOperationResponse1',
                        type: 'object',
                      }
                    }
                  }
                }
              }
            }
          }
        },
      }

      expect(await GenDTOs.getRequestBodySchemas(oas)).toEqual({
        MyTestOperationRequestBody: {
          title: 'TestOperationRequest1',
          type: 'object',
        }
      })
    })
    it('keeps writeOnly properties and removes readOnly properties', async () => {
      const oas: OpenAPI.Document = {
        openapi: '3.0.0',
        info: {
          title: 'test',
          version: '1.0.0'
        },
        paths: {
          '/test': {
            put: {
              operationId: 'my-test-operation',
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      title: 'TestOperationRequest1',
                      type: 'object',
                      properties: {
                        a: {
                          type: 'string',
                          readOnly: true,
                        },
                        b: {
                          type: 'string',
                          writeOnly: true,
                        },
                        c: {
                          type: 'string',
                        },
                        nested: {
                          type: 'object',
                          properties: {
                            d: {
                              type: 'string',
                              readOnly: true,
                            },
                            e: {
                              type: 'string',
                              writeOnly: true,
                            },
                            f: {
                              type: 'string',
                            }
                          }
                        }
                      }
                    }
                  }
                }
              },
              responses: {
                200: {
                  description: 'ok',
                  content: {
                    'application/json': {
                      schema: {
                        title: 'TestOperationResponse1',
                        type: 'object',
                      }
                    }
                  }
                }
              }
            }
          }
        },
      }

      expect(await GenDTOs.getRequestBodySchemas(oas)).toEqual({
        MyTestOperationRequestBody: {
          title: 'TestOperationRequest1',
          type: 'object',
          properties: {
            b: {
              type: 'string',
              writeOnly: true,
            },
            c: {
              type: 'string',
            },
            nested: {
              properties: {
                e: {
                  type: 'string',
                  writeOnly: true,
                },
                f: {
                  type: 'string',
                },
              },
              type: 'object',
            }
          }
        }
      })
    })
  })
  describe('getResponseBodySchemas', () => {
    it('finds schemas in operation response body', async () => {
      const oas: OpenAPI.Document = {
        openapi: '3.0.0',
        info: {
          title: 'test',
          version: '1.0.0'
        },
        paths: {
          '/test': {
            put: {
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      title: 'TestOperationRequest1',
                      type: 'object',
                    }
                  }
                }
              },
              responses: {
                200: {
                  description: 'ok',
                  content: {
                    'application/json': {
                      schema: {
                        title: 'TestOperationResponse1',
                        type: 'object',
                      }
                    }
                  }
                }
              }
            }
          }
        },
      }

      expect(await GenDTOs.getResponseBodySchemas(oas)).toEqual({
        PutTestResponseBody: {
          title: 'TestOperationResponse1',
          type: 'object',
        }
      })
    })
    it('uses operationId for schema name when available', async () => {
      const oas: OpenAPI.Document = {
        openapi: '3.0.0',
        info: {
          title: 'test',
          version: '1.0.0'
        },
        paths: {
          '/test': {
            put: {
              operationId: 'my-test-operation',
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      title: 'TestOperationRequest1',
                      type: 'object',
                    }
                  }
                }
              },
              responses: {
                200: {
                  description: 'ok',
                  content: {
                    'application/json': {
                      schema: {
                        title: 'TestOperationResponse1',
                        type: 'object',
                      }
                    }
                  }
                }
              }
            }
          }
        },
      }

      expect(await GenDTOs.getResponseBodySchemas(oas)).toEqual({
        MyTestOperationResponseBody: {
          title: 'TestOperationResponse1',
          type: 'object',
        }
      })
    })
    it('keeps readOnly properties and removes writeOnly properties', async () => {
      const oas: OpenAPI.Document = {
        openapi: '3.0.0',
        info: {
          title: 'test',
          version: '1.0.0'
        },
        paths: {
          '/test': {
            put: {
              operationId: 'my-test-operation',
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      title: 'TestOperationRequest1',
                      type: 'object',
                    }
                  }
                }
              },
              responses: {
                200: {
                  description: 'ok',
                  content: {
                    'application/json': {
                      schema: {
                        title: 'TestOperationResponse1',
                        type: 'object',
                        properties: {
                          a: {
                            type: 'string',
                            readOnly: true,
                          },
                          b: {
                            type: 'string',
                            writeOnly: true,
                          },
                          c: {
                            type: 'string',
                          },
                          nested: {
                            type: 'object',
                            properties: {
                              d: {
                                type: 'string',
                                readOnly: true,
                              },
                              e: {
                                type: 'string',
                                writeOnly: true,
                              },
                              f: {
                                type: 'string',
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
      }

      expect(await GenDTOs.getResponseBodySchemas(oas)).toEqual({
        MyTestOperationResponseBody: {
          title: 'TestOperationResponse1',
          type: 'object',
          properties: {
            a: {
              type: 'string',
              readOnly: true,
            },
            c: {
              type: 'string',
            },
            nested: {
              properties: {
                d: {
                  type: 'string',
                  readOnly: true,
                },
                f: {
                  type: 'string',
                },
              },
              type: 'object',
            }
          }
        }
      })
    })
  })

})