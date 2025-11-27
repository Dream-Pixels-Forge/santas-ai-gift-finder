import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaBars, FaTimes, FaSnowflake, FaSignOutAlt, FaSearch, FaHome } from 'react-icons/fa';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    closeMenu();
  };

  return (
    <header className="landing-header">
      <div className="header-container">
        {/* Logo/Branding */}
        <Link to="/" className="logo" onClick={scrollToTop}>
          <FaSnowflake className="logo-icon" />
          <span className="logo-text">Santa's AI Gift Finder</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <button onClick={scrollToTop} className="nav-link">
            <FaHome /> Home
          </button>
          <Link to="/search" className="nav-link">
            <FaSearch /> Search
          </Link>
        </nav>

        {/* Auth Section */}
        <div className="auth-section">
          {isAuthenticated ? (
            <div className="user-info">
              <span className="welcome-text">Welcome, {user?.username}!</span>
              <button onClick={handleLogout} className="logout-btn" aria-label="Logout">
                <FaSignOutAlt /> Logout
              </button>
            </div>
          ) : (
            <Link to="/auth" className="login-btn">
              Login
            </Link>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="mobile-menu-toggle"
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      <div className={`mobile-nav ${isMenuOpen ? 'open' : ''}`}>
        <nav className="mobile-nav-content">
          <button onClick={scrollToTop} className="mobile-nav-link">
            <FaHome /> Home
          </button>
          <Link to="/search" className="mobile-nav-link" onClick={closeMenu}>
            <FaSearch /> Search
          </Link>
          {isAuthenticated ? (
            <>
              <div className="mobile-user-info">
                <span>Welcome, {user?.username}!</span>
              </div>
              <button onClick={handleLogout} className="mobile-logout-btn">
                <FaSignOutAlt /> Logout
              </button>
            </>
          ) : (
            <Link to="/auth" className="mobile-login-btn" onClick={closeMenu}>
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;