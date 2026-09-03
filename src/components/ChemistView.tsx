import React, { useState } from 'react';
import {
  Pill,
  Search,
  Barcode,
  Plus,
  Minus,
  ShoppingCart,
  AlertTriangle,
  Calendar,
  ShieldCheck,
  Tag,
  Check,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { ProductItem } from '../types/pos';
import { soundFx } from '../utils/audio';

interface ChemistViewProps {
  onOpenBarcodeScanner: () => void;
  onOpenCheckout: () => void;
}

export const ChemistView: React.FC<ChemistViewProps> = ({ onOpenBarcodeScanner, onOpenCheckout }) => {
  const {
    products,
    addToCart,
    cart,
    currencySymbol,
    isManager,
    requestManagerAuth,
    setEditingProduct,
    inventoryFilter,
    setInventoryFilter,
  } = usePOS();

  const [chemistSearch, setChemistSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const chemistCategories = [
    { id: 'all', label: 'All Medicines' },
    { id: 'prescription', label: 'Prescription (Rx)' },
    { id: 'antibiotics', label: 'Antibiotics' },
    { id: 'painkillers', label: 'Pain & Fever' },
    { id: 'syrups', label: 'Syrups & Cough' },
    { id: 'vitamins', label: 'Vitamins & Supplements' },
    { id: 'firstaid', label: 'First Aid & Devices' },
  ];

  // Filter products for chemist (pharmacy category or all products with medicine tags, excluding food/drinks)
  const chemistProducts = products.filter((p) => {
    const nameLower = p.name.toLowerCase();
    const isFoodOrDrink =
      nameLower.includes('burger') ||
      nameLower.includes('pizza') ||
      nameLower.includes('ribs') ||
      nameLower.includes('coffee') ||
      nameLower.includes('juice') ||
      nameLower.includes('mojito') ||
      nameLower.includes('cider') ||
      nameLower.includes('beer') ||
      nameLower.includes('wine') ||
      nameLower.includes('salmon') ||
      nameLower.includes('honey') ||
      p.categoryId === 'cat-food' ||
      p.categoryId === 'cat-drinks' ||
      p.categoryId === 'cat-bar';

    if (isFoodOrDrink && (!p.businessModes || !p.businessModes.includes('chemist'))) {
      return false;
    }

    const matchesSearch =
      nameLower.includes(chemistSearch.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(chemistSearch.toLowerCase())) ||
      (p.barcode && p.barcode.includes(chemistSearch)) ||
      (p.sku && p.sku.toLowerCase().includes(chemistSearch.toLowerCase()));
    
    if (selectedCategory === 'all') return matchesSearch;

    const matchesCat =
      p.categoryId === selectedCategory ||
      (p.description && p.description.toLowerCase().includes(selectedCategory)) ||
      nameLower.includes(selectedCategory);

    return matchesSearch && matchesCat;
  });

  // Low stock and near expiry checks
  const lowStockCount = products.filter(
    (p) => p.isInventory && (p.stock ?? 0) <= (p.reorderLevel ?? 10)
  ).length;

  const expiredOrExpiringCount = products.filter((p) => {
    if (!p.expiryDate) return false;
    const expTime = new Date(p.expiryDate).getTime();
    const now = Date.now();
    const daysUntilExpiry = (expTime - now) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry <= 60;
  }).length;

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-slate-50 relative" id="chemist-module-container">
      {/* Main Chemist Catalog & POS Area */}
      <div className="flex-1 flex flex-col p-3 sm:p-4 overflow-hidden min-w-0">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 text-white rounded-3xl p-4 sm:p-5 mb-3.5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Pill className="w-5 h-5 text-emerald-200" />
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">Pharmacy & Chemist POS</h2>
            </div>
            <p className="text-xs sm:text-sm text-emerald-100 font-medium">
              Dispense medicines, monitor batches, track expiry dates, and manage prescriptions safely.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end flex-wrap">
            <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-2xl text-xs font-bold border border-white/20 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
              <span>{lowStockCount} Low Stock</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-2xl text-xs font-bold border border-white/20 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-rose-300" />
              <span>{expiredOrExpiringCount} Expiring Soon</span>
            </div>
            <button
              onClick={() => {
                soundFx.playClick();
                onOpenBarcodeScanner();
              }}
              className="px-3.5 py-2 bg-white text-emerald-900 font-black text-xs rounded-2xl shadow-md hover:bg-emerald-50 transition-all flex items-center gap-1.5 cursor-pointer"
              id="btn-chemist-scan-barcode"
            >
              <Barcode className="w-4 h-4 text-emerald-700" />
              <span>Scan Barcode</span>
            </button>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-2 mb-3 shrink-0">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={chemistSearch}
              onChange={(e) => setChemistSearch(e.target.value)}
              placeholder="Search medicines by name, brand, salt, barcode..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              id="input-chemist-search"
            />
            {chemistSearch && (
              <button
                onClick={() => setChemistSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold px-1.5 py-0.5 rounded-lg bg-slate-100"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 shrink-0">
            {chemistCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  soundFx.playClick();
                  setSelectedCategory(cat.id);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chemist Products Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {chemistProducts.map((product) => {
              const stockNum = product.stock ?? 50;
              const isLow = product.isInventory && stockNum <= (product.reorderLevel ?? 10);
              const isOut = product.isInventory && stockNum <= 0;
              const inCart = cart.find((item) => item.product.id === product.id);

              return (
                <div
                  key={product.id}
                  onClick={() => {
                    if (isOut) return;
                    soundFx.playClick();
                    addToCart(product);
                  }}
                  className={`bg-white rounded-2xl p-3 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative group cursor-pointer select-none ${
                    isOut ? 'opacity-60 bg-slate-50' : 'hover:border-emerald-500'
                  }`}
                  id={`chemist-product-${product.id}`}
                >
                  {/* Stock or Inventory Badge */}
                  <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1">
                    {product.isInventory ? (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isOut
                            ? 'bg-rose-100 text-rose-800'
                            : isLow
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isOut ? 'Out of Stock' : `${stockNum} ${product.unit || 'units'}`}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
                        Service
                      </span>
                    )}
                  </div>

                  {/* Cart Count Badge */}
                  {inCart && (
                    <div className="absolute -top-2 -right-2 z-10 w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-md border-2 border-white">
                      {inCart.quantity}
                    </div>
                  )}

                  {/* Product Image / Icon Box */}
                  <div className="w-full h-24 sm:h-28 rounded-xl bg-gradient-to-br from-slate-100 to-emerald-50/50 flex items-center justify-center mb-2.5 overflow-hidden relative group-hover:scale-[1.02] transition-transform">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Pill className="w-10 h-10 text-emerald-600/70" />
                    )}
                    {product.brand && (
                      <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md truncate text-center">
                        {product.brand}
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-tight group-hover:text-emerald-700">
                        {product.name}
                      </h4>
                      {product.batchNumber && (
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">
                          Batch: {product.batchNumber}
                        </p>
                      )}
                    </div>

                    <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="font-black text-emerald-700 text-sm">
                        {currencySymbol} {product.price.toLocaleString()}
                      </span>
                      <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
