import { describe, expect } from 'bun:test';
import { nativeTest as test } from './native-prerequisite.js';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseFile, unfoldSymbol } from '../../../src/services/smart-file-read/parser.js';
import { searchCodebase } from '../../../src/services/smart-file-read/search.js';

const source = [
  'namespace geo {',
  'using Coord = double;',
  '',
  'template <typename T>',
  'using Vec = std::vector<T>;',
  '',
  'typedef int Id;',
  '',
  'struct Point { Coord x; Coord y; };',
  '}',
].join('\n');
const filename = 'geo.hpp';

describe('cpp-using-aliases', () => {
  test('a using alias is a type in the outline, like a typedef', () => {
    const file = parseFile(source, filename);
    expect(file.symbols.map(s => [s.name, s.kind])).toEqual([['geo', 'namespace']]);
    expect(file.symbols[0].children?.map(s => [s.name, s.kind])).toEqual([
      ['Coord', 'type'], ['Vec', 'type'], ['Id', 'type'], ['Point', 'struct'],
    ]);
    expect(file.symbols[0].children?.[1].signature).toBe('using Vec = std::vector<T>;');
  }, 120000);

  test('search and unfold find a using alias', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'cm-cpp-using-aliases-'));
    try {
      writeFileSync(join(dir, filename), source);
      const result = await searchCodebase(dir, 'Coord');
      expect(result.matchingSymbols.map(s => s.symbolName)).toEqual(['geo.Coord']);
      expect(unfoldSymbol(source, filename, 'geo.Vec')).toContain('std::vector<T>');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 120000);
});
