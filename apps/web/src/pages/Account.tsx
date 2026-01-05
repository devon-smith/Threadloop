import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

type UserProfile = {
  displayName: string;
  email: string;
  campus: string;
  bio: string;
  avatarUrl: string;
  measurements: {
    topSize: string;
    bottomSize: string;
    shoeSize: string;
  };
  styleTags: string[];
  rating: number;
  swapCount: number;
};

export function Account() {
  const { user, campus, updateProfile, updateStyleProfile } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile>({
    displayName: 'Student User',
    email: 'student@university.edu',
    campus: 'Stanford University',
    bio: 'Love sustainable fashion and finding unique pieces!',
    avatarUrl: '',
    measurements: {
      topSize: 'M',
      bottomSize: '28',
      shoeSize: '9'
    },
    styleTags: ['minimalist', 'streetwear', 'vintage'],
    rating: 4.8,
    swapCount: 12
  });

  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(profile);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || !campus) return;

    const nextProfile: UserProfile = {
      displayName: user.displayName,
      email: user.email,
      campus: campus.name,
      bio: user.bio || '',
      avatarUrl: user.avatarUrl || '',
      measurements: {
        topSize: user.sizingProfile?.topSize || '',
        bottomSize: user.sizingProfile?.bottomSize || '',
        shoeSize: user.sizingProfile?.shoeSize || ''
      },
      styleTags: (user.styleVibes as any) || [],
      rating: user.rating || 0,
      swapCount: user.swapCount || 0
    };

    setProfile(nextProfile);
    setFormData(nextProfile);
    // Only reset photo preview if there's no avatar URL
    if (!user.avatarUrl) {
      setPhotoPreview(null);
    }
  }, [user, campus]);

  const handleChange = (field: keyof UserProfile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleMeasurementChange = (field: keyof UserProfile['measurements']) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      measurements: { ...prev.measurements, [field]: e.target.value }
    }));
  };

  // Handle profile photo file upload
  const handlePhotoUpload = async (file: File) => {
    if (!user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('listing-images') // Reuse the existing bucket
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert('Failed to upload image. Please try again.');
        setPhotoPreview(null);
        return;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('listing-images')
        .getPublicUrl(fileName);

      const newAvatarUrl = urlData.publicUrl;

      // Update form data with new URL
      setFormData(prev => ({ ...prev, avatarUrl: newAvatarUrl }));

      // If not in editing mode, save directly to profile
      if (!editing) {
        await updateProfile({ avatarUrl: newAvatarUrl });
        setProfile(prev => ({ ...prev, avatarUrl: newAvatarUrl }));
        // Clear photo preview after successful upload
        setPhotoPreview(null);
      }

    } catch (error) {
      console.error('Photo upload error:', error);
      alert('Failed to upload photo');
      setPhotoPreview(null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handlePhotoUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleSave = async () => {
    if (!user) return;

    await updateProfile({
      displayName: formData.displayName,
      bio: formData.bio,
      avatarUrl: formData.avatarUrl || undefined
    });

    await updateStyleProfile({
      styleVibes: formData.styleTags,
      favoriteColors: user.favoriteColors || [],
      sizingProfile: {
        topSize: formData.measurements.topSize,
        bottomSize: formData.measurements.bottomSize,
        shoeSize: formData.measurements.shoeSize
      }
    });

    setProfile(formData);
    // Clear photo preview after successful save
    setPhotoPreview(null);
    setEditing(false);
  };

  const handleCancel = () => {
    setFormData(profile);
    setEditing(false);
  };

  if (!user || !campus) {
    return (
      <div className="page-content">
        <div className="empty-state">
          <p>Please log in to view your account</p>
          <button className="cta-primary" onClick={() => navigate('/login')}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <section>
        <div className="section-header">
          <h1>Account Settings</h1>
          <span>Manage your profile and preferences</span>
        </div>

        <div className="account-container">
          <div className="profile-card">
            <div className="profile-header">
              <div
                className={`avatar avatar-upload ${uploadingPhoto ? 'uploading' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                title="Click or drop image to change photo"
              >
                {(photoPreview || profile.avatarUrl) ? (
                  <>
                    <img src={photoPreview || profile.avatarUrl} alt={profile.displayName} />
                    <div className="avatar-overlay">
                      {uploadingPhoto ? 'Uploading...' : 'Change'}
                    </div>
                  </>
                ) : (
                  <div className="avatar-placeholder">
                    <span className="avatar-initial">{profile.displayName.charAt(0).toUpperCase()}</span>
                    <div className="avatar-overlay">
                      {uploadingPhoto ? 'Uploading...' : 'Add photo'}
                    </div>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <div className="profile-stats">
                <h2>{profile.displayName}</h2>
                <p className="meta">{profile.email}</p>
                <div className="stats-row">
                  <div className="stat">
                    <span className="stat-value">{profile.rating.toFixed(1)}</span>
                    <span className="stat-label">Rating</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{profile.swapCount}</span>
                    <span className="stat-label">Swaps</span>
                  </div>
                </div>
              </div>
            </div>

            {!editing ? (
              <div className="profile-content">
                <div className="profile-section">
                  <h3>Campus</h3>
                  <p>{profile.campus}</p>
                </div>

                <div className="profile-section">
                  <h3>Bio</h3>
                  <p>{profile.bio}</p>
                </div>

                <div className="profile-section">
                  <h3>Measurements</h3>
                  <div className="measurements-grid">
                    <div>
                      <span className="label">Top size:</span> {profile.measurements.topSize}
                    </div>
                    <div>
                      <span className="label">Bottom size:</span> {profile.measurements.bottomSize}
                    </div>
                    <div>
                      <span className="label">Shoe size:</span> {profile.measurements.shoeSize}
                    </div>
                  </div>
                </div>

                <div className="profile-section">
                  <h3>Style Tags</h3>
                  <div className="tags-container">
                    {profile.styleTags.map((tag) => (
                      <span key={tag} className="pill">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <button className="cta-primary" onClick={() => setEditing(true)}>
                  Edit Profile
                </button>
              </div>
            ) : (
              <form className="profile-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                {/* Profile Photo Upload */}
                <div className="field">
                  <span>Profile Photo</span>
                  <div
                    className={`photo-upload-zone ${uploadingPhoto ? 'uploading' : ''}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {(photoPreview || formData.avatarUrl) ? (
                      <div className="photo-preview">
                        <img
                          src={photoPreview || formData.avatarUrl}
                          alt="Profile preview"
                        />
                        <div className="photo-overlay">
                          {uploadingPhoto ? 'Uploading...' : 'Click or drop to change'}
                        </div>
                      </div>
                    ) : (
                      <div className="photo-placeholder">
                        <span className="photo-icon">📷</span>
                        <span>{uploadingPhoto ? 'Uploading...' : 'Drop photo here or click to upload'}</span>
                        <span className="photo-hint">JPG, PNG up to 5MB</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <div className="photo-url-fallback">
                    <span>Or paste an image URL:</span>
                    <input
                      value={formData.avatarUrl}
                      onChange={handleChange('avatarUrl')}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <label className="field">
                  <span>Display Name</span>
                  <input
                    value={formData.displayName}
                    onChange={handleChange('displayName')}
                    required
                  />
                </label>

                <label className="field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={handleChange('email')}
                    required
                    disabled
                  />
                </label>

                <label className="field">
                  <span>Campus</span>
                  <input
                    value={formData.campus}
                    onChange={handleChange('campus')}
                    required
                    disabled
                  />
                </label>

                <label className="field">
                  <span>Bio</span>
                  <textarea
                    value={formData.bio}
                    onChange={handleChange('bio')}
                    rows={3}
                    placeholder="Tell others about your style preferences..."
                  />
                </label>

                <div className="measurements-form">
                  <h3>Measurements</h3>
                  <div className="form-grid">
                    <label className="field">
                      <span>Top size</span>
                      <input
                        value={formData.measurements.topSize}
                        onChange={handleMeasurementChange('topSize')}
                        placeholder="e.g. M, L"
                      />
                    </label>
                    <label className="field">
                      <span>Bottom size</span>
                      <input
                        value={formData.measurements.bottomSize}
                        onChange={handleMeasurementChange('bottomSize')}
                        placeholder="e.g. 28, 30"
                      />
                    </label>
                    <label className="field">
                      <span>Shoe size</span>
                      <input
                        value={formData.measurements.shoeSize}
                        onChange={handleMeasurementChange('shoeSize')}
                        placeholder="e.g. 9, 10"
                      />
                    </label>
                  </div>
                </div>

                <div className="actions">
                  <button type="submit" className="cta-primary">
                    Save Changes
                  </button>
                  <button type="button" className="ghost" onClick={handleCancel}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="settings-card">
            <h3>Notification Preferences</h3>
            <div className="settings-list">
              <label className="setting-item">
                <input type="checkbox" defaultChecked />
                <span>New swap requests</span>
              </label>
              <label className="setting-item">
                <input type="checkbox" defaultChecked />
                <span>Price drop alerts</span>
              </label>
              <label className="setting-item">
                <input type="checkbox" defaultChecked />
                <span>Similar item recommendations</span>
              </label>
              <label className="setting-item">
                <input type="checkbox" />
                <span>Weekly style digest</span>
              </label>
            </div>

            <h3>Privacy Settings</h3>
            <div className="settings-list">
              <label className="setting-item">
                <input type="checkbox" defaultChecked />
                <span>Show my profile to campus members</span>
              </label>
              <label className="setting-item">
                <input type="checkbox" defaultChecked />
                <span>Allow direct messages</span>
              </label>
              <label className="setting-item">
                <input type="checkbox" />
                <span>Share my style preferences for better recommendations</span>
              </label>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
