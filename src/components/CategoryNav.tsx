import React from 'react';
import {
  LayoutGrid,
  Utensils,
  Coffee,
  Wine,
  ShoppingBag,
  Scissors,
  BedDouble,
  Pill,
  FileText,
  ShieldCheck,
  Zap,
  Heart,
  Smile,
  Cross,
  Activity,
  Sparkles,
  Flame,
  GlassWater,
  Cake,
  Apple,
  Milk,
  Package,
  Cookie,
  Shirt,
  Laptop,
  Home,
  BookOpen,
  Flower2,
  Beer,
  Beef,
  Drumstick,
  Wrench,
  Search,
  Barcode,
  X,
  Plus,
  Edit2,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { getBusinessConfig } from '../utils/businessConfig';
import { soundFx } from '../utils/audio';

interface CategoryNavProps {
  onOpenBarcodeScanner: () => void;
  onOpenQuickSale: () => void;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  onOpenBarcodeScanner,
  onOpenQuickSale,
}) => {
  const {
    categories,
    selectedCategory,
    setSelectedCategory,
    products,
    searchQuery,
    setSearchQuery,
    setEditingProduct,
    isManageItemsMode,
    setIsManageItemsMode,
    currentBusiness,
  } = usePOS();

  const bizConfig = getBusinessConfig(currentBusiness?.mode || 'chemist');

  // Helper icon mapper for large touchscreen icons
  const getCategoryIcon = (iconName: string, isSelected: boolean) => {
    const iconClass = `w-5 h-5 sm:w-6 sm:h-6 shrink-0 transition-transform duration-200 ${
      isSelected ? 'scale-110' : 'opacity-85'
    }`;

    switch (iconName) {
      case 'Utensils':
        return <Utensils className={iconClass} />;
      case 'Coffee':
        return <Coffee className={iconClass} />;
      case 'Wine':
        return <Wine className={iconClass} />;
      case 'ShoppingBag':
        return <ShoppingBag className={iconClass} />;
      case 'Scissors':
        return <Scissors className={iconClass} />;
      case 'BedDouble':
        return <BedDouble className={iconClass} />;
      case 'Pill':
        return <Pill className={iconClass} />;
      case 'FileText':
        return <FileText className={iconClass} />;
      case 'ShieldCheck':
        return <ShieldCheck className={iconClass} />;
      case 'Zap':
        return <Zap className={iconClass} />;
      case 'Heart':
        return <Heart className={iconClass} />;
      case 'Smile':
        return <Smile className={iconClass} />;
      case 'Cross':
        return <Cross className={iconClass} />;
      case 'Activity':
        return <Activity className={iconClass} />;
      case 'Sparkles':
        return <Sparkles className={iconClass} />;
      case 'Flame':
        return <Flame className={iconClass} />;
      case 'GlassWater':
        return <GlassWater className={iconClass} />;
      case 'Cake':
        return <Cake className={iconClass} />;
      case 'Apple':
        return <Apple className={iconClass} />;
      case 'Milk':
        return <Milk className={iconClass} />;
      case 'Package':
        return <Package className={iconClass} />;
      case 'Cookie':
        return <Cookie className={iconClass} />;
      case 'Shirt':
        return <Shirt className={iconClass} />;
      case 'Laptop':
        return <Laptop className={iconClass} />;
      case 'Home':
        return <Home className={iconClass} />;
      case 'BookOpen':
        return <BookOpen className={iconClass} />;
      case 'Flower2':
        return <Flower2 className={iconClass} />;
      case 'Beer':
        return <Beer className={iconClass} />;
      case 'Beef':
        return <Beef className={iconClass} />;
      case 'Drumstick':
        return <Drumstick className={iconClass} />;
      case 'Wrench':
        return <Wrench className={iconClass} />;
      default:
        return <Package className={iconClass} />;
    }
  };

  const handleSelectCategory = (catId: string) => {
    soundFx.playClick();
    setSelectedCategory(catId);
    setSearchQuery('');
  };

  // Count items per category
  const getCategoryCount = (catId: string) => {
    return products.filter((p) => p.categoryId === catId).length;
  };

  // Pre-define standard categories order to ensure All Items, Food, Drinks, Bar, Retail, Services, Hotel
  const standardCategoryOrder = [
    { id: 'cat-food', fallbackName: 'Food', icon: 'Utensils' },
    { id: 'cat-drinks', fallbackName: 'Drinks', icon: 'Coffee' },
    { id: 'cat-bar', fallbackName: 'Bar', icon: 'Wine' },
    { id: 'cat-retail', fallbackName: 'Retail', icon: 'ShoppingBag' },
    { id: 'cat-services', fallbackName: 'Services', icon: 'Scissors' },
    { id: 'cat-hotel', fallbackName: 'Hotel', icon: 'BedDouble' },
  ];

  return (
    <div className="space-y-3 select-none">
      {/* Top Search & Action Bar: Search input + Quick Sale + Barcode Scanner */}
      <div className="flex items-center gap-2">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={bizConfig.searchPlaceholder}
            className="w-full pl-10 pr-9 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 text-sm font-semibold rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-xs"
            id="pos-search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* PROMINENT QUICK SALE BUTTON */}
        <button
          onClick={() => {
            soundFx.playClick();
            onOpenQuickSale();
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md shadow-emerald-600/20 transition-all shrink-0 cursor-pointer"
          title="Instant Quick Sale / Open Ring without creating catalog item"
          id="btn-quick-sale-trigger"
        >
          <Zap className="w-4 h-4 fill-white" />
          <span className="tracking-wide">Quick Sale</span>
        </button>

        {/* Barcode Scanner Button */}
        <button
          onClick={onOpenBarcodeScanner}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 font-bold text-xs rounded-2xl border border-slate-200 shadow-xs transition-all shrink-0 cursor-pointer"
          title="Scan barcode with camera / handheld scanner"
          id="btn-open-scanner"
        >
          <Barcode className="w-4 h-4 text-slate-600" />
          <span className="hidden sm:inline">Scanner</span>
        </button>

        {/* Add New Item Button */}
        <button
          onClick={() => {
            soundFx.playClick();
            setEditingProduct({
              id: `new-${Date.now()}`,
              name: '',
              price: 0,
              costPrice: 0,
              categoryId: selectedCategory !== 'all' ? selectedCategory : 'cat-food',
              isInventory: true,
              stock: 50,
              reorderLevel: 10,
              imageUrl: '',
              isAvailable: true,
              businessModes: ['restaurant', 'bar', 'hotel', 'retail', 'services'],
            });
          }}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold text-xs rounded-2xl border border-slate-200 shadow-xs transition-all shrink-0 cursor-pointer"
          title="Add new item to product catalog"
          id="btn-add-item-trigger"
        >
          <Plus className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">Add Item</span>
        </button>

        {/* Toggle Edit Mode Button */}
        <button
          onClick={() => {
            soundFx.playClick();
            setIsManageItemsMode((prev) => !prev);
          }}
          className={`flex items-center justify-center gap-1.5 px-3 py-2.5 active:scale-95 font-bold text-xs rounded-2xl border transition-all shrink-0 cursor-pointer ${
            isManageItemsMode
              ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
          }`}
          title="Toggle edit/delete mode on products"
          id="btn-toggle-edit-mode"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isManageItemsMode ? 'Done' : 'Edit Items'}</span>
        </button>
      </div>

      {/* PRIMARY TOUCHSCREEN CATEGORY NAVIGATION */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {/* 1. All Items Category Button */}
        <button
          onClick={() => handleSelectCategory('all')}
          className={`flex items-center gap-2.5 px-4 sm:px-5 py-3 rounded-2xl font-black text-sm transition-all duration-150 shrink-0 border cursor-pointer active:scale-95 ${
            selectedCategory === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/20'
              : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 hover:border-slate-300 shadow-xs'
          }`}
          id="cat-btn-all"
        >
          <LayoutGrid className={`w-5 h-5 ${selectedCategory === 'all' ? 'text-white' : 'text-slate-500'}`} />
          <span className="tracking-tight">All Items</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              selectedCategory === 'all'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {products.length}
          </span>
        </button>

        {/* 2. Standard Defined Categories (Food, Drinks, Bar, Retail, Services, Hotel) */}
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = getCategoryCount(cat.id);

          return (
            <button
              key={cat.id}
              onClick={() => handleSelectCategory(cat.id)}
              className={`flex items-center gap-2.5 px-4 sm:px-5 py-3 rounded-2xl font-black text-sm transition-all duration-150 shrink-0 border cursor-pointer active:scale-95 ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20 ring-2 ring-emerald-400/30'
                  : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 hover:border-slate-300 shadow-xs'
              }`}
              id={`cat-btn-${cat.id}`}
            >
              {getCategoryIcon(cat.icon, isSelected)}
              <span className="tracking-tight">{cat.name}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  isSelected
                    ? 'bg-emerald-700/80 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
