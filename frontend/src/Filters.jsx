import React from 'react';
import Select from 'react-select';

const Filters = ({ filters, setFilters }) => {
  const priceOptions = [
    { value: 0, label: '$0' },
    { value: 50, label: '$50' },
    { value: 100, label: '$100' },
    { value: 500, label: '$500+' }
  ];

  return (
    <div className="filters">
      <label>Price Range: </label>
      <Select
        isMulti
        options={priceOptions}
        onChange={(selected) => setFilters({ ...filters, price: selected.map(o => o.value) })}
        placeholder="Select price"
      />
      {/* Add more filters similarly */}
    </div>
  );
};

export default Filters;