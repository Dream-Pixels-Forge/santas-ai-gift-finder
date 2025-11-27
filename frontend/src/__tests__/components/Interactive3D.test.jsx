import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Interactive3D from '../../components/Interactive3D';

// Mock Three.js and React Three Fiber
jest.mock('@react-three/fiber', () => ({
  Canvas: ({ children }) => <div data-testid="canvas">{children}</div>,
  useFrame: jest.fn(),
}));

jest.mock('@react-three/drei', () => ({
  OrbitControls: () => <div data-testid="orbit-controls" />,
  useGLTF: () => ({ scene: {} }),
}));

describe('Interactive3D', () => {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;

  beforeEach(() => {
    // Mock WebGL support
    HTMLCanvasElement.prototype.getContext = jest.fn((contextId) => {
      if (contextId === 'webgl' || contextId === 'experimental-webgl') {
        return {};
      }
      return originalGetContext.call(this, contextId);
    });
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  test('renders 3D section with WebGL support', () => {
    render(<Interactive3D />);
    expect(screen.getByText('Explore 3D Gifts')).toBeInTheDocument();
    expect(screen.getByText('Click and drag to rotate, scroll to zoom')).toBeInTheDocument();
    expect(screen.getByTestId('canvas')).toBeInTheDocument();
  });

  test('shows fallback when WebGL is not supported', () => {
    HTMLCanvasElement.prototype.getContext = jest.fn(() => null);

    render(<Interactive3D />);
    expect(screen.getByText('3D Gift Explorer')).toBeInTheDocument();
    expect(screen.getByText("Your browser doesn't support WebGL. Here's a static image instead.")).toBeInTheDocument();
  });

  test('loads 3D model when WebGL is supported', () => {
    render(<Interactive3D />);
    // Since we mocked, just check that it renders
    expect(screen.getByTestId('canvas')).toBeInTheDocument();
  });
});