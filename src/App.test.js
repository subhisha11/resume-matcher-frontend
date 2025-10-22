import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import axios from 'axios';

// Mock axios
jest.mock('axios');

describe('Resume Matcher App', () => {

  beforeEach(() => {
    // Default mock for jobs API
    axios.get.mockResolvedValue({ data: { jobs: [
      { _id: '1', title: 'Frontend Developer', description: 'React job', skills: ['React','JS'] },
      { _id: '2', title: 'Backend Developer', description: 'Node.js job', skills: ['Node','Express'] }
    ]}});
  });

  test('renders Job Board heading after navigating to Jobs page', async () => {
    render(<App />);

    // Open the drawer menu
    const menuButton = screen.getByLabelText(/menu/i);
    fireEvent.click(menuButton);

    // Click "Jobs" button
    const jobsButton = await screen.findByText(/Jobs/i);
    fireEvent.click(jobsButton);

    // Heading should appear
    const heading = await screen.findByText(/Job Board/i);
    expect(heading).toBeInTheDocument();
  });

  test('renders Load Jobs button', async () => {
    render(<App />);

    // Open drawer menu
    const menuButton = screen.getByLabelText(/menu/i);
    fireEvent.click(menuButton);

    // Click "Jobs" page
    const jobsButton = await screen.findByText(/Jobs/i);
    fireEvent.click(jobsButton);

    const loadJobsButton = await screen.findByText(/Load Jobs/i);
    expect(loadJobsButton).toBeInTheDocument();
  });

  test('loads and displays jobs', async () => {
    render(<App />);

    // Navigate to Jobs page
    fireEvent.click(screen.getByLabelText(/menu/i));
    fireEvent.click(await screen.findByText(/Jobs/i));

    // Click Load Jobs
    const loadJobsButton = await screen.findByText(/Load Jobs/i);
    fireEvent.click(loadJobsButton);

    // Wait for jobs to render
    const job1 = await screen.findByText(/Frontend Developer/i);
    const job2 = await screen.findByText(/Backend Developer/i);

    expect(job1).toBeInTheDocument();
    expect(job2).toBeInTheDocument();
  });

});
