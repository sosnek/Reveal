import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ThemeSwitcher from '../../src/components/ThemeSwitcher';

describe('ThemeSwitcher Component', () => {
  const mockOnThemeChange = jest.fn();

  beforeEach(() => {
    mockOnThemeChange.mockClear();
  });

  test('renders theme switcher button', () => {
    render(
      <ThemeSwitcher 
        currentTheme="original" 
        onThemeChange={mockOnThemeChange} 
      />
    );

    const button = screen.getByText('🎨 Themes');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('theme-switcher-btn');
  });

  test('opens dropdown when button is clicked', () => {
    render(
      <ThemeSwitcher 
        currentTheme="original" 
        onThemeChange={mockOnThemeChange} 
      />
    );

    const button = screen.getByText('🎨 Themes');
    fireEvent.click(button);

    expect(screen.getByText('Choose Your Style')).toBeInTheDocument();
    expect(screen.getByText('🎨 Original')).toBeInTheDocument();
    expect(screen.getByText('🌙 Dark Mode')).toBeInTheDocument();
    expect(screen.getByText('✨ Glassmorphism')).toBeInTheDocument();
    expect(screen.getByText('🤍 Minimalist')).toBeInTheDocument();
    expect(screen.getByText('🔥 Neon Cyberpunk')).toBeInTheDocument();
  });

  test('closes dropdown when close button is clicked', async () => {
    render(
      <ThemeSwitcher 
        currentTheme="original" 
        onThemeChange={mockOnThemeChange} 
      />
    );

    const button = screen.getByText('🎨 Themes');
    fireEvent.click(button);

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Choose Your Style')).not.toBeInTheDocument();
    });
  });

  test('closes dropdown when overlay is clicked', async () => {
    render(
      <ThemeSwitcher 
        currentTheme="original" 
        onThemeChange={mockOnThemeChange} 
      />
    );

    const button = screen.getByText('🎨 Themes');
    fireEvent.click(button);

    const overlay = document.querySelector('.theme-overlay');
    fireEvent.click(overlay);

    await waitFor(() => {
      expect(screen.queryByText('Choose Your Style')).not.toBeInTheDocument();
    });
  });

  test('highlights current theme as active', () => {
    render(
      <ThemeSwitcher 
        currentTheme="dark" 
        onThemeChange={mockOnThemeChange} 
      />
    );

    const button = screen.getByText('🎨 Themes');
    fireEvent.click(button);

    const darkThemeButton = screen.getByText('🌙 Dark Mode').closest('button');
    expect(darkThemeButton).toHaveClass('active');
  });

  test('calls onThemeChange when theme is selected', async () => {
    render(
      <ThemeSwitcher 
        currentTheme="original" 
        onThemeChange={mockOnThemeChange} 
      />
    );

    const button = screen.getByText('🎨 Themes');
    fireEvent.click(button);

    const darkThemeButton = screen.getByText('🌙 Dark Mode');
    fireEvent.click(darkThemeButton);

    expect(mockOnThemeChange).toHaveBeenCalledWith('dark');
    
    await waitFor(() => {
      expect(screen.queryByText('Choose Your Style')).not.toBeInTheDocument();
    });
  });

  test('shows theme descriptions correctly', () => {
    render(
      <ThemeSwitcher 
        currentTheme="original" 
        onThemeChange={mockOnThemeChange} 
      />
    );

    const button = screen.getByText('🎨 Themes');
    fireEvent.click(button);

    expect(screen.getByText('Gradient with white cards')).toBeInTheDocument();
    expect(screen.getByText('Sleek dark theme')).toBeInTheDocument();
    expect(screen.getByText('Frosted glass effects')).toBeInTheDocument();
    expect(screen.getByText('Clean and simple')).toBeInTheDocument();
    expect(screen.getByText('Futuristic and vibrant')).toBeInTheDocument();
  });

  test('displays save information', () => {
    render(
      <ThemeSwitcher 
        currentTheme="original" 
        onThemeChange={mockOnThemeChange} 
      />
    );

    const button = screen.getByText('🎨 Themes');
    fireEvent.click(button);

    expect(screen.getByText('Themes are saved automatically')).toBeInTheDocument();
  });

  test('handles all theme selections correctly', async () => {
    const themes = [
      { id: 'original', name: '🎨 Original' },
      { id: 'dark', name: '🌙 Dark Mode' },
      { id: 'glassmorphism', name: '✨ Glassmorphism' },
      { id: 'minimalist', name: '🤍 Minimalist' },
      { id: 'neon', name: '🔥 Neon Cyberpunk' }
    ];

    for (const theme of themes) {
      const { unmount } = render(
        <ThemeSwitcher 
          currentTheme="original" 
          onThemeChange={mockOnThemeChange} 
        />
      );

      const button = screen.getByText('🎨 Themes');
      fireEvent.click(button);

      const themeButton = screen.getByText(theme.name);
      fireEvent.click(themeButton);

      expect(mockOnThemeChange).toHaveBeenCalledWith(theme.id);
      
      // Cleanup for next iteration
      mockOnThemeChange.mockClear();
      unmount();
    }
  });

  test('has proper accessibility attributes', () => {
    render(
      <ThemeSwitcher 
        currentTheme="original" 
        onThemeChange={mockOnThemeChange} 
      />
    );

    const button = screen.getByText('🎨 Themes');
    expect(button).toHaveAttribute('title', 'Switch Theme');
  });
}); 