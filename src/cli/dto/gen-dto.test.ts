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

    it.each([
      ['HelloThere', { title: 'Hello there', type: 'string' }, 'Goodbye'],
      ['Abc', { title: 'abc', type: 'string' }, 'Goodbye'],
      ['Good1Yeah', { title: 'good 1 yeah', type: 'string' }, 'Goodbye'],
      ['ReallyGreat1', { title: 'really Great 1', type: 'string' }, 'Goodbye'],
      ['Good1AnotherYeah', { title: 'good. #1 & another ; yeah?', type: 'string' }, 'Goodbye'],
      ['UnderScore', { title: 'under_score', type: 'string' }, 'Goodbye'],
      ['SlashDash', { title: '/slash-dash', type: 'string' }, 'Goodbye'],
    ])('creates a valid identifier from the title for the type alias - %s', async (expected, ...args) => {
      const rendered = await GenDTO.renderTypeScriptDTO(...args)

      expect(rendered.split('\n')).toContain(`export type Goodbye = ${expected}`)
    })

    it('does not include a type alias if the schema title and key match', async () => {
      const rendered = await GenDTO.renderTypeScriptDTO({ title: 'Hello', type: 'object' }, 'Hello')

      expect(rendered.split('\n')).not.toContain('export type Hello = Hello')
    })

    it('does not include a type alias if the schema title resolves to the same identifier as the key', async () => {
      const rendered = await GenDTO.renderTypeScriptDTO({ title: 'Hello in there', type: 'object' }, 'HelloInThere')

      expect(rendered.split('\n')).not.toContain('export type Hello = HelloInThere')
    })
  })
})