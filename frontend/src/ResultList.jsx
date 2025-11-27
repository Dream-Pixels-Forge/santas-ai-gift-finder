import React, { memo, useMemo } from 'react';
import GiftCard from './GiftCard';
import SkeletonCard from './components/SkeletonCard';
import PropTypes from 'prop-types';

/**
 * ResultsList component to display filtered gift results
 * @param {Object} props - Component props
 * @param {Array} props.results - Array of gift results
 * @param {Object} props.filters - Filter configuration
 * @returns {JSX.Element} The rendered ResultsList component
 */
const ResultsList = memo(({ results, filters, isLoading }) => {
  /**
   * Filters gifts based on price range
   * @param {Array} gifts - Array of gifts to filter
   * @param {Object} filterConfig - Filter configuration with price range
   * @returns {Array} Filtered gifts
   */
  const filterGifts = (gifts, filterConfig) => {
    if (!gifts || gifts.length === 0) return [];
    
    const [minPrice, maxPrice] = filterConfig?.price || [0, 500];
    
    return gifts.filter(gift => {
      if (!gift?.prices || gift.prices.length === 0) return true;
      
      // Check if any price falls within the filter range
      return gift.prices.some(price => {
        const priceValue = parseFloat(price.price);
        return priceValue >= minPrice && priceValue <= maxPrice;
      });
    });
  };

  const filteredResults = useMemo(() => filterGifts(results, filters), [results, filters]);

  /**
   * Renders loading skeletons
   * @returns {JSX.Element[]} Array of skeleton cards
   */
  const renderSkeletons = () => {
    return Array.from({ length: 6 }, (_, index) => (
      <SkeletonCard key={`skeleton-${index}`} />
    ));
  };

  return (
    <div
      className="results gift-grid"
      role="region"
      aria-label="Search results"
      aria-live="polite"
    >
      {isLoading ? (
        renderSkeletons()
      ) : results.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎁</div>
          <p className="empty-state-text">No gifts found. Try a different query!</p>
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <p className="empty-state-text">No gifts match your filter criteria. Try adjusting your filters!</p>
        </div>
      ) : (
        filteredResults.map((gift) => (
          <GiftCard
            key={gift?.id || `${gift?.name}-${Math.random()}`}
            gift={gift}
          />
        ))
      )}
    </div>
  );
});

ResultsList.propTypes = {
  results: PropTypes.arrayOf(PropTypes.object).isRequired,
  filters: PropTypes.shape({
    price: PropTypes.arrayOf(PropTypes.number),
    age: PropTypes.arrayOf(PropTypes.number)
  }),
  isLoading: PropTypes.bool
};

ResultsList.defaultProps = {
  isLoading: false
};

ResultsList.defaultProps = {
  filters: {
    price: [0, 500],
    age: [0, 100]
  }
};

ResultsList.displayName = 'ResultsList';

export default ResultsList;