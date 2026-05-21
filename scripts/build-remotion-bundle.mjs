// Pre-bundles the Remotion composition at Docker build time so the running
// container doesn't need to spin up webpack + bundling memory at first
// render. Cuts ~200 MB peak runtime memory and ~30 s off the first request.

import { bundle } from '@remotion/bundler';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'remotion-bundle');

console.log('Bundling Remotion entry → ' + outDir);
const t0 = Date.now();

await bundle({
  entryPoint: path.join(root, 'remotion', 'index.ts'),
  outDir,
  webpackOverride: (config) => ({
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...(config.resolve?.alias || {}),
        '@': root,
      },
    },
  }),
});

console.log(`Bundle ready in ${((Date.now() - t0) / 1000).toFixed(1)}s.`);
