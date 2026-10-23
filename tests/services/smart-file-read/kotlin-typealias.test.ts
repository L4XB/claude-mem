import { describe, expect } from 'bun:test';
import { nativeTest as test } from './native-prerequisite.js';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseFile, unfoldSymbol } from '../../../src/services/smart-file-read/parser.js';
import { searchCodebase } from '../../../src/services/smart-file-read/search.js';

const source = [
  'package demo',
  '',
  'typealias Handler = (String) -> Unit',
  '',
  'typealias Name = String',
  '',
  'private typealias Table<K> = Map<K, List<String>>',
  '',
  'class Service { fun run() {} }',
].join('\n');
const filename = 'Types.kt';

describe('kotlin-typealias', () => {
  test('a typealias is a type in the outline', () => {
    const file = parseFile(source, filename);
    expect(file.symbols.map(s => [s.name, s.kind])).toEqual([
      ['Handler', 'type'], ['Name', 'type'], ['Table', 'type'], ['Service', 'class'],
    ]);
    expect(file.symbols[0].signature).toBe('typealias Handler = (String) -> Unit');
    expect(file.symbols[2].signature).toBe('private typealias Table<K> = Map<K, List<String>>');
  }, 120000);

  test('search and unfold find a typealias', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'cm-kotlin-typealias-'));
    try {
      writeFileSync(join(dir, filename), source);
      const result = await searchCodebase(dir, 'Handler');
      expect(result.matchingSymbols.map(s => s.symbolName)).toEqual(['Handler']);
      expect(unfoldSymbol(source, filename, 'Table')).toContain('Map<K, List<String>>');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 120000);
});
