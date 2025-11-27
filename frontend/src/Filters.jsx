import React from 'react';
import Select from 'react-select';
import PropTypes from 'prop-types';

/**
 * Filters component for filtering gift results
 * @param {Object} props - Component props
 * @param {Object} props.filters - Current filter configuration
 * @param {Function} props.setFilters - Callback to update filters
 * @returns {JSX.Element} The rendered Filters component
 */
const Filters = ({ filters, setFilters }) => {
  const priceOptions = [
    { value: 0, label: '$0' },
    { value: 50, label: '$50' },
    { value: 100, label: '$100' },
    { value: 150, label: '$150' },
    { value: 200, label: '$200' },
    { value: 500, label: '$500+' }
  ];

  /**
   * Handles price filter change
   * @param {Array} selected - Selected price options
   */
  const handlePriceChange = (selected) => {
    const values = selected.map(o => o.value);
    // Ensure we have min and max values for the range
    const minPrice = values.length > 0 ? Math.min(...values) : 0;
    const maxPrice = values.length > 0 ? Math.max(...values) : 500;
    setFilters({ ...filters, price: [minPrice, maxPrice] });
  };

  return (
    <div className="filters" role="group" aria-label="Gift filters">
      <label htmlFor="price-filter" className="filter-label">
        Price Range:
      </label>
      <Select
        id="price-filter"
        isMulti
        options={priceOptions}
        onChange={handlePriceChange}
        placeholder="Select price range"
        aria-label="Price range filter"
      />
      {/* Add more filters similarly */}
    </div>
  );
};

Filters.propTypes = {
  filters: PropTypes.shape({
    price: PropTypes.arrayOf(PropTypes.number),
    age: PropTypes.arrayOf(PropTypes.number)
  }).isRequired,
  setFilters: PropTypes.func.isRequired
};

export default Filters;