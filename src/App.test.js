import { render, screen } from '@testing-library/react';
import App from './App'; // Correct: matches App.js

test('renders Job Board heading', () => {
  render(<App />);
  const heading = screen.getByText(/Job Board/i);
  expect(heading).toBeInTheDocument();
});

test('renders Load Jobs button', () => {
  render(<App />);
  const button = screen.getByText(/LOAD JOBS/i);
  expect(button).toBeInTheDocument();
});
