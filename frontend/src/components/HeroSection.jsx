import React, { useState, useEffect, useRef } from 'react';
import SnowfallAnimation from './SnowfallAnimation';
import ParallaxBackground from './ParallaxBackground';

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef(null);
  const images = Array.from({ length: 13 }, (_, i) => `/api/assets/images/hero-bg-${String(i).padStart(2, '0')}.jpg`);

  // Dynamic text variations
  const heroTexts = [
    { title: "Welcome to Santa's AI Gift Finder", subtitle: "Discover the perfect gifts with the magic of AI" },
    { title: "Find Gifts That Spark Joy", subtitle: "AI-powered recommendations for every occasion" },
    { title: "Santa's Secret Helper", subtitle: "Let AI make gift-finding effortless and fun" },
    { title: "Gifts That Wow", subtitle: "Personalized suggestions from Santa's workshop" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 6000); // Change slide every 6 seconds

    return () => clearInterval(interval);
  }, [images.length]);

  useEffect(() => {
    // Trigger animations when component mounts
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleStartFindingGifts = () => {
    const searchSection = document.getElementById('search-section');
    if (searchSection) {
      searchSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const currentText = heroTexts[currentSlide % heroTexts.length];

  return (
    <section className="hero-section" ref={heroRef}>
      <ParallaxBackground>
        <SnowfallAnimation />
        <div className="hero-content">
          <div className="hero-slideshow">
            {images.map((image, index) => (
              <div
                key={index}
                className={`hero-slide ${index === currentSlide ? 'active' : ''} ${index === (currentSlide - 1 + images.length) % images.length ? 'previous' : ''}`}
                style={{ backgroundImage: `url(${image})` }}
              />
            ))}
          </div>
          <div className={`hero-text ${isVisible ? 'animate-in' : ''}`}>
            <h1 className="hero-title" data-text={currentText.title}>
              {currentText.title}
            </h1>
            <p className="hero-subtitle">
              {currentText.subtitle}
            </p>
            <div className="cta-container">
              <button className="cta-button primary" onClick={handleStartFindingGifts}>
                <span>Start Finding Gifts</span>
                <div className="button-glow"></div>
              </button>
              <button className="cta-button secondary" onClick={handleStartFindingGifts}>
                Explore AI Magic
              </button>
            </div>
          </div>
          <div className="hero-indicators">
            {images.map((_, index) => (
              <button
                key={index}
                className={`indicator ${index === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </ParallaxBackground>
    </section>
  );
};

export default HeroSection;