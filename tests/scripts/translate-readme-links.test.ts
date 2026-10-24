import { describe, it, expect } from 'bun:test';
import { join } from 'path';
import { rebaseRelativeLinks } from '../../scripts/translate-readme/index.ts';

/**
 * `npm run translate-readme` writes the translations to docs/i18n while the
 * source README sits at the repo root, so every relative link the model copies
 * verbatim (LICENSE, docs/..., the language switcher) has to be re-pointed.
 */
const root = join('/', 'repo');
const i18n = join(root, 'docs', 'i18n');

describe('rebaseRelativeLinks', () => {
  it('re-points Markdown and HTML links of a README translated into docs/i18n', () => {
    const readme = [
      '<a href="docs/i18n/README.de.md">Deutsch</a>',
      '<a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL-blue.svg"></a>',
      'See [the IP boundary](docs/ip-boundary.md#scope) and [all docs](docs/).',
    ].join('\n');

    expect(rebaseRelativeLinks(readme, root, i18n)).toBe([
      '<a href="README.de.md">Deutsch</a>',
      '<a href="../../LICENSE"><img src="https://img.shields.io/badge/license-AGPL-blue.svg"></a>',
      'See [the IP boundary](../ip-boundary.md#scope) and [all docs](../).',
    ].join('\n'));
  });

  it('leaves URLs, anchors and root-relative links alone', () => {
    const text = '[site](https://claude-mem.ai) [mail](mailto:a@b.c) [top](#install) [root](/docs/x.md)';

    expect(rebaseRelativeLinks(text, root, i18n)).toBe(text);
  });

  it('changes nothing when the output stays next to the source', () => {
    const text = '[license](LICENSE) <a href="docs/i18n/README.de.md">';

    expect(rebaseRelativeLinks(text, root, root)).toBe(text);
  });
});
