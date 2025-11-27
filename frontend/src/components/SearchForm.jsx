import React, { useState, memo, useCallback } from 'react';
import { FaSearch } from 'react-icons/fa';
import { useApi } from '../hooks/useApi';
import { processSearchQuery } from '../utils/security';
import PropTypes from 'prop-types';

/**
 * SearchForm component for gift search functionality
 * @param {Object} props - Component props
 * @param {Function} props.setResults - Callback to set search results
 * @param {Function} props.setError - Callback to set error state
 */
const SearchForm = memo(({ setResults, setError, setLoading }) => {
  const [query, setQuery] = useState('');
  const { loading, error: apiError, request } = useApi();

  /**
   * Handles form submission and API call
   * @param {Event} e - Form submit event
   */
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    const processedQuery = processSearchQuery(query);
    if (!processedQuery.isValid) {
      setError(processedQuery.error);
      return;
    }

    setLoading(true);
    try {
      setError(null);
      const data = await request('/search', {
        method: 'POST',
        data: {
          query: processedQuery.query,
          limit: 20 // Request more results for better filtering
        }
      });

      if (data && data.success && data.recommendations) {
        setResults(data.recommendations);
      } else {
        setResults([]);
        setError(data?.error || 'No gifts found. Try a different search query!');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search for gifts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [query, setError, setResults, setLoading, request]);

  const handleInputChange = useCallback((e) => {
    setQuery(e.target.value);
  }, []);

  return (
    <form
      onSubmit={handleSubmit}
      className="search-form"
      role="search"
      aria-label="Gift search form"
    >
      <label htmlFor="search-input" className="sr-only">
        Search for gifts
      </label>
      <input
        id="search-input"
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder="E.g., A gift for my 12-year-old niece who loves drawing"
        disabled={loading}
        aria-label="Search input for gift recommendations"
        aria-required="true"
        aria-describedby={apiError ? "search-error" : undefined}
      />
      <button
        type="submit"
        disabled={loading}
        aria-label={loading ? 'Searching' : 'Search for gifts'}
      >
        {loading ? 'Searching...' : <><FaSearch /> Find Gifts</>}
      </button>
      {apiError && (
        <div id="search-error" className="error-message" role="alert">
          {apiError}
        </div>
      )}
    </form>
  );
});

SearchForm.propTypes = {
  setResults: PropTypes.func.isRequired,
  setError: PropTypes.func.isRequired,
  setLoading: PropTypes.func.isRequired
};

SearchForm.displayName = 'SearchForm';

export default SearchForm;