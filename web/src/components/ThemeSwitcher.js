import React, { useState } from 'react';

const themes = [
  { id: 'original', name: '🎨 Original', description: 'Gradient with white cards' },
  { id: 'dark', name: '🌙 Dark Mode', description: 'Sleek dark theme' },
  { id: 'glassmorphism', name: '✨ Glassmorphism', description: 'Frosted glass effects' },
  { id: 'minimalist', name: '🤍 Minimalist', description: 'Clean and simple' },
  { id: 'neon', name: '🔥 Neon Cyberpunk', description: 'Futuristic and vibrant' },
];

function ThemeSwitcher({ currentTheme, onThemeChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleThemeSelect = (themeId) => {
    onThemeChange(themeId);
    setIsOpen(false);
  };

  return (
    <div className="theme-switcher">
      <button 
        className="theme-switcher-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Switch Theme"
      >
        🎨 Themes
      </button>
      
      {isOpen && (
        <div className="theme-dropdown">
          <div className="theme-dropdown-header">
            <h3>Choose Your Style</h3>
            <button 
              className="close-btn"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>
          
          <div className="theme-options">
            {themes.map(theme => (
              <button
                key={theme.id}
                className={`theme-option ${currentTheme === theme.id ? 'active' : ''}`}
                onClick={() => handleThemeSelect(theme.id)}
              >
                <div className="theme-name">{theme.name}</div>
                <div className="theme-description">{theme.description}</div>
              </button>
            ))}
          </div>
          
          <div className="theme-dropdown-footer">
            <p>Themes are saved automatically</p>
          </div>
        </div>
      )}
      
      {isOpen && (
        <div 
          className="theme-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export default ThemeSwitcher; 