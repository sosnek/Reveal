import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import App from '../../src/App';

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));
const mockedAxios = axios;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('App Component Integration Tests', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    mockedAxios.get.mockClear();
    mockedAxios.post.mockClear();
    
    // Mock theme loading
    document.head.innerHTML = '';
  });

  test('renders main application components', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });

    render(<App />);

    expect(screen.getByText('Reveal')).toBeInTheDocument();
    expect(screen.getByText('Share your thoughts anonymously')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('What\'s on your mind?')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Share your thoughts here...')).toBeInTheDocument();
    expect(screen.getByText('🎨 Themes')).toBeInTheDocument();
  });

  test('loads posts on component mount', async () => {
    const mockPosts = [
      {
        id: '1',
        title: 'Test Post 1',
        content: 'Test content 1',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Test Post 2',
        content: 'Test content 2',
        created_at: new Date().toISOString()
      }
    ];

    mockedAxios.get.mockResolvedValueOnce({ data: mockPosts });

    render(<App />);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/posts');
      expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      expect(screen.getByText('Test Post 2')).toBeInTheDocument();
    });
  });

  test('shows loading state while fetching posts', () => {
    mockedAxios.get.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: [] }), 100))
    );

    render(<App />);

    expect(screen.getByText('Loading posts...')).toBeInTheDocument();
  });

  test('handles post fetch error gracefully', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load posts. Please try again.')).toBeInTheDocument();
    });
  });

  test('creates new post successfully', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });
    mockedAxios.post.mockResolvedValueOnce({
      data: { id: 'new-post-id', created_at: new Date().toISOString() }
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: [{
        id: 'new-post-id',
        title: 'New Test Post',
        content: 'New test content',
        created_at: new Date().toISOString()
      }]
    });

    render(<App />);

    const titleInput = screen.getByPlaceholderText('What\'s on your mind?');
    const contentInput = screen.getByPlaceholderText('Share your thoughts here...');
    const submitButton = screen.getByText('Share Anonymously');

    fireEvent.change(titleInput, { target: { value: 'New Test Post' } });
    fireEvent.change(contentInput, { target: { value: 'New test content with enough characters' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/posts', {
        title: 'New Test Post',
        content: 'New test content with enough characters'
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Post shared successfully!')).toBeInTheDocument();
    });
  });

  test('validates form input before submission', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });

    render(<App />);

    const submitButton = screen.getByText('Share Anonymously');
    fireEvent.click(submitButton);

    expect(screen.getByText('Please fill in both title and content.')).toBeInTheDocument();
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  test('validates content length', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });

    render(<App />);

    const titleInput = screen.getByPlaceholderText('What\'s on your mind?');
    const contentInput = screen.getByPlaceholderText('Share your thoughts here...');
    const submitButton = screen.getByText('Share Anonymously');

    fireEvent.change(titleInput, { target: { value: 'Short Title' } });
    fireEvent.change(contentInput, { target: { value: 'Short' } }); // Less than 10 chars
    fireEvent.click(submitButton);

    expect(screen.getByText('Content must be at least 10 characters long.')).toBeInTheDocument();
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  test('shows loading state during post submission', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });
    mockedAxios.post.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: { id: '1' } }), 100))
    );

    render(<App />);

    const titleInput = screen.getByPlaceholderText('What\'s on your mind?');
    const contentInput = screen.getByPlaceholderText('Share your thoughts here...');
    const submitButton = screen.getByText('Share Anonymously');

    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    fireEvent.change(contentInput, { target: { value: 'Test content with enough characters' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('Sharing...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  test('handles post creation error', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });
    mockedAxios.post.mockRejectedValueOnce({
      response: { data: { error: 'Rate limit exceeded' } }
    });

    render(<App />);

    const titleInput = screen.getByPlaceholderText('What\'s on your mind?');
    const contentInput = screen.getByPlaceholderText('Share your thoughts here...');
    const submitButton = screen.getByText('Share Anonymously');

    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    fireEvent.change(contentInput, { target: { value: 'Test content with enough characters' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Rate limit exceeded')).toBeInTheDocument();
    });
  });

  test('opens flag modal when flag button is clicked', async () => {
    const mockPosts = [{
      id: 'test-post-id',
      title: 'Test Post',
      content: 'Test content',
      created_at: new Date().toISOString()
    }];

    mockedAxios.get.mockResolvedValueOnce({ data: mockPosts });

    render(<App />);

    await waitFor(() => {
      const flagButton = screen.getByText('🚩 Flag');
      fireEvent.click(flagButton);
    });

    // The flag modal should be rendered (though it will need API call for reasons)
    expect(screen.getByText('Flag Post')).toBeInTheDocument();
  });

  test('manages theme state and localStorage', async () => {
    localStorageMock.getItem.mockReturnValue('dark');
    mockedAxios.get.mockResolvedValueOnce({ data: [] });

    render(<App />);

    expect(localStorageMock.getItem).toHaveBeenCalledWith('selectedTheme');
    
    // Should have attempted to load dark theme CSS
    await waitFor(() => {
      const links = document.querySelectorAll('link[data-theme]');
      expect(links.length).toBeGreaterThan(0);
    });
  });

  test('changes theme when theme switcher is used', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });

    render(<App />);

    const themeButton = screen.getByText('🎨 Themes');
    fireEvent.click(themeButton);

    const darkThemeButton = screen.getByText('🌙 Dark Mode');
    fireEvent.click(darkThemeButton);

    expect(localStorageMock.setItem).toHaveBeenCalledWith('selectedTheme', 'dark');
  });

  test('shows proper relative timestamps', async () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    
    const mockPosts = [
      {
        id: '1',
        title: 'Recent Post',
        content: 'Recent content',
        created_at: fiveMinutesAgo.toISOString()
      },
      {
        id: '2',
        title: 'Older Post',
        content: 'Older content',
        created_at: twoHoursAgo.toISOString()
      }
    ];

    mockedAxios.get.mockResolvedValueOnce({ data: mockPosts });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('5 minutes ago')).toBeInTheDocument();
      expect(screen.getByText('2 hours ago')).toBeInTheDocument();
    });
  });

  test('shows "Just now" for very recent posts', async () => {
    const now = new Date();
    const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);
    
    const mockPosts = [{
      id: '1',
      title: 'Very Recent Post',
      content: 'Very recent content',
      created_at: thirtySecondsAgo.toISOString()
    }];

    mockedAxios.get.mockResolvedValueOnce({ data: mockPosts });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Just now')).toBeInTheDocument();
    });
  });

  test('clears form after successful submission', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });
    mockedAxios.post.mockResolvedValueOnce({
      data: { id: 'new-post-id', created_at: new Date().toISOString() }
    });
    mockedAxios.get.mockResolvedValueOnce({ data: [] });

    render(<App />);

    const titleInput = screen.getByPlaceholderText('What\'s on your mind?');
    const contentInput = screen.getByPlaceholderText('Share your thoughts here...');
    const submitButton = screen.getByText('Share Anonymously');

    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    fireEvent.change(contentInput, { target: { value: 'Test content with enough characters' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(titleInput.value).toBe('');
      expect(contentInput.value).toBe('');
    });
  });

  test('displays privacy notice in footer', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });

    render(<App />);

    expect(screen.getByText(/All posts are anonymous/)).toBeInTheDocument();
    expect(screen.getByText(/cannot be traced back to you/)).toBeInTheDocument();
  });

  test('handles flag success and refreshes posts', async () => {
    const mockPosts = [{
      id: 'test-post-id',
      title: 'Test Post',
      content: 'Test content',
      created_at: new Date().toISOString()
    }];

    mockedAxios.get.mockResolvedValueOnce({ data: mockPosts });
    mockedAxios.get.mockResolvedValueOnce({ data: [] }); // After flagging

    render(<App />);

    await waitFor(() => {
      const flagButton = screen.getByText('🚩 Flag');
      fireEvent.click(flagButton);
    });

    // Simulate flag success
    const flagSuccessHandler = screen.getByText('Flag Post').closest('div').querySelector('[data-testid="flag-modal"]');
    if (flagSuccessHandler) {
      // This would normally be triggered by the FlagModal component
      fireEvent.click(flagSuccessHandler);
    }

    // Should show success message and refresh posts
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(2); // Initial load + refresh
    });
  });

  test('updates character count in real-time', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });

    render(<App />);

    const contentInput = screen.getByPlaceholderText('Share your thoughts here...');
    
    fireEvent.change(contentInput, { target: { value: 'Hello' } });
    expect(screen.getByText('5/2000 characters')).toBeInTheDocument();
    
    fireEvent.change(contentInput, { target: { value: 'Hello World' } });
    expect(screen.getByText('11/2000 characters')).toBeInTheDocument();
  });

  test('handles empty posts list gracefully', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('No posts yet. Be the first to share something!')).toBeInTheDocument();
    });
  });
}); 