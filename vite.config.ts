import { defineConfig } from 'vite';
import civetPlugin from '@danielx/civet/vite';
import { resolve } from 'path';
import { builtinModules as nodeBuiltins } from 'module';

export default defineConfig({
  base: '/fold/',
  build: {
    watch: {
      include: ['**/*.civet'],
    },
    lib: {
      entry: [
        'index',
        'convert',
        'file',
        'filter',
        'viewer',
        'oripa',
        'geom',
      ].map(name => resolve(__dirname, `src/${name}.civet`)),
      name: 'Fold',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      // exclude node internals
      external: nodeBuiltins,
    },
  },
  test: {
    include: ['test/**/*.test.civet'],
  },
  plugins: [
    civetPlugin({
      ts: 'esbuild',
    }),
  ],
});
