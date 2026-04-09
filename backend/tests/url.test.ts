import { appendQueryParam } from '../src/utils/url';

describe('appendQueryParam', () => {
  it('appends the first query parameter with ?', () => {
    expect(appendQueryParam('https://example.com/executor/tariffs', 'payment_id', 'abc123')).toBe(
      'https://example.com/executor/tariffs?payment_id=abc123'
    );
  });

  it('appends additional query parameters with &', () => {
    expect(
      appendQueryParam('https://example.com/profile/balance?tab=history', 'payment_id', 'abc123')
    ).toBe('https://example.com/profile/balance?tab=history&payment_id=abc123');
  });

  it('preserves hash fragments', () => {
    expect(
      appendQueryParam('https://example.com/profile/balance?tab=history#payments', 'payment_id', 'abc123')
    ).toBe('https://example.com/profile/balance?tab=history&payment_id=abc123#payments');
  });
});
