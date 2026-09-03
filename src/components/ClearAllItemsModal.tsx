import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  Trash2,
  CheckCircle,
  Loader2,
  Building2,
  Package,
  ShieldAlert,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { soundFx } from '../utils/audio';

interface ClearAllItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCleared?: () => void;
}

export const ClearAllItemsModal: React.FC<ClearAllItemsModalProps> = ({
  isOpen,
  onClose,
  onCleared,
}) => {
  const {
    currentBusiness,
    currentBusinessId,
    products,
    clearAllTenantProducts,
    isClearingProducts,
    canManageProducts,
  } = usePOS();

  const [typedConfirmation, setTypedConfirmation] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successCount, setSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const isConfirmed = typedConfirmation.trim() === 'DELETE ALL ITEMS';

  const handleClose = () => {
    if (isClearingProducts) return;
    setTypedConfirmation('');
    setErrorMessage('');
    setSuccessCount(null);
    onClose();
  };

  const handleExecuteClear = async () => {
    if (!isConfirmed || isClearingProducts) return;
    setErrorMessage('');

    const result = await clearAllTenantProducts();
    if (result.success) {
      setSuccessCount(result.count);
      if (onCleared) onCleared();
      setTimeout(() => {
        handleClose();
      }, 1400);
    } else {
      setErrorMessage(result.error || 'Failed to clear items from Firestore.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in"
      id="modal-clear-all-items"
    >
      <div className="bg-white rounded-3xl border border-rose-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-rose-50/90 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-1.5">
                <span>Clear All Items?</span>
              </h2>
              <p className="text-xs font-semibold text-rose-700">
                Tenant Product Catalogue Reset
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isClearingProducts}
            className="p-1.5 rounded-full hover:bg-rose-100 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors disabled:opacity-50"
            id="btn-close-clear-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {successCount !== null ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                <CheckCircle className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Catalogue Cleared Successfully
              </h3>
              <p className="text-slate-600 text-xs max-w-xs">
                Removed {successCount} products from Firestore for{' '}
                <span className="font-bold text-slate-900">{currentBusiness.name}</span>.
                Your catalogue is now empty and ready for your own items.
              </p>
            </div>
          ) : (
            <>
              {/* Primary User Warning Notice */}
              <div className="p-4 bg-rose-50/80 rounded-2xl border border-rose-200/80 text-rose-900 space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-rose-950 text-sm">
                      This will remove all products/items belonging to this tenant. This action cannot be undone.
                    </p>
                    <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                      All existing demo or sample items will be permanently erased from Firestore for this tenant so you can start clean with your own product list.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tenant Isolation Scope Card */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    Target Tenant Isolation
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-black">
                    ID: {currentBusinessId}
                  </span>
                </div>
                <div className="flex items-center justify-between font-extrabold text-slate-900 text-sm">
                  <span>{currentBusiness.name}</span>
                  <span className="flex items-center gap-1 text-xs text-slate-600 font-bold">
                    <Package className="w-3.5 h-3.5 text-slate-400" />
                    {products.length} Items to be deleted
                  </span>
                </div>
              </div>

              {/* Data Safety Assurance */}
              <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 text-emerald-900">
                <div className="flex items-center gap-2 font-black text-[11px]">
                  <ShieldAlert className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Scope Protection: What is Preserved</span>
                </div>
                <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
                  Only product records are removed. Your tenant account, users, cashiers, customers, suppliers, past sales receipts, M-Pesa payments, orders, settings, domains, and audit history remain 100% intact.
                </p>
              </div>

              {/* Type to Confirm Guard */}
              <div className="space-y-2 pt-1">
                <label className="font-extrabold text-slate-800 block text-xs">
                  To confirm, type <span className="font-mono bg-rose-100 px-1.5 py-0.5 rounded text-rose-800 tracking-wider">DELETE ALL ITEMS</span> below:
                </label>
                <input
                  type="text"
                  value={typedConfirmation}
                  onChange={(e) => setTypedConfirmation(e.target.value)}
                  placeholder="Type DELETE ALL ITEMS"
                  disabled={isClearingProducts}
                  className="w-full px-3.5 py-2.5 bg-slate-50 text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono text-xs placeholder:text-slate-400 disabled:opacity-60"
                  id="input-confirm-delete-all"
                  autoComplete="off"
                />
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {successCount === null && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              disabled={isClearingProducts}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer transition-colors disabled:opacity-50"
              id="btn-cancel-clear-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecuteClear}
              disabled={!isConfirmed || isClearingProducts || !canManageProducts}
              className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                isConfirmed && !isClearingProducts
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25 active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
              id="btn-confirm-delete-all-items"
            >
              {isClearingProducts ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deleting from Firestore...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Delete All Items</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
