import { BusinessMode } from '../types/pos';
import { BUSINESS_CATEGORIES } from '../data/mockData';

export interface BusinessTypeConfig {
  mode: BusinessMode;
  name: string;
  searchPlaceholder: string;
  requiresInventory: boolean;
  allowTables: boolean;
  allowRooms: boolean;
  allowBarTabs: boolean;
  allowDelivery: boolean;
  allowTakeaway: boolean;
  allowWeightPricing: boolean;
  defaultCategories: typeof BUSINESS_CATEGORIES[string];
}

export const BUSINESS_TYPE_CONFIGS: Record<BusinessMode, BusinessTypeConfig> = {
  chemist: {
    mode: 'chemist',
    name: 'Chemist / Pharmacy',
    searchPlaceholder: 'Search medicines, medical supplies or scan barcode...',
    requiresInventory: true,
    allowTables: false,
    allowRooms: false,
    allowBarTabs: false,
    allowDelivery: false,
    allowTakeaway: true,
    allowWeightPricing: false,
    defaultCategories: BUSINESS_CATEGORIES.chemist,
  },
  restaurant: {
    mode: 'restaurant',
    name: 'Restaurant & Café',
    searchPlaceholder: 'Search food, drinks, desserts or scan barcode...',
    requiresInventory: true,
    allowTables: true,
    allowRooms: false,
    allowBarTabs: false,
    allowDelivery: true,
    allowTakeaway: true,
    allowWeightPricing: false,
    defaultCategories: BUSINESS_CATEGORIES.restaurant,
  },
  hotel: {
    mode: 'hotel',
    name: 'Hotel & Lounge',
    searchPlaceholder: 'Search rooms, services, meals or scan barcode...',
    requiresInventory: true,
    allowTables: true,
    allowRooms: true,
    allowBarTabs: false,
    allowDelivery: true,
    allowTakeaway: true,
    allowWeightPricing: false,
    defaultCategories: BUSINESS_CATEGORIES.hotel,
  },
  bar: {
    mode: 'bar',
    name: 'Bar & Lounge',
    searchPlaceholder: 'Search drinks, beers, spirits or scan barcode...',
    requiresInventory: true,
    allowTables: true,
    allowRooms: false,
    allowBarTabs: true,
    allowDelivery: false,
    allowTakeaway: true,
    allowWeightPricing: false,
    defaultCategories: BUSINESS_CATEGORIES.bar,
  },
  butchery: {
    mode: 'butchery',
    name: 'Butchery',
    searchPlaceholder: 'Search meat cuts, poultry, sausages or scan barcode...',
    requiresInventory: true,
    allowTables: false,
    allowRooms: false,
    allowBarTabs: false,
    allowDelivery: false,
    allowTakeaway: true,
    allowWeightPricing: true,
    defaultCategories: BUSINESS_CATEGORIES.butchery,
  },
  shop: {
    mode: 'shop',
    name: 'Retail Shop',
    searchPlaceholder: 'Search retail products, apparel, electronics...',
    requiresInventory: true,
    allowTables: false,
    allowRooms: false,
    allowBarTabs: false,
    allowDelivery: false,
    allowTakeaway: true,
    allowWeightPricing: false,
    defaultCategories: BUSINESS_CATEGORIES.shop,
  },
  supermarket: {
    mode: 'supermarket',
    name: 'Supermarket',
    searchPlaceholder: 'Search supermarket items, groceries, household...',
    requiresInventory: true,
    allowTables: false,
    allowRooms: false,
    allowBarTabs: false,
    allowDelivery: false,
    allowTakeaway: true,
    allowWeightPricing: true,
    defaultCategories: BUSINESS_CATEGORIES.supermarket,
  },
  wholesale: {
    mode: 'wholesale',
    name: 'Wholesale',
    searchPlaceholder: 'Search bulk goods, crates, grains or scan barcode...',
    requiresInventory: true,
    allowTables: false,
    allowRooms: false,
    allowBarTabs: false,
    allowDelivery: true,
    allowTakeaway: true,
    allowWeightPricing: false,
    defaultCategories: BUSINESS_CATEGORIES.wholesale,
  },
  salon: {
    mode: 'salon',
    name: 'Salon & Beauty',
    searchPlaceholder: 'Search salon services, hair, nails or products...',
    requiresInventory: false,
    allowTables: false,
    allowRooms: false,
    allowBarTabs: false,
    allowDelivery: false,
    allowTakeaway: true,
    allowWeightPricing: false,
    defaultCategories: BUSINESS_CATEGORIES.services,
  },
  hardware: {
    mode: 'hardware',
    name: 'Hardware',
    searchPlaceholder: 'Search tools, plumbing, electrical, paints...',
    requiresInventory: true,
    allowTables: false,
    allowRooms: false,
    allowBarTabs: false,
    allowDelivery: true,
    allowTakeaway: true,
    allowWeightPricing: false,
    defaultCategories: BUSINESS_CATEGORIES.hardware,
  },
  services: {
    mode: 'services',
    name: 'Professional Services',
    searchPlaceholder: 'Search professional services, consulting...',
    requiresInventory: false,
    allowTables: false,
    allowRooms: false,
    allowBarTabs: false,
    allowDelivery: false,
    allowTakeaway: false,
    allowWeightPricing: false,
    defaultCategories: BUSINESS_CATEGORIES.services,
  },
  pos: {
    mode: 'pos',
    name: 'General POS',
    searchPlaceholder: 'Search products or scan barcode...',
    requiresInventory: true,
    allowTables: false,
    allowRooms: false,
    allowBarTabs: false,
    allowDelivery: false,
    allowTakeaway: true,
    allowWeightPricing: false,
    defaultCategories: BUSINESS_CATEGORIES.shop,
  },
};

export function getBusinessConfig(mode: BusinessMode): BusinessTypeConfig {
  return BUSINESS_TYPE_CONFIGS[mode] || BUSINESS_TYPE_CONFIGS.chemist;
}
