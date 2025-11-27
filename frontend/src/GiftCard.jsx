import React from 'react';
import { FaStar, FaShoppingCart } from 'react-icons/fa';

const GiftCard = ({ gift }) => (
  <div className="gift-card">
    <img src={gift.image || 'https://via.placeholder.com/300x200?text=Gift'} alt={gift.name} />
    <h3>{gift.name}</h3>
    <p>{gift.description}</p>
    <div className="prices">
      {gift.prices.map((p, i) => (
        <div key={i} className="price-item">
          <strong>${p.price}</strong> <span>{p.retailer}</span>
        </div>
      ))}
    </div>
    <div className="rating">
      <FaStar /> {gift.rating || 4.5}/5
    </div>
    <button className="buy-btn"><FaShoppingCart /> Buy Now</button>
  </div>
);

export default GiftCard;