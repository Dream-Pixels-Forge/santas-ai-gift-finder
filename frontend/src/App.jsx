import React, { useState } from 'react';
import SearchForm from './components/SearchForm';
import ResultsList from './components/ResultsList';
import Filters from './components/Filters';
import { FaSnowflake } from 'react-icons/fa';
import './App.css';

function App() {
  const [results, setResults] = useState([]);
  const [filters, setFilters] = useState({ price: [0, 500], age: [0, 100] });

  return (
    <div className="App">
      <header>
        <FaSnowflake className="icon" />
        <h1>Santa's AI Gift Finder 🎅</h1>
        <p>AI-powered perfect gifts!</p>
      </header>
      <main>
        <SearchForm setResults={setResults} />
        <Filters filters={filters} setFilters={setFilters} />
        <ResultsList results={results} />
      </main>
    </div>
  );
}

export default App;