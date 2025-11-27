import React from 'react';
import './SkeletonCard.css';

/**
 * SkeletonCard component for loading states
 * Displays a placeholder while gift data is loading
 * @returns {JSX.Element} The rendered SkeletonCard component
 */
const SkeletonCard = () => {
  return (
    <div className="skeleton-card" role="status" aria-label="Loading gift card">
      <div className="skeleton-image" />
      <div className="skeleton-title" />
      <div className="skeleton-description" />
      <div className="skeleton-prices">
        <div className="skeleton-price-item" />
        <div className="skeleton-price-item" />
      </div>
      <div className="skeleton-rating" />
      <div className="skeleton-button" />
    </div>
  );
};

export default SkeletonCard;