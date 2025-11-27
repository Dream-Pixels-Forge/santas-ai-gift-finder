import React, { useState } from 'react';
import axios from 'axios';
import { FaSearch } from 'react-icons/fa';

const SearchForm = ({ setResults }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    try {
      const res = await axios.post('/api/search', { query });
      setResults(res.data.recommendations);
    } catch (err) {
      alert('Oops! Try again. ' + err.message);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="search-form">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="E.g., A gift for my 12-year-old niece who loves drawing"
        disabled={loading}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Searching...' : <><FaSearch /> Find Gifts</>}
      </button>
    </form>
  );
};

export default SearchForm;