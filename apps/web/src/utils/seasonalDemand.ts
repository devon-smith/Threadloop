type Season = 'spring' | 'summer' | 'fall' | 'winter';
type EventType = 'graduation' | 'career_fair' | 'formal' | 'game_day' | 'finals' | 'move_out';

type SeasonalEvent = {
  name: string;
  type: EventType;
  date: Date;
  highDemandCategories: string[];
};

type DemandScore = {
  category: string;
  demandLevel: 'very_high' | 'high' | 'medium' | 'low';
  score: number;
  reasons: string[];
};

// Campus events calendar (hardcoded for MVP, would come from API in production)
const CAMPUS_EVENTS: SeasonalEvent[] = [
  {
    name: 'Spring Career Fair',
    type: 'career_fair',
    date: new Date('2025-02-15'),
    highDemandCategories: ['Blazers', 'Dress Shirts', 'Slacks', 'Professional Shoes']
  },
  {
    name: 'Winter Formal',
    type: 'formal',
    date: new Date('2025-01-20'),
    highDemandCategories: ['Dresses', 'Suits', 'Heels', 'Formal Accessories']
  },
  {
    name: 'Graduation',
    type: 'graduation',
    date: new Date('2025-05-15'),
    highDemandCategories: ['Dresses', 'Suits', 'Semi-formal', 'Professional']
  },
  {
    name: 'Move-Out Week',
    type: 'move_out',
    date: new Date('2025-05-20'),
    highDemandCategories: ['Casual', 'Basics', 'Loungewear', 'Budget-friendly']
  },
  {
    name: 'Fall Game Days',
    type: 'game_day',
    date: new Date('2025-09-01'),
    highDemandCategories: ['School Colors', 'Casual', 'Athleisure', 'Outerwear']
  },
  {
    name: 'Finals Week',
    type: 'finals',
    date: new Date('2025-05-01'),
    highDemandCategories: ['Loungewear', 'Comfortable', 'Basics', 'Sweats']
  }
];

// Seasonal weather patterns and typical clothing needs
const SEASONAL_DEMAND: Record<Season, { categories: string[]; description: string }> = {
  winter: {
    categories: ['Coats', 'Jackets', 'Sweaters', 'Boots', 'Scarves', 'Long Sleeves'],
    description: 'Cold weather essentials in high demand'
  },
  spring: {
    categories: ['Light Jackets', 'Dresses', 'T-shirts', 'Jeans', 'Sneakers', 'Florals'],
    description: 'Transitional layering pieces popular'
  },
  summer: {
    categories: ['Shorts', 'Tank Tops', 'Sandals', 'Swimwear', 'Light Dresses', 'T-shirts'],
    description: 'Lightweight and breathable items trending'
  },
  fall: {
    categories: ['Sweaters', 'Jeans', 'Boots', 'Light Coats', 'Flannels', 'Layers'],
    description: 'Cozy layering pieces in season'
  }
};

// Get current season based on month
function getCurrentSeason(): Season {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

// Get upcoming events in the next 60 days
function getUpcomingEvents(): SeasonalEvent[] {
  const now = new Date();
  const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  return CAMPUS_EVENTS.filter(event => {
    return event.date >= now && event.date <= sixtyDaysFromNow;
  }).sort((a, b) => a.date.getTime() - b.date.getTime());
}

// Calculate demand score for a category
export function calculateDemandScore(category: string): DemandScore {
  const season = getCurrentSeason();
  const upcomingEvents = getUpcomingEvents();
  const reasons: string[] = [];
  let score = 0;

  // Base seasonal demand
  const seasonalCategories = SEASONAL_DEMAND[season].categories;
  const isSeasonalMatch = seasonalCategories.some(cat =>
    category.toLowerCase().includes(cat.toLowerCase()) ||
    cat.toLowerCase().includes(category.toLowerCase())
  );

  if (isSeasonalMatch) {
    score += 40;
    reasons.push(`${season.charAt(0).toUpperCase() + season.slice(1)} season demand`);
  }

  // Event-based demand
  upcomingEvents.forEach(event => {
    const isEventMatch = event.highDemandCategories.some(cat =>
      category.toLowerCase().includes(cat.toLowerCase()) ||
      cat.toLowerCase().includes(category.toLowerCase())
    );

    if (isEventMatch) {
      const daysUntilEvent = Math.ceil((event.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const urgencyBonus = Math.max(0, 30 - daysUntilEvent); // Closer events = higher score
      score += 30 + urgencyBonus;
      reasons.push(`${event.name} (${daysUntilEvent} days away)`);
    }
  });

  // Graduation season boost (April-May)
  const month = new Date().getMonth();
  if ((month === 3 || month === 4) &&
      (category.toLowerCase().includes('professional') ||
       category.toLowerCase().includes('dress') ||
       category.toLowerCase().includes('suit'))) {
    score += 25;
    reasons.push('Graduation season - professional wear in demand');
  }

  // Move-out liquidation urgency (late spring)
  if (month === 4 && category.toLowerCase().includes('casual')) {
    score += 20;
    reasons.push('End of semester - students looking for budget deals');
  }

  // Determine demand level
  let demandLevel: DemandScore['demandLevel'];
  if (score >= 70) demandLevel = 'very_high';
  else if (score >= 50) demandLevel = 'high';
  else if (score >= 30) demandLevel = 'medium';
  else demandLevel = 'low';

  // Add default reason if none
  if (reasons.length === 0) {
    reasons.push('Standard campus demand');
  }

  return {
    category,
    demandLevel,
    score,
    reasons
  };
}

// Get all upcoming events for display
export function getUpcomingCampusEvents(): SeasonalEvent[] {
  return getUpcomingEvents();
}

// Get seasonal insights
export function getSeasonalInsights(): {
  currentSeason: Season;
  description: string;
  topCategories: string[];
  upcomingEvents: SeasonalEvent[];
} {
  const season = getCurrentSeason();
  const seasonalInfo = SEASONAL_DEMAND[season];
  const upcomingEvents = getUpcomingEvents();

  return {
    currentSeason: season,
    description: seasonalInfo.description,
    topCategories: seasonalInfo.categories,
    upcomingEvents
  };
}

// Smart pricing suggestion based on demand and urgency
export function suggestPricing(
  category: string,
  condition: string,
  estimatedRetailValue: number,
  isUrgent: boolean = false
): {
  suggestedPrice: number;
  priceRange: { min: number; max: number };
  reasoning: string;
} {
  const demandScore = calculateDemandScore(category);

  // Base percentage of retail value
  let percentage = 0.4; // 40% of retail for base

  // Adjust for condition
  if (condition === 'new') percentage = 0.7;
  else if (condition === 'like_new') percentage = 0.6;
  else if (condition === 'good') percentage = 0.45;
  else if (condition === 'fair') percentage = 0.3;

  // Adjust for demand
  if (demandScore.demandLevel === 'very_high') percentage += 0.15;
  else if (demandScore.demandLevel === 'high') percentage += 0.1;
  else if (demandScore.demandLevel === 'medium') percentage += 0.05;

  // Urgency discount (graduation/move-out)
  if (isUrgent) percentage -= 0.1;

  const suggestedPrice = Math.round(estimatedRetailValue * percentage);
  const priceRange = {
    min: Math.round(suggestedPrice * 0.85),
    max: Math.round(suggestedPrice * 1.15)
  };

  let reasoning = `Based on ${condition} condition`;
  if (demandScore.demandLevel === 'very_high' || demandScore.demandLevel === 'high') {
    reasoning += ` and high ${demandScore.reasons[0]} demand`;
  }
  if (isUrgent) {
    reasoning += `. Priced for quick sale`;
  }

  return {
    suggestedPrice,
    priceRange,
    reasoning
  };
}
