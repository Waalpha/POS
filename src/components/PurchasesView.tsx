import React, { useState } from 'react';
import {
  FileText,
  Plus,
  ShoppingBag,
  Calendar,
  CheckCircle2,
  Clock,
  X,
  Search,
  Building,
  DollarSign,
  Package,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { PurchaseRecord } from '../types/pos';
import { soundFx } from '../utils/audio';

export const PurchasesView: React.FC = () => {
  const {
    purchases,
    addPurchaseRecord,
    suppliers,
    products,
    isManager,
    currencySymbol,
  } = usePOS();

  const [showModal, setShowModal] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [purchaseItems, setPurchaseItems] = useState<
    { productId: string; quantity: number; unitCost: number; batchNumber: string; expiryDate: string }[]
  >([]);

  const [selectedProductId, setSelectedProductId] = useState('');
  const [qty, setQty] = useState(10);
  const [cost, setCost] = useState(100);
  const [batchNum, setBatchNum] = useState('');
  const [expDate, setExpDate] = useState('');

  const handleAddItemToPurchase = () => {
    if (!selectedProductId) return;
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    soundFx.playClick();
    setPurchaseItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        quantity: Number(qty) || 1,
        unitCost: Number(cost) || prod.costPrice || 100,
        batchNumber: batchNum || `BATCH-${Date.now().toString().slice(-4)}`,
        expiryDate: expDate || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
      },
    ]);
    setSelectedProductId('');
  };

  const handleCreatePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || purchaseItems.length === 0) return;

    const sup = suppliers.find((s) => s.id === supplierId);
    if (!sup) return;

    soundFx.playSuccess();
    addPurchaseRecord({
      supplierId: sup.id,
      supplierName: sup.name,
      items: purchaseItems.map((pi) => {
        const prod = products.find((p) => p.id === pi.productId);
        return {
          productId: pi.productId,
          productName: prod ? prod.name : 'Unknown Product',
          quantity: pi.quantity,
          unitCost: pi.unitCost,
          batchNumber: pi.batchNumber,
          expiryDate: pi.expiryDate,
        };
      }),
      totalAmount: purchaseItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0),
      status: 'received',
    });

    setShowModal(false);
    setPurchaseItems([]);
    setSupplierId('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden p-4 sm:p-6" id="purchases-module-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Purchase Orders & Shipments</h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Record incoming stock purchases, supplier deliveries, batches, and expiries.
              </p>
            </div>
          </div>
        </div>

        {isManager && (
          <button
            onClick={() => {
              soundFx.playClick();
              setPurchaseItems([]);
              setShowModal(true);
            }}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            id="btn-new-purchase"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Purchase</span>
          </button>
        )}
      </div>

      {/* Purchases Ledger Table / Cards */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="space-y-3">
          {(purchases || []).map((pur) => (
            <div
              key={pur.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-black shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">{pur.supplierName}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                      {pur.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Order Ref: {pur.id} • Date: {new Date(pur.date).toLocaleDateString()} • Recorded by: {pur.cashierName || 'Manager'}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {pur.items.map((item, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold">
                        {item.quantity}x {item.productName} {item.batchNumber ? `(Batch: ${item.batchNumber})` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Cost</div>
                  <div className="text-base sm:text-lg font-black text-teal-700">
                    {currencySymbol} {pur.totalAmount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {(!purchases || purchases.length === 0) && (
            <div className="py-16 text-center text-slate-400">
              <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">No purchase records found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Record Purchase Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-base">Record Incoming Stock Purchase</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Select Supplier *
                </label>
                <select
                  required
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Add item rows */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-extrabold text-xs text-slate-700 uppercase">Add Product Batch to Purchase</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="sm:col-span-2">
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    >
                      <option value="">-- Select Product / Medicine --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.brand ? `(${p.brand})` : ''} - Selling: {currencySymbol} {p.price}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      value={qty}
                      onChange={(e) => setQty(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Unit Buying Cost</label>
                    <input
                      type="number"
                      min={0}
                      value={cost}
                      onChange={(e) => setCost(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Batch Number</label>
                    <input
                      type="text"
                      value={batchNum}
                      onChange={(e) => setBatchNum(e.target.value)}
                      placeholder="e.g. BATCH-9821"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Expiry Date</label>
                    <input
                      type="date"
                      value={expDate}
                      onChange={(e) => setExpDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddItemToPurchase}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer mt-2"
                >
                  + Add Item to Purchase List
                </button>
              </div>

              {/* Items List */}
              {purchaseItems.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-extrabold text-xs text-slate-700 uppercase">Items in this Purchase ({purchaseItems.length})</h4>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {purchaseItems.map((pi, idx) => {
                      const prod = products.find((p) => p.id === pi.productId);
                      return (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold">
                          <div>
                            <span className="font-bold text-slate-900">{prod?.name}</span>
                            <span className="text-slate-500 ml-2">Qty: {pi.quantity} @ {currencySymbol}{pi.unitCost}</span>
                            <div className="text-[10px] text-slate-400">Batch: {pi.batchNumber} | Exp: {pi.expiryDate}</div>
                          </div>
                          <span className="font-black text-teal-700">{currencySymbol} {(pi.quantity * pi.unitCost).toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!supplierId || purchaseItems.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-black text-xs shadow-md cursor-pointer"
                >
                  Complete & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
