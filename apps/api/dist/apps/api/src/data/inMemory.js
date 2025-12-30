"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getListings = getListings;
exports.createListing = createListing;
const crypto_1 = require("crypto");
const listings = [];
const staticBasePath = '/static';
const staticUrl = (fileName) => `${staticBasePath}/${fileName}`;
const sampleListings = [
    {
        sellerId: '11111111-1111-1111-1111-111111111111',
        campusId: '22222222-2222-2222-2222-222222222222',
        title: 'Vintage Levi’s Sherpa Jacket',
        description: 'Cozy sherpa-lined trucker jacket from Levi’s. Worn a handful of times and perfect for chilly library nights.',
        category: 'Outerwear',
        size: 'M',
        condition: 'like_new',
        price: 65,
        status: 'active',
        swapValue: undefined,
        aiMetadata: { palette: ['indigo', 'cream'] },
        images: [{ storageUrl: staticUrl('look-1.png') }]
    },
    {
        sellerId: '33333333-3333-3333-3333-333333333333',
        campusId: '22222222-2222-2222-2222-222222222222',
        title: 'Aritzia Wilfred Effortless Pant',
        description: 'Black high-waisted trousers, sits cropped at the ankle. Great condition and a staple for presentations.',
        category: 'Bottoms',
        size: '4',
        condition: 'good',
        price: 55,
        status: 'active',
        swapValue: undefined,
        aiMetadata: { vibe: 'academic chic' },
        images: [{ storageUrl: staticUrl('look-2.png') }]
    },
    {
        sellerId: '44444444-4444-4444-4444-444444444444',
        campusId: '22222222-2222-2222-2222-222222222222',
        title: 'Nike Dunks “Panda”',
        description: 'Unisex Nike Dunks in the classic black/white colorway. Lightly scuffed on the toe, still tons of life.',
        category: 'Footwear',
        size: 'W8 / M6.5',
        condition: 'good',
        price: undefined,
        status: 'active',
        swapValue: 90,
        aiMetadata: { recommendedSwaps: ['white zip-up', 'cargo skirt'] },
        images: [{ storageUrl: staticUrl('look-3.png') }]
    },
    {
        sellerId: '55555555-5555-5555-5555-555555555555',
        campusId: '22222222-2222-2222-2222-222222222222',
        title: 'Plaid Skirt + Knit Bundle',
        description: 'Two-piece bundle: Urban Outfitters plaid mini and neutral cropped knit. Ideal for fall fits.',
        category: 'Bundle',
        size: 'S',
        condition: 'like_new',
        price: 45,
        status: 'active',
        swapValue: undefined,
        aiMetadata: { bundle: true },
        images: [{ storageUrl: 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=800&q=80' }]
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
