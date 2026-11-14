export interface AirportSeed {
  code: string;
  name: string;
  city: string;
  country: string;
  description: string;
  image: string;
  sortOrder: number;
}

export interface VehicleSeed {
  name: string;
  slug: string;
  price: number;
  shortBase: number;
  shortPerMile: number;
  longBase: number;
  longPerMile: number;
  passengers: number;
  suitcases: number;
  handLuggageNote: string | null;
  image: string;
  description: string;
  carModel: string;
  sortOrder: number;
}

export interface FaqSeed {
  question: string;
  answer: string;
  sortOrder: number;
}

const UK = 'United Kingdom';

export const airportSeeds: AirportSeed[] = [
  {
    code: 'LHR',
    name: 'London Heathrow Airport',
    city: 'London',
    country: UK,
    description: "UK's busiest airport and major international hub",
    image: '/images/airports/lhr.png',
    sortOrder: 1,
  },
  {
    code: 'LGW',
    name: 'London Gatwick Airport',
    city: 'London',
    country: UK,
    description: "London's second-largest airport serving millions",
    image: '/images/airports/lgw.svg',
    sortOrder: 2,
  },
  {
    code: 'STN',
    name: 'London Stansted Airport',
    city: 'London',
    country: UK,
    description: 'Major hub for European low-cost carriers',
    image: '/images/airports/stn.png',
    sortOrder: 3,
  },
  {
    code: 'LTN',
    name: 'London Luton Airport',
    city: 'London',
    country: UK,
    description: 'Popular choice for budget airlines and European flights',
    image: '/images/airports/ltn.png',
    sortOrder: 4,
  },
  {
    code: 'LCY',
    name: 'London City Airport',
    city: 'London',
    country: UK,
    description: 'Convenient airport in East London for business travel',
    image: '/images/airports/lcy.png',
    sortOrder: 5,
  },
  {
    code: 'SEN',
    name: 'London Southend Airport',
    city: 'London',
    country: UK,
    description: 'Compact airport serving London and the South East',
    image: '/images/airports/sen.png',
    sortOrder: 6,
  },
  {
    code: 'MAN',
    name: 'Manchester Airport',
    city: 'Manchester',
    country: UK,
    description: "UK's third-busiest airport serving the North",
    image: '/images/airports/man.svg',
    sortOrder: 7,
  },
  {
    code: 'EDI',
    name: 'Edinburgh Airport',
    city: 'Edinburgh',
    country: UK,
    description: "Scotland's busiest airport serving the capital",
    image: '/images/airports/edi.svg',
    sortOrder: 8,
  },
  {
    code: 'BHX',
    name: 'Birmingham Airport',
    city: 'Birmingham',
    country: UK,
    description: "Central England's premier international airport",
    image: '/images/airports/bhx.svg',
    sortOrder: 9,
  },
  {
    code: 'BRS',
    name: 'Bristol Airport',
    city: 'Bristol',
    country: UK,
    description: 'Gateway to the South West of England',
    image: '/images/airports/brs.svg',
    sortOrder: 10,
  },
  {
    code: 'NCL',
    name: 'Newcastle Airport',
    city: 'Newcastle',
    country: UK,
    description: "Newcastle's main international airport",
    image: '/images/airports/ncl.svg',
    sortOrder: 11,
  },
  {
    code: 'BFS',
    name: 'Belfast International Airport',
    city: 'Belfast',
    country: UK,
    description: "Northern Ireland's main international airport",
    image: '/images/airports/bfs.png',
    sortOrder: 12,
  },
];

export const vehicleSeeds: VehicleSeed[] = [
  {
    name: 'Saloon',
    slug: 'saloon',
    price: 34,
    shortBase: 32.64,
    shortPerMile: 2.57,
    longBase: 54.14,
    longPerMile: 1.17,
    passengers: 3,
    suitcases: 3,
    handLuggageNote: 'or 4 with hand luggage only',
    image: '/images/vehicles/saloon.svg',
    description: 'Perfect for business trips and solo travellers',
    carModel: 'Prius or similar',
    sortOrder: 1,
  },
  {
    name: 'Executive',
    slug: 'executive',
    price: 45,
    shortBase: 43.07,
    shortPerMile: 3.41,
    longBase: 69.89,
    longPerMile: 1.64,
    passengers: 3,
    suitcases: 3,
    handLuggageNote: 'or 4 with hand luggage',
    image: '/images/vehicles/executive.svg',
    description: 'Premium comfort for discerning travellers',
    carModel: 'Mercedes E-Class or similar',
    sortOrder: 2,
  },
  {
    name: 'Estate',
    slug: 'estate',
    price: 39,
    shortBase: 36.96,
    shortPerMile: 2.94,
    longBase: 61.76,
    longPerMile: 1.35,
    passengers: 4,
    suitcases: 4,
    handLuggageNote: null,
    image: '/images/vehicles/estate.svg',
    description: 'Extra space for luggage and comfort',
    carModel: 'VW Passat or similar',
    sortOrder: 3,
  },
  {
    name: 'People Carrier',
    slug: 'people-carrier',
    price: 45,
    shortBase: 44.81,
    shortPerMile: 3.32,
    longBase: 68.3,
    longPerMile: 1.69,
    passengers: 5,
    suitcases: 5,
    handLuggageNote: 'or 6 with hand luggage',
    image: '/images/vehicles/people-carrier.svg',
    description: 'Ideal for families and small groups',
    carModel: 'Ford Galaxy or similar',
    sortOrder: 4,
  },
  {
    name: 'Executive People Carrier',
    slug: 'executive-people-carrier',
    price: 64,
    shortBase: 60.59,
    shortPerMile: 4.57,
    longBase: 99.89,
    longPerMile: 2.2,
    passengers: 5,
    suitcases: 5,
    handLuggageNote: 'or 6 with hand luggage',
    image: '/images/vehicles/people-carrier.svg',
    description: 'Luxury travel for groups',
    carModel: 'Mercedes V-Class or similar',
    sortOrder: 5,
  },
  {
    name: 'Minibus',
    slug: 'minibus',
    price: 67,
    shortBase: 71.85,
    shortPerMile: 3.9,
    longBase: 96.78,
    longPerMile: 1.52,
    passengers: 8,
    suitcases: 8,
    handLuggageNote: null,
    image: '/images/vehicles/minibus.svg',
    description: 'Perfect for larger groups',
    carModel: 'Mercedes Sprinter or similar',
    sortOrder: 6,
  },
  {
    name: '16Pax',
    slug: '16pax',
    price: 155,
    shortBase: 140.17,
    shortPerMile: 8.62,
    longBase: 223.71,
    longPerMile: 2.47,
    passengers: 16,
    suitcases: 16,
    handLuggageNote: null,
    image: '/images/vehicles/pax16.svg',
    description: 'Maximum capacity for large parties',
    carModel: 'Ford Transit or similar',
    sortOrder: 7,
  },
];

export const faqSeeds: FaqSeed[] = [
  {
    question: 'Where can I find my booking reference?',
    answer:
      'Your booking reference was sent to you in your confirmation email. You can find it at the top of the booking confirmation.',
    sortOrder: 1,
  },
  {
    question: 'Can I make changes to my booking?',
    answer:
      "Yes, you can make changes to your booking up to 24 hours before the scheduled pick-up time. Access the 'My Booking' section on our website with your booking reference and email address.",
    sortOrder: 2,
  },
  {
    question: 'How can I cancel my booking?',
    answer:
      'To cancel your booking, please contact us at supportaerotaxi@gmail.com with your booking reference. Cancellations made more than 24 hours before the scheduled pick-up time are eligible for a full refund minus card processing fees.',
    sortOrder: 3,
  },
  {
    question: 'How can I inform you about a problem with my booking?',
    answer:
      'Please email us at supportaerotaxi@gmail.com with your booking reference and a description of the problem. We aim to acknowledge all complaints within five working days.',
    sortOrder: 4,
  },
  {
    question: 'How can I inform you about my flight delay?',
    answer:
      'Your driver automatically tracks your flight, so they will be aware of any delays. If you need to contact your driver directly, you can find the supplier details in your booking confirmation email. For further assistance, contact us at supportaerotaxi@gmail.com.',
    sortOrder: 5,
  },
];
