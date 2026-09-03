import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Check,
  Package,
  DollarSign,
  Tag,
  Barcode,
  Layers,
  Image as ImageIcon,
  AlertTriangle,
  Boxes,
  Zap,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { ProductItem } from '../types/pos';
import { soundFx } from '../utils/audio';

const IMAGE_PRESETS = [
  { label: 'Steak / Meat', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80' },
  { label: 'Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80' },
  { label: 'Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80' },
  { label: 'Cocktail / Bar', url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=400&q=80' },
  { label: 'Beer / Ale', url: 'https://images.unsplash.com/photo-1608270192806-03f47e335293?auto=format&fit=crop&w=400&q=80' },
  { label: 'Coffee / Tea', url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80' },
  { label: 'Salad / Vegan', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80' },
  { label: 'Hotel Room', url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=400&q=80' },
  { label: 'Service / Spa', url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80' },
  { label: 'Retail Goods', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80' },
];

export const EditProductModal: React.FC = () => {
  const {
    editingProduct,
    setEditingProduct,
    updateProduct,
    deleteProduct,
    addProduct,
    categories,
    currencySymbol,
  } = usePOS();

  const isNewProduct = !editingProduct?.id || editingProduct.id.startsWith('new');

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isInventory, setIsInventory] = useState(true);
  const [stock, setStock] = useState('50');
  const [reorderLevel, setReorderLevel] = useState('10');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formError, setFormError] = useState('');

  // Sync state with editingProduct
  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name || '');
      setPrice(editingProduct.price ? editingProduct.price.toString() : '');
      setCostPrice(editingProduct.costPrice ? editingProduct.costPrice.toString() : '');
      setCategoryId(editingProduct.categoryId || categories[0]?.id || 'cat-food');
      setIsInventory(editingProduct.isInventory !== false);
      setStock(editingProduct.stock !== undefined ? editingProduct.stock.toString() : '50');
      setReorderLevel(editingProduct.reorderLevel !== undefined ? editingProduct.reorderLevel.toString() : '10');
      setSku(editingProduct.sku || '');
      setBarcode(editingProduct.barcode || '');
      setImageUrl(
        editingProduct.imageUrl ||
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'
      );
      setDescription(editingProduct.description || '');
      setIsAvailable(editingProduct.isAvailable !== false);
      setShowDeleteConfirm(false);
      setFormError('');
    }
  }, [editingProduct, categories]);

  if (!editingProduct) return null;

  const handleGenerateSku = () => {
    soundFx.playClick();
    const prefix = name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'ITM';
    const rand = Math.floor(1000 + Math.random() * 9000);
    setSku(`${prefix}-${rand}`);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Product name is required');
      soundFx.playError();
      return;
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setFormError('Please enter a valid selling price');
      soundFx.playError();
      return;
    }

    soundFx.playSuccess();

    const productData = {
      name: name.trim(),
      price: numPrice,
      costPrice: parseFloat(costPrice) || 0,
      categoryId,
      isInventory,
      stock: isInventory ? parseInt(stock) || 0 : undefined,
      reorderLevel: isInventory ? parseInt(reorderLevel) || 5 : undefined,
      sku: sku.trim() || undefined,
      barcode: barcode.trim() || undefined,
      imageUrl: imageUrl.trim() || IMAGE_PRESETS[0].url,
      description: description.trim() || undefined,
      isAvailable,
      businessModes: editingProduct.businessModes || ['restaurant', 'bar', 'hotel', 'retail', 'services'],
    };

    if (isNewProduct) {
      addProduct(productData);
    } else {
      updateProduct(editingProduct.id, productData);
    }

    setEditingProduct(null);
  };

  const handleDelete = () => {
    if (!editingProduct.id) return;
    soundFx.playError();
    deleteProduct(editingProduct.id);
    setEditingProduct(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in select-none"
      id="modal-edit-product"
    >
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                {isNewProduct ? 'Add New Product' : `Edit Product: ${editingProduct.name}`}
              </h3>
              <p className="text-xs text-slate-400">
                {isNewProduct ? 'Create catalog item with pricing & stock' : 'Update pricing, category, stock or delete product'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              setEditingProduct(null);
            }}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            id="btn-close-edit-product"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Product Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-bold text-slate-700">Product / Item Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Grilled T-Bone Steak, Mojito Cocktail"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 text-slate-900 font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                id="input-product-name"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 text-slate-900 font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                id="select-product-category"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing Row: Selling Price & Cost Price */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200/80">
            <div className="space-y-1">
              <label className="font-extrabold text-emerald-900 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Selling Price ({currencySymbol}) *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                required
                className="w-full px-3 py-2 bg-white text-slate-900 font-black text-sm rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                id="input-product-price"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600">Cost Price ({currencySymbol})</label>
              <input
                type="number"
                min="0"
                step="any"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="0.00 (optional)"
                className="w-full px-3 py-2 bg-white text-slate-900 font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
            </div>
          </div>

          {/* Inventory Tracking Toggle & Stock Counts */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-indigo-600" />
                  Track Physical Stock / Inventory
                </span>
                <p className="text-[10px] text-slate-400">
                  Enable for countable items, disable for services, labor & unlimited items
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setIsInventory(!isInventory);
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  isInventory ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
                id="btn-toggle-inventory"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isInventory ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {isInventory && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 animate-in fade-in">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Stock on Hand (Units)</label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-slate-900 font-black rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                    id="input-product-stock"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Low Stock Alert Level</label>
                  <input
                    type="number"
                    min="1"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-slate-900 font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SKU & Barcode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">SKU Code</label>
                <button
                  type="button"
                  onClick={handleGenerateSku}
                  className="text-[10px] text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  Generate
                </button>
              </div>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g., STK-1042"
                className="w-full px-3 py-2 bg-slate-50 text-slate-900 font-mono font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Barcode / UPC</label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="e.g., 600104829102"
                className="w-full px-3 py-2 bg-slate-50 text-slate-900 font-mono font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
            </div>
          </div>

          {/* Image Presets & URL */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                Product Image
              </label>
              <span className="text-[10px] text-slate-400">Quick visual presets</span>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={imageUrl || IMAGE_PRESETS[0].url}
                alt="Preview"
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-2xl object-cover border border-slate-300 shrink-0 shadow-xs"
              />
              <div className="flex-1 space-y-1">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... image URL"
                  className="w-full px-3 py-1.5 bg-white text-slate-900 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                />
              </div>
            </div>

            {/* Quick Image Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {IMAGE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setImageUrl(preset.url);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 transition-all cursor-pointer ${
                    imageUrl === preset.url
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Availability Status */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <span className="font-bold text-slate-800">Available on Register</span>
              <p className="text-[10px] text-slate-400">
                Hide from cashier screen when temporarily unavailable
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setIsAvailable(!isAvailable);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isAvailable
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {isAvailable ? 'Active / Visible' : 'Hidden'}
            </button>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2 w-full animate-in fade-in">
              <span className="text-xs font-bold text-rose-700 flex-1">
                Permanently delete &ldquo;{editingProduct.name}&rdquo; from menu catalog?
              </span>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs flex items-center gap-1 shadow-sm cursor-pointer"
                id="btn-confirm-delete-product"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete</span>
              </button>
            </div>
          ) : (
            <>
              {/* Delete Button (Only for existing products) */}
              {!isNewProduct ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-2xl border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  id="btn-delete-product"
                  title="Delete product from catalog"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Delete Product</span>
                </button>
              ) : (
                <div />
              )}

              {/* Save / Cancel */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-2xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs rounded-2xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                  id="btn-save-product"
                >
                  <Check className="w-4 h-4" />
                  <span>{isNewProduct ? 'Add to Catalog' : 'Save Changes'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
