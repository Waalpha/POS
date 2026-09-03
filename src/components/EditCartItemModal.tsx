import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Check,
  Plus,
  Minus,
  Percent,
  MessageSquare,
  DollarSign,
  Tag,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { CartModifierSelection } from '../types/pos';
import { soundFx } from '../utils/audio';

const COMMON_NOTE_TAGS = [
  'No Onions',
  'Extra Spicy',
  'Mild',
  'Gluten Free',
  'Well Done',
  'Less Ice',
  'Extra Hot',
  'Takeaway',
  'Rush Order',
  'Room Delivery',
];

export const EditCartItemModal: React.FC = () => {
  const {
    editingCartItem,
    setEditingCartItem,
    updateCartItem,
    removeCartItem,
    currencySymbol,
  } = usePOS();

  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [itemNotes, setItemNotes] = useState<string>('');
  const [selectedModifiers, setSelectedModifiers] = useState<CartModifierSelection[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Initialize form state when an item is selected for editing
  useEffect(() => {
    if (editingCartItem) {
      setQuantity(editingCartItem.quantity);
      setUnitPrice(editingCartItem.unitPrice);
      setDiscountPercent(editingCartItem.itemDiscountPercent || 0);
      setItemNotes(editingCartItem.itemNotes || '');
      setSelectedModifiers(editingCartItem.selectedModifiers || []);
      setShowDeleteConfirm(false);
    }
  }, [editingCartItem]);

  if (!editingCartItem) return null;

  const product = editingCartItem.product;
  const basePrice = product.price;

  // Calculate live line total
  const discountedUnitPrice = unitPrice * (1 - discountPercent / 100);
  const lineTotal = Math.max(0, discountedUnitPrice * quantity);

  const handleModifierOptionChange = (
    groupName: string,
    optionLabel: string,
    extraPrice: number
  ) => {
    soundFx.playClick();
    setSelectedModifiers((prev) => {
      const filtered = prev.filter((m) => m.groupName !== groupName);
      const updated = [...filtered, { groupName, selectedOption: optionLabel, extraPrice }];

      // Recalculate unit price with new modifier extras
      const modifierSum = updated.reduce((acc, m) => acc + m.extraPrice, 0);
      setUnitPrice(basePrice + modifierSum);
      return updated;
    });
  };

  const handleNoteTagClick = (tag: string) => {
    soundFx.playClick();
    if (itemNotes.includes(tag)) {
      // Remove tag
      const regex = new RegExp(`(^|,\\s*)${tag}`, 'gi');
      setItemNotes((prev) => prev.replace(regex, '').replace(/^,\s*/, ''));
    } else {
      // Add tag
      setItemNotes((prev) => (prev.trim() ? `${prev.trim()}, ${tag}` : tag));
    }
  };

  const handleSave = () => {
    soundFx.playSuccess();
    updateCartItem(editingCartItem.cartItemId, {
      quantity: Math.max(1, quantity),
      unitPrice: Math.max(0, unitPrice),
      itemDiscountPercent: Math.min(100, Math.max(0, discountPercent)),
      itemNotes: itemNotes.trim(),
      selectedModifiers,
    });
    setEditingCartItem(null);
  };

  const handleDelete = () => {
    soundFx.playError();
    removeCartItem(editingCartItem.cartItemId);
    setEditingCartItem(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in select-none"
      id="modal-edit-cart-item"
    >
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={product.imageUrl}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-xl object-cover border border-slate-700 shrink-0"
            />
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                {product.name}
              </h3>
              <p className="text-xs text-emerald-400 font-medium mt-0.5">
                Standard: {currencySymbol} {basePrice.toLocaleString()} {product.sku ? `• SKU: ${product.sku}` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              setEditingCartItem(null);
            }}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            id="btn-close-edit-cart-item"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-slate-800 text-xs">
          {/* Live Calculated Total Banner */}
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                Calculated Line Total
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-700">
                {currencySymbol} {lineTotal.toLocaleString()}
              </div>
            </div>
            <div className="text-right text-[11px] text-emerald-800 font-medium">
              <div>{quantity} x {currencySymbol} {discountedUnitPrice.toLocaleString()}</div>
              {discountPercent > 0 && (
                <span className="text-rose-600 font-bold">({discountPercent}% OFF applied)</span>
              )}
            </div>
          </div>

          {/* 1. QUANTITY SECTION */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                Quantity
              </span>
              <span className="text-[11px] text-slate-400">Total units</span>
            </div>

            {/* Stepper + Input */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setQuantity((prev) => Math.max(1, prev - 1));
                }}
                className="w-12 h-12 rounded-2xl bg-white hover:bg-slate-200 active:bg-slate-300 text-slate-700 border border-slate-200 flex items-center justify-center font-black shadow-xs cursor-pointer text-base"
                title="Decrease"
              >
                <Minus className="w-5 h-5" />
              </button>

              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 h-12 text-center text-xl font-black text-slate-900 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
              />

              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setQuantity((prev) => prev + 1);
                }}
                className="w-12 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white flex items-center justify-center font-black shadow-sm cursor-pointer text-base"
                title="Increase"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Quantity Shortcuts */}
            <div className="flex items-center justify-center gap-1.5 pt-1">
              {[1, 2, 3, 4, 5, 10, 12, 24].map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setQuantity(qty);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl font-black text-[11px] transition-all cursor-pointer ${
                    quantity === qty
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  {qty}
                </button>
              ))}
            </div>
          </div>

          {/* 2. UNIT PRICE OVERRIDE */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Unit Price ({currencySymbol})
              </span>
              {unitPrice !== basePrice && (
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setUnitPrice(basePrice);
                  }}
                  className="flex items-center gap-1 text-[10px] text-amber-700 hover:text-amber-900 font-bold underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset to Standard ({currencySymbol} {basePrice})
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full pl-12 pr-3 py-2.5 bg-white text-slate-900 text-sm font-black rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* 3. ITEM DISCOUNT */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-emerald-600" />
                Item Discount (%)
              </span>
              <span className="text-[11px] font-black text-rose-600">
                {discountPercent > 0 ? `-${discountPercent}%` : 'No discount'}
              </span>
            </div>

            <div className="grid grid-cols-6 gap-1.5">
              {[0, 5, 10, 15, 20, 50].map((disc) => (
                <button
                  key={disc}
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setDiscountPercent(disc);
                  }}
                  className={`py-2 rounded-xl font-black text-xs transition-all cursor-pointer ${
                    discountPercent === disc
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  {disc === 0 ? 'None' : `${disc}%`}
                </button>
              ))}
            </div>
          </div>

          {/* 4. MODIFIERS (If applicable) */}
          {product.modifiers && product.modifiers.length > 0 && (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="font-bold text-slate-700 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                Product Options & Add-ons
              </div>

              {product.modifiers.map((group) => {
                const currentSelection = selectedModifiers.find((m) => m.groupName === group.name);

                return (
                  <div key={group.name} className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      {group.name}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {group.options.map((opt) => {
                        const isSelected = currentSelection?.selectedOption === opt.label;

                        return (
                          <button
                            key={opt.label}
                            type="button"
                            onClick={() =>
                              handleModifierOptionChange(group.name, opt.label, opt.extraPrice)
                            }
                            className={`px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {opt.extraPrice > 0 && (
                              <span
                                className={`text-[10px] ${
                                  isSelected ? 'text-emerald-100' : 'text-slate-400'
                                }`}
                              >
                                (+{currencySymbol}{opt.extraPrice})
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 5. KITCHEN / SERVER NOTES */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                Kitchen & Order Instructions
              </span>
              <span className="text-[10px] text-slate-400">Prints on KDS & kitchen docket</span>
            </div>

            {/* Quick tags */}
            <div className="flex flex-wrap gap-1.5">
              {COMMON_NOTE_TAGS.map((tag) => {
                const isActive = itemNotes.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleNoteTagClick(tag)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            <textarea
              rows={2}
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
              placeholder="Add custom preparation instructions (e.g., sauce on the side, no ice)..."
              className="w-full p-2.5 bg-white text-slate-900 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
            />
          </div>
        </div>

        {/* Action Footer: Delete Item & Save Changes */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2 w-full animate-in fade-in">
              <span className="text-xs font-bold text-rose-700 flex-1">
                Confirm removing this item from ticket?
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
                id="btn-confirm-delete-cart-item"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete</span>
              </button>
            </div>
          ) : (
            <>
              {/* Red Delete Button */}
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-2xl border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                id="btn-delete-cart-item"
                title="Remove item from order ticket"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Delete Item</span>
              </button>

              {/* Green Save Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setEditingCartItem(null);
                  }}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-2xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs rounded-2xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                  id="btn-save-cart-item"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
