import { describe, expect, it } from 'vitest'
import { parseMarkdown } from '../src/parse'

describe('headingIds option', () => {
  it('generates id attributes by default', async () => {
    const tree = await parseMarkdown('# Hello World')

    expect(tree.nodes).toEqual([['h1', { id: 'hello-world' }, 'Hello World']])
  })

  it('skips auto-generated ids when headingIds is false', async () => {
    const tree = await parseMarkdown('# Hello World', { headingIds: false })

    expect(tree.nodes).toEqual([['h1', {}, 'Hello World']])
  })

  it('preserves user-supplied id when headingIds is false', async () => {
    const tree = await parseMarkdown('# Hello {id="custom"}', { headingIds: false })

    expect(tree.nodes).toEqual([['h1', { id: 'custom' }, 'Hello']])
  })

  it('still generates hierarchical ids when headingIds is true', async () => {
    const tree = await parseMarkdown('# Title\n\n## Section')

    expect(tree.nodes).toEqual([
      ['h1', { id: 'title' }, 'Title'],
      ['h2', { id: 'section' }, 'Section'],
    ])
  })

  it('deduplicates hierarchical ids with a numeric suffix', async () => {
    const tree = await parseMarkdown('## Options\n\n## Options')

    const ids = tree.nodes.map((n: any) => n[1].id)
    expect(ids).toEqual(['options', 'options-1'])
  })

  describe('slug text extraction', () => {
    it('does not leak tag names from bold text', async () => {
      const tree = await parseMarkdown('## 1. Never let an LLM **speak** for you')

      expect((tree.nodes[0] as any)[1].id).toBe('_1-never-let-an-llm-speak-for-you')
    })

    it('does not leak tag names from inline code', async () => {
      const tree = await parseMarkdown('## The `parse` function')

      expect((tree.nodes[0] as any)[1].id).toBe('the-parse-function')
    })

    it('does not leak tag names from links', async () => {
      const tree = await parseMarkdown('## See [Nuxt](https://nuxt.com) docs')

      expect((tree.nodes[0] as any)[1].id).toBe('see-nuxt-docs')
    })

    it('does not include inline component names in the slug', async () => {
      const tree = await parseMarkdown('## Star :icon-star here')

      expect((tree.nodes[0] as any)[1].id).toBe('star-here')
    })
  })

  describe('non-ASCII headings', () => {
    it('keeps accented Latin letters', async () => {
      const tree = await parseMarkdown('## Café')

      expect((tree.nodes[0] as any)[1].id).toBe('café')
    })

    it('keeps accented Latin letters across words', async () => {
      const tree = await parseMarkdown('## Ünïcödé Tëxt')

      expect((tree.nodes[0] as any)[1].id).toBe('ünïcödé-tëxt')
    })

    it('keeps Cyrillic letters', async () => {
      const tree = await parseMarkdown('## Привет мир')

      expect((tree.nodes[0] as any)[1].id).toBe('привет-мир')
    })

    it('keeps CJK characters', async () => {
      const tree = await parseMarkdown('## 日本語')

      expect((tree.nodes[0] as any)[1].id).toBe('日本語')
    })

    it('omits the id for a symbol-only heading', async () => {
      const tree = await parseMarkdown('## 🚀')

      expect((tree.nodes[0] as any)[1].id).toBeUndefined()
    })

    it('omits the id for every duplicate symbol-only heading', async () => {
      const tree = await parseMarkdown('## 🚀\n\n## 🚀')

      const ids = tree.nodes.map((n: any) => n[1].id)
      expect(ids).toEqual([undefined, undefined])
    })

    it('keeps the parent prefix for a non-ASCII child heading', async () => {
      const tree = await parseMarkdown('## Setup\n\n### Café')

      const ids = tree.nodes.map((n: any) => n[1].id)
      expect(ids).toEqual(['setup', 'setup-café'])
    })

    it('keeps the underscore prefix for a leading digit', async () => {
      const tree = await parseMarkdown('## 2024 résumé')

      expect((tree.nodes[0] as any)[1].id).toBe('_2024-résumé')
    })
  })
})
