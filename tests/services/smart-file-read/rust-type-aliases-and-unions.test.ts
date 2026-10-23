import { describe, expect } from 'bun:test';
import { nativeTest as test } from './native-prerequisite.js';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseFile, unfoldSymbol } from '../../../src/services/smart-file-read/parser.js';
import { searchCodebase } from '../../../src/services/smart-file-read/search.js';

const source = [
  'pub type Result<T> = std::result::Result<T, Error>;',
  '',
  'pub struct Point { x: f64 }',
  '',
  'union Bits { i: u32, f: f32 }',
  '',
  'pub enum Kind { A, B }',
].join('\n');
const filename = 'lib.rs';

describe('rust-type-aliases-and-unions', () => {
  test('a type alias is a type and a union is a struct in the outline', () => {
    const file = parseFile(source, filename);
    expect(file.symbols.map(s => [s.name, s.kind, s.exported])).toEqual([
      ['Result', 'type', true], ['Point', 'struct', true], ['Bits', 'struct', false], ['Kind', 'enum', true],
    ]);
    expect(file.symbols[0].signature).toBe('pub type Result<T> = std::result::Result<T, Error>;');
    expect(file.symbols[2].signature).toBe('union Bits');
  }, 120000);

  test('search and unfold find a type alias and a union', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'cm-rust-type-aliases-'));
    try {
      writeFileSync(join(dir, filename), source);
      const result = await searchCodebase(dir, 'Result');
      expect(result.matchingSymbols.map(s => s.symbolName)).toEqual(['Result']);
      expect(unfoldSymbol(source, filename, 'Bits')).toContain('f: f32');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 120000);
});
