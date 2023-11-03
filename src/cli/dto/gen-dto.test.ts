import { GenDTO } from "./gen-dto"

describe('GenDTO', () => {
  describe('renderTypeScriptDTO', () => {
    it('uses the schema title as the name of an interface for types that are single-object based', async () => {
      const rendered = await GenDTO.renderTypeScriptDTO({ title: 'Hello', type: 'object' }, 'Goodbye')

      expect(rendered.split('\n')).toContain('export interface Hello {')
    })

    it('uses the schema title as the name of a type for types that are not single-object based', async () => {
      const rendered = await GenDTO.renderTypeScriptDTO({ title: 'Hello', type: 'string' }, 'Goodbye')

      expect(rendered.split('\n')).toContain('export type Hello = string')
    })

    it.each([
      ['interface definition', { title: 'Hello', type: 'object' }, 'Goodbye'], // generated type uses `interface`
      ['type definition', { title: 'Hello', type: 'string' }, 'Goodbye'], // generated type uses `type`
    ])('includes a type alias if the schema title and key do not match - %s', async (_, ...args) => {
      const rendered = await GenDTO.renderTypeScriptDTO(...args)

      expect(rendered.split('\n')).toContain('export type Goodbye = Hello')
    })

    it('does not include a type alias if the schema title and key match', async () => {
      const rendered = await GenDTO.renderTypeScriptDTO({ title: 'Hello', type: 'object' }, 'Hello')

      expect(rendered.split('\n')).not.toContain('export type Hello = Hello')
    })
  })
})