import { describe, expect } from 'bun:test';
import { nativeTest as test } from './native-prerequisite.js';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseFile, unfoldSymbol } from '../../../src/services/smart-file-read/parser.js';
import { searchCodebase } from '../../../src/services/smart-file-read/search.js';

const source = [
  'public enum Color {',
  '    RED(0xff0000), GREEN(0x00ff00);',
  '    private final int rgb;',
  '    Color(int rgb) { this.rgb = rgb; }',
  '    public Color next() { return values()[(ordinal() + 1) % values().length]; }',
  '}',
  'class Plain {}',
].join('\n');
const filename = 'Color.java';

describe('java-enums', () => {
  test('an enum owns its constructor and methods', () => {
    const file = parseFile(source, filename);
    expect(file.symbols.map(s => s.name)).toEqual(['Color', 'Plain']);
    expect(file.symbols[0].kind).toBe('enum');
    expect(file.symbols[0].children?.map(s => s.name)).toEqual(['Color(int rgb)', 'next']);
  }, 120000);

  test('search and unfold address an enum method through its enum', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'cm-java-enums-'));
    try {
      writeFileSync(join(dir, filename), source);
      const result = await searchCodebase(dir, 'next');
      const match = result.matchingSymbols.find(s => s.symbolName === 'Color.next');
      expect(match).toBeDefined();
      expect(unfoldSymbol(source, filename, match!.symbolName)).toContain('return values()[(ordinal() + 1) % values().length];');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 120000);
});
