
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Layout } from './Layout';

test('renders footer with current year', () => {
  render(<Layout currentPage="home" onNavigate={() => {}} children={undefined} />);
  const currentYear = new Date().getFullYear();
  const footerText = screen.getByText(new RegExp(`© ${currentYear} Prof Dr Metin Çiriş`));
  expect(footerText).toBeInTheDocument();
});
