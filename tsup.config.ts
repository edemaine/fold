import { defineConfig } from 'tsup';
import civetPlugin from '@danielx/civet/esbuild';

export default defineConfig({
  entryPoints: ['src/index.civet', 'test/convert.test.civet'],
  esbuildPlugins: [
    civetPlugin({
      dts: false,
    }),
  ],
  format: ['cjs'],
  target: 'es2021',
});
