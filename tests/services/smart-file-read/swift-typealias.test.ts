import { describe, expect } from 'bun:test';
import { nativeTest as test } from './native-prerequisite.js';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseFile, unfoldSymbol } from '../../../src/services/smart-file-read/parser.js';
import { searchCodebase } from '../../../src/services/smart-file-read/search.js';

const source = [
  'typealias Handler = (String) -> Void',
  '',
  'public typealias Pair<T> = (T, T)',
  '',
  'struct Point {',
  '    typealias Scalar = Double',
  '    var x: Scalar',
  '}',
].join('\n');
const filename = 'Types.swift';

describe('swift-typealias', () => {
  test('a typealias is a type in the outline, also inside a type', () => {
    const file = parseFile(source, filename);
    expect(file.symbols.map(s => [s.name, s.kind])).toEqual([
      ['Handler', 'type'], ['Pair', 'type'], ['Point', 'class'],
    ]);
    expect(file.symbols[1].signature).toBe('public typealias Pair<T> = (T, T)');
    expect(file.symbols[2].children?.map(s => [s.name, s.kind])).toEqual([['Scalar', 'type']]);
  }, 120000);

  test('search and unfold find a typealias', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'cm-swift-typealias-'));
    try {
      writeFileSync(join(dir, filename), source);
      const result = await searchCodebase(dir, 'Handler');
      expect(result.matchingSymbols.map(s => s.symbolName)).toEqual(['Handler']);
      expect(unfoldSymbol(source, filename, 'Pair')).toContain('(T, T)');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 120000);
});
