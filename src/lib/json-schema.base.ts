import Ajv, { ErrorObject, ValidateFunction } from 'ajv'
import addFormats from 'ajv-formats'
import { RemoveAdditionalPropsError } from './errors/remove-additional-props.error'

export const ajv = addFormats(new Ajv({
  strictSchema: false
}))

export const ajvRemoveAdditional = addFormats(new Ajv({
  strictSchema: false,
  removeAdditional: true, // for more info see https://ajv.js.org/guide/modifying-data.html
}))

export interface ValidationResult {
  valid: boolean
  errors: ErrorObject<string, Record<string, any>, unknown>[] | null | undefined
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

  get ajv() {
    return ajv
  }

  get schema() {
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
      errors: this._validate.errors
    }
  }

  removeAdditional<T>(o: T): T {
    // This mutates the object by removing properties that aren't in the schema
    const valid = this._removeAdditional(o)

    if (!valid) {
      throw new RemoveAdditionalPropsError(
        this._removeAdditional.errors,
        this.schema
      )
    }

    return o
  }
}
