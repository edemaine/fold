import { defineConfig } from 'vite';
import civetPlugin from '@danielx/civet/vite';
import { resolve } from 'path';

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
      external: ['fs', 'path'],
    },
  },
  test: {
    include: ['test/**/*.test.civet'],
  },
  plugins: [
    civetPlugin({
      dts: false,
    }),
  ],
});
