import path from 'path'
import klaw from 'klaw'
import { Command } from 'commander'
import { GenDTOs } from './dto/gen-dtos'
import packageJson from './package.symlink.json'

const program = new Command()

program
  .name(packageJson.name)
  .description(
`
          ┏┓━━━━━━━━━━
          ┃┃━━━━━━━━┏┓
          ┃┗━┓┏━┓┏┓━┗┛
          ┃┏┓┃┃┏┛┣┫━┏┓
          ┃┗┛┃┃┃━┃┃━┃┃
          ┗━━┛┗┛━┗┛━┃┃
          ━━━━━━━━━┏┛┃
          ━━━━━━━━━┗━┛
---------------------------------
build responsively in json-schema
---------------------------------

Generate TypeScript interface and validators from JSON schemas defined in OAS files.

license: ${packageJson.license}
`)
  .version(packageJson.version)

program.command('dto')
  .description('Output TypeScript artifacts based on json-schema definitions in OAS files')
  .argument('source <string>', 'source directory with OAS or JSON schema files')
  .argument('output <string>', 'output directory for generated TypeScript files')
  .option('--schemas <string>', 'JSON path to the section in the OAS with the JSON schemas, e.g. \'#/definitions\'')
  .option('--remove-circular', 'whether to remove circular references from schemas and treat them as generic objects, rather than fail to generate specs with circular references')
  .option('--no-index-files', 'skip generation of index.ts files that auto-export all exports in each file in each directory')
  .action(async(schemaDirectory: string, outputDirectory: string, options: Record<string, any>) => {
    const absRoot = path.resolve(schemaDirectory)

    console.log(`
Generating DTOs from JSON schemas
  - OAS directory: '${absRoot}'
  - schemas JSON path: '${options.schemas}'
`)
    for await (const file of klaw(schemaDirectory)) {
      if (file.stats.isDirectory()) {
        continue
      }

      const relativePath = path.relative(absRoot, file.path)
      const basename = path.basename(relativePath)
      const intermediatePath = relativePath.slice(0, -1*basename.length)

      console.log(`Found file ${relativePath}`)

      const result = await GenDTOs.generateDTOs({
        sourceDirectory: path.join(schemaDirectory, intermediatePath),
        outputDirectory: path.join(outputDirectory, intermediatePath),
        filename: basename,
        schemasJSONPath: options.schemas,
        removeCircular: options.removeCircular || false,
        skipIndexFile: !options.indexFiles,
      })

      result
        ? console.log(`  - Generated DTOs at ${outputDirectory}`)
        : console.log(`  - No DTOs found`)

      console.log()
    }
  })


export function run() {
  program.parse(process.argv)
}