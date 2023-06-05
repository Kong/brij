"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenDTOs = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const swagger_parser_1 = __importDefault(require("@apidevtools/swagger-parser"));
const gen_dto_1 = require("./gen-dto");
const DEFAULT_SCHEMAS_JSON_PATH = '#/definitions';
class GenDTOs {
    static getAbsPath(pathRelToBase, baseDir) {
        const abs = path_1.default.resolve(baseDir);
        const filePath = path_1.default.join(abs, pathRelToBase);
        return filePath;
    }
    static getFileContent(absPath) {
        const fileContent = fs_1.default.readFileSync(absPath).toString();
        return fileContent;
    }
    static removeCircularReferences(obj) {
        const keyPath = [];
        const objectArray = [];
        const objectSet = new Set();
        const circularRefs = [];
        function isCircular(value, key) {
            if (typeof value !== 'object') {
                return false;
            }
            if (objectSet.has(value)) {
                const objIndex = objectArray.indexOf(value);
                const reference = `${keyPath.join('/')}/${key}`;
                const original = keyPath.slice(0, objIndex + 1).join('/');
                return { reference, original };
            }
            keyPath.push(key);
            objectArray.push(value);
            objectSet.add(value);
            for (const k in value) {
                if (value.hasOwnProperty(k)) {
                    const circular = isCircular(value[k], k);
                    if (circular) {
                        circularRefs.push(circular);
                        value[k] = {
                            type: 'object',
                            _circularRef: circular.original
                        };
                    }
                }
            }
            keyPath.pop();
            objectArray.pop();
            objectSet.delete(value);
            return false;
        }
        isCircular(obj, '.');
        return circularRefs;
    }
    static replaceNullables(obj) {
        if (!obj || typeof obj !== 'object') {
            return;
        }
        let output = JSON.parse(JSON.stringify(obj));
        function traverseChildren(value, parentKey, parent) {
            for (const k in value) {
                if (value.hasOwnProperty(k)) {
                    if (value[k] && typeof value[k] === 'object') {
                        traverseChildren(value[k], k, value);
                    }
                    else if (k === 'nullable' && value[k] === true && parentKey !== 'properties') {
                        delete value[k];
                        const newValue = {
                            oneOf: [
                                { type: 'null' },
                                value
                            ]
                        };
                        if (!parent) {
                            output = newValue;
                        }
                        else {
                            parent[parentKey] = newValue;
                        }
                    }
                }
            }
        }
        traverseChildren(output, '', null);
        return output;
    }
    static async getSchemasFromOAS(args) {
        const oas = await GenDTOs.parseOAS(args.fileContent);
        const lookup = args.schemasJSONPath.split('/').slice(1);
        let current = oas;
        for (const prop of lookup) {
            if (!current || typeof current !== 'object') {
                current = null;
                break;
            }
            current = current[prop];
            if (!current) {
                break;
            }
        }
        try {
            JSON.stringify(current);
        }
        catch (e) {
            if (e.message.includes('Converting circular structure to JSON')) {
                if (!args.removeCircular) {
                    console.error('\nUnable to process OpenAPI spec, found circular references in schema definitions. Circular references in schemas cannot be validated in the generated DTOs.\n\nUse --remove-circular to transform circular references into generic { "type": "object" } schemas\n\n');
                    throw e;
                }
            }
        }
        if (args.removeCircular) {
            const circularRefs = GenDTOs.removeCircularReferences(current);
            if (circularRefs.length) {
                console.log(`  - Removed circular references from schemas: ${JSON.stringify(circularRefs, null, 2)}`);
            }
        }
        return GenDTOs.replaceNullables(current);
    }
    static async parseOAS(content) {
        const parsers = {
            json: (x) => JSON.parse(x),
            yaml: (x) => js_yaml_1.default.load(x),
        };
        let o;
        for (const parser of Object.values(parsers)) {
            try {
                o = parser(content);
                if (o) {
                    break;
                }
            }
            catch { /* try again */ }
        }
        if (!o) {
            throw new Error(`file format must be one of ${Object.keys(parsers).join('|')}`);
        }
        try {
            return await swagger_parser_1.default.dereference(o);
        }
        catch (e) {
            // will throw if invalid
            await swagger_parser_1.default.validate(o);
            // otherwise it can't be dereferenced for some reason
            console.error(`unable to dereference OAS file: ${e?.message}`);
            throw e;
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
    static async generateDTOs(config) {
        const name = gen_dto_1.GenDTO.stripExtensions(config.filename);
        const sourceAbsPath = GenDTOs.getAbsPath(config.filename, config.sourceDirectory);
        const fileContent = GenDTOs.getFileContent(sourceAbsPath);
        let schemas = await GenDTOs.getSchemasFromOAS({
            fileContent,
            schemasJSONPath: typeof config.schemasJSONPath === 'string'
                ? config.schemasJSONPath
                : DEFAULT_SCHEMAS_JSON_PATH,
            removeCircular: config.removeCircular || false
        });
        if (!schemas) {
            console.warn(`no schemas found at JSON path '${config.schemasJSONPath}' in oas at ${sourceAbsPath}`);
            return false;
        }
        const dtoFolder = path_1.default.join(config.outputDirectory, name);
        gen_dto_1.GenDTO.prepareOutputDirectory(dtoFolder);
        const dtoFiles = [];
        await Promise.all(Object.entries(schemas).map(async ([key, schema]) => {
            const outputPath = path_1.default.join(dtoFolder, `${key}.ts`);
            try {
                gen_dto_1.GenDTO.generateDTO({ schema, outputPath, key });
            }
            catch (e) {
                console.error(`unable to generate DTO for ${key} in ${sourceAbsPath}`);
                return;
            }
            dtoFiles.push(key);
        }));
        gen_dto_1.GenDTO.writeIndexExports({
            outputDirectory: dtoFolder,
            indexExportFiles: dtoFiles,
        });
        return !!dtoFiles.length;
    }
}
exports.GenDTOs = GenDTOs;
//# sourceMappingURL=gen-dtos.js.map