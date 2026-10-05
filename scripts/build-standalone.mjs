// Builds dist-standalone/mycohub.html: the whole app (JS, CSS, icons) in one file
// that can be opened directly or hosted anywhere that serves a single HTML page.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

execSync('npx vite build --mode standalone', { stdio: 'inherit' });

const out = 'dist-standalone';
const assets = join(out, 'assets');
const files = readdirSync(assets);
const js = files.filter((f) => f.endsWith('.js')).map((f) => readFileSync(join(assets, f), 'utf8')).join('\n');
const css = files.filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(assets, f), 'utf8')).join('\n');
const icon = 'data:image/svg+xml;base64,' + readFileSync('public/favicon.svg').toString('base64');

// Keep "</script" and "</style" inside the bundles from closing the inline tags early.
const safeJs = js.replace(/<\/script/gi, '<\\/script');
const safeCss = css.replace(/<\/style/gi, '<\\/style');

const html = `<title>MycoHub Research</title>
<meta name="theme-color" content="#059669">
<link rel="icon" type="image/svg+xml" href="${icon}">
<style>${safeCss}</style>
<div id="root"></div>
<script type="module">${safeJs}</script>
`;

writeFileSync(join(out, 'mycohub.html'), html);
console.log(`Wrote ${join(out, 'mycohub.html')} (${(html.length / 1024).toFixed(0)} KiB)`);
