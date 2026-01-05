import { useState, useCallback } from 'react';
import type { Listing } from '@threadloop/shared';
import { calculateDemandScore, getSeasonalInsights, suggestPricing } from '../utils/seasonalDemand';
import { createImagePreview, SUPPORTED_IMAGE_TYPES, SUPPORTED_FORMATS_TEXT } from '../lib/imageUtils';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.PROD ? `${window.location.origin}/api` : 'http://localhost:4000');
const DEFAULT_SELLER_ID = '11111111-1111-1111-1111-111111111111';
const DEFAULT_CAMPUS_ID = '22222222-2222-2222-2222-222222222222';

type UploadedImage = {
  id: string;
  file: File;
  preview: string;
  aiSuggestion?: {
    title: string;
    description: string;
    category: string;
    size: string;
    condition: Listing['condition'];
    price?: number;
    swapValue?: number;
  };
  demandScore?: ReturnType<typeof calculateDemandScore>;
  pricingSuggestion?: ReturnType<typeof suggestPricing>;
  loading?: boolean;
  error?: string;
};

export function BulkUpload() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUrgentSale, setIsUrgentSale] = useState(false);
  const seasonalInsights = getSeasonalInsights();

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Process each file to handle HEIC conversion
    const processedImages = await Promise.all(
      files.map(async (file) => {
        try {
          const preview = await createImagePreview(file);
          return {
            id: `${Date.now()}-${Math.random()}`,
            file,
            preview
          };
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          // Return null for failed files, filter them out later
          return null;
        }
      })
    );

    // Filter out any failed conversions and add valid images
    const validImages = processedImages.filter((img): img is UploadedImage => img !== null);
    setImages(prev => [...prev, ...validImages]);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);

    // Process each file to handle HEIC conversion
    const processedImages = await Promise.all(
      files.map(async (file) => {
        try {
          const preview = await createImagePreview(file);
          return {
            id: `${Date.now()}-${Math.random()}`,
            file,
            preview
          };
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          return null;
        }
      })
    );

    // Filter out any failed conversions and add valid images
    const validImages = processedImages.filter((img): img is UploadedImage => img !== null);
    setImages(prev => [...prev, ...validImages]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const processImage = async (image: UploadedImage) => {
    setImages(prev =>
      prev.map(img => (img.id === image.id ? { ...img, loading: true, error: undefined } : img))
    );

    try {
      const reader = new FileReader();
      const imageData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(image.file);
      });

      const response = await fetch(`${API_BASE_URL}/ai/listing-suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData })
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? 'AI processing failed');
      }

      const aiSuggestion = payload.data;
      const demandScore = calculateDemandScore(aiSuggestion.category);
      const pricingSuggestion = suggestPricing(
        aiSuggestion.category,
        aiSuggestion.condition,
        aiSuggestion.price || aiSuggestion.swapValue || 50,
        isUrgentSale
      );

      setImages(prev =>
        prev.map(img =>
          img.id === image.id
            ? { ...img, aiSuggestion, demandScore, pricingSuggestion, loading: false }
            : img
        )
      );
    } catch (error) {
      setImages(prev =>
        prev.map(img =>
          img.id === image.id
            ? { ...img, loading: false, error: error instanceof Error ? error.message : 'Processing failed' }
            : img
        )
      );
    }
  };

  const processAllImages = async () => {
    setIsProcessing(true);
    for (const image of images) {
      if (!image.aiSuggestion && !image.loading) {
        await processImage(image);
      }
    }
    setIsProcessing(false);
  };

  const publishAll = async () => {
    const successfulUploads: Listing[] = [];

    for (const image of images) {
      if (!image.aiSuggestion) continue;

      try {
        const payload = {
          sellerId: DEFAULT_SELLER_ID,
          campusId: DEFAULT_CAMPUS_ID,
          title: image.aiSuggestion.title,
          description: image.aiSuggestion.description,
          category: image.aiSuggestion.category,
          size: image.aiSuggestion.size,
          condition: image.aiSuggestion.condition,
          price: image.pricingSuggestion?.suggestedPrice,
          status: 'active' as const,
          images: [{ storageUrl: image.preview }]
        };

        const response = await fetch(`${API_BASE_URL}/listings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const body = await response.json();
        if (response.ok && body.success) {
          successfulUploads.push(body.data);
        }
      } catch (error) {
        console.error('Failed to publish listing:', error);
      }
    }

    alert(`Successfully published ${successfulUploads.length} out of ${images.length} listings!`);
    setImages([]);
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const getDemandBadgeClass = (level: string) => {
    switch (level) {
      case 'very_high': return 'demand-badge very-high';
      case 'high': return 'demand-badge high';
      case 'medium': return 'demand-badge medium';
      default: return 'demand-badge low';
    }
  };

  return (
    <div className="page-content">
      <section>
        <div className="section-header">
          <div>
            <h1>Bulk Closet Liquidation</h1>
            <p className="subtitle">Upload multiple items at once with AI-powered pricing and demand insights</p>
          </div>
        </div>

        <div className="seasonal-insights-card">
          <h3>📅 Current Market Insights</h3>
          <p className="season-info">
            <strong>{seasonalInsights.currentSeason.charAt(0).toUpperCase() + seasonalInsights.currentSeason.slice(1)} Season:</strong> {seasonalInsights.description}
          </p>
          <div className="top-categories">
            <strong>High-demand categories:</strong>
            <div className="category-pills">
              {seasonalInsights.topCategories.slice(0, 6).map(cat => (
                <span key={cat} className="pill pill-demand">{cat}</span>
              ))}
            </div>
          </div>
          {seasonalInsights.upcomingEvents.length > 0 && (
            <div className="upcoming-events">
              <strong>Upcoming campus events:</strong>
              <ul>
                {seasonalInsights.upcomingEvents.map((event, idx) => (
                  <li key={idx}>
                    {event.name} - {event.date.toLocaleDateString()}
                    <span className="event-categories"> ({event.highDemandCategories.slice(0, 3).join(', ')})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="urgency-toggle">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={isUrgentSale}
              onChange={(e) => setIsUrgentSale(e.target.checked)}
            />
            <span>🎓 Urgent sale (graduation/move-out) - Price items 10% lower for quick sales</span>
          </label>
        </div>

        <div
          className="drop-zone"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="drop-zone-content">
            <div className="upload-icon">📸</div>
            <h3>Drag & drop photos here</h3>
            <p>or click to browse files</p>
            <input
              type="file"
              multiple
              accept={SUPPORTED_IMAGE_TYPES.join(',')}
              onChange={handleFileChange}
              className="file-input"
            />
          </div>
        </div>

        {images.length > 0 && (
          <div className="bulk-actions">
            <button
              onClick={processAllImages}
              disabled={isProcessing}
              className="cta-primary"
            >
              {isProcessing ? 'Processing...' : `Process All ${images.length} Items with AI`}
            </button>
            {images.every(img => img.aiSuggestion) && (
              <button onClick={publishAll} className="cta-primary">
                Publish All {images.length} Listings
              </button>
            )}
          </div>
        )}

        <div className="bulk-grid">
          {images.map(image => (
            <div key={image.id} className="bulk-card">
              <button className="remove-btn" onClick={() => removeImage(image.id)}>×</button>
              <img src={image.preview} alt="Upload preview" className="bulk-image" />

              {image.loading && <div className="loading-overlay">AI Processing...</div>}

              {image.error && (
                <div className="error-overlay">{image.error}</div>
              )}

              {image.aiSuggestion && (
                <div className="bulk-info">
                  <h4>{image.aiSuggestion.title}</h4>
                  <div className="bulk-meta">
                    <span className="pill pill-secondary">{image.aiSuggestion.category}</span>
                    <span className="pill">Size {image.aiSuggestion.size}</span>
                  </div>

                  {image.demandScore && (
                    <div className="demand-info">
                      <span className={getDemandBadgeClass(image.demandScore.demandLevel)}>
                        {image.demandScore.demandLevel.replace('_', ' ').toUpperCase()} DEMAND
                      </span>
                      <p className="demand-reason">{image.demandScore.reasons[0]}</p>
                    </div>
                  )}

                  {image.pricingSuggestion && (
                    <div className="pricing-suggestion">
                      <div className="suggested-price">
                        <strong>Suggested: ${image.pricingSuggestion.suggestedPrice}</strong>
                      </div>
                      <p className="price-range">
                        Range: ${image.pricingSuggestion.priceRange.min} - ${image.pricingSuggestion.priceRange.max}
                      </p>
                      <p className="price-reasoning">{image.pricingSuggestion.reasoning}</p>
                    </div>
                  )}
                </div>
              )}

              {!image.aiSuggestion && !image.loading && !image.error && (
                <button
                  className="process-btn"
                  onClick={() => processImage(image)}
                >
                  Process with AI
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
