"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getListings = getListings;
exports.createListing = createListing;
const crypto_1 = require("crypto");
const listings = [];
const staticBasePath = '/static';
const staticUrl = (fileName) => `${staticBasePath}/${fileName}`;
const sampleListings = [
    // Diverse clothing listings
    {
        sellerId: '66666666-6666-6666-6666-666666666666',
        campusId: '22222222-2222-2222-2222-222222222222',
        title: 'Patagonia Fleece Pullover',
        description: 'Classic Patagonia synchilla fleece in navy. Perfect for layering during cold study sessions.',
        category: 'Outerwear',
        size: 'S',
        condition: 'good',
        price: 48,
        status: 'active',
        swapValue: undefined,
        aiMetadata: { brand: 'Patagonia', sustainable: true },
        images: [{ storageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80' }]
    },
    {
        sellerId: '77777777-7777-7777-7777-777777777777',
        campusId: '22222222-2222-2222-2222-222222222222',
        title: 'Zara Blazer - Navy',
        description: 'Professional navy blazer perfect for career fairs and presentations. Fitted cut, barely worn.',
        category: 'Blazers',
        size: 'M',
        condition: 'like_new',
        price: 72,
        status: 'active',
        swapValue: undefined,
        aiMetadata: { occasion: ['career_fair', 'formal'] },
        images: [{ storageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80' }]
    },
    {
        sellerId: '88888888-8888-8888-8888-888888888888',
        campusId: '22222222-2222-2222-2222-222222222222',
        title: 'White Button-Down Shirt',
        description: 'Classic white oxford from J.Crew. Essential for interviews and formal events. Size medium.',
        category: 'Shirts',
        size: 'M',
        condition: 'like_new',
        price: 28,
        status: 'active',
        swapValue: undefined,
        aiMetadata: { versatile: true },
        images: [{ storageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80' }]
    },
    {
        sellerId: '99999999-9999-9999-9999-999999999999',
        campusId: '22222222-2222-2222-2222-222222222222',
        title: 'Black Midi Dress',
        description: 'Elegant black midi dress from Reformation. Perfect for formal events or date nights. Worn twice.',
        category: 'Dresses',
        size: 'S',
        condition: 'new',
        price: 95,
        status: 'active',
        swapValue: undefined,
        aiMetadata: { occasion: ['formal', 'date'] },
        images: [{ storageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80' }]
    },
    {
        sellerId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        campusId: '22222222-2222-2222-2222-222222222222',
        title: 'Adidas Ultraboost Sneakers',
        description: 'Gray Adidas Ultraboost in great condition. Super comfy for walking across campus all day.',
        category: 'Footwear',
        size: 'W9',
        condition: 'good',
        price: 68,
        status: 'active',
        swapValue: undefined,
        aiMetadata: { comfort: 'high' },
        images: [{ storageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80' }]
    },
    {
        sellerId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        campusId: '22222222-2222-2222-2222-222222222222',
        title: 'High-Waisted Mom Jeans',
        description: 'Light wash Levi\'s 501 mom jeans. Size 28 waist. Perfect vintage fit, slightly cropped.',
        category: 'Bottoms',
        size: '28',
        condition: 'good',
        price: 42,
        status: 'active',
        swapValue: undefined,
        aiMetadata: { style: 'vintage', brand: 'Levi\'s' },
        images: [{ storageUrl: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=800&q=80' }]
    },
    {
        sellerId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        campusId: '22222222-2222-2222-2222-222222222222',
        title: 'Oversized Crewneck Sweater',
        description: 'Cozy cream-colored crewneck from Urban Outfitters. Perfect for lounging or casual classes.',
        category: 'Sweaters',
        size: 'L',
        condition: 'like_new',
        price: 35,
        status: 'active',
        swapValue: undefined,
        aiMetadata: { vibe: 'cozy' },
        images: [{ storageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=800&q=80' }]
    },
    {
        sellerId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        campusId: '22222222-2222-2222-2222-222222222222',
        title: 'Floral Summer Dress',
        description: 'Light and flowy summer dress with floral print. Great for warm weather or spring formals.',
        category: 'Dresses',
        size: 'M',
        condition: 'good',
        price: 38,
        status: 'active',
        swapValue: undefined,
        aiMetadata: { season: 'spring_summer' },
        images: [{ storageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80' }]
    },
    {
        sellerId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        campusId: '22222222-2222-2222-2222-222222222222',
        title: 'Leather Ankle Boots',
        description: 'Black leather ankle boots from Steve Madden. Small heel, very comfortable for all-day wear.',
        category: 'Footwear',
        size: 'W8',
        condition: 'fair',
        price: 45,
        status: 'active',
        swapValue: undefined,
        aiMetadata: { style: 'professional' },
        images: [{ storageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80' }]
    },
    {
        sellerId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
        campusId: '22222222-2222-2222-2222-222222222222',
        title: 'Graphic T-Shirt Bundle (3)',
        description: 'Three vintage band tees - all size small. Mix and match for casual looks.',
        category: 'Shirts',
        size: 'S',
        condition: 'good',
        price: 25,
        status: 'active',
        swapValue: undefined,
        aiMetadata: { bundle: true, count: 3 },
        images: [{ storageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80' }]
    },
    {
        sellerId: '10101010-1010-1010-1010-101010101010',
        campusId: '22222222-2222-2222-2222-222222222222',
        title: 'North Face Rain Jacket',
        description: 'Yellow North Face windbreaker/rain jacket. Lightweight and packable. Perfect for rainy campus days.',
        category: 'Outerwear',
        size: 'M',
        condition: 'like_new',
        price: 58,
        status: 'active',
        swapValue: undefined,
        aiMetadata: { weather: 'rain', brand: 'North Face' },
        images: [{ storageUrl: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=800&q=80' }]
    },
    {
        sellerId: '11111111-2222-3333-4444-555555555555',
        campusId: '22222222-2222-2222-2222-222222222222',
        title: 'Cargo Pants - Olive Green',
        description: 'Trendy olive green cargo pants from Dickies. Size 30 waist. Great for streetwear looks.',
        category: 'Bottoms',
        size: '30',
        condition: 'good',
        price: 40,
        status: 'active',
        swapValue: undefined,
        aiMetadata: { style: 'streetwear' },
        images: [{ storageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80' }]
    },
    {
        sellerId: '22222222-3333-4444-5555-666666666666',
        campusId: '22222222-2222-2222-2222-222222222222',
        title: 'Cashmere Scarf - Burgundy',
        description: 'Soft burgundy cashmere scarf. Barely used, perfect for winter months.',
        category: 'Accessories',
        size: 'One Size',
        condition: 'new',
        price: 32,
        status: 'active',
        swapValue: undefined,
        aiMetadata: { season: 'winter', material: 'cashmere' },
        images: [{ storageUrl: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?auto=format&fit=crop&w=800&q=80' }]
    },
    {
        sellerId: '33333333-4444-5555-6666-777777777777',
        campusId: '22222222-2222-2222-2222-222222222222',
        title: 'Denim Jacket - Medium Wash',
        description: 'Classic medium wash denim jacket from Gap. Never goes out of style. Size large.',
        category: 'Outerwear',
        size: 'L',
        condition: 'good',
        price: 38,
        status: 'active',
        swapValue: undefined,
        aiMetadata: { classic: true },
        images: [{ storageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80' }]
    },
    {
        sellerId: '44444444-5555-6666-7777-888888888888',
        campusId: '22222222-2222-2222-2222-222222222222',
        title: 'Converse Chuck Taylor High-Tops',
        description: 'Black high-top Converse. Size M8/W10. Some wear but still in solid condition.',
        category: 'Footwear',
        size: 'M8',
        condition: 'fair',
        price: 30,
        status: 'active',
        swapValue: undefined,
        aiMetadata: { classic: true, brand: 'Converse' },
        images: [{ storageUrl: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=800&q=80' }]
    },
    {
        sellerId: '55555555-6666-7777-8888-999999999999',
        campusId: '22222222-2222-2222-2222-222222222222',
        title: 'Wool Peacoat - Charcoal',
        description: 'Heavy charcoal wool peacoat. Very warm for winter. Fits like a medium/large.',
        category: 'Outerwear',
        size: 'M/L',
        condition: 'good',
        price: 85,
        status: 'active',
        swapValue: undefined,
        aiMetadata: { season: 'winter', formal: true },
        images: [{ storageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=800&q=80' }]
    }
];
function hydrateListing(partial, overrideId) {
    const listingId = overrideId ?? (0, crypto_1.randomUUID)();
    return {
        ...partial,
        id: listingId,
        images: partial.images.map((image) => ({
            storageUrl: image.storageUrl,
            qualityScore: image.qualityScore,
            id: image.id ?? (0, crypto_1.randomUUID)(),
            listingId: image.listingId ?? listingId
        }))
    };
}
function getListings() {
    return listings;
}
function createListing(partial) {
    const listing = hydrateListing(partial);
    listings.push(listing);
    return listing;
}
sampleListings.forEach((listing) => {
    listings.push(hydrateListing(listing));
});
