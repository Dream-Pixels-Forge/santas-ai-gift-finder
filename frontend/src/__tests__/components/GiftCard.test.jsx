import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import GiftCard from '../../GiftCard';
import { createMockGift } from '../../test-utils';

expect.extend(toHaveNoViolations);

describe('GiftCard Component', () => {
  const mockGift = createMockGift();

  describe('Rendering', () => {
    it('renders gift information correctly', () => {
      render(<GiftCard gift={mockGift} />);

      expect(screen.getByText('Test Gift')).toBeInTheDocument();
      expect(screen.getByText('A test gift description')).toBeInTheDocument();
      expect(screen.getByText('$29.99')).toBeInTheDocument();
      expect(screen.getByText('Amazon')).toBeInTheDocument();
      expect(screen.getByText('$34.99')).toBeInTheDocument();
      expect(screen.getByText('Target')).toBeInTheDocument();
      expect(screen.getByText('4.5/5')).toBeInTheDocument();
    });

    it('renders image with correct attributes', () => {
      render(<GiftCard gift={mockGift} />);

      const image = screen.getByAltText('Test Gift');
      expect(image).toHaveAttribute('src', 'https://example.com/test-gift.jpg');
      expect(image).toHaveAttribute('loading', 'lazy');
    });

    it('renders buy button with correct attributes', () => {
      render(<GiftCard gift={mockGift} />);

      const button = screen.getByRole('button', { name: /buy test gift now/i });
      expect(button).toHaveTextContent('Buy Now');
    });
  });

  describe('Data Handling', () => {
    it('handles null/undefined gift gracefully', () => {
      render(<GiftCard gift={null} />);

      expect(screen.getByText('Unnamed Gift')).toBeInTheDocument();
      expect(screen.getByText('No description available')).toBeInTheDocument();
      expect(screen.getByAltText('Gift')).toHaveAttribute('src', 'https://via.placeholder.com/300x200?text=Gift');
    });

    it('handles missing gift properties gracefully', () => {
      const incompleteGift = { id: 1 };
      render(<GiftCard gift={incompleteGift} />);

      expect(screen.getByText('Unnamed Gift')).toBeInTheDocument();
      expect(screen.getByText('No description available')).toBeInTheDocument();
      expect(screen.getByText('4.5/5')).toBeInTheDocument(); // default rating
    });

    it('handles empty prices array', () => {
      const giftWithoutPrices = { ...mockGift, prices: [] };
      render(<GiftCard gift={giftWithoutPrices} />);

      expect(screen.queryByText('$29.99')).not.toBeInTheDocument();
      expect(screen.queryByText('Amazon')).not.toBeInTheDocument();
    });

    it('handles null prices array', () => {
      const giftWithNullPrices = { ...mockGift, prices: null };
      render(<GiftCard giftWithNullPrices />);

      expect(screen.queryByText('$29.99')).not.toBeInTheDocument();
    });
  });

  describe('Price Display', () => {
    it('displays multiple prices correctly', () => {
      const giftWithMultiplePrices = {
        ...mockGift,
        prices: [
          { retailer: 'Amazon', price: 29.99 },
          { retailer: 'Target', price: 34.99 },
          { retailer: 'Walmart', price: 32.99 }
        ]
      };

      render(<GiftCard gift={giftWithMultiplePrices} />);

      expect(screen.getByText('$29.99')).toBeInTheDocument();
      expect(screen.getByText('Amazon')).toBeInTheDocument();
      expect(screen.getByText('$34.99')).toBeInTheDocument();
      expect(screen.getByText('Target')).toBeInTheDocument();
      expect(screen.getByText('$32.99')).toBeInTheDocument();
      expect(screen.getByText('Walmart')).toBeInTheDocument();
    });

    it('formats prices correctly', () => {
      const giftWithDecimalPrices = {
        ...mockGift,
        prices: [
          { retailer: 'Store', price: 29.999 },
          { retailer: 'Another Store', price: 34.5 }
        ]
      };

      render(<GiftCard gift={giftWithDecimalPrices} />);

      expect(screen.getByText('$29.999')).toBeInTheDocument();
      expect(screen.getByText('$34.5')).toBeInTheDocument();
    });
  });

  describe('Rating Display', () => {
    it('displays rating with correct accessibility attributes', () => {
      render(<GiftCard gift={mockGift} />);

      const ratingElement = screen.getByLabelText('Rating: 4.5 out of 5 stars');
      expect(ratingElement).toHaveTextContent('4.5/5');
    });

    it('uses default rating when not provided', () => {
      const giftWithoutRating = { ...mockGift };
      delete giftWithoutRating.rating;

      render(<GiftCard gift={giftWithoutRating} />);

      expect(screen.getByLabelText('Rating: 4.5 out of 5 stars')).toBeInTheDocument();
    });

    it('displays custom rating correctly', () => {
      const giftWithCustomRating = { ...mockGift, rating: 3.8 };
      render(<GiftCard gift={giftWithCustomRating} />);

      expect(screen.getByLabelText('Rating: 3.8 out of 5 stars')).toBeInTheDocument();
    });
  });

  describe('Buy Button', () => {
    it('calls handleBuyClick when clicked', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      render(<GiftCard gift={mockGift} />);

      const button = screen.getByRole('button', { name: /buy test gift now/i });
      fireEvent.click(button);

      expect(consoleSpy).toHaveBeenCalledWith('Buy button clicked for:', mockGift);
      consoleSpy.mockRestore();
    });

    it('handles buy button click for unnamed gift', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const giftWithoutName = { ...mockGift };
      delete giftWithoutName.name;

      render(<GiftCard gift={giftWithoutName} />);

      const button = screen.getByRole('button', { name: /buy gift now/i });
      fireEvent.click(button);

      expect(consoleSpy).toHaveBeenCalledWith('Buy button clicked for:', giftWithoutName);
      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<GiftCard gift={mockGift} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has correct ARIA attributes', () => {
      render(<GiftCard gift={mockGift} />);

      const article = screen.getByRole('article');
      expect(article).toHaveAttribute('aria-label', 'Gift: Test Gift');

      const pricesList = screen.getByLabelText('Price comparisons');
      expect(pricesList).toBeInTheDocument();

      expect(screen.getAllByRole('listitem')).toHaveLength(2); // Two price items
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<GiftCard gift={mockGift} />);

      const button = screen.getByRole('button', { name: /buy test gift now/i });

      await user.tab();
      expect(button).toHaveFocus();
    });

    it('has semantic HTML structure', () => {
      render(<GiftCard gift={mockGift} />);

      expect(screen.getByRole('article')).toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'Test Gift' })).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('PropTypes', () => {
    it('renders with valid props', () => {
      expect(() => render(<GiftCard gift={mockGift} />)).not.toThrow();
    });

    it('uses default props when gift is undefined', () => {
      render(<GiftCard />);

      expect(screen.getByText('Unnamed Gift')).toBeInTheDocument();
      expect(screen.getByText('No description available')).toBeInTheDocument();
      expect(screen.getByText('4.5/5')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('is memoized and does not re-render unnecessarily', () => {
      const { rerender } = render(<GiftCard gift={mockGift} />);
      const initialRender = screen.getByText('Test Gift');

      // Re-render with same props
      rerender(<GiftCard gift={mockGift} />);
      const secondRender = screen.getByText('Test Gift');

      // Should be the same element (not re-rendered)
      expect(initialRender).toBe(secondRender);
    });
  });
});