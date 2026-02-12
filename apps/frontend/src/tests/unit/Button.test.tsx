import { render, screen } from '@testing-library/react';
import React from 'react';
import Button from '@/components/ui/Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('supports variant ghost', () => {
    render(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByText('Ghost')).toBeInTheDocument();
  });
});
