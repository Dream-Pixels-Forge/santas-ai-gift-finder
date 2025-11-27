import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import ResultList from '../../ResultList';
import { createMockGifts } from '../../test-utils';

expect.extend(toHaveNoViolations);

describe('ResultList Component', () => {
  const mockGifts = createMockGifts(3);
  const mockFilters = { price: [0, 500] };

  describe('Rendering', () => {
    it('renders gift cards when results are provided', () => {
      render(<ResultList results={mockGifts} filters={mockFilters} />);

      expect(screen.getByText('Test Gift 1')).toBeInTheDocument();
      expect(screen.getByText('Test Gift 2')).toBeInTheDocument();
      expect(screen.getByText('Test Gift 3')).toBeInTheDocument();
    });

    it('renders empty state when no results', () => {
      render(<ResultList results={[]} filters={mockFilters} />);

      expect(screen.getByText('No gifts found. Try a different query!')).toBeInTheDocument();
      expect(screen.getByText('🎁')).toBeInTheDocument();
    });

    it('renders loading skeletons when isLoading is true', () => {
      render(<ResultList results={[]} filters={mockFilters} isLoading={true} />);

      // Should render 6 skeleton cards
      const skeletons = screen.getAllByRole('status');
      expect(skeletons).toHaveLength(6);
    });

    it('renders filtered empty state when filters exclude all results', () => {
      const highPriceFilter = { price: [200, 500] };
      render(<ResultList results={mockGifts} filters={highPriceFilter} />);

      expect(screen.getByText('No gifts match your filter criteria. Try adjusting your filters!')).toBeInTheDocument();
      expect(screen.getByText('🔍')).toBeInTheDocument();
    });
  });

  describe('Filtering Logic', () => {
    it('filters gifts by price range correctly', () => {
      const mixedPriceGifts = [
        { ...mockGifts[0], prices: [{ price: 25 }] }, // Should show
        { ...mockGifts[1], prices: [{ price: 75 }] }, // Should show
        { ...mockGifts[2], prices: [{ price: 150 }] } // Should not show
      ];
      const priceFilter = { price: [20, 100] };

      render(<ResultList results={mixedPriceGifts} filters={priceFilter} />);

      expect(screen.getByText('Test Gift 1')).toBeInTheDocument();
      expect(screen.getByText('Test Gift 2')).toBeInTheDocument();
      expect(screen.queryByText('Test Gift 3')).not.toBeInTheDocument();
    });

    it('includes gifts with no prices in results', () => {
      const giftsWithNoPrices = [
        { ...mockGifts[0], prices: null },
        { ...mockGifts[1], prices: [] }
      ];

      render(<ResultList results={giftsWithNoPrices} filters={mockFilters} />);

      expect(screen.getByText('Test Gift 1')).toBeInTheDocument();
      expect(screen.getByText('Test Gift 2')).toBeInTheDocument();
    });

    it('handles gifts with multiple prices correctly', () => {
      const giftWithMultiplePrices = {
        ...mockGifts[0],
        prices: [
          { price: 25 }, // Within range
          { price: 150 } // Outside range
        ]
      };
      const priceFilter = { price: [20, 100] };

      render(<ResultList results={[giftWithMultiplePrices]} filters={priceFilter} />);

      expect(screen.getByText('Test Gift 1')).toBeInTheDocument();
    });

    it('excludes gifts when none of their prices are in range', () => {
      const giftWithMultiplePrices = {
        ...mockGifts[0],
        prices: [
          { price: 150 }, // Outside range
          { price: 200 }  // Outside range
        ]
      };
      const priceFilter = { price: [20, 100] };

      render(<ResultList results={[giftWithMultiplePrices]} filters={priceFilter} />);

      expect(screen.queryByText('Test Gift 1')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<ResultList results={mockGifts} filters={mockFilters} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has correct ARIA attributes', () => {
      render(<ResultList results={mockGifts} filters={mockFilters} />);

      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-label', 'Search results');
      expect(region).toHaveAttribute('aria-live', 'polite');
    });

    it('renders semantic list structure', () => {
      render(<ResultList results={mockGifts} filters={mockFilters} />);

      expect(screen.getByRole('region')).toBeInTheDocument();
      expect(screen.getAllByRole('article')).toHaveLength(3);
    });
  });

  describe('Performance', () => {
    it('memoizes filtered results', () => {
      const { rerender } = render(<ResultList results={mockGifts} filters={mockFilters} />);

      // First render
      expect(screen.getByText('Test Gift 1')).toBeInTheDocument();

      // Re-render with same props - should not cause unnecessary re-computation
      rerender(<ResultList results={mockGifts} filters={mockFilters} />);
      expect(screen.getByText('Test Gift 1')).toBeInTheDocument();
    });

    it('re-filters when results change', () => {
      const { rerender } = render(<ResultList results={mockGifts} filters={mockFilters} />);

      expect(screen.getByText('Test Gift 1')).toBeInTheDocument();
      expect(screen.getByText('Test Gift 2')).toBeInTheDocument();
      expect(screen.getByText('Test Gift 3')).toBeInTheDocument();

      // Change results
      const newGifts = [mockGifts[0]];
      rerender(<ResultList results={newGifts} filters={mockFilters} />);

      expect(screen.getByText('Test Gift 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Gift 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Gift 3')).not.toBeInTheDocument();
    });

    it('re-filters when filters change', () => {
      const { rerender } = render(<ResultList results={mockGifts} filters={mockFilters} />);

      expect(screen.getByText('Test Gift 1')).toBeInTheDocument();
      expect(screen.getByText('Test Gift 2')).toBeInTheDocument();
      expect(screen.getByText('Test Gift 3')).toBeInTheDocument();

      // Apply restrictive filter
      const restrictiveFilter = { price: [200, 500] };
      rerender(<ResultList results={mockGifts} filters={restrictiveFilter} />);

      expect(screen.queryByText('Test Gift 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Gift 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Gift 3')).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('renders correct number of skeleton cards', () => {
      render(<ResultList results={[]} filters={mockFilters} isLoading={true} />);

      const skeletonCards = screen.getAllByRole('status');
      expect(skeletonCards).toHaveLength(6);
    });

    it('prioritizes loading state over empty state', () => {
      render(<ResultList results={[]} filters={mockFilters} isLoading={true} />);

      expect(screen.getAllByRole('status')).toHaveLength(6);
      expect(screen.queryByText('No gifts found')).not.toBeInTheDocument();
    });
  });

  describe('PropTypes and Default Props', () => {
    it('renders with required props', () => {
      expect(() => render(<ResultList results={mockGifts} filters={mockFilters} />)).not.toThrow();
    });

    it('uses default props correctly', () => {
      render(<ResultList results={mockGifts} />);

      // Should use default filters
      expect(screen.getByText('Test Gift 1')).toBeInTheDocument();
    });

    it('handles undefined results gracefully', () => {
      render(<ResultList results={undefined} filters={mockFilters} />);

      expect(screen.getByText('No gifts found. Try a different query!')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles null results gracefully', () => {
      render(<ResultList results={null} filters={mockFilters} />);

      expect(screen.getByText('No gifts found. Try a different query!')).toBeInTheDocument();
    });

    it('handles malformed gift objects', () => {
      const malformedGifts = [
        { id: 1, name: 'Valid Gift', prices: [{ price: 30 }] },
        { id: 2 }, // Missing required properties
        null // Null gift
      ];

      render(<ResultList results={malformedGifts} filters={mockFilters} />);

      // Should render the valid gift and handle malformed ones gracefully
      expect(screen.getByText('Valid Gift')).toBeInTheDocument();
    });

    it('handles empty filters object', () => {
      render(<ResultList results={mockGifts} filters={{}} />);

      // Should use default price range [0, 500]
      expect(screen.getByText('Test Gift 1')).toBeInTheDocument();
    });
  });
});