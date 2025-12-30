import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STYLE_VIBES = [
  { id: 'minimalist', label: 'Minimalist', emoji: '⚪', description: 'Clean lines, neutral colors' },
  { id: 'preppy', label: 'Preppy', emoji: '👔', description: 'Classic, polished style' },
  { id: 'streetwear', label: 'Streetwear', emoji: '👟', description: 'Urban, trendy' },
  { id: 'vintage', label: 'Vintage', emoji: '🕰️', description: 'Retro, timeless' },
  { id: 'bohemian', label: 'Bohemian', emoji: '🌸', description: 'Flowy, free-spirited' },
  { id: 'sporty', label: 'Sporty', emoji: '⚽', description: 'Athletic, active' },
  { id: 'professional', label: 'Professional', emoji: '💼', description: 'Work-ready, polished' },
  { id: 'edgy', label: 'Edgy', emoji: '🖤', description: 'Bold, alternative' },
  { id: 'casual', label: 'Casual', emoji: '👕', description: 'Comfortable, everyday' }
];

const COLOR_OPTIONS = [
  { id: 'black', label: 'Black', hex: '#000000' },
  { id: 'white', label: 'White', hex: '#FFFFFF' },
  { id: 'gray', label: 'Gray', hex: '#808080' },
  { id: 'navy', label: 'Navy', hex: '#001f3f' },
  { id: 'brown', label: 'Brown', hex: '#8B4513' },
  { id: 'beige', label: 'Beige', hex: '#F5F5DC' },
  { id: 'red', label: 'Red', hex: '#FF0000' },
  { id: 'blue', label: 'Blue', hex: '#0074D9' },
  { id: 'green', label: 'Green', hex: '#2ECC40' },
  { id: 'yellow', label: 'Yellow', hex: '#FFDC00' },
  { id: 'pink', label: 'Pink', hex: '#FF69B4' },
  { id: 'purple', label: 'Purple', hex: '#B10DC9' }
];

export function StyleQuiz() {
  const [step, setStep] = useState(1);
  const [styleVibes, setStyleVibes] = useState<string[]>([]);
  const [favoriteColors, setFavoriteColors] = useState<string[]>([]);
  const [sizingProfile, setSizingProfile] = useState({
    topSize: '',
    bottomSize: '',
    shoeSize: '',
    dressSize: ''
  });
  const [saving, setSaving] = useState(false);

  const { updateStyleProfile } = useAuth();
  const navigate = useNavigate();

  const toggleStyleVibe = (id: string) => {
    if (styleVibes.includes(id)) {
      setStyleVibes(styleVibes.filter(v => v !== id));
    } else {
      if (styleVibes.length < 3) {
        setStyleVibes([...styleVibes, id]);
      }
    }
  };

  const toggleColor = (id: string) => {
    if (favoriteColors.includes(id)) {
      setFavoriteColors(favoriteColors.filter(c => c !== id));
    } else {
      if (favoriteColors.length < 5) {
        setFavoriteColors([...favoriteColors, id]);
      }
    }
  };

  const handleSizingChange = (field: keyof typeof sizingProfile) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSizingProfile(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await updateStyleProfile({
        styleVibes,
        favoriteColors,
        sizingProfile: Object.keys(sizingProfile).some(key => sizingProfile[key as keyof typeof sizingProfile])
          ? sizingProfile
          : undefined
      });
      navigate('/');
    } catch (error) {
      console.error('Failed to save style profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return styleVibes.length > 0;
    if (step === 2) return favoriteColors.length > 0;
    return true;
  };

  return (
    <div className="quiz-container">
      <div className="quiz-card">
        <div className="quiz-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(step / 3) * 100}%` }}></div>
          </div>
          <p className="progress-text">Step {step} of 3</p>
        </div>

        {step === 1 && (
          <div className="quiz-step">
            <h2>What's your style vibe?</h2>
            <p className="quiz-subtitle">Select up to 3 styles that match your aesthetic</p>

            <div className="style-grid">
              {STYLE_VIBES.map(vibe => (
                <button
                  key={vibe.id}
                  className={`style-card ${styleVibes.includes(vibe.id) ? 'selected' : ''}`}
                  onClick={() => toggleStyleVibe(vibe.id)}
                  type="button"
                >
                  <span className="style-emoji">{vibe.emoji}</span>
                  <span className="style-label">{vibe.label}</span>
                  <span className="style-description">{vibe.description}</span>
                </button>
              ))}
            </div>

            <p className="selection-count">{styleVibes.length}/3 selected</p>
          </div>
        )}

        {step === 2 && (
          <div className="quiz-step">
            <h2>What colors do you love?</h2>
            <p className="quiz-subtitle">Pick up to 5 favorite colors to help us personalize your feed</p>

            <div className="color-grid">
              {COLOR_OPTIONS.map(color => (
                <button
                  key={color.id}
                  className={`color-card ${favoriteColors.includes(color.id) ? 'selected' : ''}`}
                  onClick={() => toggleColor(color.id)}
                  type="button"
                >
                  <div
                    className="color-swatch"
                    style={{
                      backgroundColor: color.hex,
                      border: color.id === 'white' ? '1px solid #d9d9d9' : 'none'
                    }}
                  ></div>
                  <span className="color-label">{color.label}</span>
                </button>
              ))}
            </div>

            <p className="selection-count">{favoriteColors.length}/5 selected</p>
          </div>
        )}

        {step === 3 && (
          <div className="quiz-step">
            <h2>What are your sizes?</h2>
            <p className="quiz-subtitle">Optional: Help us filter listings that fit you perfectly</p>

            <div className="sizing-form">
              <label className="field">
                <span>Top Size</span>
                <input
                  type="text"
                  value={sizingProfile.topSize}
                  onChange={handleSizingChange('topSize')}
                  placeholder="e.g., S, M, L, XL"
                />
              </label>

              <label className="field">
                <span>Bottom Size</span>
                <input
                  type="text"
                  value={sizingProfile.bottomSize}
                  onChange={handleSizingChange('bottomSize')}
                  placeholder="e.g., 28, 30, 32"
                />
              </label>

              <label className="field">
                <span>Shoe Size</span>
                <input
                  type="text"
                  value={sizingProfile.shoeSize}
                  onChange={handleSizingChange('shoeSize')}
                  placeholder="e.g., 9, 10, W8"
                />
              </label>

              <label className="field">
                <span>Dress Size (optional)</span>
                <input
                  type="text"
                  value={sizingProfile.dressSize}
                  onChange={handleSizingChange('dressSize')}
                  placeholder="e.g., 2, 4, 6"
                />
              </label>
            </div>
          </div>
        )}

        <div className="quiz-actions">
          {step > 1 && (
            <button
              className="quiz-button ghost"
              onClick={() => setStep(step - 1)}
              type="button"
            >
              Back
            </button>
          )}

          {step < 3 ? (
            <button
              className="quiz-button cta-primary"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              type="button"
            >
              Continue
            </button>
          ) : (
            <button
              className="quiz-button cta-primary"
              onClick={handleSubmit}
              disabled={saving}
              type="button"
            >
              {saving ? 'Saving...' : 'Complete Setup'}
            </button>
          )}

          {step === 3 && (
            <button
              className="quiz-skip"
              onClick={handleSubmit}
              type="button"
            >
              Skip sizing (you can add this later)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
