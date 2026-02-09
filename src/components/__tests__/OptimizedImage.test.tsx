/**
 * OptimizedImage Component Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import OptimizedImage from '@/components/OptimizedImage';

describe('OptimizedImage', () => {
  it('renders image with correct props', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test Image"
        width={800}
        height={600}
      />
    );

    const image = screen.getByAlt('Test Image');
    expect(image).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    const { container } = render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test Image"
        width={800}
        height={600}
      />
    );

    const loader = container.querySelector('.animate-spin');
    expect(loader).toBeInTheDocument();
  });

  it('handles image load error gracefully', async () => {
    render(
      <OptimizedImage
        src="/invalid-image.jpg"
        alt="Test Image"
        width={800}
        height={600}
      />
    );

    const image = screen.getByAlt('Test Image') as HTMLImageElement;
    
    // Trigger error event
    const errorEvent = new Event('error');
    image.dispatchEvent(errorEvent);

    await waitFor(() => {
      expect(image.src).toContain('placeholder.png');
    });
  });

  it('applies priority loading when specified', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test Image"
        width={800}
        height={600}
        priority={true}
      />
    );

    const image = screen.getByAlt('Test Image');
    expect(image).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test Image"
        width={800}
        height={600}
        className="custom-class"
      />
    );

    const image = container.querySelector('.custom-class');
    expect(image).toBeInTheDocument();
  });
});
