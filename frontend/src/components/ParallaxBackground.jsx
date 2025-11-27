import React, { useEffect, useRef } from 'react';

const ParallaxBackground = ({ children }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        containerRef.current.style.transform = `translateY(${rate}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="parallax-container">
      <div ref={containerRef} className="parallax-background">
        <div className="parallax-layer layer-1"></div>
        <div className="parallax-layer layer-2"></div>
        <div className="parallax-layer layer-3"></div>
      </div>
      <div className="parallax-content">
        {children}
      </div>
    </div>
  );
};

export default ParallaxBackground;