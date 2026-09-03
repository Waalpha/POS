import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Key,
  Lock,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  X,
  History,
  ShieldCheck,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { CashierUser, UserRole } from '../types/pos';
import { soundFx } from '../utils/audio';

export const StaffView: React.FC = () => {
  const {
    cashiers,
    addCashierUser,
    updateCashierUser,
    resetCashierPassword,
    deleteCashierUser,
    toggleCashierStatus,
    auditLogs,
    isManager,
  } = usePOS();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [targetCashier, setTargetCashier] = useState<CashierUser | null>(null);

  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('cashier');
  const [pin, setPin] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [newPin, setNewPin] = useState('');

  const handleAddCashier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !pin.trim()) return;

    soundFx.playSuccess();
    addCashierUser({
      name,
      role,
      pin,
      avatarColor: role === 'manager' ? 'bg-purple-600' : 'bg-emerald-600',
      phone,
      email,
      status: 'active',
    });

    setShowAddModal(false);
    setName('');
    setPin('');
    setPhone('');
    setEmail('');
  };

  const handleResetPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCashier || !newPin.trim()) return;

    soundFx.playSuccess();
    resetCashierPassword(targetCashier.id, newPin);
    setShowPasswordModal(false);
    setTargetCashier(null);
    setNewPin('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden p-4 sm:p-6" id="staff-module-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Staff & Cashier Management</h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Manage cashier accounts, secure PINs/passwords, roles, and administrative permissions.
              </p>
            </div>
          </div>
        </div>

        {isManager && (
          <button
            onClick={() => {
              soundFx.playClick();
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            id="btn-add-cashier"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Cashier / Staff</span>
          </button>
        )}
      </div>

      {/* Staff Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(cashiers || []).map((cashier) => (
            <div
              key={cashier.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between"
              id={`staff-card-${cashier.id}`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl ${cashier.avatarColor || 'bg-indigo-600'} text-white flex items-center justify-center font-black text-base shadow-sm`}>
                      {cashier.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-tight">{cashier.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          cashier.role === 'manager'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {cashier.role}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          cashier.status === 'inactive'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-teal-100 text-teal-800'
                        }`}>
                          {cashier.status || 'active'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs font-medium text-slate-600 py-3 border-t border-slate-100">
                  <div>Phone: {cashier.phone || 'No phone'}</div>
                  <div>Email: {cashier.email || 'No email'}</div>
                  <div>PIN Security: <span className="font-bold font-mono text-slate-800">••••</span> (Secure Hash)</div>
                </div>
              </div>

              {isManager && (
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setTargetCashier(cashier);
                      setShowPasswordModal(true);
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5 text-slate-500" />
                    <span>Reset PIN</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        toggleCashierStatus(cashier.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        cashier.status === 'inactive'
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                      }`}
                    >
                      {cashier.status === 'inactive' ? 'Activate' : 'Deactivate'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Audit Logs Section for Managers */}
        {isManager && (
          <div className="mt-8 bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-purple-600" />
              <h3 className="font-extrabold text-slate-900 text-base">Administrative Audit Logs</h3>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(auditLogs || []).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="font-black text-slate-900">{log.action}</span>
                    <span className="text-slate-600 ml-2">{log.details}</span>
                    <div className="text-[10px] text-slate-400 mt-0.5">By {log.userName} • {new Date(log.timestamp).toLocaleString()}</div>
                  </div>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-bold rounded-lg text-[10px]">
                    {log.recordAffected}
                  </span>
                </div>
              ))}
              {(!auditLogs || auditLogs.length === 0) && (
                <p className="text-xs text-slate-400 text-center py-4">No audit logs recorded yet.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Cashier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-base">Add New Staff / Cashier</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCashier} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mary Wanjiru"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">System Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                >
                  <option value="cashier">Cashier (Sales & POS)</option>
                  <option value="manager">Manager / Admin (Full Access)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Secure PIN (4-6 digits) *</label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="e.g. 4812"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254 712..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="mary@davetech.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md cursor-pointer"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset PIN Modal */}
      {showPasswordModal && targetCashier && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-base">Reset PIN for {targetCashier.name}</h3>
              <button onClick={() => setShowPasswordModal(false)} className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPinSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">New Secure PIN (4-6 digits)</label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="e.g. 5920"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md cursor-pointer"
                >
                  Update PIN Securely
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
