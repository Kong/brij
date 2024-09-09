import fs from 'fs'
import path from 'path'
import { ajv } from '../../lib/json-schema.base'
import { compile, Options as TypescriptInterfaceOptions } from 'json-schema-to-typescript'

const typescriptInterfaceOptions: Partial<TypescriptInterfaceOptions> = {
  style: {
    singleQuote: true,
    semi: false,
  },
  bannerComment: ''
}

export class GenDTO {
  /**
   * Use the ajv ValidatorFunction instance imported from json-schema.base.ts.
   * This verifies that the same ajv instance that will be used at run time will
   * work for the schema in the generated code.
   * 
   * @param schema
   */
  private static verifyValidatorCompilation(schema: any) {
    const validate = ajv.compile(schema)

    validate({})
  }

  static async renderTypeScriptDTO(jsonSchema: any, key: string) {
    const generatedTsInteface = await compile(jsonSchema, key, typescriptInterfaceOptions)
    const schemaText = JSON.stringify(jsonSchema, null, 2)

    // If the resolved schema title did not match the key (also if the schema was using a $ref),
    // export a type alias for the generated schema type so that it can be referenced by the key
    // of the input schema
    const identifier = GenDTO.makeCodeIdentifier(jsonSchema.title)
    const codifiedKey = GenDTO.makeCodeIdentifier(key)

    const typeKeyAlias = identifier && identifier !== key && generatedTsInteface.includes(identifier)
      ? `export type ${codifiedKey} = ${identifier}`
      : undefined

    return `/* eslint-disable */
/**
 * This file was automatically generated.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema in the source OAS file,
 * and use \`yarn brij dto\` to regenerate this file.
 */

import { JSONSchema } from '@kong/brij'

${generatedTsInteface}${typeKeyAlias ? `\n${typeKeyAlias}`: ''}

class ${codifiedKey}Schema extends JSONSchema {
  constructor() {
    super(${schemaText.split('\n').join('\n    ')})
  }
}

export const ${codifiedKey} = new ${codifiedKey}Schema()
`
  }

  static stripExtensions(oasName: string) {
    return oasName
      .replace(/\.json$/, '')
      .replace(/\.yaml$/, '')
      .replace(/\.yml$/, '')
  }

  static prepareOutputDirectory(outputFolderPath: string) {
    if (fs.existsSync(outputFolderPath)) {
      fs.rmSync(outputFolderPath, { recursive: true })
    }

    let cumulative = ''

    outputFolderPath.split('/').forEach(folder => {
      cumulative = path.join(cumulative, folder)
      if (cumulative) {
        if (!fs.existsSync(cumulative)) {
          fs.mkdirSync(cumulative)
        }
      }
    })
  }

  static writeIndexExports(args: {
    outputDirectory: string
    indexExportFiles: string[]
    writeExport?: (filename: string) => string
  }) {
    const writeExport = args.writeExport
      || ((filename: string) => `export * from './${GenDTO.stripExtensions(filename)}'`)

    const indexPath = path.join(args.outputDirectory, 'index.ts')

    fs.writeFileSync(indexPath, args.indexExportFiles.map(writeExport).join('\n') + '\n')
  }

  static makeCodeIdentifier(s: string) {
    if (!s) {
      return ''
    }

    return s
      .replace(/\s+/g, ' ')
      .replace(/\_+/g, ' ')
      .replace(/\-+/g, ' ')
      .replace(/\/+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .split(' ')
      .map((s: string) => (s[0]?.toUpperCase() || '') + (s.slice(1) || ''))
      .join('')
  }


  static async generateDTO(args: {
    key: string
    schema: any
    outputPath?: string
  }) {
    try {
      GenDTO.verifyValidatorCompilation(args.schema)
    } catch (e: any) {
      console.error(`error compiling ajv for ${args.key}`)
      console.error(`\t- ${e?.message}\n`)

      throw e
    }

    const generated = await GenDTO.renderTypeScriptDTO(args.schema, args.key)

    if (args.outputPath) {
      fs.writeFileSync(args.outputPath, generated)
    }
    return generated
  }

}