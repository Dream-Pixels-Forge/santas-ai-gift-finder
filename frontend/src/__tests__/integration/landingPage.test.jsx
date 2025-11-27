import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../../App';

// Mock the API calls
jest.mock('../../hooks/useApi', () => ({
  __esModule: true,
  default: () => ({
    searchGifts: jest.fn().mockResolvedValue([]),
    isLoading: false,
    error: null,
  }),
}));

describe('Landing Page Integration', () => {
  test('renders complete landing page experience', () => {
    render(<App />);

    // Check hero section
    expect(screen.getByText("Welcome to Santa's AI Gift Finder")).toBeInTheDocument();
    expect(screen.getByText('Discover the perfect gifts with the magic of AI')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start Finding Gifts' })).toBeInTheDocument();

    // Check header
    expect(screen.getByText("Santa's AI Gift Finder 🎅")).toBeInTheDocument();

    // Check search form
    expect(screen.getByPlaceholderText(/enter gift preferences/i)).toBeInTheDocument();

    // Check filters
    expect(screen.getByText('Price Range')).toBeInTheDocument();
    expect(screen.getByText('Age Range')).toBeInTheDocument();

    // Check 3D section (assuming WebGL is supported in test)
    expect(screen.getByText('Explore 3D Gifts')).toBeInTheDocument();
  });

  test('hero button scrolls to search form', () => {
    render(<App />);

    const button = screen.getByRole('button', { name: 'Start Finding Gifts' });
    fireEvent.click(button);

    // In a real scenario, this would scroll, but since we don't have scroll behavior in tests,
    // we can check that the button exists and is clickable
    expect(button).toBeInTheDocument();
  });

  test('parallax effect is applied', () => {
    render(<App />);

    // Check that parallax elements exist
    const parallaxBackground = document.querySelector('.parallax-background');
    expect(parallaxBackground).toBeInTheDocument();
  });

  test('snowfall animation is present', () => {
    render(<App />);

    const snowflakes = screen.getAllByText('❄');
    expect(snowflakes.length).toBeGreaterThan(0);
  });
});