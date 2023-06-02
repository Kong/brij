"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const path_1 = __importDefault(require("path"));
const klaw_1 = __importDefault(require("klaw"));
const commander_1 = require("commander");
const gen_dtos_1 = require("./dto/gen-dtos");
const package_symlink_json_1 = __importDefault(require("./package.symlink.json"));
const program = new commander_1.Command();
program
    .name(package_symlink_json_1.default.name)
    .description(`
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

license: ${package_symlink_json_1.default.license}
`)
    .version(package_symlink_json_1.default.version);
program.command('dto')
    .description('Output TypeScript artifacts based on json-schema definitions in OAS files')
    .argument('source <string>', 'source directory with OAS or JSON schema files')
    .argument('output <string>', 'output directory for generated TypeScript files')
    .option('--schemas <string>', 'JSON path to the section in the OAS with the JSON schemas, e.g. \'#/definitions\'')
    .option('--remove-circular', 'whether to remove circular references from schemas and treat them as generic objects, rather than fail to generate specs with circular references')
    .action(async (schemaDirectory, outputDirectory, options) => {
    const absRoot = path_1.default.resolve(schemaDirectory);
    console.log(`
Generating DTOs from JSON schemas
  - OAS directory: '${absRoot}'
  - schemas JSON path: '${options.schemas}'
`);
    for await (const file of (0, klaw_1.default)(schemaDirectory)) {
        if (file.stats.isDirectory()) {
            continue;
        }
        const relativePath = path_1.default.relative(absRoot, file.path);
        const basename = path_1.default.basename(relativePath);
        const intermediatePath = relativePath.slice(0, -1 * basename.length);
        console.log(`Found file ${relativePath}`);
        const result = await gen_dtos_1.GenDTOs.generateDTOs({
            sourceDirectory: path_1.default.join(schemaDirectory, intermediatePath),
            outputDirectory: path_1.default.join(outputDirectory, intermediatePath),
            filename: basename,
            schemasJSONPath: options.schemas,
            removeCircular: options.removeCircular || false,
        });
        result
            ? console.log(`  - Generated DTOs at ${outputDirectory}`)
            : console.log(`  - No DTOs found`);
        console.log();
    }
});
function run() {
    program.parse(process.argv);
}
exports.run = run;
//# sourceMappingURL=main.js.map