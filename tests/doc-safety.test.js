import { describe, it, expect } from 'vitest';
import {
  findUnsafeDocHtml,
  assertDocHtmlSafe,
} from '../scripts/doc-safety.js';

describe('doc HTML safety - malicious content is rejected', () => {
  const malicious = [
    ['<script> element', '<p>hi</p><script>alert(1)</script>'],
    ['<script> with attributes', '<script src="https://evil.example/x.js">'],
    ['<iframe> element', '<iframe src="https://evil.example"></iframe>'],
    ['<object> element', '<object data="x.svg"></object>'],
    ['<embed> element', '<embed src="x.svg">'],
    ['<embed> self-closing without space', '<embed/src=x>'],
    ['<base> element', '<base href="https://evil.example/">'],
    ['<form> element', '<form action="https://evil.example"><input></form>'],
    ['<meta http-equiv refresh', '<meta http-equiv="refresh" content="0;url=https://evil.example">'],
    ['inline handler after whitespace', '<img src="x.png" onerror=alert(1)>'],
    ['inline handler after slash (no whitespace)', '<svg/onload=alert(1)>'],
    ['inline handler after quote', '<img src="x"onerror=alert(1)>'],
    ['javascript: href', '<a href="javascript:alert(1)">x</a>'],
    ['javascript: href with whitespace', '<a href = " javascript:alert(1)">x</a>'],
    ['javascript: src', '<img src="javascript:alert(1)">'],
    ['data:text/html URL', '<a href="data:text/html,<script>alert(1)</script>">x</a>'],
    ['data:image/svg+xml URL', '<img src="data:image/svg+xml;base64,PHN2Zz4=">'],
    ['data: URL on object data attr', '<object data="data:text/html,x"></object>'],
  ];

  for (const [label, html] of malicious) {
    it(`rejects ${label}`, () => {
      expect(findUnsafeDocHtml(html).length).toBeGreaterThan(0);
      expect(() => assertDocHtmlSafe(html, 'test.md')).toThrow(/Unsafe HTML/);
    });
  }
});

describe('doc HTML safety - legitimate docs content passes', () => {
  const safe = [
    ['plain markup', '<p>Install with <code>npm install</code></p>'],
    ['tables', '<table><tr><td>Prop</td><td>Type</td></tr></table>'],
    [
      'tab widgets with ARIA',
      '<div role="tablist"><button role="tab" aria-selected="true" data-pm="npm">npm</button></div>',
    ],
    [
      'escaped code samples',
      '<pre><code class="hljs">&lt;script&gt;alert(1)&lt;/script&gt; &lt;img onerror=x&gt;</code></pre>',
    ],
    ['https links', '<a href="https://github.com/uiuxassets/uiuxicons">GitHub</a>'],
    ['raster data URL image', '<img src="data:image/png;base64,iVBORw0KGgo=">'],
    ['text mentioning "on" words', '<p>Icons render on any background. Version = 0.4.0</p>'],
    ['attribute containing the word data', '<div data-variant="line-regular" class="active"></div>'],
  ];

  for (const [label, html] of safe) {
    it(`accepts ${label}`, () => {
      expect(findUnsafeDocHtml(html)).toEqual([]);
      expect(() => assertDocHtmlSafe(html, 'test.md')).not.toThrow();
    });
  }
});
