import Ajv, { ErrorObject, Options, ValidateFunction } from 'ajv'
import addFormats from 'ajv-formats'
import { RemoveAdditionalPropsError } from './errors/remove-additional-props.error'

export type AjvOptions = Options

export interface JSONSchemaOptions {
  omitNullSiblingErrors?: boolean
}

export const defaultAjvOptions: AjvOptions = {
  discriminator: true,
  strictSchema: false,
  allErrors: true,
}

export const ajv = addFormats(new Ajv({ ...defaultAjvOptions }))

export const ajvRemoveAdditional = addFormats(new Ajv({
  ...defaultAjvOptions,
  removeAdditional: true, // for more info see https://ajv.js.org/guide/modifying-data.html
}))


export interface ValidationResult {
  valid: boolean
  errors: ErrorObject<string, Record<string, any>, unknown>[] | null | undefined
  customMessage: string
}

/*
 * Base JSON schema validator class

 * Uses ajv

 * Provides methods for validation and removal of extra properies not allowed in the schema
 */
export class JSONSchema {
  private static _ajv: Ajv | null = null

  private static _ajvRemoveAdditional: Ajv | null = null

  private static _options: JSONSchemaOptions = {}

  private _schema: any

  private _validateDefault: ValidateFunction

  private _validateCustom: ValidateFunction | null = null

  private _removeAdditionalDefault: ValidateFunction

  private _removeAdditionalCustom: ValidateFunction | null = null

  /**
   * Set the ajv options for all instances of JSONSchema, overriding the default options.
   * 
   * Note: this can only be called once to guarantee that all instances of JSONSchema use the same options.
   * @param options 
   */
  static setAjvOptions(options: AjvOptions) {
    JSONSchema._ajv = addFormats(new Ajv(options))
    JSONSchema._ajvRemoveAdditional = addFormats(new Ajv({
      ...options,
      removeAdditional: true
    }))
  }

  /**
   * Set JSONSchema options for all instances of JSONSchema.
   * 
   * @param options 
   */
  static setOptions(options: JSONSchemaOptions) {
    JSONSchema._options = options ?? {}
  }

  /**
   * Get the ajv instance used by the validate method
   */
  get ajv() {
    return JSONSchema._ajv ?? ajv
  }

  /**
   * Get the ajv instance used by the removeAdditional method
   */
  get ajvRemoveAdditional() {
    return JSONSchema._ajvRemoveAdditional ?? ajvRemoveAdditional
  }

  /**
   * Get the schema object
   */
  get schema(): any {
    return JSON.parse(JSON.stringify(this._schema))
  }

  /**
   * Get the JSONSchema options object
   */
  get options(): JSONSchemaOptions {
    return JSONSchema._options
  }

  constructor(schema: any) {
    this._schema = schema
    this._validateDefault = this.ajv.compile(schema)
    this._removeAdditionalDefault = this.ajvRemoveAdditional.compile(schema)
  }

  private get validateFunction() {
    if (JSONSchema._ajv && !this._validateCustom) {
      this._validateCustom = this.ajv.compile(this._schema)
    }

    return this._validateCustom ?? this._validateDefault
  }

  private get removeAdditionalFunction() {
    if (JSONSchema._ajvRemoveAdditional && !this._removeAdditionalCustom) {
      this._removeAdditionalCustom = this.ajvRemoveAdditional.compile(this._schema)
    }

    return this._removeAdditionalCustom ?? this._removeAdditionalDefault
  }

  private prepareErrors(errors: ErrorObject<string, Record<string, any>, unknown>[] | null | undefined) {
    if (!errors) {
      return errors
    }

    let preparedErrors = [...errors]

    if (this.options.omitNullSiblingErrors) {
      preparedErrors = this.removeNullSiblingErrors(preparedErrors)
    }

    return preparedErrors
  }

  private removeNullSiblingErrors(errors: ErrorObject<string, Record<string, any>, unknown>[]) {
    const schemaPathsPrefixesToCheck: [string, number][] = []
    const errorsToRemove: number[] = []

    errors.forEach((error, index) => {
      if (['anyOf', 'oneOf'].includes(error.keyword)) {
        schemaPathsPrefixesToCheck.push([error.schemaPath, index])
      }
    })

    if (schemaPathsPrefixesToCheck.length) {
      errors.forEach((error, index) => {
        for (const [prefix, parentIndex] of schemaPathsPrefixesToCheck) {
          if (error.schemaPath.startsWith(prefix)) {
            const remainder = error.schemaPath.replace(prefix, '')
            if (remainder.match(/^\/[0-9]+\/type$/) && error.keyword === 'type' && error.params.type === 'null') {
              errorsToRemove.push(index)
              errorsToRemove.push(parentIndex)
            }
          }
        }
      })

      return errors.filter((_, index) => {
        return !errorsToRemove.includes(index)
      })
    }

    return errors
  }

  /**
   * Validate an object against the schema
   * 
   * @param o 
   * @returns ValidationResult
   */
  validate(o: any): ValidationResult {
    const validateFunction = this.validateFunction
    const valid = validateFunction(o)

    return {
      valid,
      errors: this.prepareErrors(validateFunction.errors),
      customMessage: this._schema['x-validation-message']
    }
  }

  /**
   * Mutates the object by removing properties that aren't allowed in the schema.
   * If the object is not valid for another reason that having additional properties,
   * an error is logged with an optional logger.
   * 
   * Enable the strict option to instead throw an error if the object is invalid.
   * 
   * @param o 
   * @param options 
   * @returns 
   */
  removeAdditional<T>(o: T, options: {
    strict?: boolean
    logger?: { error: (s: string) => void }
    errorLogger?: (s: string) => void
  } = {}): T|never {
    // This mutates the object by removing properties that aren't in the schema
    const removeAdditionalFunction = this.removeAdditionalFunction
    const valid = removeAdditionalFunction(o)

    const error = new RemoveAdditionalPropsError(
      this.prepareErrors(removeAdditionalFunction.errors),
      this.schema
    )

    if (!valid) {
      try {
        const message = `Invalid object found when using removeAdditional(): ${JSON.stringify(error.validationErrors.map((err: any) => `${err?.schemaPath}: ${err?.message}`))}`

        if (options.errorLogger) {
          options.errorLogger(message)
        } else if (options.logger?.error) {
          options.logger.error(message)
        }
      } catch (e) {
        // invalid logger
      }

      if (options.strict) {
        throw error
      }
    }

    return o
  }
}
