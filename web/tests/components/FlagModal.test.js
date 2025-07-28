import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import FlagModal from '../../src/components/FlagModal';

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));
const mockedAxios = axios;

describe('FlagModal Component', () => {
  const mockOnClose = jest.fn();
  const mockOnFlagSuccess = jest.fn();
  const testPostId = 'test-post-id';

  const defaultFlagReasons = {
    spam: 'Spam or unwanted content',
    inappropriate: 'Inappropriate content',
    hate_speech: 'Hate speech or discrimination',
    harassment: 'Harassment or bullying',
    violence: 'Violence or threats',
    other: 'Other (please specify)'
  };

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnFlagSuccess.mockClear();
    mockedAxios.get.mockClear();
    mockedAxios.post.mockClear();
  });

  test('does not render when isOpen is false', () => {
    render(
      <FlagModal
        isOpen={false}
        postId={testPostId}
        onClose={mockOnClose}
        onFlagSuccess={mockOnFlagSuccess}
      />
    );

    expect(screen.queryByText('Flag Post')).not.toBeInTheDocument();
  });

  test('renders modal when isOpen is true', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { reasons: defaultFlagReasons }
    });

    render(
      <FlagModal
        isOpen={true}
        postId={testPostId}
        onClose={mockOnClose}
        onFlagSuccess={mockOnFlagSuccess}
      />
    );

    expect(screen.getByText('Flag Post')).toBeInTheDocument();
    expect(screen.getByText('Why are you flagging this post?')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Spam or unwanted content')).toBeInTheDocument();
    });
  });

  test('fetches flag reasons on mount', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { reasons: defaultFlagReasons }
    });

    render(
      <FlagModal
        isOpen={true}
        postId={testPostId}
        onClose={mockOnClose}
        onFlagSuccess={mockOnFlagSuccess}
      />
    );

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/flag-reasons');
    });
  });

  test('displays all flag reason options', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { reasons: defaultFlagReasons }
    });

    render(
      <FlagModal
        isOpen={true}
        postId={testPostId}
        onClose={mockOnClose}
        onFlagSuccess={mockOnFlagSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Spam or unwanted content')).toBeInTheDocument();
      expect(screen.getByText('Inappropriate content')).toBeInTheDocument();
      expect(screen.getByText('Hate speech or discrimination')).toBeInTheDocument();
      expect(screen.getByText('Harassment or bullying')).toBeInTheDocument();
      expect(screen.getByText('Violence or threats')).toBeInTheDocument();
      expect(screen.getByText('Other (please specify)')).toBeInTheDocument();
    });
  });

  test('shows details textarea when "other" is selected', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { reasons: defaultFlagReasons }
    });

    render(
      <FlagModal
        isOpen={true}
        postId={testPostId}
        onClose={mockOnClose}
        onFlagSuccess={mockOnFlagSuccess}
      />
    );

    await waitFor(() => {
      const otherRadio = screen.getByLabelText(/Other \(please specify\)/);
      fireEvent.click(otherRadio);
    });

    expect(screen.getByText('Please provide more details:')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Describe why you\'re flagging this post...')).toBeInTheDocument();
    expect(screen.getByText('0/500 characters')).toBeInTheDocument();
  });

  test('hides details textarea when other reason is selected', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { reasons: defaultFlagReasons }
    });

    render(
      <FlagModal
        isOpen={true}
        postId={testPostId}
        onClose={mockOnClose}
        onFlagSuccess={mockOnFlagSuccess}
      />
    );

    await waitFor(() => {
      const otherRadio = screen.getByLabelText(/Other \(please specify\)/);
      fireEvent.click(otherRadio);
    });

    // Switch to spam
    const spamRadio = screen.getByLabelText(/Spam or unwanted content/);
    fireEvent.click(spamRadio);

    expect(screen.queryByText('Please provide more details:')).not.toBeInTheDocument();
  });

  test('updates character count when typing in details', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { reasons: defaultFlagReasons }
    });

    render(
      <FlagModal
        isOpen={true}
        postId={testPostId}
        onClose={mockOnClose}
        onFlagSuccess={mockOnFlagSuccess}
      />
    );

    await waitFor(() => {
      const otherRadio = screen.getByLabelText(/Other \(please specify\)/);
      fireEvent.click(otherRadio);
    });

    const textarea = screen.getByPlaceholderText('Describe why you\'re flagging this post...');
    fireEvent.change(textarea, { target: { value: 'Test message' } });

    expect(screen.getByText('12/500 characters')).toBeInTheDocument();
  });

  test('closes modal when close button is clicked', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { reasons: defaultFlagReasons }
    });

    render(
      <FlagModal
        isOpen={true}
        postId={testPostId}
        onClose={mockOnClose}
        onFlagSuccess={mockOnFlagSuccess}
      />
    );

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('closes modal when cancel button is clicked', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { reasons: defaultFlagReasons }
    });

    render(
      <FlagModal
        isOpen={true}
        postId={testPostId}
        onClose={mockOnClose}
        onFlagSuccess={mockOnFlagSuccess}
      />
    );

    await waitFor(() => {
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('closes modal when overlay is clicked', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { reasons: defaultFlagReasons }
    });

    render(
      <FlagModal
        isOpen={true}
        postId={testPostId}
        onClose={mockOnClose}
        onFlagSuccess={mockOnFlagSuccess}
      />
    );

    const overlay = document.querySelector('.flag-modal-overlay');
    fireEvent.click(overlay);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('shows error when no reason is selected', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { reasons: defaultFlagReasons }
    });

    render(
      <FlagModal
        isOpen={true}
        postId={testPostId}
        onClose={mockOnClose}
        onFlagSuccess={mockOnFlagSuccess}
      />
    );

    await waitFor(() => {
      const submitButton = screen.getByText('Flag Post');
      fireEvent.click(submitButton);
    });

    expect(screen.getByText('Please select a reason for flagging')).toBeInTheDocument();
  });

  test('shows error when "other" is selected without details', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { reasons: defaultFlagReasons }
    });

    render(
      <FlagModal
        isOpen={true}
        postId={testPostId}
        onClose={mockOnClose}
        onFlagSuccess={mockOnFlagSuccess}
      />
    );

    await waitFor(() => {
      const otherRadio = screen.getByLabelText(/Other \(please specify\)/);
      fireEvent.click(otherRadio);
    });

    const submitButton = screen.getByText('Flag Post');
    fireEvent.click(submitButton);

    expect(screen.getByText('Please provide details when selecting "Other"')).toBeInTheDocument();
  });

  test('successfully submits flag with valid data', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { reasons: defaultFlagReasons }
    });
    mockedAxios.post.mockResolvedValueOnce({
      data: { message: 'Post flagged successfully' }
    });

    render(
      <FlagModal
        isOpen={true}
        postId={testPostId}
        onClose={mockOnClose}
        onFlagSuccess={mockOnFlagSuccess}
      />
    );

    await waitFor(() => {
      const spamRadio = screen.getByLabelText(/Spam or unwanted content/);
      fireEvent.click(spamRadio);
    });

    const submitButton = screen.getByText('Flag Post');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(`/api/posts/${testPostId}/flag`, {
        reason: 'spam',
        details: ''
      });
      expect(mockOnFlagSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  test('submits flag with other reason and details', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { reasons: defaultFlagReasons }
    });
    mockedAxios.post.mockResolvedValueOnce({
      data: { message: 'Post flagged successfully' }
    });

    render(
      <FlagModal
        isOpen={true}
        postId={testPostId}
        onClose={mockOnClose}
        onFlagSuccess={mockOnFlagSuccess}
      />
    );

    await waitFor(() => {
      const otherRadio = screen.getByLabelText(/Other \(please specify\)/);
      fireEvent.click(otherRadio);
    });

    const textarea = screen.getByPlaceholderText('Describe why you\'re flagging this post...');
    fireEvent.change(textarea, { target: { value: 'Custom reason for flagging' } });

    const submitButton = screen.getByText('Flag Post');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(`/api/posts/${testPostId}/flag`, {
        reason: 'other',
        details: 'Custom reason for flagging'
      });
    });
  });

  test('shows loading state during submission', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { reasons: defaultFlagReasons }
    });
    
    // Mock a delayed response
    mockedAxios.post.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: { message: 'Success' } }), 100))
    );

    render(
      <FlagModal
        isOpen={true}
        postId={testPostId}
        onClose={mockOnClose}
        onFlagSuccess={mockOnFlagSuccess}
      />
    );

    await waitFor(() => {
      const spamRadio = screen.getByLabelText(/Spam or unwanted content/);
      fireEvent.click(spamRadio);
    });

    const submitButton = screen.getByText('Flag Post');
    fireEvent.click(submitButton);

    expect(screen.getByText('Flagging...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  test('handles API error for duplicate flag', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { reasons: defaultFlagReasons }
    });
    mockedAxios.post.mockRejectedValueOnce({
      response: { status: 409, data: { error: 'You have already flagged this post' } }
    });

    render(
      <FlagModal
        isOpen={true}
        postId={testPostId}
        onClose={mockOnClose}
        onFlagSuccess={mockOnFlagSuccess}
      />
    );

    await waitFor(() => {
      const spamRadio = screen.getByLabelText(/Spam or unwanted content/);
      fireEvent.click(spamRadio);
    });

    const submitButton = screen.getByText('Flag Post');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('You have already flagged this post')).toBeInTheDocument();
    });
  });

  test('handles generic API error', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { reasons: defaultFlagReasons }
    });
    mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

    render(
      <FlagModal
        isOpen={true}
        postId={testPostId}
        onClose={mockOnClose}
        onFlagSuccess={mockOnFlagSuccess}
      />
    );

    await waitFor(() => {
      const spamRadio = screen.getByLabelText(/Spam or unwanted content/);
      fireEvent.click(spamRadio);
    });

    const submitButton = screen.getByText('Flag Post');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to flag post')).toBeInTheDocument();
    });
  });

  test('disables submit button when no reason selected', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { reasons: defaultFlagReasons }
    });

    render(
      <FlagModal
        isOpen={true}
        postId={testPostId}
        onClose={mockOnClose}
        onFlagSuccess={mockOnFlagSuccess}
      />
    );

    await waitFor(() => {
      const submitButton = screen.getByText('Flag Post');
      expect(submitButton).toBeDisabled();
    });
  });

  test('enables submit button when reason is selected', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { reasons: defaultFlagReasons }
    });

    render(
      <FlagModal
        isOpen={true}
        postId={testPostId}
        onClose={mockOnClose}
        onFlagSuccess={mockOnFlagSuccess}
      />
    );

    await waitFor(() => {
      const spamRadio = screen.getByLabelText(/Spam or unwanted content/);
      fireEvent.click(spamRadio);
    });

    const submitButton = screen.getByText('Flag Post');
    expect(submitButton).not.toBeDisabled();
  });
}); 