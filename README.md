# brij

build responsively in json-schema

## Summary

Generate TypeScript interface and validators from JSON schemas defined in OAS files.

Compatible with Swagger 2.0 and OpenAPI 3.0 Specifications (OAS)

## Install

npm
```sh
npm install @kong/brij
```

yarn
```sh
yarn add @kong/brij
```

## CLI

```
Usage: brij [options] [command]

Options:
  -V, --version                    output the version number
  -h, --help                       display help for command

Commands:
  dto [options] <string> <string>  Output TypeScript artifacts based on json-schema definitions in OAS files
  help [command]                   display help for command
```

### Command: `dto`

```
Usage: brij dto [options] <string> <string>

Output TypeScript artifacts based on json-schema definitions in OAS files

Arguments:
  source <string>     source directory with OAS or JSON schema files
  output <string>     output directory for generated TypeScript files

Options:
  --schemas <string>  JSON path to the section in the OAS with the JSON schemas, e.g. '#/definitions'
  --remove-circular   whether to remove circular references from schemas and treat them as generic objects, rather than fail to generate specs with circular references
  --no-index-files    skip generation of index.ts files that auto-export all exports in each file in each directory
  -h, --help          display help for command
```

#### Example usage of `dto` command
Let's say
- you have an OAS file at `my-oas/bananas.json`.
  - it should have JSON schemas defined under a certain JSON path, e.g. `#/definitions` or `#/components/schemas`
- you want to generate TypeScript interfaces and a runtime validator for each schema
- you want to output the generated code to a `generated/dto` directory

You should run:
```
./index.js dto my-oas generated/dto --schemas '\#/definitions'
```
The `generated` directory will now look like this:
```sh
└── dto                  # generated files that mirror the structure of the source directory
    └── bananas
        ├── request      # schemas linked to request bodies
        │   └── PutBananaRequestBody.ts
        ├── response     # schemas linked to response bodies
        │   ├── GetBananaResponseBody.ts
        │   ├── PutBananaResponseBody.ts
        ├── Banana.ts    # all schemas under the `--schemas` JSON path are output to the top level of the bananas directory
        └── index.ts
```

The `dto` command will:
- look in all subdirectories of the source directory for any json or yaml files
- try to parse each file as Swagger/OpenAPI
- if it is valid OAS,
  - then the properties under the JSON path specified in `--schemas` will each output a DTO file
    - readOnly and writeOnly properties in object schemas will both be retained in these schemas
  - each schema that is found in an operation's `requestBody` will be added to the output directory's `request` directory
    - writeOnly properties in object schemas will be retained in these schemas, readOnly propeties will be removed
  - each schema that is found in an operation's `responses` will be added to the output directory's `response` directory
    - readOnly properties in object schemas will be retained in these schemas, writeOnly properties will be removed
- generated DTO files contain a TypeScript interface and a JSON schema validator
- generated DTO filenames will match the key of the schema from the OAS file
  - e.g., if the JSON Schema key in the OAS file is `ApiResponse`, then the generated DTO filename will be `ApiResponse.ts`
- the interface and validator instance will both have the same identifier
  - e.g., if the JSON Schema key in the OAS file is `ApiResponse`, then the interface and validator instance will both be named `ApiResponse`

#### Example consumption of the generated DTO

The DTO file generated for each JSON schema looks like this, including an exported interface and validator instance:
```ts
import {JSONSchema} from 'brij'

export interface ApiResponse {
  code?: number
  type?: string
  message?: string
  [k: string]: unknown
}

class ApiResponseSchema extends JSONSchema {
  constructor() {
    super({
      "x-validation-message": "This is a custom error message that will be returned when validation fails"
      "type": "object",
      "properties": {
        "code": {
          "type": "integer"
        },
        "type": {
          "type": "string"
        },
        "message": {
          "type": "string"
        }
      }
    })
  }
}

export const ApiResponse = new ApiResponseSchema()
```

You can import the generated DTO into your program and use it like this:
```ts
import { ApiResponse } from '../dto/ApiResponse'

export function test(input: any): ApiResponse|never {
  const {valid, errors} = ApiResponse.validate(input)

  if (!valid) {
    throw new Error(JSON.stringify(errors))
  }

  // Since it is a valid ApiResponse object, we can confidently cast it the expected type
  return input as ApiResponse
}
```

##### Using a custom `x-validation-message` property in a schema

```ts
import { ApiResponse } from '../dto/ApiResponse'

export function test(input: any): ApiResponse|never {
  const {valid, errors, customMessage} = ApiResponse.validate(input)

  if (!valid) {
    throw new Error(JSON.stringify({
      message: customMessage, // This message comes from the "x-validation-message" property on the schema
      errors
    }))
  }

  // Since it is a valid ApiResponse object, we can confidently cast it the expected type
  return input as ApiResponse
}
```

To strip additional properties from an object to ensure it matches the JSON schema definition:

> Note: you must use `additionalProperties: false` or similar to have properties be removed, since otherwise they will still be valid properties

```ts
import { ApiResponse } from '../dto/ApiResponse'

export function removeAdditonalProperties(input: ApiResponse): ApiResponse|never {
  // This mutates (and returns) the input object.
  // Properties not allowed in the JSON schema have been removed.
  // By default, any unrelated validation issues (e.g. missing required props, invalid types) are ignored.
  // Validation issues unrelated to additionalProperties can be surfaced using either `errorLogger` or `strict` option (see below).
  return ApiResponse.removeAdditional(input)
}
```


##### `errorLogger` option

```ts
import { ApiResponse } from '../dto/ApiResponse'

export function removeAdditonalProperties(input: ApiResponse): ApiResponse|never {
  // Pass a function to log validation errors unrelated to additionalProperties with.
  return ApiResponse.removeAdditional(input, { errorLogger: console.log })
}
```

##### `strict` option

```ts
import { ApiResponse, RemoveAdditionalPropsError } from '../dto/ApiResponse'

export function removeAdditonalProperties(input: ApiResponse): ApiResponse|never {
  try {
    // Set `strict` to true to throw a RemoveAdditionalPropsError if there are validation
    // errors unrelated to additionalProperties.
    ApiResponse.removeAdditional(input, { strict: true })
  } catch (e: unknown) {
    if (e instanceof RemoveAdditionalPropsError) {
      console.error(`error removing additional props: ${e.message}`)
      console.error(`validation errors: ${JSON.stringify(e.validationErrors)}`)
    }

    throw e
  }

  // Properties not allowed in the JSON schema have been removed
  return input
}
```

##### Using custom `ajv` options

To set custom [ajv options](https://ajv.js.org/options.html) for all JSONSchema instances, use the static `JSONSchema.setAjvOptions(options)` method. These options will override the default options. This method must be called before any instances have been used for validation to ensure that the options are applied.

##### JSONSchema global options

To set global JSONSchema options, use the static `JSONSchema.setOptions(options)` method. These options will be used by all instances of JSONSchema.

Options:
- `omitNullSiblingErrors` - do not report any errors related to failed `oneOf` or `anyOf` error when one of the child errors is `type must be null`. Only report errors against the non-`"type": "null"` child schemas.
