import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import App from '../../App';

expect.extend(toHaveNoViolations);

describe('Filter Flow Integration', () => {
  describe('Complete Filter Application Flow', () => {
    it('applies price filters and updates results immediately', async () => {
      const user = userEvent.setup();
      render(<App />);

      // First perform a search to get results
      const searchInput = screen.getByPlaceholderText(/a gift for my 12-year-old niece/i);
      await user.type(searchInput, 'art supplies');

      const searchButton = screen.getByRole('button', { name: /find gifts/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Test Gift 1')).toBeInTheDocument();
      });

      // Verify initial results (all gifts shown)
      expect(screen.getAllByRole('article')).toHaveLength(5);

      // Apply price filter - select $50 option
      const priceSelect = screen.getByLabelText('Price range filter');
      await user.selectOptions(priceSelect, ['$50']);

      // Results should be filtered
      await waitFor(() => {
        const visibleGifts = screen.getAllByRole('article');
        expect(visibleGifts.length).toBeLessThan(5);
      });
    });

    it('combines multiple filter criteria correctly', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Perform search
      const searchInput = screen.getByPlaceholderText(/a gift for my 12-year-old niece/i);
      await user.type(searchInput, 'gifts');

      const searchButton = screen.getByRole('button', { name: /find gifts/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Test Gift 1')).toBeInTheDocument();
      });

      // Apply multiple price filters
      const priceSelect = screen.getByLabelText('Price range filter');
      await user.selectOptions(priceSelect, ['$50', '$100']);

      // Should filter to gifts within $50-$100 range
      await waitFor(() => {
        const visibleGifts = screen.getAllByRole('article');
        // Mock data has gifts at $30, $60, $80, $110, $140
        // $50-$100 range should include $60 and $80
        expect(visibleGifts.length).toBe(2);
      });
    });

    it('shows appropriate message when no results match filters', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Perform search
      const searchInput = screen.getByPlaceholderText(/a gift for my 12-year-old niece/i);
      await user.type(searchInput, 'gifts');

      const searchButton = screen.getByRole('button', { name: /find gifts/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Test Gift 1')).toBeInTheDocument();
      });

      // Apply very restrictive filter
      const priceSelect = screen.getByLabelText('Price range filter');
      await user.selectOptions(priceSelect, ['$500+']);

      // Should show filter empty state
      await waitFor(() => {
        expect(screen.getByText('No gifts match your filter criteria. Try adjusting your filters!')).toBeInTheDocument();
        expect(screen.getByText('🔍')).toBeInTheDocument();
      });
    });
  });

  describe('Filter State Management', () => {
    it('maintains filter state across searches', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Apply filter first
      const priceSelect = screen.getByLabelText('Price range filter');
      await user.selectOptions(priceSelect, ['$100']);

      // Perform search
      const searchInput = screen.getByPlaceholderText(/a gift for my 12-year-old niece/i);
      await user.type(searchInput, 'gifts');

      const searchButton = screen.getByRole('button', { name: /find gifts/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Test Gift 1')).toBeInTheDocument();
      });

      // Results should be filtered
      const visibleGifts = screen.getAllByRole('article');
      expect(visibleGifts.length).toBeLessThan(5);
    });

    it('clears filters appropriately', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Apply filter
      const priceSelect = screen.getByLabelText('Price range filter');
      await user.selectOptions(priceSelect, ['$50']);

      // Perform search
      const searchInput = screen.getByPlaceholderText(/a gift for my 12-year-old niece/i);
      await user.type(searchInput, 'gifts');

      const searchButton = screen.getByRole('button', { name: /find gifts/i });
      await user.click(searchButton);

      await waitFor(() => {
        const filteredGifts = screen.getAllByRole('article');
        expect(filteredGifts.length).toBeLessThan(5);
      });

      // Clear filter (select no options)
      await user.selectOptions(priceSelect, []);

      // Results should show all gifts again
      await waitFor(() => {
        expect(screen.getAllByRole('article')).toHaveLength(5);
      });
    });
  });

  describe('Filter UI Behavior', () => {
    it('updates filter display when selections change', async () => {
      const user = userEvent.setup();
      render(<App />);

      const priceSelect = screen.getByLabelText('Price range filter');

      // Select single option
      await user.selectOptions(priceSelect, ['$50']);
      expect(priceSelect).toHaveValue('50');

      // Select multiple options
      await user.selectOptions(priceSelect, ['$50', '$100']);
      // Note: react-select multi behavior may vary
    });

    it('maintains filter UI state during search operations', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Apply filter
      const priceSelect = screen.getByLabelText('Price range filter');
      await user.selectOptions(priceSelect, ['$100']);

      // Perform search
      const searchInput = screen.getByPlaceholderText(/a gift for my 12-year-old niece/i);
      await user.type(searchInput, 'gifts');

      const searchButton = screen.getByRole('button', { name: /find gifts/i });
      await user.click(searchButton);

      // Filter should maintain its selection during and after search
      expect(priceSelect).toHaveValue('100');

      await waitFor(() => {
        expect(screen.getByText('Test Gift 1')).toBeInTheDocument();
      });

      expect(priceSelect).toHaveValue('100');
    });
  });

  describe('Filter and Search Interaction', () => {
    it('applies filters to new search results', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Apply filter first
      const priceSelect = screen.getByLabelText('Price range filter');
      await user.selectOptions(priceSelect, ['$100']);

      // Perform search
      const searchInput = screen.getByPlaceholderText(/a gift for my 12-year-old niece/i);
      await user.type(searchInput, 'gifts');

      const searchButton = screen.getByRole('button', { name: /find gifts/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Test Gift 1')).toBeInTheDocument();
      });

      // Results should be filtered
      const visibleGifts = screen.getAllByRole('article');
      expect(visibleGifts.length).toBeLessThan(5);
    });

    it('maintains search results when changing filters', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Perform search first
      const searchInput = screen.getByPlaceholderText(/a gift for my 12-year-old niece/i);
      await user.type(searchInput, 'gifts');

      const searchButton = screen.getByRole('button', { name: /find gifts/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getAllByRole('article')).toHaveLength(5);
      });

      // Apply filter
      const priceSelect = screen.getByLabelText('Price range filter');
      await user.selectOptions(priceSelect, ['$50']);

      // Results should be filtered without new search
      await waitFor(() => {
        const visibleGifts = screen.getAllByRole('article');
        expect(visibleGifts.length).toBeLessThan(5);
      });
    });
  });

  describe('Accessibility', () => {
    it('maintains accessibility during filter operations', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Perform search to get results
      const searchInput = screen.getByPlaceholderText(/a gift for my 12-year-old niece/i);
      await user.type(searchInput, 'gifts');

      const searchButton = screen.getByRole('button', { name: /find gifts/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Test Gift 1')).toBeInTheDocument();
      });

      // Check accessibility before filtering
      let results = await axe(screen.getByRole('main'));
      expect(results).toHaveNoViolations();

      // Apply filter
      const priceSelect = screen.getByLabelText('Price range filter');
      await user.selectOptions(priceSelect, ['$100']);

      await waitFor(() => {
        const visibleGifts = screen.getAllByRole('article');
        expect(visibleGifts.length).toBeLessThan(5);
      });

      // Check accessibility after filtering
      results = await axe(screen.getByRole('main'));
      expect(results).toHaveNoViolations();
    });

    it('supports keyboard navigation for filter controls', async () => {
      const user = userEvent.setup();
      render(<App />);

      const priceSelect = screen.getByLabelText('Price range filter');

      // Tab to filter control
      await user.tab();
      await user.tab(); // Skip search input and button
      expect(priceSelect).toHaveFocus();
    });

    it('announces filter changes to screen readers', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Perform search
      const searchInput = screen.getByPlaceholderText(/a gift for my 12-year-old niece/i);
      await user.type(searchInput, 'gifts');

      const searchButton = screen.getByRole('button', { name: /find gifts/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Test Gift 1')).toBeInTheDocument();
      });

      // Apply filter
      const priceSelect = screen.getByLabelText('Price range filter');
      await user.selectOptions(priceSelect, ['$50']);

      // Results region should announce changes
      await waitFor(() => {
        const resultsRegion = screen.getByRole('region', { name: /search results/i });
        expect(resultsRegion).toHaveAttribute('aria-live', 'polite');
      });
    });
  });

  describe('Performance', () => {
    it('filters results quickly without delay', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Perform search
      const searchInput = screen.getByPlaceholderText(/a gift for my 12-year-old niece/i);
      await user.type(searchInput, 'gifts');

      const searchButton = screen.getByRole('button', { name: /find gifts/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getAllByRole('article')).toHaveLength(5);
      });

      // Apply filter and measure time
      const startTime = Date.now();
      const priceSelect = screen.getByLabelText('Price range filter');
      await user.selectOptions(priceSelect, ['$100']);

      await waitFor(() => {
        const visibleGifts = screen.getAllByRole('article');
        expect(visibleGifts.length).toBeLessThan(5);
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Filtering should be near instantaneous (< 100ms)
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty filter selections gracefully', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Perform search
      const searchInput = screen.getByPlaceholderText(/a gift for my 12-year-old niece/i);
      await user.type(searchInput, 'gifts');

      const searchButton = screen.getByRole('button', { name: /find gifts/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getAllByRole('article')).toHaveLength(5);
      });

      // Clear all filters
      const priceSelect = screen.getByLabelText('Price range filter');
      await user.selectOptions(priceSelect, []);

      // Should show all results again
      await waitFor(() => {
        expect(screen.getAllByRole('article')).toHaveLength(5);
      });
    });

    it('handles filter application before search', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Apply filter before searching
      const priceSelect = screen.getByLabelText('Price range filter');
      await user.selectOptions(priceSelect, ['$100']);

      // Perform search
      const searchInput = screen.getByPlaceholderText(/a gift for my 12-year-old niece/i);
      await user.type(searchInput, 'gifts');

      const searchButton = screen.getByRole('button', { name: /find gifts/i });
      await user.click(searchButton);

      // Results should be filtered immediately
      await waitFor(() => {
        const visibleGifts = screen.getAllByRole('article');
        expect(visibleGifts.length).toBeLessThan(5);
      });
    });
  });
});