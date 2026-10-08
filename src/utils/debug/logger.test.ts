import {
 describe, expect, it, vi, beforeEach,
} from 'vitest';

const capture = vi.fn();

// emit() checks shouldCapture() before it ever gets to capture(), & the whole thing sits inside a
// try/catch that swallows everything, so a mock without shouldCapture doesn't fail loudly. it just
// makes every assertion below see zero calls
vi.mock('./teledex', () => ({
  teledex: {
    capture: (...a: unknown[]) => capture(...a),
    shouldCapture: () => true,
  },
}));

const { logger } = await import('./logger');

describe('logger() facade', () => {
  beforeEach(() => capture.mockClear());

  it('preserves the API: scope + 7 level methods', () => {
    const l = logger('@showdex/test');
    expect(l.scope).toBe('@showdex/test');
    (['silly', 'debug', 'verbose', 'info', 'success', 'warn', 'error'] as const)
      .forEach((lvl) => expect(typeof l[lvl]).toBe('function'));
  });

  it('forwards every level call to teledex.capture(level, scope, args)', () => {
    const l = logger('@showdex/test');
    l.warn('uh oh', { x: 1 });
    expect(capture).toHaveBeenCalledWith('warn', '@showdex/test', ['uh oh', { x: 1 }]);
  });

  it('module-level aliases work without a scope', () => {
    logger.info('hello');
    expect(capture).toHaveBeenCalledWith('info', expect.any(String), ['hello']);
  });
});
