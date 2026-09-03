import React, { useState, useEffect } from 'react';
import {
  Store,
  ShieldAlert,
  Search,
  ArrowRight,
  LogOut,
  Building2,
  CheckCircle2,
  Lock,
  Sparkles,
  Layers,
  Activity,
  UserCheck,
  ArrowLeft,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { BusinessTenant } from '../types/pos';
import { soundFx } from '../utils/audio';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth';
import { SuperAdminView } from './SuperAdminView';

export const PlatformGateway: React.FC = () => {
  const {
    businesses,
    openTenantPOS,
    isTenantLoading,
    loadingTenantName,
    accessDenied,
    accessDeniedMessage,
    clearAccessDenied,
    logoutPlatform,
    currentViewState,
    setCurrentViewState,
  } = usePOS();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('breakthroughcollege03@gmail.com');
  const [currentUserRole, setCurrentUserRole] = useState<'super_admin' | 'manager' | 'cashier'>('super_admin');
  const [showSuperAdmin, setShowSuperAdmin] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserEmail(user.email || 'breakthroughcollege03@gmail.com');
        if (user.email === 'breakthroughcollege03@gmail.com') {
          setCurrentUserRole('super_admin');
        }
      } else {
        signInAnonymously(auth).catch(() => {});
      }
    });
    return () => unsub();
  }, []);

  const filteredTenants = businesses.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.mode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none relative overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Loading Tenant Handoff Overlay */}
      {isTenantLoading && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-2xl animate-bounce mb-6">
            <Store className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mb-2">
            Loading tenant <span className="text-emerald-400">"{loadingTenantName}"</span>...
          </h2>
          <p className="text-sm text-slate-400 mb-6">Establishing secure tenant context, zero-leak isolation & offline sync</p>
          <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-emerald-500 to-indigo-500 animate-pulse rounded-full" />
          </div>
        </div>
      )}

      {/* Access Denied Modal */}
      {accessDenied && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/40 w-full max-w-md rounded-3xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">Access Denied</h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              {accessDeniedMessage || 'You are not authorized to access this tenant namespace. Cross-tenant reads and writes are strictly restricted by DAVETECH security rules.'}
            </p>
            <button
              onClick={() => {
                soundFx.playClick();
                clearAccessDenied();
              }}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-black shadow-lg transition-all cursor-pointer"
            >
              Return to Authorized Tenants
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-white">DAVETECH POS</h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest">
                SaaS Platform
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Multi-Tenant Cloud POS & Enterprise Operations</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl">
            <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
              {currentUserEmail.charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-200">{currentUserEmail}</div>
              <div className="text-[10px] text-emerald-400 font-semibold uppercase">{currentUserRole.replace('_', ' ')}</div>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              logoutPlatform();
            }}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl text-xs font-bold transition-all cursor-pointer border border-slate-700"
            title="Sign out of Platform"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Gateway Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 flex flex-col gap-8 relative z-10 overflow-y-auto">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Production-Ready Multi-Tenant Architecture</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Select a Business Tenant Namespace to Open POS
            </h2>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              Every tenant operates with isolated data (`tenantId`), tailored workflows (Chemist, Hotel, Restaurant, Supermarket, Retail, Bar, Wholesale), and secure Firestore security rules.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={() => {
                soundFx.playClick();
                setShowSuperAdmin(true);
              }}
              className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Super Admin Control Center</span>
            </button>
          </div>
        </div>

        {showSuperAdmin ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  soundFx.playClick();
                  setShowSuperAdmin(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs font-bold transition-all cursor-pointer border border-slate-700"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Platform Gateway</span>
              </button>
            </div>
            <SuperAdminView />
          </div>
        ) : (
          <>
        {/* Tenant Search & Grid Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-white">Authorized Tenant Businesses ({businesses.length})</h3>
            <p className="text-xs text-slate-400">Click <strong className="text-emerald-400">Open POS</strong> for instant secure handoff.</p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by business name or mode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Tenants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
          {filteredTenants.map((biz) => (
            <div
              key={biz.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 flex flex-col justify-between shadow-xl transition-all group hover:shadow-2xl hover:shadow-emerald-950/20"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black group-hover:scale-105 transition-transform">
                      <Store className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {biz.mode.toUpperCase()}
                      </span>
                      <h4 className="text-base font-bold text-white mt-1">{biz.name}</h4>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Active
                  </span>
                </div>

                <p className="text-xs text-slate-400 mb-5 line-clamp-2">{biz.tagline}</p>

                <div className="space-y-2 text-xs text-slate-300 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 mb-6">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tenant ID:</span>
                    <code className="text-emerald-400 font-mono font-bold">{biz.id}</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Currency / VAT:</span>
                    <span>{biz.currency} ({Math.round(biz.taxRate * 100)}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Location:</span>
                    <span className="truncate max-w-[160px]">{biz.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Plan:</span>
                    <span className="font-bold text-amber-400">{biz.subscriptionPlan || 'Professional SaaS'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    soundFx.playClick();
                    openTenantPOS(biz.id);
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer group-hover:bg-emerald-500"
                  id={`btn-open-pos-${biz.id}`}
                >
                  <span>Open POS Dashboard</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
          </>
        )}
      </main>
    </div>
  );
};
