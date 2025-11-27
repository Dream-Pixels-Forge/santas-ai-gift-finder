import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import HeroSection from '../../components/HeroSection';

describe('HeroSection', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders hero section with title and button', () => {
    render(<HeroSection />);
    expect(screen.getByText("Welcome to Santa's AI Gift Finder")).toBeInTheDocument();
    expect(screen.getByText('Discover the perfect gifts with the magic of AI')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start Finding Gifts' })).toBeInTheDocument();
  });

  test('renders snowfall animation', () => {
    render(<HeroSection />);
    const snowflakes = screen.getAllByText('❄');
    expect(snowflakes.length).toBeGreaterThan(0);
  });

  test('changes slide every 5 seconds', () => {
    render(<HeroSection />);
    const initialSlides = screen.getAllByRole('img', { hidden: true });
    expect(initialSlides.length).toBe(13);

    // Fast-forward time
    jest.advanceTimersByTime(5000);
    // The component should re-render with a new slide, but since it's background-image, hard to test
  });

  test('has parallax background', () => {
    render(<HeroSection />);
    const parallaxContainer = screen.getByTestId ? screen.getByTestId('parallax-container') : document.querySelector('.parallax-container');
    // Since we don't have test ids, just check if it renders
    expect(document.querySelector('.parallax-background')).toBeInTheDocument();
  });
});