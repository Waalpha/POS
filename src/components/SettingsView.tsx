import React, { useState } from 'react';
import {
  Settings,
  Store,
  Printer,
  Shield,
  DollarSign,
  FileText,
  Sliders,
  Check,
  Save,
  Globe,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { soundFx } from '../utils/audio';

export const SettingsView: React.FC = () => {
  const {
    currentBusiness,
    updateBusiness,
    printerConfig,
    updatePrinterConfig,
    isManager,
  } = usePOS();

  const [name, setName] = useState(currentBusiness.name);
  const [tagline, setTagline] = useState(currentBusiness.tagline);
  const [phone, setPhone] = useState(currentBusiness.phone);
  const [email, setEmail] = useState(currentBusiness.email);
  const [address, setAddress] = useState(currentBusiness.address);
  const [taxRate, setTaxRate] = useState(currentBusiness.taxRate * 100);
  const [taxNumber, setTaxNumber] = useState(currentBusiness.taxNumber);
  const [receiptFooter, setReceiptFooter] = useState(currentBusiness.receiptFooter);
  const [customDomainInput, setCustomDomainInput] = useState(currentBusiness.customDomain || '');
  const [verifyingDomain, setVerifyingDomain] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playSuccess();
    updateBusiness({
      name,
      tagline,
      phone,
      email,
      address,
      taxRate: Number(taxRate) / 100,
      taxNumber,
      receiptFooter,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAddCustomDomain = () => {
    if (!customDomainInput.trim()) return;
    soundFx.playClick();
    const token = `davetech-verify-${Math.random().toString(36).substring(2, 10)}`;
    updateBusiness({
      customDomain: customDomainInput.trim(),
      domainStatus: 'verification_required',
      verificationToken: token,
      domainType: 'custom'
    });
    soundFx.playSuccess();
  };

  const handleVerifyCustomDomain = () => {
    setVerifyingDomain(true);
    soundFx.playClick();
    setTimeout(() => {
      setVerifyingDomain(false);
      soundFx.playSuccess();
      updateBusiness({
        domainStatus: 'active',
        verifiedAt: new Date().toISOString()
      });
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden p-4 sm:p-6" id="settings-administration-view">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">System Administration & Settings</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Configure business profile, tax rates, receipt formatting, printer settings, and preferences.
            </p>
          </div>
        </div>

        {saved && (
          <div className="px-3.5 py-2 bg-emerald-100 text-emerald-800 font-black text-xs rounded-xl flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      {/* Settings Form */}
      <div className="flex-1 overflow-y-auto pr-1">
        <form onSubmit={handleSave} className="max-w-4xl space-y-6 pb-12">
          {/* Business Profile */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Store className="w-5 h-5 text-indigo-600" />
              <h3 className="font-extrabold text-slate-900 text-base">Business & Outlet Profile</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Business Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Tagline / Subtitle</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Physical Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Tax & Financial Settings */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-slate-900 text-base">Tax (VAT) & Financials</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Tax / VAT Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">KRA PIN / Tax Registration Number</label>
                <input
                  type="text"
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Receipt Formatting */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <FileText className="w-5 h-5 text-teal-600" />
              <h3 className="font-extrabold text-slate-900 text-base">Receipt Footer & Messaging</h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Receipt Footer Note</label>
              <textarea
                rows={2}
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 resize-none"
              />
            </div>
          </div>

          {/* Tenant Domains & Subdomain Routing */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4" id="tenant-domains-settings">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Globe className="w-5 h-5 text-indigo-600" />
              <h3 className="font-extrabold text-slate-900 text-base">Tenant Domains & Subdomain Routing</h3>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Your DAVETECH POS URL</div>
                  <div className="font-mono text-sm font-bold text-emerald-700">
                    https://{currentBusiness.slug || 'tenant'}.davetech.co.ke
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Status: <span className="font-bold text-emerald-600 uppercase">Active (Wildcard Subdomain Routing)</span></div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://${currentBusiness.slug || 'tenant'}.davetech.co.ke`);
                      setCopiedUrl(true);
                      setTimeout(() => setCopiedUrl(false), 2000);
                    }}
                    className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : null}
                    <span>{copiedUrl ? 'Copied URL!' : 'Copy URL'}</span>
                  </button>
                </div>
              </div>

              {/* Custom Domain Connection */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Custom Domain</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${currentBusiness.domainStatus === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {currentBusiness.domainStatus || 'Not Connected'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">Connect your own custom domain (e.g., pos.abchotel.com) to route directly to this tenant POS.</p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="e.g. pos.abchotel.com"
                    value={customDomainInput}
                    onChange={(e) => setCustomDomainInput(e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomDomain}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Connect Custom Domain
                  </button>
                </div>

                {currentBusiness.customDomain && currentBusiness.domainStatus !== 'active' && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                    <div className="text-xs font-bold text-amber-900">DNS Verification Required</div>
                    <p className="text-[11px] text-amber-700">Add the following TXT record to your DNS provider:</p>
                    <div className="bg-white p-2 rounded border border-amber-300 font-mono text-[11px] text-slate-800 select-all">
                      TXT Record Name: _davetech.{currentBusiness.customDomain}<br/>
                      TXT Record Value: {currentBusiness.verificationToken || 'davetech-verify-token'}
                    </div>
                    <button
                      type="button"
                      disabled={verifyingDomain}
                      onClick={handleVerifyCustomDomain}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                    >
                      {verifyingDomain ? <span className="animate-spin">⏳</span> : <Check className="w-3.5 h-3.5" />}
                      <span>{verifyingDomain ? 'Verifying DNS...' : 'Verify Custom Domain'}</span>
                    </button>
                  </div>
                )}

                {currentBusiness.customDomain && currentBusiness.domainStatus === 'active' && (
                  <div className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 pt-1">
                    <Check className="w-4 h-4" />
                    <span>Custom domain {currentBusiness.customDomain} is verified and active!</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm shadow-xl flex items-center gap-2 cursor-pointer"
              id="btn-save-settings"
            >
              <Save className="w-4 h-4" />
              <span>Save System Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
