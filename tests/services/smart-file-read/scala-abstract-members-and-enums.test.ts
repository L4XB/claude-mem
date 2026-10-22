import { describe, expect } from 'bun:test';
import { nativeTest as test } from './native-prerequisite.js';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseFile } from '../../../src/services/smart-file-read/parser.js';
import { searchCodebase } from '../../../src/services/smart-file-read/search.js';

const source = [
  'trait Shape {',
  '  def area: Double',
  '  def scale(f: Double): Shape',
  '  def describe: String = "shape"',
  '}',
  'abstract class Base {',
  '  def id: Int',
  '  def name(): String = "base"',
  '}',
  'enum Color(val rgb: Int):',
  '  case Red extends Color(0xff0000)',
  '  case Green extends Color(0x00ff00)',
  '  def hex: String = rgb.toHexString',
].join('\n');
const filename = 'Shapes.scala';

describe('scala-abstract-members-and-enums', () => {
  test('abstract members and a Scala 3 enum are in the outline', () => {
    const file = parseFile(source, filename);
    expect(file.symbols.map(s => [s.name, s.kind])).toEqual([
      ['Shape', 'trait'], ['Base', 'class'], ['Color', 'enum'],
    ]);
    expect(file.symbols[0].children?.map(s => [s.name, s.signature])).toEqual([
      ['area', 'def area: Double'],
      ['scale', 'def scale(f: Double): Shape'],
      ['describe', 'def describe: String = "shape"'],
    ]);
    expect(file.symbols[1].children?.map(s => s.name)).toEqual(['id', 'name']);
    expect(file.symbols[2].signature).toBe('enum Color(val rgb: Int)');
    expect(file.symbols[2].children?.map(s => s.name)).toEqual(['hex']);
  }, 120000);

  test('search names an enum method through its enum', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'cm-scala-enums-'));
    try {
      writeFileSync(join(dir, filename), source);
      const result = await searchCodebase(dir, 'hex');
      expect(result.matchingSymbols.map(s => s.symbolName)).toEqual(['Color.hex']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 120000);
});
