import type { Assertion, AsymmetricMatchersContaining } from 'vitest';
import type { Iterable } from 'jest-matcher-deep-close-to/lib/types';

interface CustomMatchers<R = unknown> {
  toBeDeepCloseTo(
    received: Iterable,
    expected: Iterable,
    precision?: number
  ): R;
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
