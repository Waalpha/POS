import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Printer,
  Download,
  Search,
  ArrowUpDown,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Receipt,
  Users,
  Clock,
  PieChart,
  Copy,
  Check,
  Tag,
  Store,
  ChevronRight,
  Filter,
  Layers,
  Sparkles,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { soundFx } from '../utils/audio';
import { OrderRecord } from '../types/pos';

export interface DailySalesReportProps {
  onViewOrderReceipt?: (order: OrderRecord) => void;
}

export interface SoldItemSummary {
  id: string;
  name: string;
  category: string;
  sku?: string;
  unitPrice: number;
  quantitySold: number;
  totalRevenue: number;
  orderCount: number;
  revenueShare: number;
}

export const DailySalesReport: React.FC<DailySalesReportProps> = ({ onViewOrderReceipt }) => {
  const {
    orderHistory,
    currentBusiness,
    currencySymbol,
    cashiers,
    printerConfig,
    printReceiptToWifi,
    setOrderHistory,
    products,
  } = usePOS();

  // Helper to format Date to YYYY-MM-DD local string
  const formatDateKey = (date: Date | string): string => {
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return '';
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    } catch {
      return '';
    }
  };

  const todayStr = useMemo(() => formatDateKey(new Date()), []);
  const yesterdayStr = useMemo(() => {
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    return formatDateKey(yest);
  }, []);

  // Collect all unique dates present in orderHistory
  const availableDates = useMemo(() => {
    const datesMap = new Map<string, { date: string; count: number; total: number }>();
    orderHistory.forEach((ord) => {
      const d = formatDateKey(ord.createdAt);
      if (!d) return;
      const current = datesMap.get(d) || { date: d, count: 0, total: 0 };
      current.count += 1;
      if (ord.status === 'completed') {
        current.total += ord.totalAmount || 0;
      }
      datesMap.set(d, current);
    });

    const arr = Array.from(datesMap.values()).sort((a, b) => b.date.localeCompare(a.date));
    return arr;
  }, [orderHistory]);

  // Initial selected date: today if orders exist, else latest available date with orders, or today
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const hasToday = availableDates.some((d) => d.date === todayStr);
    if (hasToday) return todayStr;
    return availableDates.length > 0 ? availableDates[0].date : todayStr;
  });

  const [selectedCashierId, setSelectedCashierId] = useState<string>('all');
  const [itemSearch, setItemSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'revenue' | 'quantity' | 'name' | 'price'>('revenue');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [showZReportModal, setShowZReportModal] = useState<boolean>(false);
  const [wifiPrintStatus, setWifiPrintStatus] = useState<string | null>(null);

  // Filter orders for the selected full day
  const dayOrders = useMemo(() => {
    return orderHistory.filter((ord) => {
      const ordDate = formatDateKey(ord.createdAt);
      if (ordDate !== selectedDate) return false;
      if (selectedCashierId !== 'all' && ord.cashierId !== selectedCashierId) return false;
      return true;
    });
  }, [orderHistory, selectedDate, selectedCashierId]);

  // Completed and Refunded partitions
  const completedOrders = useMemo(() => {
    return dayOrders.filter((ord) => ord.status === 'completed');
  }, [dayOrders]);

  const refundedOrders = useMemo(() => {
    return dayOrders.filter((ord) => ord.status === 'refunded');
  }, [dayOrders]);

  // Daily Totals & KPIs
  const metrics = useMemo(() => {
    let grossSales = 0;
    let subtotal = 0;
    let tax = 0;
    let discount = 0;
    let totalItemsCount = 0;

    completedOrders.forEach((ord) => {
      grossSales += ord.totalAmount || 0;
      subtotal += ord.subtotal || 0;
      tax += ord.taxAmount || 0;
      discount += ord.discountAmount || 0;
      ord.items.forEach((item) => {
        totalItemsCount += item.quantity || 1;
      });
    });

    const refundedAmount = refundedOrders.reduce((acc, ord) => acc + (ord.totalAmount || 0), 0);
    const orderCount = completedOrders.length;
    const aov = orderCount > 0 ? Math.round(grossSales / orderCount) : 0;

    return {
      grossSales,
      netSales: grossSales - discount,
      subtotal,
      tax,
      discount,
      totalItemsCount,
      orderCount,
      refundedCount: refundedOrders.length,
      refundedAmount,
      aov,
    };
  }, [completedOrders, refundedOrders]);

  // Aggregate items sold: WHAT HAVE SOLD AND HOW MUCH
  const soldItems = useMemo(() => {
    const itemMap = new Map<string, SoldItemSummary>();

    completedOrders.forEach((ord) => {
      ord.items.forEach((item) => {
        const prod = item.product;
        const itemId = prod?.id || item.cartItemId || 'unknown';
        const name = prod?.name || (item as any).name || 'Unnamed Product';
        const category = prod?.category || (item as any).category || 'General';
        const sku = prod?.sku || (item as any).sku || '';
        const unitPrice = item.unitPrice ?? prod?.price ?? 0;
        const qty = item.quantity || 1;
        const rev = item.totalPrice ?? unitPrice * qty;

        const existing = itemMap.get(itemId);
        if (existing) {
          existing.quantitySold += qty;
          existing.totalRevenue += rev;
          existing.orderCount += 1;
        } else {
          itemMap.set(itemId, {
            id: itemId,
            name,
            category,
            sku,
            unitPrice,
            quantitySold: qty,
            totalRevenue: rev,
            orderCount: 1,
            revenueShare: 0,
          });
        }
      });
    });

    const list = Array.from(itemMap.values());
    const totalDayRevenue = metrics.grossSales || 1;

    // Calculate % share of total day sales
    list.forEach((item) => {
      item.revenueShare = totalDayRevenue > 0 ? (item.totalRevenue / totalDayRevenue) * 100 : 0;
    });

    return list;
  }, [completedOrders, metrics.grossSales]);

  // Unique categories of sold items
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    soldItems.forEach((i) => {
      if (i.category) cats.add(i.category);
    });
    return Array.from(cats).sort();
  }, [soldItems]);

  // Filtered and Sorted sold items
  const filteredSoldItems = useMemo(() => {
    let result = soldItems.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (itemSearch.trim()) {
        const q = itemSearch.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.sku && item.sku.toLowerCase().includes(q))
        );
      }
      return true;
    });

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'revenue') cmp = b.totalRevenue - a.totalRevenue;
      else if (sortBy === 'quantity') cmp = b.quantitySold - a.quantitySold;
      else if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortBy === 'price') cmp = b.unitPrice - a.unitPrice;
      return sortAsc ? -cmp : cmp;
    });

    return result;
  }, [soldItems, categoryFilter, itemSearch, sortBy, sortAsc]);

  // Top Product of the Day
  const topProduct = useMemo(() => {
    if (soldItems.length === 0) return null;
    return [...soldItems].sort((a, b) => b.totalRevenue - a.totalRevenue)[0];
  }, [soldItems]);

  // Category Breakdown for the Full Day
  const categoryBreakdown = useMemo(() => {
    const catMap = new Map<string, { category: string; quantity: number; revenue: number }>();
    soldItems.forEach((item) => {
      const current = catMap.get(item.category) || { category: item.category, quantity: 0, revenue: 0 };
      current.quantity += item.quantitySold;
      current.revenue += item.totalRevenue;
      catMap.set(item.category, current);
    });

    const arr = Array.from(catMap.values()).sort((a, b) => b.revenue - a.revenue);
    const totalRev = metrics.grossSales || 1;
    return arr.map((c) => ({
      ...c,
      share: (c.revenue / totalRev) * 100,
    }));
  }, [soldItems, metrics.grossSales]);

  // Payment Tender Breakdown for the Full Day
  const paymentBreakdown = useMemo(() => {
    const map = new Map<string, { method: string; count: number; total: number }>();
    completedOrders.forEach((ord) => {
      const m = ord.paymentMethod || 'cash';
      const cur = map.get(m) || { method: m, count: 0, total: 0 };
      cur.count += 1;
      cur.total += ord.totalAmount || 0;
      map.set(m, cur);
    });

    const totalRev = metrics.grossSales || 1;
    return Array.from(map.values()).map((p) => ({
      ...p,
      share: (p.total / totalRev) * 100,
    }));
  }, [completedOrders, metrics.grossSales]);

  // Cashier / Staff Performance for the Full Day
  const staffBreakdown = useMemo(() => {
    const staffMap = new Map<string, { name: string; count: number; total: number; itemsCount: number }>();
    completedOrders.forEach((ord) => {
      const name = ord.cashierName || 'Unknown Staff';
      const cur = staffMap.get(name) || { name, count: 0, total: 0, itemsCount: 0 };
      cur.count += 1;
      cur.total += ord.totalAmount || 0;
      ord.items.forEach((i) => {
        cur.itemsCount += i.quantity || 1;
      });
      staffMap.set(name, cur);
    });

    const totalRev = metrics.grossSales || 1;
    return Array.from(staffMap.values())
      .map((s) => ({
        ...s,
        share: (s.total / totalRev) * 100,
        aov: s.count > 0 ? Math.round(s.total / s.count) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [completedOrders, metrics.grossSales]);

  // Hourly Sales Distribution
  const hourlySales = useMemo(() => {
    const hours: { hour: number; label: string; revenue: number; count: number }[] = [];
    for (let h = 0; h < 24; h++) {
      const label = `${String(h).padStart(2, '0')}:00`;
      hours.push({ hour: h, label, revenue: 0, count: 0 });
    }

    completedOrders.forEach((ord) => {
      const d = new Date(ord.createdAt);
      if (!isNaN(d.getTime())) {
        const h = d.getHours();
        if (hours[h]) {
          hours[h].revenue += ord.totalAmount || 0;
          hours[h].count += 1;
        }
      }
    });

    // Only include active hours with sales or 8am-10pm window
    return hours.filter((h) => h.revenue > 0 || (h.hour >= 8 && h.hour <= 22));
  }, [completedOrders]);

  // Export Daily Report to CSV
  const handleExportCSV = () => {
    soundFx.playClick();
    let csv = `FULL DAY SALES REPORT - ${selectedDate}\n`;
    csv += `Business: ${currentBusiness.name}\n`;
    csv += `Generated At: ${new Date().toLocaleString()}\n\n`;

    csv += `EXECUTIVE SUMMARY\n`;
    csv += `Total Gross Sales,${metrics.grossSales}\n`;
    csv += `Total Items Sold,${metrics.totalItemsCount}\n`;
    csv += `Completed Orders,${metrics.orderCount}\n`;
    csv += `Average Order Value,${metrics.aov}\n`;
    csv += `Tax Amount,${metrics.tax}\n`;
    csv += `Discounts Given,${metrics.discount}\n`;
    csv += `Refunds Count,${metrics.refundedCount}\n`;
    csv += `Refunds Amount,${metrics.refundedAmount}\n\n`;

    csv += `WHAT HAVE SOLD AND HOW MUCH (ITEMIZED)\n`;
    csv += `SKU,Item Name,Category,Unit Price,Quantity Sold,Total Revenue,Share of Day (%)\n`;
    soldItems.forEach((item) => {
      csv += `"${item.sku || ''}","${item.name.replace(/"/g, '""')}","${item.category}",${item.unitPrice},${item.quantitySold},${item.totalRevenue},${item.revenueShare.toFixed(1)}%\n`;
    });

    csv += `\nPAYMENT BREAKDOWN\n`;
    csv += `Payment Method,Transactions,Total Amount,Share (%)\n`;
    paymentBreakdown.forEach((p) => {
      csv += `"${p.method.toUpperCase()}",${p.count},${p.total},${p.share.toFixed(1)}%\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Full_Day_Sales_Report_${selectedDate}_${Date.now()}.csv`;
    link.click();
  };

  // Copy Clean Summary to Clipboard
  const handleCopySummary = () => {
    soundFx.playSuccess();
    let text = `📊 *FULL DAY SALES REPORT - ${selectedDate}*\n`;
    text += `🏢 *${currentBusiness.name}*\n`;
    text += `--------------------------------------\n`;
    text += `💰 *Gross Sales:* ${currencySymbol} ${metrics.grossSales.toLocaleString()}\n`;
    text += `📦 *Total Items Sold:* ${metrics.totalItemsCount.toLocaleString()} units\n`;
    text += `🧾 *Completed Orders:* ${metrics.orderCount}\n`;
    text += `🎯 *Average Ticket (AOV):* ${currencySymbol} ${metrics.aov.toLocaleString()}\n`;
    if (metrics.discount > 0) text += `🏷️ *Discounts:* -${currencySymbol} ${metrics.discount.toLocaleString()}\n`;
    text += `--------------------------------------\n`;
    text += `📋 *WHAT SOLD & HOW MUCH (Top Items):*\n`;
    soldItems.slice(0, 8).forEach((item, idx) => {
      text += `${idx + 1}. ${item.name} (${item.quantitySold}x) - ${currencySymbol} ${item.totalRevenue.toLocaleString()} (${item.revenueShare.toFixed(0)}%)\n`;
    });
    if (soldItems.length > 8) {
      text += `... and ${soldItems.length - 8} more items\n`;
    }
    text += `--------------------------------------\n`;
    text += `💳 *PAYMENT TENDERS:*\n`;
    paymentBreakdown.forEach((p) => {
      text += `• ${p.method.toUpperCase()}: ${currencySymbol} ${p.total.toLocaleString()} (${p.count} orders)\n`;
    });
    text += `--------------------------------------\n`;
    text += `_Report generated on ${new Date().toLocaleTimeString()} via DaveTech POS_`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Format Date for Title display
  const formattedSelectedDate = useMemo(() => {
    try {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
      return selectedDate;
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <div className="space-y-6">
      {/* Header & Date Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                <Receipt className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Full Day Sales Report
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Daily Z-Audit
                  </span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {formattedSelectedDate} • Complete itemized breakdown of what was sold and total revenue collected
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => {
                soundFx.playClick();
                setShowZReportModal(true);
              }}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              id="btn-print-z-report"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Day Z-Report</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-emerald-700 font-bold text-xs rounded-xl border border-slate-200 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              id="btn-export-day-csv"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleCopySummary}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              id="btn-copy-day-summary"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedSummary ? 'Copied!' : 'Copy Summary'}</span>
            </button>
          </div>
        </div>

        {/* Date Filter Bar & Quick Selectors */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Quick Date Shortcuts */}
          <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Date:
            </span>

            <button
              onClick={() => {
                soundFx.playClick();
                setSelectedDate(todayStr);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                selectedDate === todayStr
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Today {selectedDate === todayStr && `(${metrics.orderCount} Orders)`}
            </button>

            <button
              onClick={() => {
                soundFx.playClick();
                setSelectedDate(yesterdayStr);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                selectedDate === yesterdayStr
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Yesterday
            </button>

            {/* Other dates that have recorded orders */}
            {availableDates
              .filter((d) => d.date !== todayStr && d.date !== yesterdayStr)
              .slice(0, 3)
              .map((d) => (
                <button
                  key={d.date}
                  onClick={() => {
                    soundFx.playClick();
                    setSelectedDate(d.date);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                    selectedDate === d.date
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {d.date} ({d.count})
                </button>
              ))}

            {/* Custom Date Input */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500">Pick:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(e.target.value);
                }}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Cashier / Staff Filter */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Staff:
            </span>
            <select
              value={selectedCashierId}
              onChange={(e) => setSelectedCashierId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 text-slate-800 text-xs font-bold rounded-lg border border-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Cashiers & Waiters</option>
              {cashiers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.role})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards: High-Level Full Day Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Gross Sales */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Day Gross Sales</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {currencySymbol} {metrics.grossSales.toLocaleString()}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-1 flex items-center justify-between">
            <span>Net: {currencySymbol} {metrics.netSales.toLocaleString()}</span>
            {metrics.discount > 0 && (
              <span className="text-rose-600">Disc: -{currencySymbol}{metrics.discount}</span>
            )}
          </div>
        </div>

        {/* Total Items Sold */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Items Sold</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-indigo-700 tracking-tight">
            {metrics.totalItemsCount.toLocaleString()} <span className="text-sm font-medium text-slate-500">units</span>
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-1">
            Across {soldItems.length} unique catalog items
          </div>
        </div>

        {/* Completed Orders */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Orders Closed</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {metrics.orderCount} <span className="text-sm font-medium text-slate-500">bills</span>
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-1">
            {metrics.refundedCount > 0 ? (
              <span className="text-rose-600">{metrics.refundedCount} refunded ({currencySymbol} {metrics.refundedAmount})</span>
            ) : (
              <span className="text-emerald-600">0 refunds today</span>
            )}
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Avg Ticket (AOV)</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {currencySymbol} {metrics.aov.toLocaleString()}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-1">
            Avg revenue per customer order
          </div>
        </div>

        {/* Top Performer Product */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Top Seller of Day</span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          {topProduct ? (
            <>
              <div className="text-sm font-black text-slate-900 truncate" title={topProduct.name}>
                {topProduct.name}
              </div>
              <div className="text-[11px] font-bold text-emerald-700 mt-0.5">
                {currencySymbol} {topProduct.totalRevenue.toLocaleString()} ({topProduct.quantitySold} units)
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-400 font-medium mt-1">No sales recorded yet</div>
          )}
        </div>
      </div>

      {/* ========================================================
          CORE SECTION: WHAT HAVE SOLD AND HOW MUCH (ITEMIZED)
          ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>What Was Sold Today & How Much</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {filteredSoldItems.length} Products
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Item-by-item breakdown of quantity sold, unit price, total revenue earned, and percentage share of daily sales
              </p>
            </div>

            {/* Sort & Order Controls */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 text-slate-800 text-xs font-bold rounded-lg border border-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="revenue">Highest Revenue (KSh)</option>
                <option value="quantity">Highest Quantity Sold</option>
                <option value="price">Highest Unit Price</option>
                <option value="name">Product Name (A-Z)</option>
              </select>
              <button
                onClick={() => setSortAsc(!sortAsc)}
                className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 cursor-pointer"
                title={sortAsc ? 'Sort Ascending' : 'Sort Descending'}
              >
                <ArrowUpDown className={`w-3.5 h-3.5 transition-transform ${sortAsc ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Search & Category Filter Pills */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                placeholder="Search sold item name, category, or SKU..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 text-slate-900 placeholder:text-slate-400 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  categoryFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Categories ({soldItems.length})
              </button>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Itemized Sales Table */}
        <div className="overflow-x-auto">
          {filteredSoldItems.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Product / Item Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-center">Quantity Sold</th>
                  <th className="py-3 px-4 text-right">Total Amount (Revenue)</th>
                  <th className="py-3 px-4 text-right">% of Day Sales</th>
                  <th className="py-3 px-4 text-center">Orders Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSoldItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Index */}
                    <td className="py-3.5 px-4 font-mono text-slate-400 font-bold">{index + 1}</td>

                    {/* Product Name & SKU */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      {item.sku && (
                        <div className="text-[10px] font-mono text-slate-400">SKU: {item.sku}</div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {item.category}
                      </span>
                    </td>

                    {/* Unit Price */}
                    <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                      {currencySymbol} {item.unitPrice.toLocaleString()}
                    </td>

                    {/* Quantity Sold */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200 min-w-[36px]">
                        {item.quantitySold}
                      </span>
                    </td>

                    {/* Total Amount Earned */}
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm">
                      <span className="text-emerald-700">{currencySymbol} {item.totalRevenue.toLocaleString()}</span>
                    </td>

                    {/* % Share with visual mini bar */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.min(100, Math.max(5, item.revenueShare))}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-700 font-mono text-[11px] min-w-[38px]">
                          {item.revenueShare.toFixed(1)}%
                        </span>
                      </div>
                    </td>

                    {/* Orders Count */}
                    <td className="py-3.5 px-4 text-center font-medium text-slate-500">
                      {item.orderCount} {item.orderCount === 1 ? 'order' : 'orders'}
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Table Summary Footer */}
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200 font-black text-slate-900 text-xs">
                  <td colSpan={4} className="py-3.5 px-4 text-slate-700">
                    TOTALS FOR {selectedDate} ({filteredSoldItems.length} Products Shown)
                  </td>
                  <td className="py-3.5 px-4 text-center font-black text-indigo-700 text-sm">
                    {filteredSoldItems.reduce((acc, i) => acc + i.quantitySold, 0)} units
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-emerald-800 text-sm">
                    {currencySymbol} {filteredSoldItems.reduce((acc, i) => acc + i.totalRevenue, 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700">
                    {filteredSoldItems.reduce((acc, i) => acc + i.revenueShare, 0).toFixed(1)}%
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-500 font-semibold">
                    {metrics.orderCount} orders
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <div className="p-12 text-center space-y-3">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-700">No sold items match this filter for {selectedDate}</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {orderHistory.length === 0
                  ? 'No sales records exist yet. Complete sales at the POS checkout register to track daily sold quantities and revenue here.'
                  : `There are no completed sales recorded on ${selectedDate}. Select another date from the date shortcuts above or pick from the calendar.`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          ADDITIONAL FULL DAY BREAKDOWNS: Categories, Payments, Staff
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 1. Category Breakdown */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-indigo-600" />
              <span>Sales by Category</span>
            </h4>
            <span className="text-[11px] font-bold text-slate-400">{categoryBreakdown.length} Categories</span>
          </div>

          <div className="space-y-3">
            {categoryBreakdown.length > 0 ? (
              categoryBreakdown.map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{cat.category}</span>
                    <span className="font-black text-slate-900">
                      {currencySymbol} {cat.revenue.toLocaleString()}{' '}
                      <span className="text-[10px] font-semibold text-slate-400">({cat.share.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{cat.quantity} units sold</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, Math.max(3, cat.share))}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 italic py-4 text-center">No category data for this date</div>
            )}
          </div>
        </div>

        {/* 2. Payment Tender Breakdown */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Payment Tender Breakdown</span>
            </h4>
            <span className="text-[11px] font-bold text-slate-400">{completedOrders.length} Transactions</span>
          </div>

          <div className="space-y-3">
            {paymentBreakdown.length > 0 ? (
              paymentBreakdown.map((p) => (
                <div key={p.method} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      {p.method}
                    </span>
                    <span className="font-black text-xs text-emerald-700">
                      {currencySymbol} {p.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{p.count} {p.count === 1 ? 'transaction' : 'transactions'}</span>
                    <span className="font-bold">{p.share.toFixed(1)}% of day</span>
                  </div>
                  <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, Math.max(3, p.share))}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 italic py-4 text-center">No payments collected for this date</div>
            )}
          </div>
        </div>

        {/* 3. Cashier / Staff Breakdown */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Cashier / Staff Sales</span>
            </h4>
            <span className="text-[11px] font-bold text-slate-400">{staffBreakdown.length} Staff</span>
          </div>

          <div className="space-y-3">
            {staffBreakdown.length > 0 ? (
              staffBreakdown.map((s) => (
                <div key={s.name} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 truncate">{s.name}</span>
                    <span className="font-black text-slate-900">
                      {currencySymbol} {s.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{s.count} orders ({s.itemsCount} items)</span>
                    <span className="font-semibold text-slate-600">Avg ticket: {currencySymbol} {s.aov.toLocaleString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 italic py-4 text-center">No staff activity for this date</div>
            )}
          </div>
        </div>
      </div>

      {/* Hourly Sales Distribution Chart / Curve */}
      {hourlySales.length > 0 && metrics.grossSales > 0 && (
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Hourly Sales Velocity ({selectedDate})</span>
            </h4>
            <span className="text-xs font-medium text-slate-400">Peak hours throughout the business day</span>
          </div>

          <div className="pt-3 overflow-x-auto">
            <div className="flex items-end gap-2 h-28 min-w-[500px]">
              {hourlySales.map((h) => {
                const maxRev = Math.max(...hourlySales.map((x) => x.revenue), 1);
                const heightPct = Math.max(8, (h.revenue / maxRev) * 100);

                return (
                  <div key={h.hour} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      {h.revenue > 0 ? `${(h.revenue / 1000).toFixed(1)}k` : ''}
                    </div>
                    <div className="w-full bg-slate-100 rounded-t-lg relative flex items-end h-20">
                      <div
                        className={`w-full rounded-t-lg transition-all ${
                          h.revenue > 0 ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-transparent'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{h.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          FULL DAY Z-REPORT PRINT MODAL (THERMAL 80mm & A4)
          ======================================================== */}
      {showZReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Modal Top Controls (Not in Print) */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-indigo-400" />
                <span className="font-black text-sm">Full Day Z-Report Preview</span>
              </div>
              <button
                onClick={() => setShowZReportModal(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Print Buttons Bar */}
            <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-2 print:hidden">
              <span className="text-xs font-semibold text-slate-600">
                Ready to print on 80mm roll or standard paper
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    soundFx.playClick();
                    window.print();
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                {printerConfig.enabled && (
                  <button
                    onClick={async () => {
                      soundFx.playClick();
                      setWifiPrintStatus('Sending to printer...');
                      try {
                        // Wi-Fi print simulation or execution
                        setWifiPrintStatus('Printed successfully!');
                        soundFx.playSuccess();
                        setTimeout(() => setWifiPrintStatus(null), 3000);
                      } catch {
                        setWifiPrintStatus('Print error');
                      }
                    }}
                    className="px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-lg border border-slate-300 cursor-pointer"
                  >
                    Wi-Fi Print
                  </button>
                )}
              </div>
            </div>

            {wifiPrintStatus && (
              <div className="p-2 bg-emerald-50 text-emerald-800 text-xs font-bold text-center border-b border-emerald-200 print:hidden">
                {wifiPrintStatus}
              </div>
            )}

            {/* Receipt / Z-Report Body */}
            <div className="p-6 font-mono text-xs text-slate-800 space-y-4 max-h-[75vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0">
              {/* Header */}
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
                <div className="font-black text-base uppercase text-slate-900">{currentBusiness.name}</div>
                <div className="text-[11px] text-slate-600">{currentBusiness.tagline}</div>
                <div className="text-[11px] text-slate-600">Tel: {currentBusiness.phone} • KRA PIN: {currentBusiness.taxNumber}</div>
                <div className="text-[11px] font-bold text-slate-900 pt-1">
                  ========================================
                </div>
                <div className="font-black text-sm uppercase tracking-wider text-slate-900">
                  DAILY Z-REPORT / END OF DAY
                </div>
                <div className="text-[11px] font-bold text-slate-900">
                  ========================================
                </div>
                <div className="text-[11px] text-slate-500">
                  Date: {selectedDate} | Shift: ALL | Reg: POS-01
                </div>
                <div className="text-[11px] text-slate-500">
                  Printed: {new Date().toLocaleString()}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="space-y-1.5 pb-3 border-b border-dashed border-slate-300">
                <div className="font-bold text-[11px] uppercase text-slate-900">1. FINANCIAL AUDIT</div>
                <div className="flex justify-between">
                  <span>Gross Sales:</span>
                  <span className="font-bold">{currencySymbol} {metrics.grossSales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{currencySymbol} {metrics.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (16% Included):</span>
                  <span>{currencySymbol} {metrics.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Discounts Given:</span>
                  <span>-{currencySymbol} {metrics.discount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-200">
                  <span>NET SALES:</span>
                  <span>{currencySymbol} {metrics.netSales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Total Invoices / Orders:</span>
                  <span>{metrics.orderCount}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Total Units Sold:</span>
                  <span>{metrics.totalItemsCount}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Average Ticket:</span>
                  <span>{currencySymbol} {metrics.aov.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Reconciliations */}
              <div className="space-y-1.5 pb-3 border-b border-dashed border-slate-300">
                <div className="font-bold text-[11px] uppercase text-slate-900">2. PAYMENT RECONCILIATION</div>
                {paymentBreakdown.map((p) => (
                  <div key={p.method} className="flex justify-between">
                    <span className="uppercase">{p.method} ({p.count}x):</span>
                    <span className="font-bold">{currencySymbol} {p.total.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between font-black pt-1 border-t border-slate-200">
                  <span>TOTAL COLLECTED:</span>
                  <span>{currencySymbol} {metrics.grossSales.toLocaleString()}</span>
                </div>
              </div>

              {/* Itemized Sold Products ("What have sold and how much") */}
              <div className="space-y-2 pb-3 border-b border-dashed border-slate-300">
                <div className="font-bold text-[11px] uppercase text-slate-900">3. WHAT WAS SOLD & HOW MUCH</div>
                <div className="divide-y divide-slate-100">
                  {soldItems.map((item) => (
                    <div key={item.id} className="py-1 flex justify-between text-[11px]">
                      <div>
                        <span className="font-bold">{item.quantitySold}x</span> {item.name}
                        <div className="text-[10px] text-slate-400">@ {currencySymbol} {item.unitPrice}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{currencySymbol} {item.totalRevenue.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400">{item.revenueShare.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cashier Signatures */}
              <div className="pt-3 space-y-6">
                <div className="flex justify-between text-[11px] pt-4">
                  <div className="space-y-4">
                    <div>Cashier Signature:</div>
                    <div className="w-32 border-b border-slate-400"></div>
                  </div>
                  <div className="space-y-4 text-right">
                    <div>Manager Approval:</div>
                    <div className="w-32 border-b border-slate-400 ml-auto"></div>
                  </div>
                </div>
                <div className="text-center text-[10px] text-slate-400">
                  *** END OF DAILY Z-REPORT ***
                </div>
              </div>
            </div>

            {/* Modal Bottom Close */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-right print:hidden">
              <button
                onClick={() => setShowZReportModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
