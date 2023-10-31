import Ajv, { ErrorObject, ValidateFunction } from 'ajv'
import addFormats from 'ajv-formats'
import { RemoveAdditionalPropsError } from './errors/remove-additional-props.error'
import { ScrubbableInput, ScrubbableOutput, isCreatedUpdatedAtInput } from './types'

export const ajv = addFormats(new Ajv({
  discriminator: true,
  strictSchema: false
}))

export const ajvRemoveAdditional = addFormats(new Ajv({
  discriminator: true,
  strictSchema: false,
  removeAdditional: true, // for more info see https://ajv.js.org/guide/modifying-data.html
  allErrors: true,
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
  private _schema: any

  private _validate: ValidateFunction

  private _removeAdditional: ValidateFunction

  private static ajv = ajv

  static setAjv(ajv: Ajv) {
    JSONSchema.ajv = ajv
  }

  get ajv() {
    return JSONSchema.ajv
  }

  get schema(): any {
    return JSON.parse(JSON.stringify(this._schema))
  }

  constructor(schema: any) {
    this._schema = schema
    this._validate = ajv.compile(schema)
    this._removeAdditional = ajvRemoveAdditional.compile(schema)
  }

  validate(o: any): ValidationResult {
    const valid = this._validate(o)

    return {
      valid,
      errors: this._validate.errors,
      customMessage: this._schema['x-validation-message']
    }
  }

  scrub<T extends ScrubbableInput>(input: T, options: {
    strict?: boolean
    logger?: { error: (s: string) => void }
  } = {}): ScrubbableOutput<T>|never {
    const output = this.removeAdditional(input, options)

    if (isCreatedUpdatedAtInput(output)) {
      return {
        ...output,
        created_at: output.created_at?.toISOString() || '',
        updated_at: output.updated_at?.toISOString() || '',
      } as ScrubbableOutput<T>
    }

    return output as ScrubbableOutput<T>
  }

  removeAdditional<T>(o: T, options: {
    strict?: boolean
    logger?: { error: (s: string) => void }
    errorLogger?: (s: string) => void
  } = {}): T|never {
    // This mutates the object by removing properties that aren't in the schema
    const valid = this._removeAdditional(o)

    const error = new RemoveAdditionalPropsError(
      this._removeAdditional.errors,
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
