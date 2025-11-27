import { formatPrice, filterGifts } from '../../utils/helpers';

describe('Helper Functions', () => {
  describe('formatPrice', () => {
    it('formats price correctly with dollar sign and two decimal places', () => {
      expect(formatPrice(29.99)).toBe('$29.99');
      expect(formatPrice(10)).toBe('$10.00');
      expect(formatPrice(0)).toBe('$0.00');
    });

    it('handles string inputs', () => {
      expect(formatPrice('29.99')).toBe('$29.99');
      expect(formatPrice('10')).toBe('$10.00');
    });

    it('handles decimal precision correctly', () => {
      expect(formatPrice(29.999)).toBe('$30.00');
      expect(formatPrice(29.994)).toBe('$29.99');
    });

    it('handles edge cases', () => {
      expect(formatPrice(null)).toBe('$NaN');
      expect(formatPrice(undefined)).toBe('$NaN');
      expect(formatPrice('')).toBe('$NaN');
    });
  });

  describe('filterGifts', () => {
    const mockGifts = [
      {
        id: 1,
        name: 'Cheap Gift',
        prices: [{ price: 10 }]
      },
      {
        id: 2,
        name: 'Medium Gift',
        prices: [{ price: 50 }]
      },
      {
        id: 3,
        name: 'Expensive Gift',
        prices: [{ price: 100 }]
      },
      {
        id: 4,
        name: 'No Price Gift',
        prices: []
      },
      {
        id: 5,
        name: 'Null Price Gift',
        prices: null
      }
    ];

    it('filters gifts within price range correctly', () => {
      const filters = { price: [20, 80] };
      const result = filterGifts(mockGifts, filters);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Medium Gift');
    });

    it('includes gifts with no prices in results', () => {
      const filters = { price: [0, 200] };
      const result = filterGifts(mockGifts, filters);

      const noPriceGift = result.find(gift => gift.name === 'No Price Gift');
      const nullPriceGift = result.find(gift => gift.name === 'Null Price Gift');

      expect(noPriceGift).toBeDefined();
      expect(nullPriceGift).toBeDefined();
    });

    it('handles empty filters object', () => {
      const result = filterGifts(mockGifts, {});

      expect(result).toHaveLength(mockGifts.length);
    });

    it('handles null or undefined filters', () => {
      expect(() => filterGifts(mockGifts, null)).not.toThrow();
      expect(() => filterGifts(mockGifts, undefined)).not.toThrow();
    });

    it('handles empty gifts array', () => {
      const filters = { price: [0, 100] };
      const result = filterGifts([], filters);

      expect(result).toHaveLength(0);
    });

    it('handles null or undefined gifts array', () => {
      const filters = { price: [0, 100] };

      expect(() => filterGifts(null, filters)).not.toThrow();
      expect(() => filterGifts(undefined, filters)).not.toThrow();
    });

    it('filters correctly with minimum price only', () => {
      const filters = { price: [50, 500] };
      const result = filterGifts(mockGifts, filters);

      expect(result).toHaveLength(2); // Medium and Expensive gifts
      expect(result.map(g => g.name)).toEqual(['Medium Gift', 'Expensive Gift']);
    });

    it('filters correctly with maximum price only', () => {
      const filters = { price: [0, 50] };
      const result = filterGifts(mockGifts, filters);

      expect(result).toHaveLength(2); // Cheap and Medium gifts
      expect(result.map(g => g.name)).toEqual(['Cheap Gift', 'Medium Gift']);
    });

    it('handles gifts with multiple prices', () => {
      const giftWithMultiplePrices = {
        id: 6,
        name: 'Multi Price Gift',
        prices: [
          { price: 25 },
          { price: 75 },
          { price: 150 }
        ]
      };

      const filters = { price: [20, 100] };
      const result = filterGifts([giftWithMultiplePrices], filters);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Multi Price Gift');
    });

    it('excludes gifts when none of their prices are in range', () => {
      const giftWithMultiplePrices = {
        id: 6,
        name: 'Multi Price Gift',
        prices: [
          { price: 150 },
          { price: 200 }
        ]
      };

      const filters = { price: [20, 100] };
      const result = filterGifts([giftWithMultiplePrices], filters);

      expect(result).toHaveLength(0);
    });
  });
});