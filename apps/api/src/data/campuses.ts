// Campus data with email domains and safe zones

import type { Campus } from '@threadloop/shared';

export const CAMPUSES: Campus[] = [
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Stanford University',
    emailDomains: ['stanford.edu'],
    location: {
      city: 'Stanford',
      state: 'CA',
      coordinates: { lat: 37.4275, lng: -122.1697 }
    },
    lockerLocations: [
      {
        name: 'Green Library Lockers',
        building: 'Green Library',
        coordinates: { lat: 37.4265, lng: -122.1686 },
        hours: '24/7',
        capacity: 50
      },
      {
        name: 'Tresidder Union Lockers',
        building: 'Tresidder Student Union',
        coordinates: { lat: 37.4252, lng: -122.1698 },
        hours: '6am-12am',
        capacity: 30
      },
      {
        name: 'Arrillaga Gym Lockers',
        building: 'Arrillaga Family Sports Center',
        coordinates: { lat: 37.4298, lng: -122.1633 },
        hours: '5am-11pm',
        capacity: 40
      }
    ],
    safeZones: [
      {
        name: 'Green Library 3rd Floor',
        type: 'library',
        coordinates: { lat: 37.4265, lng: -122.1686 },
        hours: '24/7'
      },
      {
        name: 'Coupa Cafe',
        type: 'cafe',
        coordinates: { lat: 37.4260, lng: -122.1693 },
        hours: '7am-7pm'
      },
      {
        name: 'Tresidder Student Union',
        type: 'student-center',
        coordinates: { lat: 37.4252, lng: -122.1698 },
        hours: '7am-10pm'
      },
      {
        name: 'Wilbur Dining Hall',
        type: 'dining-hall',
        coordinates: { lat: 37.4241, lng: -122.1674 },
        hours: '7am-9pm'
      }
    ]
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'UC Berkeley',
    emailDomains: ['berkeley.edu', 'cal.berkeley.edu'],
    location: {
      city: 'Berkeley',
      state: 'CA',
      coordinates: { lat: 37.8719, lng: -122.2585 }
    },
    lockerLocations: [
      {
        name: 'Doe Library Lockers',
        building: 'Doe Memorial Library',
        coordinates: { lat: 37.8723, lng: -122.2595 },
        hours: '24/7',
        capacity: 60
      },
      {
        name: 'MLK Student Union Lockers',
        building: 'Martin Luther King Jr. Student Union',
        coordinates: { lat: 37.8698, lng: -122.2601 },
        hours: '7am-11pm',
        capacity: 35
      }
    ],
    safeZones: [
      {
        name: 'Doe Library Main Reading Room',
        type: 'library',
        coordinates: { lat: 37.8723, lng: -122.2595 },
        hours: '8am-10pm'
      },
      {
        name: 'Caffe Strada',
        type: 'cafe',
        coordinates: { lat: 37.8750, lng: -122.2588 },
        hours: '7am-8pm'
      },
      {
        name: 'MLK Student Union',
        type: 'student-center',
        coordinates: { lat: 37.8698, lng: -122.2601 },
        hours: '7am-11pm'
      }
    ]
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'MIT',
    emailDomains: ['mit.edu'],
    location: {
      city: 'Cambridge',
      state: 'MA',
      coordinates: { lat: 42.3601, lng: -71.0942 }
    },
    safeZones: [
      {
        name: 'Student Center (W20)',
        type: 'student-center',
        coordinates: { lat: 42.3586, lng: -71.0953 },
        hours: '24/7'
      },
      {
        name: 'Lobby 7',
        type: 'other',
        coordinates: { lat: 42.3596, lng: -71.0935 },
        hours: '24/7'
      }
    ]
  }
];

export function findCampusByEmailDomain(email: string): Campus | undefined {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return undefined;

  return CAMPUSES.find(campus =>
    campus.emailDomains.some(campusDomain =>
      domain === campusDomain.toLowerCase()
    )
  );
}

export function getCampusById(campusId: string): Campus | undefined {
  return CAMPUSES.find(c => c.id === campusId);
}
