type CreatedUpdatedAtInput = { created_at: Date, updated_at: Date } 
type CreatedUpdatedAtOutput<T> = Omit<T,'created_at'|'updated_at'>&{ created_at: string, updated_at: string }

export function isCreatedUpdatedAtInput(o: any): o is CreatedUpdatedAtInput {
  return o && typeof o === 'object'
    && o.created_at?.constructor?.name === 'Date'
    && o.updated_at?.constructor?.name === 'Date'
}

export type ScrubbableInput = CreatedUpdatedAtInput|Record<string, any>

export type ScrubbableOutput<T> =
    T extends CreatedUpdatedAtInput
      ? CreatedUpdatedAtOutput<T>
      : T

