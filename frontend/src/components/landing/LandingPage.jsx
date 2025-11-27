import React from 'react';
import Header from './Header';
import HeroSection from './HeroSection';
import Interactive3D from './Interactive3D';
import Footer from './Footer';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <Header />
      <main className="landing-main">
        <HeroSection />
        <Interactive3D />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;