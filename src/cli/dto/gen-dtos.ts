import path from 'path'
import fs from 'fs'
import yaml from 'js-yaml'
import SwaggerParser from '@apidevtools/swagger-parser'
import { GenDTO } from './gen-dto'

export interface FileConfig {
  sourceDirectory: string
  outputDirectory: string
  filename: string
  schemasJSONPath?: string
  removeCircular?: boolean
  skipIndexFile?: boolean
}

export interface CircularRefInfo {
  reference: string
  original: string
}

const DEFAULT_SCHEMAS_JSON_PATH = '#/definitions'

export class GenDTOs {
  private static getAbsPath(pathRelToBase: string, baseDir: string) {
    const abs = path.resolve(baseDir)
    const filePath = path.join(abs, pathRelToBase)

    return filePath
  }

  private static getFileContent(absPath: string) {
    const fileContent = fs.readFileSync(absPath).toString()

    return fileContent
  }

  static removeCircularReferences(obj: any): CircularRefInfo[] {
    const keyPath: string[] = []
    const objectArray: any[] = []
    const objectSet = new Set()

    const circularRefs: CircularRefInfo[] = []

    function isCircular(value: any, key: string): false|CircularRefInfo {
      if (typeof value !== 'object') {
        return false
      }

      if (objectSet.has(value)) {
        const objIndex = objectArray.indexOf(value)

        const reference = `${keyPath.join('/')}/${key}`
        const original = keyPath.slice(0, objIndex + 1).join('/')

        return { reference, original }
      }

      keyPath.push(key)
      objectArray.push(value)
      objectSet.add(value)

      for (const k in value) {
        if (value.hasOwnProperty(k)) {
          const circular = isCircular(value[k], k)

          if (circular) {
            circularRefs.push(circular)

            value[k] = {
              type: 'object',
              _circularRef: circular.original
            }
          }
        }
      }

      keyPath.pop()
      objectArray.pop()
      objectSet.delete(value)

      return false
    }

    isCircular(obj, '.')

    return circularRefs
  }

  static replaceNullables(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return
    }

    let output = JSON.parse(JSON.stringify(obj))

    function traverseChildren(value: any, parentKey: string, parent: any) {
      for (const k in value) {
        if (value.hasOwnProperty(k)) {
          if (value[k] && typeof value[k] === 'object') {
            traverseChildren(value[k], k, value)
          } else if (k === 'nullable' && value[k] === true && parentKey !== 'properties') {
            delete value[k]

            const newValue = {
              oneOf: [
                { type: 'null' },
                value
              ]
            }

            if (!parent) {
              output = newValue
            } else {
              parent[parentKey] = newValue
            }
          }

        }
      }
    }

    traverseChildren(output, '', null)

    return output
  }

  private static async getSchemasFromOAS(args: {
    fileContent: string
    schemasJSONPath: string
    removeCircular: boolean
  }) {
    const oas = await GenDTOs.parseOAS(args.fileContent)

    const lookup = args.schemasJSONPath.split('/').slice(1)

    let current: any = oas

    for (const prop of lookup) {
      if (!current || typeof current !== 'object') {
        current = null
        break
      }

      current = current[prop]
      if (!current) {
        break
      }
    }

    try {
      JSON.stringify(current)
    } catch (e: any) {
      if (e.message.includes('Converting circular structure to JSON')) {
        if (!args.removeCircular) {
          console.error('\nUnable to process OpenAPI spec, found circular references in schema definitions. Circular references in schemas cannot be validated in the generated DTOs.\n\nUse --remove-circular to transform circular references into generic { "type": "object" } schemas\n\n')
          throw e
        }
      }
    }

    if (args.removeCircular) {
      const circularRefs = GenDTOs.removeCircularReferences(current)

      if (circularRefs.length) {
        console.log(`  - Removed circular references from schemas: ${JSON.stringify(circularRefs, null, 2)}`)
      }
    }

    return GenDTOs.replaceNullables(current)
  }

  private static async parseOAS(content: string) {
    const parsers = {
      json: (x: string) => JSON.parse(x),
      yaml: (x: string) => yaml.load(x),
    }

    let o: any

    for (const parser of Object.values(parsers)) {
      try {
        o = parser(content)
        if (o) { break }
      } catch { /* try again */ }
    }

    if (!o) {
      throw new Error(`file format must be one of ${Object.keys(parsers).join('|')}`)
    }

    try {
      return await SwaggerParser.dereference(o)
    } catch (e: unknown) {
      // will throw if invalid
      await SwaggerParser.validate(o)

      // otherwise it can't be dereferenced for some reason
      console.error(`unable to dereference OAS file: ${(e as any)?.message}`)
      throw e
    }
  }

  /**
   * Write DTO files to the specified output directory based on the
   * the JSON schemas in the input OAS. For Each JSON schema found,
   * generate TypeScript for the following:
   *
   * - exported TypeScript interface
   * - class extending JSONSchema, providing the JSON Schema
   * - exported instance of the class with the name overloading the TypeScript interface
   *
   * @param config
   */
  static async generateDTOs(config: FileConfig): Promise<boolean> {
    const name = GenDTO.stripExtensions(config.filename)
    const sourceAbsPath = GenDTOs.getAbsPath(config.filename, config.sourceDirectory)
    const fileContent = GenDTOs.getFileContent(sourceAbsPath)
    let schemas: Record<string, any>|undefined

    try {
      schemas = await GenDTOs.getSchemasFromOAS({
        fileContent,
        schemasJSONPath: typeof config.schemasJSONPath === 'string'
          ? config.schemasJSONPath
          : DEFAULT_SCHEMAS_JSON_PATH,
        removeCircular: config.removeCircular || false
      })
    } catch (e: any) {
      if (e?.message?.startsWith('file format must be one of')) {
        console.warn(`invalid file found at ${sourceAbsPath}: ${e.message}`)

        return false
      } else {
        throw e
      }
    }

    if (!schemas) {
      console.warn(`no schemas found at JSON path '${config.schemasJSONPath}' in oas at ${sourceAbsPath}`)

      return false
    }

    const dtoFolder = path.join(config.outputDirectory, name)

    GenDTO.prepareOutputDirectory(dtoFolder)

    const dtoFiles: string[] = []

    await Promise.all(Object.entries(schemas).map(async([key, schema]: [string, any]) => {
      const outputPath = path.join(dtoFolder, `${key}.ts`)

      try {
        GenDTO.generateDTO({ schema, outputPath, key })
      } catch (e) {
        console.error(`unable to generate DTO for ${key} in ${sourceAbsPath}`)

        return
      }

      dtoFiles.push(key)
    }))

    if (!config.skipIndexFile) {
      GenDTO.writeIndexExports({
        outputDirectory: dtoFolder,
        indexExportFiles: dtoFiles,
      })
    }

    return !!dtoFiles.length
  }
}
