import React, { useState } from 'react';
import {
  ShieldAlert,
  Store,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Building2,
  Globe,
  DollarSign,
  Activity,
  Lock,
  Search,
  Settings,
  Users,
  AlertTriangle,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { BusinessTenant, BusinessMode, generateSlug } from '../types/pos';
import { soundFx } from '../utils/audio';

export const SuperAdminView: React.FC = () => {
  const { businesses, switchBusiness, currentBusiness, logAuditAction, auditLogs } = usePOS();

  const [searchTerm, setSearchTerm] = useState('');
  const [showNewTenantModal, setShowNewTenantModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'tenants' | 'audit' | 'subscriptions'>('tenants');

  // Edit tenant form state
  const [editingTenant, setEditingTenant] = useState<BusinessTenant | null>(null);
  const [editName, setEditName] = useState('');
  const [editTagline, setEditTagline] = useState('');
  const [editMode, setEditMode] = useState<BusinessMode>('pos');
  const [editCurrency, setEditCurrency] = useState('KSh');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPlan, setEditPlan] = useState<'Standard' | 'Professional' | 'Enterprise'>('Professional');

  // New tenant form state
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantTagline, setNewTenantTagline] = useState('');
  const [newTenantMode, setNewTenantMode] = useState<BusinessMode>('pos');
  const [newTenantCurrency, setNewTenantCurrency] = useState('KSh');
  const [newTenantPhone, setNewTenantPhone] = useState('');
  const [newTenantEmail, setNewTenantEmail] = useState('');
  const [newTenantAddress, setNewTenantAddress] = useState('');
  const [newTenantPlan, setNewTenantPlan] = useState<'Standard' | 'Professional' | 'Enterprise'>('Professional');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  const filteredTenants = businesses.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.mode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenEditTenant = (biz: BusinessTenant) => {
    setEditingTenant(biz);
    setEditName(biz.name);
    setEditTagline(biz.tagline || '');
    setEditMode(biz.mode);
    setEditCurrency(biz.currency);
    setEditPhone(biz.phone || '');
    setEditEmail(biz.email || '');
    setEditAddress(biz.address || '');
    setEditPlan(biz.subscriptionPlan || 'Professional');
  };

  const handleSaveEditTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant || !editName.trim()) return;

    const updatedBusinesses = businesses.map((b) => {
      if (b.id === editingTenant.id) {
        return {
          ...b,
          name: editName.trim(),
          tagline: editTagline.trim(),
          mode: editMode,
          currency: editCurrency,
          currencySymbol: editCurrency === 'USD' ? '$' : editCurrency === 'EUR' ? '€' : 'KSh',
          phone: editPhone.trim(),
          email: editEmail.trim(),
          address: editAddress.trim(),
          subscriptionPlan: editPlan,
        };
      }
      return b;
    });

    localStorage.setItem('davetech_businesses', JSON.stringify(updatedBusinesses));
    soundFx.playSuccess();
    logAuditAction('TENANT_UPDATED', `Super Admin updated tenant details: ${editName}`, editingTenant.id);
    setEditingTenant(null);
    window.location.reload();
  };

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName.trim()) return;

    const baseSlug = generateSlug(newTenantName.trim());
    let slug = baseSlug;
    let counter = 2;
    while (businesses.some(b => b.slug === slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    const subdomain = `${slug}.davetech.co.ke`;

    const tenantId = `tenant-${Date.now()}`;
    const newTenant: BusinessTenant = {
      id: tenantId,
      name: newTenantName.trim(),
      tagline: newTenantTagline.trim() || 'Davetech POS Business',
      mode: newTenantMode,
      currency: newTenantCurrency,
      currencySymbol: newTenantCurrency === 'USD' ? '$' : newTenantCurrency === 'EUR' ? '€' : 'KSh',
      taxRate: 0.16,
      taxNumber: `TAX-${Math.floor(100000 + Math.random() * 900000)}`,
      phone: newTenantPhone || '+254 700 000 000',
      email: newTenantEmail || 'admin@davetechpos.com',
      address: newTenantAddress || 'Nairobi, Kenya',
      receiptFooter: `Thank you for shopping at ${newTenantName}!`,
      mpesaType: 'till',
      mpesaTillNumber: '123456',
      mpesaPaybillNumber: '247247',
      mpesaAccountInstructions: 'Customer Name / Phone',
      status: 'active',
      subscriptionPlan: newTenantPlan,
      createdAt: new Date().toISOString(),
      adminName: adminName || 'Manager',
      adminEmail: adminEmail || newTenantEmail || 'admin@davetechpos.com',
      slug,
      subdomain,
      domainStatus: 'active',
      domainType: 'subdomain',
    };

    // Save to localStorage or state
    const updated = [...businesses, newTenant];
    localStorage.setItem('davetech_businesses', JSON.stringify(updated));
    soundFx.playSuccess();
    logAuditAction('TENANT_CREATED', `Super Admin created new tenant: ${newTenant.name} (${newTenant.mode})`, tenantId);
    setShowNewTenantModal(false);
    // Reset form
    setNewTenantName('');
    setNewTenantTagline('');
    setNewTenantPhone('');
    setNewTenantEmail('');
    setNewTenantAddress('');
    window.location.reload();
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900 text-slate-100 overflow-hidden" id="super-admin-view">
      {/* Top Super Admin Header */}
      <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-lg">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white">DAVETECH SUPER ADMIN</h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase">
                Platform Root
              </span>
            </div>
            <p className="text-xs text-slate-400">Multi-Tenant SaaS Control Center & Global Monitoring</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundFx.playClick();
              setShowNewTenantModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg transition-all cursor-pointer"
            id="btn-create-tenant-modal"
          >
            <Plus className="w-4 h-4" />
            <span>Provision New Tenant</span>
          </button>
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 flex items-center gap-6 shrink-0">
        <button
          onClick={() => {
            soundFx.playClick();
            setSelectedTab('tenants');
          }}
          className={`py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            selectedTab === 'tenants'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Tenant Businesses ({businesses.length})</span>
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            setSelectedTab('subscriptions');
          }}
          className={`py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            selectedTab === 'subscriptions'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Subscriptions & Billing</span>
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            setSelectedTab('audit');
          }}
          className={`py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            selectedTab === 'audit'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Platform Audit Logs ({auditLogs.length})</span>
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 p-6 overflow-y-auto">
        {selectedTab === 'tenants' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tenants by name or mode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="text-xs text-slate-400">
                Showing <strong className="text-white">{filteredTenants.length}</strong> active tenant instances in isolated namespaces.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTenants.map((biz) => (
                <div
                  key={biz.id}
                  className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between shadow-xl hover:border-slate-600 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {biz.mode.toUpperCase()}
                        </span>
                        <h3 className="text-base font-bold text-white mt-1.5">{biz.name}</h3>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          biz.status === 'suspended'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {biz.status || 'Active'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mb-4 line-clamp-2">{biz.tagline}</p>

                    <div className="space-y-1.5 text-xs text-slate-300 border-t border-slate-700/60 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Subdomain:</span>
                        <code className="text-emerald-400 font-mono text-[11px] truncate max-w-[180px]">
                          {biz.subdomain || `${biz.slug}.davetech.co.ke`}
                        </code>
                      </div>
                      {biz.customDomain && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Custom Domain:</span>
                          <span className="text-indigo-300 font-mono text-[11px] truncate max-w-[170px]">
                            {biz.customDomain} ({biz.domainStatus || 'pending'})
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-400">Currency / Tax:</span>
                        <span>
                          {biz.currency} ({Math.round(biz.taxRate * 100)}% VAT)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Plan:</span>
                        <span className="font-bold text-amber-400">{biz.subscriptionPlan || 'Professional'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-700/60 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        switchBusiness(biz.id);
                      }}
                      className="flex-1 py-2 px-3 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-emerald-500/30 cursor-pointer text-center"
                    >
                      Login as Tenant
                    </button>

                    <button
                      onClick={() => {
                        soundFx.playClick();
                        const updated = businesses.map((b) =>
                          b.id === biz.id ? { ...b, status: b.status === 'suspended' ? 'active' : ('suspended' as const) } : b
                        );
                        localStorage.setItem('davetech_businesses', JSON.stringify(updated));
                        window.location.reload();
                      }}
                      className="py-2 px-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      title="Toggle Status"
                    >
                      {biz.status === 'suspended' ? 'Activate' : 'Suspend'}
                    </button>

                    <button
                      onClick={() => {
                        soundFx.playClick();
                        handleOpenEditTenant(biz);
                      }}
                      className="py-2 px-2.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-indigo-500/30 cursor-pointer"
                      title="Edit Tenant"
                    >
                      <Settings className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        soundFx.playClick();
                        if (confirm(`Are you sure you want to delete tenant "${biz.name}"? This action cannot be undone.`)) {
                          const updated = businesses.filter((b) => b.id !== biz.id);
                          localStorage.setItem('davetech_businesses', JSON.stringify(updated));
                          logAuditAction('TENANT_DELETED', `Super Admin deleted tenant: ${biz.name}`, biz.id);
                          soundFx.playSuccess();
                          window.location.reload();
                        }
                      }}
                      className="py-2 px-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-rose-500/30 cursor-pointer"
                      title="Delete Tenant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'subscriptions' && (
          <div className="space-y-4">
            <h2 className="text-base font-black text-white">SaaS Subscriptions & Billing Status</h2>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
              <div className="space-y-4">
                {businesses.map((biz) => (
                  <div key={biz.id} className="flex items-center justify-between p-4 bg-slate-900/60 rounded-xl border border-slate-700/50">
                    <div>
                      <div className="font-bold text-white text-sm">{biz.name}</div>
                      <div className="text-xs text-slate-400">Tenant ID: {biz.id} | Mode: {biz.mode}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-black">
                        {biz.subscriptionPlan || 'Professional'} (Active)
                      </span>
                      <span className="text-xs font-bold text-emerald-400">KSh 15,000 / mo</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'audit' && (
          <div className="space-y-4">
            <h2 className="text-base font-black text-white">Global Platform Audit Trail</h2>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase font-bold border-b border-slate-700">
                  <tr>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Tenant / Business</th>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Action</th>
                    <th className="p-3.5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {auditLogs.slice(-25).reverse().map((log) => (
                    <tr key={log.id} className="hover:bg-slate-700/40">
                      <td className="p-3.5 text-slate-400 font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="p-3.5 font-bold text-indigo-300">{log.businessId}</td>
                      <td className="p-3.5 text-slate-300">{log.userName}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-300">{log.details}</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        No audit events recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* New Tenant Modal */}
      {showNewTenantModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-emerald-400" />
                <span>Provision New Tenant Business</span>
              </h3>
              <button
                onClick={() => setShowNewTenantModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Business Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nairobi Central Chemist"
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Business Type / Mode *</label>
                  <select
                    value={newTenantMode}
                    onChange={(e) => setNewTenantMode(e.target.value as BusinessMode)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="chemist">Chemist / Pharmacy</option>
                    <option value="restaurant">Restaurant & Café</option>
                    <option value="hotel">Hotel & Lounge</option>
                    <option value="bar">Bar & Lounge</option>
                    <option value="shop">Retail Shop</option>
                    <option value="supermarket">Supermarket</option>
                    <option value="wholesale">Wholesale</option>
                    <option value="services">Spa & Services</option>
                    <option value="pos">General POS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Currency</label>
                  <select
                    value={newTenantCurrency}
                    onChange={(e) => setNewTenantCurrency(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="KSh">KSh (Kenyan Shilling)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="TZS">TZS (Tanzanian Shilling)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tagline / Subtitle</label>
                <input
                  type="text"
                  placeholder="e.g. Trusted Health & Prescriptions"
                  value={newTenantTagline}
                  onChange={(e) => setNewTenantTagline(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+254 7..."
                    value={newTenantPhone}
                    onChange={(e) => setNewTenantPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="admin@business.com"
                    value={newTenantEmail}
                    onChange={(e) => setNewTenantEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Physical Address</label>
                <input
                  type="text"
                  placeholder="Street, Building, City"
                  value={newTenantAddress}
                  onChange={(e) => setNewTenantAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewTenantModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer"
                >
                  Create Tenant Namespace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Tenant Modal */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-white">Edit Tenant Business</h3>
              </div>
              <button
                onClick={() => setEditingTenant(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditTenant} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Business Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Business Type / Mode</label>
                  <select
                    value={editMode}
                    onChange={(e) => setEditMode(e.target.value as BusinessMode)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="chemist">Chemist / Pharmacy</option>
                    <option value="restaurant">Restaurant & Café</option>
                    <option value="hotel">Hotel & Lounge</option>
                    <option value="bar">Bar & Lounge</option>
                    <option value="shop">Retail Shop</option>
                    <option value="supermarket">Supermarket</option>
                    <option value="wholesale">Wholesale</option>
                    <option value="services">Spa & Services</option>
                    <option value="pos">General POS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Currency</label>
                  <select
                    value={editCurrency}
                    onChange={(e) => setEditCurrency(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="KSh">KSh (Kenyan Shilling)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="TZS">TZS (Tanzanian Shilling)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tagline / Subtitle</label>
                <input
                  type="text"
                  value={editTagline}
                  onChange={(e) => setEditTagline(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Physical Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Subscription Plan</label>
                <select
                  value={editPlan}
                  onChange={(e) => setEditPlan(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Standard">Standard</option>
                  <option value="Professional">Professional</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
