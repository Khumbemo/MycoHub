import { describe, expect, it } from 'vitest';
import { fitWithin } from './images';

describe('fitWithin', () => {
  it('scales the longest edge down to the limit', () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 2048, height: 1536 });
    expect(fitWithin(3000, 4000)).toEqual({ width: 1536, height: 2048 });
  });

  it('never scales up', () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });
});
