import React, { useState, useCallback, memo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SearchForm from './components/SearchForm';
import ResultsList from './ResultList';
import Filters from './Filters';
import LandingPage from './components/landing/LandingPage';
import Auth from './components/Auth/Auth';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles/main.css';

/**
 * Protected Route component
 * @param {Object} props - Component props
 * @param {React.Component} props.children - Child components to render if authenticated
 * @returns {JSX.Element} Protected route or redirect to auth
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/auth" replace />;
};

/**
 * Main App content component
 * @returns {JSX.Element} The main app content
 */
const AppContent = memo(() => {
  const [results, setResults] = useState([]);
  const [filters, setFilters] = useState({ price: [0, 500], age: [0, 100] });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  /**
   * Handles setting search results and clearing errors
   * @param {Array} newResults - The search results to set
   */
  const handleSetResults = useCallback((newResults) => {
    setResults(newResults);
    setError(null);
    setIsLoading(false);
  }, []);

  const handleSetLoading = useCallback((loading) => {
    setIsLoading(loading);
  }, []);

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/search"
          element={
            <main className="search-page">
              <SearchForm setResults={handleSetResults} setError={setError} setLoading={handleSetLoading} />
              {error && (
                <div className="error-banner" role="alert">
                  {error}
                </div>
              )}
              <Filters filters={filters} setFilters={setFilters} />
              <ResultsList results={results} filters={filters} isLoading={isLoading} />
            </main>
          }
        />
        <Route
          path="/auth"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <Auth />
          }
        />
        <Route
          path="/protected-search"
          element={
            <ProtectedRoute>
              <div className="protected-content">
                <h2>Advanced Gift Search</h2>
                <p>This is a protected area for authenticated users.</p>
                {/* Future: Add personalized search features */}
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
});

AppContent.displayName = 'AppContent';

/**
 * Main App component with routing and authentication
 * @returns {JSX.Element} The rendered App component
 */
const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;