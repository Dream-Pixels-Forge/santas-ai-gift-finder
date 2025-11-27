import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaEnvelope, FaSnowflake } from 'react-icons/fa';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the email to your backend
    console.log('Newsletter subscription:', email);
    setIsSubscribed(true);
    setEmail('');
    setTimeout(() => setIsSubscribed(false), 3000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="landing-footer">
      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-content">
          {/* Brand Section */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo" onClick={scrollToTop}>
              <FaSnowflake className="footer-logo-icon" />
              <span className="footer-logo-text">Santa's AI Gift Finder</span>
            </Link>
            <p className="footer-description">
              Discover the perfect gifts with the magic of AI. Personalized recommendations for every occasion.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="footer-links">
            <div className="footer-section">
              <h3>Navigation</h3>
              <ul>
                <li><button onClick={scrollToTop} className="footer-link">Home</button></li>
                <li><Link to="/search" className="footer-link">Search Gifts</Link></li>
                <li><Link to="/auth" className="footer-link">Login</Link></li>
              </ul>
            </div>

            <div className="footer-section">
              <h3>Company</h3>
              <ul>
                <li><a href="#" className="footer-link">About Us</a></li>
                <li><a href="#" className="footer-link">Contact</a></li>
                <li><a href="#" className="footer-link">Careers</a></li>
              </ul>
            </div>

            <div className="footer-section">
              <h3>Legal</h3>
              <ul>
                <li><a href="#" className="footer-link">Privacy Policy</a></li>
                <li><a href="#" className="footer-link">Terms of Service</a></li>
                <li><a href="#" className="footer-link">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          {/* Newsletter Signup */}
          <div className="footer-newsletter">
            <h3>Stay Updated</h3>
            <p>Subscribe to get the latest gift ideas and AI updates!</p>
            <form onSubmit={handleNewsletterSubmit} className="newsletter-form">
              <div className="newsletter-input-group">
                <FaEnvelope className="newsletter-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="newsletter-input"
                  aria-label="Email address for newsletter"
                />
              </div>
              <button type="submit" className="newsletter-button" disabled={isSubscribed}>
                {isSubscribed ? 'Subscribed!' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>

        {/* Social Media */}
        <div className="footer-social">
          <h3>Follow Us</h3>
          <div className="social-links">
            <a href="#" className="social-link" aria-label="Facebook">
              <FaFacebook />
            </a>
            <a href="#" className="social-link" aria-label="Twitter">
              <FaTwitter />
            </a>
            <a href="#" className="social-link" aria-label="Instagram">
              <FaInstagram />
            </a>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-copyright">
            <p>&copy; 2024 Santa's AI Gift Finder. All rights reserved.</p>
          </div>
          <div className="footer-security">
            <span className="security-badge">🔒 Secure & Private</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;