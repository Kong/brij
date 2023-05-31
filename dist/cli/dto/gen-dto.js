"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenDTO = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const json_schema_base_1 = require("../../lib/json-schema.base");
const json_schema_to_typescript_1 = require("json-schema-to-typescript");
const typescriptInterfaceOptions = {
    style: {
        singleQuote: true,
        semi: false,
    },
    bannerComment: ''
};
class GenDTO {
    /**
     * Use the ajv ValidatorFunction instance imported from json-schema.base.ts.
     * This verifies that the same ajv instance that will be used at run time will
     * work for the schema in the generated code.
     *
     * @param schema
     */
    static verifyValidatorCompilation(schema) {
        const validate = json_schema_base_1.ajv.compile(schema);
        validate({});
    }
    static async renderTypeScriptDTO(jsonSchema, key) {
        const generatedTsInteface = await (0, json_schema_to_typescript_1.compile)(jsonSchema, key, typescriptInterfaceOptions);
        const schemaText = JSON.stringify(jsonSchema, null, 2);
        return `/* eslint-disable */
/**
 * This file was automatically generated.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema in the source OAS file,
 * and use \`yarn brij dto\` to regenerate this file.
 */

import { JSONSchema } from '@kong/brij'

${generatedTsInteface}

class ${key}Schema extends JSONSchema {
  constructor() {
    super(${schemaText.split('\n').join('\n    ')})
  }
}

export const ${key} = new ${key}Schema()
`;
    }
    static stripExtensions(oasName) {
        return oasName
            .replace(/\.json$/, '')
            .replace(/\.yaml$/, '')
            .replace(/\.yml$/, '');
    }
    static prepareOutputDirectory(outputFolderPath) {
        if (fs_1.default.existsSync(outputFolderPath)) {
            fs_1.default.rmSync(outputFolderPath, { recursive: true });
        }
        let cumulative = '';
        outputFolderPath.split('/').forEach(folder => {
            cumulative = path_1.default.join(cumulative, folder);
            if (cumulative) {
                if (!fs_1.default.existsSync(cumulative)) {
                    fs_1.default.mkdirSync(cumulative);
                }
            }
        });
    }
    static writeIndexExports(args) {
        const writeExport = args.writeExport
            || ((filename) => `export * from './${GenDTO.stripExtensions(filename)}'`);
        const indexPath = path_1.default.join(args.outputDirectory, 'index.ts');
        fs_1.default.writeFileSync(indexPath, args.indexExportFiles.map(writeExport).join('\n') + '\n');
    }
    static async generateDTO(args) {
        try {
            GenDTO.verifyValidatorCompilation(args.schema);
        }
        catch (e) {
            console.error(`error compiling ajv for ${args.key}`);
            console.error(`\t- ${e?.message}\n`);
            throw e;
        }
        const generated = await GenDTO.renderTypeScriptDTO(args.schema, args.key);
        if (args.outputPath) {
            fs_1.default.writeFileSync(args.outputPath, generated);
        }
        return generated;
    }
}
exports.GenDTO = GenDTO;
//# sourceMappingURL=gen-dto.js.map