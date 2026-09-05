import {
  BusinessTenant,
  CashierUser,
  ProductCategory,
  ProductItem,
  TableInfo,
  HotelRoomInfo,
  OrderRecord,
} from '../types/pos';

export const INITIAL_BUSINESSES: BusinessTenant[] = [
  {
    id: 'biz-1',
    name: 'Davetech Grand Hotel & Lounge',
    tagline: 'Luxury Stays, Fine Dining & Bar',
    mode: 'hotel',
    currency: 'KSh',
    currencySymbol: 'KSh',
    taxRate: 0.16,
    taxNumber: 'P051982736X',
    phone: '+254 700 123 456',
    email: 'pos@davetech-grand.com',
    address: 'Davetech Towers, Kilimani, Nairobi',
    receiptFooter: 'Thank you for choosing Davetech Grand. Have a delightful day!',
    mpesaType: 'paybill',
    mpesaTillNumber: '893421',
    mpesaPaybillNumber: '247247',
    mpesaAccountInstructions: 'Table Number or Guest Name (e.g. TBL 4)',
    slug: 'davetech-grand-hotel-lounge',
    subdomain: 'davetech-grand-hotel-lounge.ats-kenya.or.ke',
    domainStatus: 'active',
    domainType: 'subdomain',
    daraja3Config: {
      enabled: true,
      environment: 'sandbox',
      appKey: 'vGjK8sL29QpM4nR7tW1xY5zA3bC6dE8f',
      appSecret: '9XyZ2aB5cE8hK1mP4rT7wV0sD3gJ6lQ9',
      passkey: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
      shortcode: '174379',
      identifierType: 'paybill',
      callbackUrl: 'https://api.davetechpos.com/api/v1/mpesa/daraja3/callback',
      c2bValidationUrl: 'https://api.davetechpos.com/api/v1/mpesa/daraja3/validation',
      c2bConfirmationUrl: 'https://api.davetechpos.com/api/v1/mpesa/daraja3/confirmation',
      accountReferencePrefix: 'DAVETECH-HOTEL',
      transactionDesc: 'Davetech Hotel & Dining Bill',
      autoQueryTimeoutSec: 25,
      enableInstantPush: true,
      lastTestedAt: new Date().toISOString(),
      testStatus: 'success',
      lastTestMessage: 'Daraja 3.0 API Connected (Sandbox 174379)',
    },
  },
  {
    id: 'biz-2',
    name: 'Davetech Bistro & Grill',
    tagline: 'Artisan Steaks, Wood-fired Pizza & Craft Brews',
    mode: 'restaurant',
    currency: 'KSh',
    currencySymbol: 'KSh',
    taxRate: 0.16,
    taxNumber: 'P052849102B',
    phone: '+254 711 987 654',
    email: 'orders@davetechbistro.com',
    address: 'The Hub Karen, Ground Floor, Nairobi',
    receiptFooter: 'Bon Appétit! Tag us @DavetechBistro on Instagram.',
    mpesaType: 'till',
    mpesaTillNumber: '654321',
    mpesaPaybillNumber: '522522',
    mpesaAccountInstructions: 'Table Number (e.g. TABLE 2)',
    slug: 'davetech-bistro-grill',
    subdomain: 'davetech-bistro-grill.ats-kenya.or.ke',
    domainStatus: 'active',
    domainType: 'subdomain',
    daraja3Config: {
      enabled: true,
      environment: 'sandbox',
      appKey: 'kLmN3oP4qR5sT6uV7wX8yZ9aB0c1d2e3',
      appSecret: '4f5g6h7j8k9l0m1n2p3q4r5s6t7u8v9w',
      passkey: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
      shortcode: '174379',
      identifierType: 'till',
      callbackUrl: 'https://api.davetechpos.com/api/v1/mpesa/daraja3/callback',
      accountReferencePrefix: 'BISTRO-TBL',
      transactionDesc: 'Davetech Bistro Dining Bill',
      autoQueryTimeoutSec: 25,
      enableInstantPush: true,
      lastTestedAt: new Date().toISOString(),
      testStatus: 'idle',
    },
  },
  {
    id: 'biz-3',
    name: 'Davetech Speed Bar & Lounge',
    tagline: 'Craft Cocktails & Premium Spirits',
    mode: 'bar',
    currency: 'KSh',
    currencySymbol: 'KSh',
    taxRate: 0.16,
    taxNumber: 'P053910293C',
    phone: '+254 722 345 678',
    email: 'bar@davetech.com',
    address: 'Westlands Square, 3rd Floor, Nairobi',
    receiptFooter: 'Drink responsibly. See you for the next round!',
    mpesaType: 'till',
    mpesaTillNumber: '778899',
    mpesaPaybillNumber: '247247',
    mpesaAccountInstructions: 'Bar Stool or Tab Name',
    slug: 'davetech-speed-bar-lounge',
    subdomain: 'davetech-speed-bar-lounge.ats-kenya.or.ke',
    domainStatus: 'active',
    domainType: 'subdomain',
  },
  {
    id: 'biz-4',
    name: 'Davetech Superette & Retail',
    tagline: 'Fresh Groceries, Essentials & Gadgets',
    mode: 'shop',
    currency: 'KSh',
    currencySymbol: 'KSh',
    taxRate: 0.16,
    taxNumber: 'P054819284D',
    phone: '+254 733 456 789',
    email: 'retail@davetech.com',
    address: 'Sarit Centre Lower Ground, Nairobi',
    receiptFooter: 'Items exchangeable within 7 days with valid receipt.',
    mpesaType: 'till',
    mpesaTillNumber: '334455',
    mpesaPaybillNumber: '247247',
    mpesaAccountInstructions: 'Customer Phone or Name',
    slug: 'davetech-superette-retail',
    subdomain: 'davetech-superette-retail.ats-kenya.or.ke',
    domainStatus: 'active',
    domainType: 'subdomain',
  },
  {
    id: 'biz-5',
    name: 'Davetech Spa & Beauty Haven',
    tagline: 'Therapeutic Wellness, Grooming & Styling',
    mode: 'services',
    currency: 'KSh',
    currencySymbol: 'KSh',
    taxRate: 0.16,
    taxNumber: 'P055928374E',
    phone: '+254 744 567 890',
    email: 'spa@davetech.com',
    address: 'Lavington Mall, Suite 204, Nairobi',
    receiptFooter: 'Relax, rejuvenate and shine. Book your next session online!',
    mpesaType: 'till',
    mpesaTillNumber: '445566',
    mpesaPaybillNumber: '247247',
    mpesaAccountInstructions: 'Client Name / Booking Ref',
    slug: 'davetech-spa-beauty-haven',
    subdomain: 'davetech-spa-beauty-haven.ats-kenya.or.ke',
    domainStatus: 'active',
    domainType: 'subdomain',
  },
];

export const INITIAL_CASHIERS: CashierUser[] = [
  {
    id: 'c-1',
    name: 'Sarah Jenkins',
    role: 'cashier',
    pin: '1111',
    avatarColor: 'bg-emerald-600',
    phone: '+254 712 345 678',
    email: 'sarah.j@davetech.com',
    status: 'active',
  },
  {
    id: 'c-2',
    name: 'David Mwangi',
    role: 'cashier',
    pin: '2222',
    avatarColor: 'bg-indigo-600',
    phone: '+254 723 456 789',
    email: 'david.m@davetech.com',
    status: 'active',
  },
  {
    id: 'c-3',
    name: 'Faith Chebet',
    role: 'manager',
    pin: '3333',
    avatarColor: 'bg-purple-600',
    phone: '+254 734 567 890',
    email: 'faith.c@davetech.com',
    status: 'active',
  },
  {
    id: 'c-owner',
    name: 'Dave Tech (General Manager)',
    role: 'manager',
    pin: '9999',
    avatarColor: 'bg-rose-600',
    phone: '+254 700 000 001',
    email: 'gm@davetech.com',
    status: 'active',
  },
];

export const BUSINESS_CATEGORIES: Record<string, ProductCategory[]> = {
  chemist: [
    { id: 'cat-chem-med', name: 'Medicines', icon: 'Pill', color: 'from-teal-500 to-emerald-600', description: 'Tablets, Capsules & General Medications' },
    { id: 'cat-chem-rx', name: 'Prescription', icon: 'FileText', color: 'from-blue-500 to-indigo-600', description: 'Prescription-only Medications & Antibiotics' },
    { id: 'cat-chem-otc', name: 'OTC Medicines', icon: 'ShieldCheck', color: 'from-emerald-500 to-teal-600', description: 'Over-the-counter Painkillers, Cold & Flu' },
    { id: 'cat-chem-supp', name: 'Supplements', icon: 'Zap', color: 'from-amber-500 to-orange-600', description: 'Vitamins, Minerals & Dietary Supplements' },
    { id: 'cat-chem-baby', name: 'Baby Care', icon: 'Heart', color: 'from-pink-500 to-rose-600', description: 'Baby Formula, Diapers & Skincare' },
    { id: 'cat-chem-personal', name: 'Personal Care', icon: 'Smile', color: 'from-purple-500 to-pink-600', description: 'Hygiene, Oral Care & Skincare' },
    { id: 'cat-chem-firstaid', name: 'First Aid', icon: 'Cross', color: 'from-red-500 to-rose-600', description: 'Bandages, Antiseptics & Emergency Kits' },
    { id: 'cat-chem-supplies', name: 'Medical Supplies', icon: 'Activity', color: 'from-cyan-500 to-blue-600', description: 'Thermometers, Monitors & Diagnostics' },
    { id: 'cat-chem-cosmetics', name: 'Cosmetics', icon: 'Sparkles', color: 'from-violet-500 to-purple-600', description: 'Dermatological Skincare & Beauty' },
  ],
  restaurant: [
    { id: 'cat-rest-mains', name: 'Mains & Grills', icon: 'Utensils', color: 'from-amber-500 to-orange-600', description: 'Steaks, Burgers, Grills & Pastas' },
    { id: 'cat-rest-app', name: 'Starters & Salads', icon: 'Flame', color: 'from-orange-500 to-red-600', description: 'Appetizers, Soups & Fresh Salads' },
    { id: 'cat-rest-hot', name: 'Hot Beverages', icon: 'Coffee', color: 'from-yellow-600 to-amber-700', description: 'Espresso, Teas & Hot Chocolate' },
    { id: 'cat-rest-cold', name: 'Cold Drinks', icon: 'GlassWater', color: 'from-cyan-500 to-blue-600', description: 'Juices, Sodas & Mocktails' },
    { id: 'cat-rest-dessert', name: 'Desserts', icon: 'Cake', color: 'from-pink-500 to-rose-600', description: 'Cakes, Pastries & Ice Cream' },
  ],
  supermarket: [
    { id: 'cat-super-fresh', name: 'Fresh Produce', icon: 'Apple', color: 'from-emerald-500 to-green-600', description: 'Fruits, Vegetables & Herbs' },
    { id: 'cat-super-dairy', name: 'Dairy & Bakery', icon: 'Milk', color: 'from-amber-400 to-yellow-600', description: 'Milk, Cheese, Butter & Fresh Bread' },
    { id: 'cat-super-pantry', name: 'Pantry & Staples', icon: 'Package', color: 'from-orange-500 to-amber-600', description: 'Rice, Flour, Sugar, Oils & Spices' },
    { id: 'cat-super-bev', name: 'Beverages', icon: 'Coffee', color: 'from-blue-500 to-cyan-600', description: 'Sodas, Juices, Water & Teas' },
    { id: 'cat-super-snacks', name: 'Snacks & Sweets', icon: 'Cookie', color: 'from-purple-500 to-pink-600', description: 'Crisps, Chocolates, Biscuits & Nuts' },
    { id: 'cat-super-cleaning', name: 'Household & Cleaning', icon: 'Sparkles', color: 'from-teal-500 to-emerald-600', description: 'Detergents, Soaps & Tissues' },
  ],
  shop: [
    { id: 'cat-retail-apparel', name: 'Clothing & Apparel', icon: 'Shirt', color: 'from-indigo-500 to-blue-600', description: 'Men, Women & Children Wear' },
    { id: 'cat-retail-electronics', name: 'Electronics', icon: 'Laptop', color: 'from-slate-700 to-slate-900', description: 'Gadgets, Chargers & Accessories' },
    { id: 'cat-retail-home', name: 'Home & Living', icon: 'Home', color: 'from-amber-600 to-orange-700', description: 'Decor, Bedding & Kitchenware' },
    { id: 'cat-retail-stationery', name: 'Stationery & Books', icon: 'BookOpen', color: 'from-emerald-600 to-teal-700', description: 'Notebooks, Pens & Office Supplies' },
  ],
  hotel: [
    { id: 'cat-hotel-rooms', name: 'Room Bookings', icon: 'BedDouble', color: 'from-indigo-500 to-violet-600', description: 'Standard, Deluxe & Executive Suites' },
    { id: 'cat-hotel-service', name: 'Room Service', icon: 'Utensils', color: 'from-amber-500 to-orange-600', description: 'In-room Dining & Beverages' },
    { id: 'cat-hotel-laundry', name: 'Laundry Services', icon: 'Shirt', color: 'from-cyan-500 to-blue-600', description: 'Wash, Iron & Dry Cleaning' },
    { id: 'cat-hotel-spa', name: 'Spa & Wellness', icon: 'Flower2', color: 'from-rose-500 to-pink-600', description: 'Massages, Sauna & Pool Access' },
  ],
  bar: [
    { id: 'cat-bar-beers', name: 'Beers & Ciders', icon: 'Beer', color: 'from-amber-500 to-yellow-600', description: 'Local & Imported Beers, Ciders' },
    { id: 'cat-bar-spirits', name: 'Spirits & Liquors', icon: 'Wine', color: 'from-purple-600 to-indigo-700', description: 'Whisky, Vodka, Gin, Rum & Tequila' },
    { id: 'cat-bar-cocktails', name: 'Cocktails', icon: 'GlassWater', color: 'from-pink-500 to-rose-600', description: 'Mojitos, Margaritas & Signature Mixes' },
    { id: 'cat-bar-wines', name: 'Wines & Champagne', icon: 'Wine', color: 'from-red-600 to-rose-700', description: 'Red, White, Rosé & Sparkling' },
    { id: 'cat-bar-snacks', name: 'Bar Bites', icon: 'Utensils', color: 'from-amber-600 to-orange-700', description: 'Wings, Fries, Nuts & Platters' },
  ],
  butchery: [
    { id: 'cat-butch-beef', name: 'Beef Cuts', icon: 'Beef', color: 'from-red-600 to-rose-700', description: 'Fillet, Sirloin, T-Bone & Minced Beef' },
    { id: 'cat-butch-poultry', name: 'Chicken & Poultry', icon: 'Drumstick', color: 'from-amber-500 to-orange-600', description: 'Whole Chicken, Breasts, Wings & Thighs' },
    { id: 'cat-butch-pork', name: 'Pork & Lamb', icon: 'Beef', color: 'from-pink-600 to-rose-600', description: 'Pork Chops, Ribs & Lamb Chops' },
    { id: 'cat-butch-sausages', name: 'Sausages & Cold Cuts', icon: 'FileText', color: 'from-orange-600 to-red-600', description: 'Beef Sausages, Polony & Bacon' },
    { id: 'cat-butch-spices', name: 'Spices & Marinades', icon: 'Flame', color: 'from-yellow-600 to-amber-700', description: 'Rubes, BBQ sauces & Marinades' },
  ],
  hardware: [
    { id: 'cat-hard-tools', name: 'Tools & Hardware', icon: 'Wrench', color: 'from-slate-700 to-slate-900', description: 'Hand tools, Power tools & Fixings' },
    { id: 'cat-hard-plumbing', name: 'Plumbing & Pipes', icon: 'Wrench', color: 'from-blue-600 to-cyan-700', description: 'PVC Pipes, Faucets, Valves & Fittings' },
    { id: 'cat-hard-electrical', name: 'Electrical & Lighting', icon: 'Zap', color: 'from-amber-500 to-yellow-600', description: 'Cables, Bulbs, Sockets & Breakers' },
    { id: 'cat-hard-paints', name: 'Paints & Finishes', icon: 'Sparkles', color: 'from-purple-600 to-indigo-600', description: 'Wall paints, Primers, Brushes & Rollers' },
  ],
  services: [
    { id: 'cat-salon-hair', name: 'Hair Styling & Cut', icon: 'Scissors', color: 'from-rose-500 to-pink-600', description: 'Haircuts, Coloring, Braiding & Styling' },
    { id: 'cat-salon-nails', name: 'Manicure & Pedicure', icon: 'Sparkles', color: 'from-purple-500 to-indigo-600', description: 'Nail Polish, Gel, Acrylics & Spa Pedi' },
    { id: 'cat-salon-facial', name: 'Facial & Skincare', icon: 'Smile', color: 'from-amber-500 to-orange-600', description: 'Facials, Waxing & Threading' },
    { id: 'cat-salon-massage', name: 'Massage & Spa', icon: 'Heart', color: 'from-teal-500 to-emerald-600', description: 'Swedish, Deep Tissue & Aromatherapy' },
  ],
  wholesale: [
    { id: 'cat-whole-grains', name: 'Bulk Grains & Flour', icon: 'Package', color: 'from-amber-600 to-yellow-700', description: 'Maize flour, Rice, Beans & Wheat in 25kg/50kg' },
    { id: 'cat-whole-bev', name: 'Wholesale Beverages', icon: 'Coffee', color: 'from-blue-600 to-indigo-700', description: 'Crates of Soda, Water & Energy Drinks' },
    { id: 'cat-whole-household', name: 'Bulk Household', icon: 'Sparkles', color: 'from-teal-600 to-emerald-700', description: 'Cartons of Soap, Cooking Oil & Detergents' },
  ],
};

export const CATEGORIES: ProductCategory[] = BUSINESS_CATEGORIES.chemist;

export const INITIAL_PRODUCTS: ProductItem[] = [];

/**
 * Check if a product item matches any of the legacy handcoded demo/mock products
 * so it is never re-seeded or resurrected upon refresh or sync.
 */
export const isHandcodedProduct = (item: any): boolean => {
  if (!item) return false;
  const id = String(item.id || '');
  if (
    /(^|-)(p-(10[1-6]|20[1-4]|30[1-5]|40[1-4]|50[1-3]|60[1-4]|chem-0[1-8]))($|-)/i.test(id) ||
    id.includes('p-101') || id.includes('p-102') || id.includes('p-103') || id.includes('p-104') || id.includes('p-105') || id.includes('p-106') ||
    id.includes('p-201') || id.includes('p-202') || id.includes('p-203') || id.includes('p-204') ||
    id.includes('p-301') || id.includes('p-302') || id.includes('p-303') || id.includes('p-304') || id.includes('p-305') ||
    id.includes('p-401') || id.includes('p-402') || id.includes('p-403') || id.includes('p-404') ||
    id.includes('p-501') || id.includes('p-502') || id.includes('p-503') ||
    id.includes('p-601') || id.includes('p-602') || id.includes('p-603') || id.includes('p-604') ||
    id.includes('p-chem-01') || id.includes('p-chem-02') || id.includes('p-chem-03') || id.includes('p-chem-04') ||
    id.includes('p-chem-05') || id.includes('p-chem-06') || id.includes('p-chem-07') || id.includes('p-chem-08')
  ) {
    return true;
  }

  const hardcodedSkus = new Set([
    'F-SMASH-01', 'F-RIBS-02', 'F-PIZZA-03', 'F-BIRY-04', 'F-SALM-05', 'F-PAST-06',
    'D-MAC-01', 'D-CAP-02', 'D-JUICE-03', 'D-MAT-04',
    'B-TUSK-01', 'B-OLD-02', 'B-GLEN-03', 'B-MOJ-04', 'B-WINE-05',
    'R-HONEY-01', 'R-BEANS-02', 'R-CAP-03', 'R-SOAP-04',
    'S-BARB-01', 'S-MASS-02', 'S-NAIL-03',
    'H-ROOM-01', 'H-SUITE-02', 'H-POOL-03', 'H-VIP-04',
    'MED-PARA-01', 'MED-AMOX-02', 'MED-IBU-03', 'MED-SYR-04', 'MED-VIT-05', 'MED-FA-06', 'MED-CET-07', 'MED-OMEP-08'
  ]);
  if (item.sku && hardcodedSkus.has(String(item.sku).trim().toUpperCase())) {
    return true;
  }

  const hardcodedBarcodes = new Set([
    '61611001001', '61611001002', '61611001003', '61611001004', '61611001005', '61611001006',
    '61611002001', '61611002002', '61611002003', '61611002004',
    '61611003001', '61611003002', '61611003003', '61611003004', '61611003005',
    '61611004001', '61611004002', '61611004003', '61611004004',
    '61611005001', '61611005002', '61611005003',
    '61611006001', '61611006002', '61611006003', '61611006004',
    '71611001001', '71611001002', '71611001003', '71611001004', '71611001005', '71611001006', '71611001007', '71611001008'
  ]);
  if (item.barcode && hardcodedBarcodes.has(String(item.barcode).trim())) {
    return true;
  }

  const hardcodedNames = new Set([
    'davetech double smash burger',
    'wood-fired bbq pork ribs',
    'artisan margherita pizza 12"',
    'swahili goat biryani feast',
    'pan-seared atlantic salmon',
    'truffle mushroom fettuccine',
    'caramel macchiato (large)',
    'single origin cappuccino',
    'fresh mango passion chill',
    'matcha green tea iced latte',
    'tusker premium cider (500ml)',
    'davetech signature old fashioned',
    'glenfiddich 12 yrs single malt (tot)',
    'passion mojito pitcher 1l',
    'nederburg cabernet sauvignon (bottle)',
    'davetech organic forest honey 500g',
    'artisan dark roast coffee beans 1kg',
    'davetech heritage snapback cap',
    'handcrafted shea butter soap 150g',
    'executive barber haircut & beard trim',
    'swedish deep tissue massage (60 mins)',
    'express manicure & gel pedicure',
    'standard deluxe room (nightly)',
    'executive suite with city view',
    'day pass: infinity pool & spa access',
    'vip airport chauffeur transfer (one way)',
    'paracetamol 500mg tablets (box of 100)',
    'amoxicillin 500mg capsules (pack of 20)',
    'ibuprofen 400mg anti-inflammatory tablets',
    'benylin cough & chest congestion syrup 100ml',
    'vitamin c 1000mg ascorbic acid (60 tabs)',
    'sterile first aid gauze bandages & plasters kit',
    'cetirizine 10mg allergy relief tablets',
    'omeprazole 20mg gastro-resistant capsules'
  ]);
  if (item.name && hardcodedNames.has(String(item.name).trim().toLowerCase())) {
    return true;
  }

  return false;
};

export const INITIAL_TABLES: TableInfo[] = [
  { id: 'tbl-1', name: 'Table 1', section: 'Main Hall', seats: 2, status: 'available' },
  { id: 'tbl-2', name: 'Table 2', section: 'Main Hall', seats: 4, status: 'available' },
  { id: 'tbl-3', name: 'Table 3', section: 'Main Hall', seats: 4, status: 'available' },
  { id: 'tbl-4', name: 'Table 4', section: 'Main Hall', seats: 6, status: 'available' },
  { id: 'tbl-5', name: 'Table 5', section: 'Terrace', seats: 2, status: 'available' },
  { id: 'tbl-6', name: 'Table 6', section: 'Terrace', seats: 4, status: 'available' },
  { id: 'tbl-7', name: 'Table 7', section: 'Terrace', seats: 4, status: 'available' },
  { id: 'tbl-8', name: 'VIP Lounge 1', section: 'VIP Lounge', seats: 8, status: 'available' },
  { id: 'tbl-9', name: 'VIP Lounge 2', section: 'VIP Lounge', seats: 8, status: 'available' },
  { id: 'tbl-10', name: 'Bar Stool 1', section: 'Bar Area', seats: 1, status: 'available' },
  { id: 'tbl-11', name: 'Bar Stool 2', section: 'Bar Area', seats: 1, status: 'available' },
  { id: 'tbl-12', name: 'Bar Stool 3', section: 'Bar Area', seats: 1, status: 'available' },
];

export const INITIAL_HOTEL_ROOMS: HotelRoomInfo[] = [
  { id: 'rm-101', roomNumber: '101', type: 'Deluxe', guestName: 'Dr. Arthur Kariuki', guestPhone: '+254 712 334 455', status: 'occupied', checkInDate: '2026-08-25', checkOutDate: '2026-08-28', folioBalance: 12400 },
  { id: 'rm-102', roomNumber: '102', type: 'Deluxe', guestName: 'Vacant', guestPhone: '', status: 'vacant', checkInDate: '', checkOutDate: '', folioBalance: 0 },
  { id: 'rm-103', roomNumber: '103', type: 'Standard', guestName: 'Elena Rostova', guestPhone: '+254 722 556 677', status: 'occupied', checkInDate: '2026-08-24', checkOutDate: '2026-08-27', folioBalance: 4800 },
  { id: 'rm-201', roomNumber: '201', type: 'Executive Suite', guestName: 'Marcus Vance', guestPhone: '+254 733 778 899', status: 'occupied', checkInDate: '2026-08-26', checkOutDate: '2026-08-30', folioBalance: 29500 },
  { id: 'rm-202', roomNumber: '202', type: 'Executive Suite', guestName: 'Under Housekeeping', guestPhone: '', status: 'cleaning', checkInDate: '', checkOutDate: '', folioBalance: 0 },
  { id: 'rm-301', roomNumber: '301', type: 'Penthouse', guestName: 'Chief Olumide Adeleke', guestPhone: '+254 799 112 233', status: 'occupied', checkInDate: '2026-08-23', checkOutDate: '2026-08-29', folioBalance: 68200 },
];

export const INITIAL_ORDER_HISTORY: OrderRecord[] = [];
