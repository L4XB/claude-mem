import { describe, expect } from 'bun:test';
import { nativeTest as test } from './native-prerequisite.js';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseFile, unfoldSymbol } from '../../../src/services/smart-file-read/parser.js';
import { searchCodebase } from '../../../src/services/smart-file-read/search.js';

const source = [
  'package demo;',
  '',
  '@Retention(RUNTIME)',
  'public @interface Cached {',
  '    int seconds() default 60;',
  '}',
  '',
  'public interface Repo { String find(int id); }',
].join('\n');
const filename = 'Cached.java';

describe('java-annotation-types', () => {
  test('an annotation type is an interface in the outline', () => {
    const file = parseFile(source, filename);
    expect(file.symbols.map(s => [s.name, s.kind])).toEqual([
      ['Cached', 'interface'], ['Repo', 'interface'],
    ]);
    expect(file.symbols[0].signature).toBe('@Retention(RUNTIME) public @interface Cached');
  }, 120000);

  test('search and unfold find an annotation type', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'cm-java-annotation-types-'));
    try {
      writeFileSync(join(dir, filename), source);
      const result = await searchCodebase(dir, 'Cached');
      expect(result.matchingSymbols.map(s => s.symbolName)).toEqual(['Cached']);
      expect(unfoldSymbol(source, filename, 'Cached')).toContain('int seconds() default 60;');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 120000);
});
