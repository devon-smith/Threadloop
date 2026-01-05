import { supabase } from './supabase';

// Fresh, high-quality Unsplash images for sample listings
const SAMPLE_LISTINGS = [
  {
    title: 'Patagonia Better Sweater Fleece',
    description: 'Classic Patagonia quarter-zip fleece in heather gray. Perfect for layering during cold study sessions or early morning classes. Very warm and cozy.',
    category: 'Outerwear',
    size: 'M',
    condition: 'like_new' as const,
    brand: 'Patagonia',
    price: 65,
    images: ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80']
  },
  {
    title: 'Vintage Levi\'s 501 Jeans',
    description: 'Authentic vintage Levi\'s 501s with the perfect worn-in look. High waisted, straight leg. These have that classic 90s fit everyone loves.',
    category: 'Bottoms',
    size: '28',
    condition: 'good' as const,
    brand: 'Levi\'s',
    price: 48,
    images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80']
  },
  {
    title: 'Nike Air Force 1 Low White',
    description: 'Classic all-white AF1s. Size 9 men\'s. Worn a few times but still in great shape. Minor creasing but no major scuffs.',
    category: 'Shoes',
    size: '9',
    condition: 'good' as const,
    brand: 'Nike',
    price: 75,
    images: ['https://images.unsplash.com/photo-1600269452121-4f2416e55c28?auto=format&fit=crop&w=800&q=80']
  },
  {
    title: 'Aritzia Oversized Blazer',
    description: 'Perfect for interviews and career fairs! This oversized blazer from Aritzia has that effortlessly chic look. Taupe color goes with everything.',
    category: 'Formal',
    size: 'S',
    condition: 'like_new' as const,
    brand: 'Aritzia',
    price: 85,
    images: ['https://images.unsplash.com/photo-1591369822096-ffd140ec948f?auto=format&fit=crop&w=800&q=80']
  },
  {
    title: 'Reformation Mini Dress',
    description: 'Gorgeous floral mini dress from Reformation. Perfect for spring formals or date nights. Sustainable and cute!',
    category: 'Dresses',
    size: 'S',
    condition: 'new' as const,
    brand: 'Reformation',
    price: 95,
    images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80']
  },
  {
    title: 'Carhartt Beanie',
    description: 'Classic Carhartt beanie in black. Brand new with tags. Essential for cold winter walks across campus.',
    category: 'Accessories',
    size: 'One Size',
    condition: 'new' as const,
    brand: 'Carhartt',
    price: 18,
    images: ['https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=800&q=80']
  },
  {
    title: 'Lululemon Align Leggings',
    description: 'Super soft Lululemon Align leggings in black. Size 6. Worn a handful of times but still in excellent condition. No pilling.',
    category: 'Activewear',
    size: 'M',
    condition: 'like_new' as const,
    brand: 'Lululemon',
    price: 58,
    images: ['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=800&q=80']
  },
  {
    title: 'Ralph Lauren Oxford Shirt',
    description: 'Light blue Ralph Lauren oxford. Classic fit. Great for presentations or when you need to look put together. Barely worn.',
    category: 'Tops',
    size: 'M',
    condition: 'like_new' as const,
    brand: 'Ralph Lauren',
    price: 35,
    images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80']
  },
  {
    title: 'North Face Puffer Jacket',
    description: 'Stay warm with this classic North Face puffer in matte black. 700-fill down. Essential for freezing lecture halls.',
    category: 'Outerwear',
    size: 'L',
    condition: 'good' as const,
    brand: 'The North Face',
    price: 120,
    images: ['https://images.unsplash.com/photo-1544923246-77307dd628b5?auto=format&fit=crop&w=800&q=80']
  },
  {
    title: 'Converse Chuck Taylor High Tops',
    description: 'Black high-top Chucks. Size 8. A wardrobe staple that goes with literally everything. Some wear but tons of life left.',
    category: 'Shoes',
    size: '8',
    condition: 'fair' as const,
    brand: 'Converse',
    price: 28,
    images: ['https://images.unsplash.com/photo-1463100099107-aa0980c362e6?auto=format&fit=crop&w=800&q=80']
  },
  {
    title: 'Free People Oversized Sweater',
    description: 'Cozy chunky knit sweater in cream. That perfect slouchy oversized fit. Great for library study sessions.',
    category: 'Tops',
    size: 'S',
    condition: 'good' as const,
    brand: 'Free People',
    price: 42,
    images: ['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=800&q=80']
  },
  {
    title: 'Adidas Track Pants',
    description: 'Classic three-stripe Adidas track pants in black. Size medium. Comfy for class or the gym.',
    category: 'Activewear',
    size: 'M',
    condition: 'like_new' as const,
    brand: 'Adidas',
    price: 32,
    images: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80']
  }
];

// Default campus ID for Stanford
const DEFAULT_CAMPUS_ID = '22222222-2222-2222-2222-222222222222';

export async function seedSampleListings(sellerId: string): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    let createdCount = 0;

    for (const listing of SAMPLE_LISTINGS) {
      // Create the listing
      const { data: newListing, error: listingError } = await supabase
        .from('listings')
        .insert({
          seller_id: sellerId,
          campus_id: DEFAULT_CAMPUS_ID,
          title: listing.title,
          description: listing.description,
          category: listing.category,
          size: listing.size,
          condition: listing.condition,
          brand: listing.brand,
          price: listing.price,
          is_sellable: true,
          is_swappable: false,
          status: 'active',
          ai_metadata: { seeded: true, brand: listing.brand }
        })
        .select()
        .single();

      if (listingError) {
        console.error('Error creating listing:', listingError);
        continue;
      }

      // Add image(s)
      for (let i = 0; i < listing.images.length; i++) {
        const { error: imageError } = await supabase
          .from('listing_images')
          .insert({
            listing_id: newListing.id,
            storage_url: listing.images[i],
            position: i
          });

        if (imageError) {
          console.error('Error adding image:', imageError);
        }
      }

      createdCount++;
    }

    return { success: true, count: createdCount };
  } catch (error) {
    console.error('Error seeding listings:', error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Failed to seed listings'
    };
  }
}

// Check if sample listings already exist
export async function checkSampleListingsExist(): Promise<boolean> {
  const { data, error } = await supabase
    .from('listings')
    .select('id')
    .eq('ai_metadata->>seeded', 'true')
    .limit(1);

  if (error) {
    console.error('Error checking sample listings:', error);
    return false;
  }

  return (data?.length || 0) > 0;
}

// Clear all sample listings (for admin/testing)
export async function clearSampleListings(): Promise<boolean> {
  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('ai_metadata->>seeded', 'true');

  if (error) {
    console.error('Error clearing sample listings:', error);
    return false;
  }

  return true;
}
