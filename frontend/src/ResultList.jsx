import React from 'react';
import GiftCard from './GiftCard';

const ResultsList = ({ results, filters }) => (
  <div className="results">
    {results.length === 0 ? (
      <p>No gifts found. Try a different query! 🎁</p>
    ) : (
      results.map((gift, i) => <GiftCard key={i} gift={gift} />)
    )}
  </div>
);

export default ResultsList;