import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  Check,
  Package,
  Boxes,
  Zap,
  Loader2,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { ProductItem } from '../types/pos';
import { soundFx } from '../utils/audio';

interface ImportProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedRow {
  name: string;
  category: string;
  price: number;
  costPrice: number;
  isInventory: boolean;
  stock: number;
  reorderLevel: number;
  sku: string;
  barcode: string;
  description: string;
}

export const ImportProductsModal: React.FC<ImportProductsModalProps> = ({ isOpen, onClose }) => {
  const { categories, importProducts, currentBusiness } = usePOS();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [csvText, setCsvText] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  // Generate Sample CSV Template for download
  const handleDownloadTemplate = () => {
    soundFx.playClick();
    const headers = 'Name,Category,Price,CostPrice,Classification,Stock,ReorderLevel,SKU,Barcode,Description';
    const sampleRows = [
      'Grilled Chicken Plate,Food,650,400,inventory,50,10,FOOD-001,60012345001,Charcoal grilled chicken with fries',
      'Fresh Passion Juice 500ml,Beverage,200,80,inventory,80,15,BEV-002,60012345002,Cold pressed passion juice',
      'Conference Room Daily Hire,Services,5000,0,non_inventory,0,0,SRV-001,,Air-conditioned meeting room for 10 people',
      'High Speed Wi-Fi Voucher 24h,Services,250,0,non_inventory,0,0,SRV-002,,Unlimited high speed internet voucher',
      'Espresso Single Shot,Hot Drinks,180,50,inventory,100,20,COF-001,,Freshly brewed Kenyan Arabica espresso',
    ];
    const content = [headers, ...sampleRows].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `davetech_products_template_${currentBusiness.mode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Quick populate sample demo rows for immediate trial
  const handleLoadSampleData = () => {
    soundFx.playClick();
    const sampleRows: ParsedRow[] = [
      {
        name: 'Whole Roast Capon Chicken',
        category: 'Food',
        price: 1400,
        costPrice: 850,
        isInventory: true,
        stock: 25,
        reorderLevel: 5,
        sku: 'CHK-01',
        barcode: '200100200',
        description: 'Seasoned herbs whole capon with gravy',
      },
      {
        name: 'Tusker Lager 500ml Can',
        category: 'Drinks',
        price: 300,
        costPrice: 180,
        isInventory: true,
        stock: 120,
        reorderLevel: 24,
        sku: 'BEER-01',
        barcode: '616110001',
        description: 'Chilled Kenya Breweries Tusker Lager',
      },
      {
        name: 'Executive Boardroom Booking (Full Day)',
        category: 'Services',
        price: 8500,
        costPrice: 0,
        isInventory: false,
        stock: 0,
        reorderLevel: 0,
        sku: 'SRV-ROOM',
        barcode: '',
        description: 'Projector, sound system, and water included',
      },
      {
        name: 'VIP Car Wash & Valet Service',
        category: 'Services',
        price: 1200,
        costPrice: 200,
        isInventory: false,
        stock: 0,
        reorderLevel: 0,
        sku: 'SRV-VALET',
        barcode: '',
        description: 'Interior vacuum, exterior wash and tyre shine',
      },
    ];
    setParsedItems(sampleRows);
    setStatusMessage({ type: 'success', text: 'Loaded 4 demo template items. Review and click "Confirm Import".' });
  };

  // Parse raw CSV text
  const parseCSV = (text: string) => {
    const lines = text.trim().split(/\r\n|\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return;

    // Check if line 0 is a header
    const hasHeader = lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('price');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const rows: ParsedRow[] = [];

    dataLines.forEach((line) => {
      // Split by comma ignoring quotes
      const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) => c.replace(/^"|"$/g, '').trim());
      if (!cols[0]) return;

      const name = cols[0];
      const category = cols[1] || 'General';
      const price = parseFloat(cols[2]) || 100;
      const costPrice = parseFloat(cols[3]) || 0;
      const classStr = (cols[4] || '').toLowerCase();
      const isInventory = !(classStr.includes('service') || classStr.includes('non') || classStr === 'false');
      const stock = isInventory ? (parseInt(cols[5], 10) || 50) : 0;
      const reorderLevel = isInventory ? (parseInt(cols[6], 10) || 10) : 0;
      const sku = cols[7] || '';
      const barcode = cols[8] || '';
      const description = cols[9] || '';

      rows.push({
        name,
        category,
        price,
        costPrice,
        isInventory,
        stock,
        reorderLevel,
        sku,
        barcode,
        description,
      });
    });

    setParsedItems(rows);
    if (rows.length > 0) {
      setStatusMessage({ type: 'success', text: `Parsed ${rows.length} valid product items.` });
    } else {
      setStatusMessage({ type: 'error', text: 'No valid products found in the provided CSV text.' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
      parseCSV(content);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (parsedItems.length === 0 || isProcessing) return;

    setIsProcessing(true);
    setStatusMessage(null);

    // Map into ProductItem objects
    const defaultCategoryId = categories[0]?.id || 'cat-food';

    const itemsToSave: Omit<ProductItem, 'id'>[] = parsedItems.map((item) => {
      // Find category or assign default
      const matchedCat = categories.find(
        (c) => c.name.toLowerCase() === item.category.toLowerCase()
      );
      const catId = matchedCat?.id || defaultCategoryId;

      return {
        name: item.name,
        categoryId: catId,
        price: item.price,
        costPrice: item.costPrice > 0 ? item.costPrice : undefined,
        isInventory: item.isInventory,
        itemType: item.isInventory ? 'inventory' : 'non_inventory',
        stock: item.isInventory ? item.stock : undefined,
        reorderLevel: item.isInventory ? item.reorderLevel : undefined,
        sku: item.sku || undefined,
        barcode: item.barcode || undefined,
        description: item.description || undefined,
        isAvailable: true,
        businessModes: [currentBusiness.mode],
        imageUrl: item.isInventory
          ? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'
          : 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80',
      };
    });

    const result = await importProducts(itemsToSave);

    setIsProcessing(false);
    if (result.count > 0) {
      soundFx.playSuccess();
      setStatusMessage({
        type: 'success',
        text: `Successfully imported ${result.count} products into your catalogue!`,
      });
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setStatusMessage({
        type: 'error',
        text: result.error || 'Failed to save products to Firestore.',
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      id="modal-import-products"
    >
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">Import Products</h2>
              <p className="text-xs text-slate-500 font-semibold">
                CSV / Excel Bulk Catalogue Import for {currentBusiness.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 cursor-pointer"
            id="btn-close-import-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Action Row: Download Template & Quick Sample */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100">
            <div className="flex items-center gap-2 text-indigo-900 font-bold">
              <Package className="w-4 h-4 text-indigo-600" />
              <span>Need a starting file?</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-indigo-700 font-bold rounded-xl border border-indigo-200 shadow-xs flex items-center gap-1.5 cursor-pointer"
                id="btn-download-csv-template"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Template .CSV</span>
              </button>
              <button
                type="button"
                onClick={handleLoadSampleData}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                id="btn-load-sample-csv"
              >
                <span>Preview Sample Rows</span>
              </button>
            </div>
          </div>

          {/* Upload Box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/60 hover:bg-indigo-50/30 transition-all"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
              id="input-file-csv"
            />
            <Upload className="w-8 h-8 text-slate-400 mb-2" />
            <p className="font-extrabold text-slate-800 text-sm">
              Click to select or drag a CSV file here
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Supports UTF-8 CSV exports from Excel, Google Sheets, or POS systems
            </p>
          </div>

          {/* Raw Text Input or Paste */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Or paste CSV comma-separated rows directly:
            </label>
            <textarea
              rows={3}
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                parseCSV(e.target.value);
              }}
              placeholder="Name,Category,Price,CostPrice,Classification,Stock&#10;Latte,Hot Drinks,250,80,inventory,50"
              className="w-full font-mono text-[11px] p-3 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              id="textarea-csv-paste"
            />
          </div>

          {/* Feedback message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Preview Table */}
          {parsedItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-800 text-xs">
                  Ready to Import ({parsedItems.length} Products)
                </span>
                <span className="text-[11px] text-slate-500 font-bold">
                  {parsedItems.filter((i) => i.isInventory).length} Inventory /{' '}
                  {parsedItems.filter((i) => !i.isInventory).length} Non-Inventory
                </span>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 text-[11px] uppercase font-bold sticky top-0">
                    <tr>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5 text-right">Price</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5 text-right">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">{item.name}</td>
                        <td className="p-2.5 text-slate-600">{item.category}</td>
                        <td className="p-2.5 text-right font-black text-slate-900">
                          {currentBusiness.currencySymbol} {item.price.toLocaleString()}
                        </td>
                        <td className="p-2.5">
                          {item.isInventory ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                              <Boxes className="w-3 h-3" /> Inventory
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">
                              <Zap className="w-3 h-3" /> Service
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-right font-mono">
                          {item.isInventory ? item.stock : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={parsedItems.length === 0 || isProcessing}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
              parsedItems.length > 0 && !isProcessing
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25 active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            id="btn-confirm-import-products"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Importing to Firestore...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Import {parsedItems.length} Products</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
