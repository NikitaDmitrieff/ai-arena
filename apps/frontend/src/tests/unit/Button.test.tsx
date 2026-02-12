import { render, screen } from '@testing-library/react';
import React from 'react';
import Button from '@/components/ui/Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('supports variant soft', () => {
    render(<Button variant="soft">Soft</Button>);
    expect(screen.getByText('Soft')).toBeInTheDocument();
  });
});
