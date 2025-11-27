export const formatPrice = (price) => `$${parseFloat(price).toFixed(2)}`;

export const filterGifts = (gifts, filters) => {
  return gifts.filter(gift => 
    filters.price[0] <= gift.prices[0]?.price && gift.prices[0]?.price <= filters.price[1]
  );
};