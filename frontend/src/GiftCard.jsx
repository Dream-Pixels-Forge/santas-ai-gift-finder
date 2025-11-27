import React, { memo } from 'react';
import { FaStar, FaShoppingCart } from 'react-icons/fa';
import PropTypes from 'prop-types';

/**
 * GiftCard component to display individual gift information
 * @param {Object} props - Component props
 * @param {Object} props.gift - Gift object containing details
 * @returns {JSX.Element} The rendered GiftCard component
 */
const GiftCard = memo(({ gift }) => {
  // Safely handle missing or null prices array
  const prices = gift?.prices || [];
  
  /**
   * Handles buy button click
   * @param {Event} e - Click event
   */
  const handleBuyClick = (e) => {
    e.preventDefault();
    // Placeholder for future purchase functionality
    console.log('Buy button clicked for:', gift?.name);
  };
  
  return (
    <article className="gift-card" aria-label={`Gift: ${gift?.name || 'Unnamed Gift'}`}>
      <img
        src={gift?.image || 'https://via.placeholder.com/300x200?text=Gift'}
        alt={gift?.name || 'Gift'}
        loading="lazy"
      />
      <h3>{gift?.name || 'Unnamed Gift'}</h3>
      <p>{gift?.description || 'No description available'}</p>
      
      {prices.length > 0 && (
        <div className="prices" role="list" aria-label="Price comparisons">
          {prices.map((p) => (
            <div
              key={`${p.retailer}-${p.price}`}
              className="price-item"
              role="listitem"
            >
              <strong>${p.price}</strong> <span>{p.retailer}</span>
            </div>
          ))}
        </div>
      )}
      
      <div className="rating" aria-label={`Rating: ${gift?.rating || 4.5} out of 5 stars`}>
        <FaStar aria-hidden="true" /> {gift?.rating || 4.5}/5
      </div>
      <button
        className="buy-btn"
        aria-label={`Buy ${gift?.name || 'gift'} now`}
        onClick={handleBuyClick}
      >
        <FaShoppingCart aria-hidden="true" /> Buy Now
      </button>
    </article>
  );
});

GiftCard.propTypes = {
  gift: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    image: PropTypes.string,
    rating: PropTypes.number,
    prices: PropTypes.arrayOf(PropTypes.shape({
      price: PropTypes.number.isRequired,
      retailer: PropTypes.string.isRequired
    }))
  })
};

GiftCard.defaultProps = {
  gift: {
    name: 'Unnamed Gift',
    description: 'No description available',
    image: null,
    rating: 4.5,
    prices: []
  }
};

GiftCard.displayName = 'GiftCard';

export default GiftCard;