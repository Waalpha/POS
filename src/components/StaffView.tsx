import React, { useState, useMemo } from 'react';
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
  Ban,
  Phone,
  Mail,
  Search,
  AlertTriangle,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { CashierUser, UserRole, CashierStatus } from '../types/pos';
import { soundFx } from '../utils/audio';

const AVATAR_COLORS = [
  'bg-purple-600',
  'bg-emerald-600',
  'bg-indigo-600',
  'bg-blue-600',
  'bg-rose-600',
  'bg-amber-600',
  'bg-teal-600',
  'bg-slate-700',
];

const SUSPENSION_PRESETS = [
  'Pending Disciplinary Review',
  'Till / Cash Variance Under Investigation',
  'Temporary Leave / Sabbatical',
  'Policy Compliance Violation',
  'Contract Inactive / Seasonal Offboarding',
  'Security PIN Compromised',
];

export const StaffView: React.FC = () => {
  const {
    cashiers,
    addCashierUser,
    updateCashierUser,
    resetCashierPassword,
    deleteCashierUser,
    suspendCashierUser,
    unsuspendCashierUser,
    auditLogs,
    isManager,
    currentCashier,
  } = usePOS();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'cashier' | 'manager'>('all');

  // Add Cashier Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addRole, setAddRole] = useState<UserRole>('cashier');
  const [addPin, setAddPin] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addAvatarColor, setAddAvatarColor] = useState('bg-emerald-600');
  const [addError, setAddError] = useState('');

  // Edit Cashier Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCashier, setEditingCashier] = useState<CashierUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('cashier');
  const [editPin, setEditPin] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editStatus, setEditStatus] = useState<CashierStatus>('active');
  const [editSuspensionReason, setEditSuspensionReason] = useState('');
  const [editAvatarColor, setEditAvatarColor] = useState('bg-emerald-600');
  const [editError, setEditError] = useState('');

  // Suspend Cashier Modal State
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState<CashierUser | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  // Delete Cashier Confirmation State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CashierUser | null>(null);

  // Reset PIN Modal State
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinTarget, setPinTarget] = useState<CashierUser | null>(null);
  const [newPin, setNewPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Metrics
  const metrics = useMemo(() => {
    const list = cashiers || [];
    return {
      total: list.length,
      active: list.filter((c) => c.status !== 'suspended' && c.status !== 'inactive').length,
      suspended: list.filter((c) => c.status === 'suspended').length,
      inactive: list.filter((c) => c.status === 'inactive').length,
      managers: list.filter((c) => c.role === 'manager').length,
      cashiers: list.filter((c) => c.role === 'cashier').length,
    };
  }, [cashiers]);

  // Filtered cashiers
  const filteredCashiers = useMemo(() => {
    return (cashiers || []).filter((c) => {
      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchPhone = (c.phone || '').toLowerCase().includes(q);
        const matchEmail = (c.email || '').toLowerCase().includes(q);
        const matchRole = c.role.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchEmail && !matchRole) return false;
      }
      // Status filter
      if (statusFilter !== 'all') {
        const cStatus = c.status || 'active';
        if (cStatus !== statusFilter) return false;
      }
      // Role filter
      if (roleFilter !== 'all') {
        if (c.role !== roleFilter) return false;
      }
      return true;
    });
  }, [cashiers, searchQuery, statusFilter, roleFilter]);

  // ----------------------------------------------------
  // Handlers: Add Cashier
  // ----------------------------------------------------
  const handleOpenAdd = () => {
    soundFx.playClick();
    setAddName('');
    setAddRole('cashier');
    setAddPin('');
    setAddPhone('');
    setAddEmail('');
    setAddAvatarColor('bg-emerald-600');
    setAddError('');
    setShowAddModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');

    if (!addName.trim()) {
      setAddError('Cashier name is required.');
      soundFx.playError();
      return;
    }

    if (!/^\d{4,6}$/.test(addPin)) {
      setAddError('PIN must be 4 to 6 numerical digits.');
      soundFx.playError();
      return;
    }

    // Check duplicate PIN
    const exists = cashiers.find((c) => c.pin === addPin);
    if (exists) {
      setAddError(`PIN ${addPin} is already registered to "${exists.name}".`);
      soundFx.playError();
      return;
    }

    soundFx.playSuccess();
    addCashierUser({
      name: addName.trim(),
      role: addRole,
      pin: addPin,
      avatarColor: addAvatarColor,
      phone: addPhone.trim(),
      email: addEmail.trim(),
      status: 'active',
    });

    setShowAddModal(false);
  };

  // ----------------------------------------------------
  // Handlers: Edit Cashier
  // ----------------------------------------------------
  const handleOpenEdit = (cashier: CashierUser) => {
    soundFx.playClick();
    setEditingCashier(cashier);
    setEditName(cashier.name);
    setEditRole(cashier.role);
    setEditPin(cashier.pin);
    setEditPhone(cashier.phone || '');
    setEditEmail(cashier.email || '');
    setEditStatus(cashier.status || 'active');
    setEditSuspensionReason(cashier.suspensionReason || '');
    setEditAvatarColor(cashier.avatarColor || 'bg-emerald-600');
    setEditError('');
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCashier) return;
    setEditError('');

    if (!editName.trim()) {
      setEditError('Cashier name is required.');
      soundFx.playError();
      return;
    }

    if (!/^\d{4,6}$/.test(editPin)) {
      setEditError('PIN must be 4 to 6 numerical digits.');
      soundFx.playError();
      return;
    }

    // Check duplicate PIN across other staff
    const duplicate = cashiers.find(
      (c) => c.pin === editPin && c.id !== editingCashier.id
    );
    if (duplicate) {
      setEditError(`PIN ${editPin} is already in use by "${duplicate.name}".`);
      soundFx.playError();
      return;
    }

    // Prevent demoting the last active manager
    const activeManagers = cashiers.filter(
      (c) => c.role === 'manager' && c.status !== 'suspended' && c.id !== editingCashier.id
    ).length;
    if (editingCashier.role === 'manager' && editRole === 'cashier' && activeManagers === 0) {
      setEditError('Cannot change role: System requires at least one active Manager account.');
      soundFx.playError();
      return;
    }

    // Prevent suspending the last manager through edit form
    if (editingCashier.role === 'manager' && editStatus === 'suspended' && activeManagers === 0) {
      setEditError('Cannot suspend the only active Manager account.');
      soundFx.playError();
      return;
    }

    soundFx.playSuccess();
    updateCashierUser(editingCashier.id, {
      name: editName.trim(),
      role: editRole,
      pin: editPin,
      phone: editPhone.trim(),
      email: editEmail.trim(),
      status: editStatus,
      suspensionReason: editStatus === 'suspended' ? (editSuspensionReason || 'Suspended by Manager') : undefined,
      suspendedAt: editStatus === 'suspended' ? (editingCashier.suspendedAt || new Date().toISOString()) : undefined,
      avatarColor: editAvatarColor,
    });

    setShowEditModal(false);
    setEditingCashier(null);
  };

  // ----------------------------------------------------
  // Handlers: Suspend / Unsuspend
  // ----------------------------------------------------
  const handleOpenSuspend = (cashier: CashierUser) => {
    soundFx.playClick();
    // Safety check for sole manager
    const activeManagers = cashiers.filter(
      (c) => c.role === 'manager' && c.status !== 'suspended' && c.id !== cashier.id
    ).length;
    if (cashier.role === 'manager' && activeManagers === 0) {
      soundFx.playError();
      alert('Cannot suspend the only active Manager account! Create another manager first.');
      return;
    }

    setSuspendTarget(cashier);
    setSuspendReason('Administrative Investigation');
    setShowSuspendModal(true);
  };

  const handleConfirmSuspend = () => {
    if (!suspendTarget) return;
    suspendCashierUser(suspendTarget.id, suspendReason || 'Suspended by Manager');
    setShowSuspendModal(false);
    setSuspendTarget(null);
  };

  const handleQuickUnsuspend = (cashier: CashierUser) => {
    soundFx.playClick();
    unsuspendCashierUser(cashier.id);
  };

  // ----------------------------------------------------
  // Handlers: Delete Cashier
  // ----------------------------------------------------
  const handleOpenDelete = (cashier: CashierUser) => {
    soundFx.playClick();
    const activeManagers = cashiers.filter(
      (c) => c.role === 'manager' && c.id !== cashier.id
    ).length;
    if (cashier.role === 'manager' && activeManagers === 0) {
      soundFx.playError();
      alert('Cannot delete the only remaining Manager account!');
      return;
    }

    setDeleteTarget(cashier);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const ok = deleteCashierUser(deleteTarget.id);
    if (ok) {
      soundFx.playSuccess();
    }
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  // ----------------------------------------------------
  // Handlers: Reset PIN
  // ----------------------------------------------------
  const handleOpenResetPin = (cashier: CashierUser) => {
    soundFx.playClick();
    setPinTarget(cashier);
    setNewPin('');
    setPinError('');
    setShowPinModal(true);
  };

  const handleResetPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinTarget) return;
    setPinError('');

    if (!/^\d{4,6}$/.test(newPin)) {
      setPinError('PIN must be 4 to 6 numerical digits.');
      soundFx.playError();
      return;
    }

    // Check duplicate PIN
    const duplicate = cashiers.find(
      (c) => c.pin === newPin && c.id !== pinTarget.id
    );
    if (duplicate) {
      setPinError(`PIN ${newPin} is already used by "${duplicate.name}".`);
      soundFx.playError();
      return;
    }

    soundFx.playSuccess();
    resetCashierPassword(pinTarget.id, newPin);
    setShowPinModal(false);
    setPinTarget(null);
    setNewPin('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden p-4 sm:p-6" id="staff-management-view">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Staff & Cashier Control
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-200">
                {metrics.total} Registered
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Create, edit, suspend, or delete cashiers with instant POS login lockout & audit tracking.
            </p>
          </div>
        </div>

        {isManager && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            id="btn-add-staff"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Cashier</span>
          </button>
        )}
      </div>

      {/* KPI Counters Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 shrink-0">
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Staff</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">{metrics.total}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-extrabold text-emerald-600 uppercase tracking-wider">Active Staff</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700">{metrics.active}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-extrabold text-amber-600 uppercase tracking-wider">Suspended</div>
            <div className="text-xl sm:text-2xl font-black text-amber-600">{metrics.suspended}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Ban className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-wider">Managers</div>
            <div className="text-xl sm:text-2xl font-black text-indigo-700">{metrics.managers}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs mb-4 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by cashier name, phone, email..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 text-xs font-black">
          {(['all', 'active', 'suspended', 'inactive'] as const).map((st) => (
            <button
              key={st}
              onClick={() => {
                soundFx.playClick();
                setStatusFilter(st);
              }}
              className={`px-3 py-1.5 rounded-xl capitalize transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? st === 'suspended'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
              {st === 'suspended' && metrics.suspended > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-white/30 text-white rounded-full text-[10px]">
                  {metrics.suspended}
                </span>
              )}
            </button>
          ))}

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Role Filter Chips */}
          {(['all', 'cashier', 'manager'] as const).map((r) => (
            <button
              key={r}
              onClick={() => {
                soundFx.playClick();
                setRoleFilter(r);
              }}
              className={`px-3 py-1.5 rounded-xl capitalize transition-all cursor-pointer whitespace-nowrap ${
                roleFilter === r
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r === 'all' ? 'All Roles' : `${r}s`}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Cards Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filteredCashiers.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">No staff members found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {searchQuery || statusFilter !== 'all' || roleFilter !== 'all'
                ? 'Try adjusting your search criteria or clearing filters.'
                : 'Get started by adding your first cashier or store manager.'}
            </p>
            {(searchQuery || statusFilter !== 'all' || roleFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setRoleFilter('all');
                }}
                className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCashiers.map((cashier) => {
              const isCurrent = currentCashier?.id === cashier.id;
              const isSuspended = cashier.status === 'suspended';
              const isInactive = cashier.status === 'inactive';

              return (
                <div
                  key={cashier.id}
                  className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between shadow-xs ${
                    isSuspended
                      ? 'border-amber-300 ring-2 ring-amber-400/20 bg-amber-50/20'
                      : isCurrent
                      ? 'border-indigo-400 ring-2 ring-indigo-500/20'
                      : 'border-slate-200'
                  }`}
                  id={`staff-card-${cashier.id}`}
                >
                  <div>
                    {/* Card Top: Avatar, Name, Badges */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl ${cashier.avatarColor || 'bg-indigo-600'} text-white flex items-center justify-center font-black text-lg shadow-sm relative shrink-0`}
                        >
                          {cashier.name.charAt(0).toUpperCase()}
                          {isSuspended && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] ring-2 ring-white shadow-xs">
                              <Lock className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-extrabold text-slate-900 text-base leading-tight truncate">
                              {cashier.name}
                            </h3>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-indigo-100 text-indigo-800 uppercase">
                                You
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                                cashier.role === 'manager'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {cashier.role === 'manager' ? (
                                <Shield className="w-2.5 h-2.5" />
                              ) : (
                                <Users className="w-2.5 h-2.5" />
                              )}
                              {cashier.role}
                            </span>

                            <span
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                                isSuspended
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : isInactive
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-teal-100 text-teal-800'
                              }`}
                            >
                              {isSuspended ? (
                                <>
                                  <Ban className="w-2.5 h-2.5" />
                                  SUSPENDED
                                </>
                              ) : isInactive ? (
                                <>
                                  <XCircle className="w-2.5 h-2.5" />
                                  INACTIVE
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  ACTIVE
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Suspension Callout Banner */}
                    {isSuspended && (
                      <div className="mb-3 p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="font-extrabold text-[11px] text-amber-800 uppercase tracking-wider">
                              POS Access Blocked
                            </div>
                            <div className="text-xs font-semibold text-amber-900 mt-0.5 truncate">
                              {cashier.suspensionReason || 'Account suspended by management.'}
                            </div>
                            {cashier.suspendedAt && (
                              <div className="text-[10px] text-amber-700 mt-0.5">
                                Since {new Date(cashier.suspendedAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Contact & Security Info */}
                    <div className="space-y-1.5 text-xs font-medium text-slate-600 py-3 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{cashier.phone || 'No phone number'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{cashier.email || 'No email registered'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-700 pt-0.5">
                        <div className="flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Login PIN:</span>
                          <span className="font-bold font-mono text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                            {cashier.pin}
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                          <ShieldCheck className="w-3 h-3" />
                          Encrypted
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Manager Controls: Edit, Suspend/Unsuspend, Reset PIN, Delete */}
                  {isManager && (
                    <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEdit(cashier)}
                          className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Edit Cashier Profile, PIN, Role, and Status"
                          id={`btn-edit-${cashier.id}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        {/* Suspend / Unsuspend Button */}
                        {isSuspended ? (
                          <button
                            onClick={() => handleQuickUnsuspend(cashier)}
                            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-200"
                            title="Activate / Unsuspend this cashier immediately"
                            id={`btn-unsuspend-${cashier.id}`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Unsuspend</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenSuspend(cashier)}
                            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-amber-200"
                            title="Suspend Cashier (Immediately Locks Out of POS)"
                            id={`btn-suspend-${cashier.id}`}
                          >
                            <Ban className="w-3.5 h-3.5 text-amber-600" />
                            <span>Suspend</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        {/* Reset PIN */}
                        <button
                          onClick={() => handleOpenResetPin(cashier)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[11px] transition-all flex items-center gap-1 cursor-pointer"
                          title="Quick PIN Reset"
                        >
                          <Key className="w-3 h-3 text-slate-500" />
                          <span>Change PIN</span>
                        </button>

                        {/* Delete Cashier */}
                        <button
                          onClick={() => handleOpenDelete(cashier)}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-[11px] transition-all flex items-center gap-1 cursor-pointer border border-rose-200"
                          title="Permanently Delete Cashier Account"
                          id={`btn-delete-${cashier.id}`}
                        >
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Administrative Audit Logs Section */}
        {isManager && (
          <div className="mt-8 bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-purple-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Administrative Audit Logs</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">Real-time Security Event Ledger</span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {(auditLogs || []).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 font-mono text-[11px] uppercase">
                        {log.action}
                      </span>
                      <span className="text-slate-600 font-medium truncate">{log.details}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      By {log.userName} • {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-bold rounded-lg text-[10px] shrink-0 font-mono">
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

      {/* ========================================================
          ADD CASHIER MODAL
          ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-400" />
                <h3 className="font-extrabold text-base">Add New Cashier / Staff</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {addError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. David Mwangi"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* System Role */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Access Role *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setAddRole('cashier');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                      addRole === 'cashier'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>CASHIER (Sales)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setAddRole('manager');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                      addRole === 'manager'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>MANAGER (Full Admin)</span>
                  </button>
                </div>
              </div>

              {/* Secure PIN */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Secure POS PIN (4–6 numerical digits) *
                </label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={addPin}
                  onChange={(e) => setAddPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 2489"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black font-mono tracking-widest text-center text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">Cashier uses this PIN on the POS numpad to log in.</p>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Phone</label>
                  <input
                    type="tel"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    placeholder="+254 7..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email</label>
                  <input
                    type="email"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="david@davetech.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Avatar Color Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Avatar Color
                </label>
                <div className="flex items-center gap-2">
                  {AVATAR_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setAddAvatarColor(col)}
                      className={`w-7 h-7 rounded-full ${col} cursor-pointer transition-transform ${
                        addAvatarColor === col ? 'ring-2 ring-purple-600 ring-offset-2 scale-110' : 'hover:scale-105'
                      }`}
                    />
                  ))}
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
                  id="btn-confirm-add-staff"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          EDIT CASHIER MODAL
          ======================================================== */}
      {showEditModal && editingCashier && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-400" />
                <h3 className="font-extrabold text-base">Edit Cashier: {editingCashier.name}</h3>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCashier(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  System Role *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setEditRole('cashier');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                      editRole === 'cashier'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>CASHIER (Sales)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setEditRole('manager');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                      editRole === 'manager'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>MANAGER (Full Admin)</span>
                  </button>
                </div>
              </div>

              {/* PIN Code */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  POS Security PIN (4-6 digits) *
                </label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={editPin}
                  onChange={(e) => setEditPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black font-mono tracking-widest text-center text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Account Status *
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as CashierStatus)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="active">Active (Can Login & Process Sales)</option>
                  <option value="suspended">Suspended (Locked Out of POS Immediately)</option>
                  <option value="inactive">Inactive (Disabled)</option>
                </select>
              </div>

              {/* If Suspended, input reason */}
              {editStatus === 'suspended' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 animate-in fade-in">
                  <label className="block text-xs font-black text-amber-900 uppercase tracking-wider">
                    Suspension Reason
                  </label>
                  <input
                    type="text"
                    value={editSuspensionReason}
                    onChange={(e) => setEditSuspensionReason(e.target.value)}
                    placeholder="e.g. Till discrepancy under review"
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-semibold text-slate-800"
                  />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {SUSPENSION_PRESETS.slice(0, 3).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setEditSuspensionReason(preset)}
                        className="text-[10px] px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded font-bold cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Phone & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Avatar Color */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Avatar Color
                </label>
                <div className="flex items-center gap-2">
                  {AVATAR_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setEditAvatarColor(col)}
                      className={`w-7 h-7 rounded-full ${col} cursor-pointer transition-transform ${
                        editAvatarColor === col ? 'ring-2 ring-indigo-600 ring-offset-2 scale-110' : 'hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCashier(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md cursor-pointer"
                  id="btn-save-edit-cashier"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          SUSPEND CASHIER MODAL
          ======================================================== */}
      {showSuspendModal && suspendTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 border border-slate-200">
            <div className="px-6 py-4 bg-amber-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5" />
                <h3 className="font-extrabold text-base">Suspend Cashier Account</h3>
              </div>
              <button
                onClick={() => {
                  setShowSuspendModal(false);
                  setSuspendTarget(null);
                }}
                className="p-1.5 text-white/80 hover:text-white rounded-xl bg-white/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-black text-amber-950">Immediate POS Lockout</div>
                  <div className="text-amber-800 mt-0.5">
                    Suspending <span className="font-black">{suspendTarget.name}</span> will immediately reject their
                    PIN at all checkout terminals. Any active session will be terminated.
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reason for Suspension *
                </label>
                <input
                  type="text"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Enter reason or choose preset..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Quick Reason Presets:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SUSPENSION_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSuspendReason(p)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold cursor-pointer transition-all ${
                        suspendReason === p
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowSuspendModal(false);
                    setSuspendTarget(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSuspend}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                  id="btn-confirm-suspend"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Confirm Suspension</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          DELETE CASHIER CONFIRMATION MODAL
          ======================================================== */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 border border-slate-200">
            <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                <h3 className="font-extrabold text-base">Permanently Delete Cashier?</h3>
              </div>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTarget(null);
                }}
                className="p-1.5 text-white/80 hover:text-white rounded-xl bg-white/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-black text-rose-950">Irreversible Action</div>
                  <div className="text-rose-800 mt-0.5">
                    Are you sure you want to permanently delete{' '}
                    <span className="font-black text-rose-950">"{deleteTarget.name}"</span> ({deleteTarget.role})?
                    Their past processed receipts will remain safely retained in the sales ledger for auditing.
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-800">Account Summary:</div>
                <div className="text-slate-600">ID: {deleteTarget.id}</div>
                <div className="text-slate-600">Role: {deleteTarget.role}</div>
                <div className="text-slate-600">Status: {deleteTarget.status || 'active'}</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteTarget(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                  id="btn-confirm-delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Cashier Account</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          RESET PIN MODAL
          ======================================================== */}
      {showPinModal && pinTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-purple-400" />
                <h3 className="font-extrabold text-base">Reset PIN for {pinTarget.name}</h3>
              </div>
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setPinTarget(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPinSubmit} className="p-6 space-y-4">
              {pinError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold">
                  {pinError}
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  New Secure PIN (4–6 numerical digits)
                </label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 5920"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black font-mono tracking-widest text-center text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowPinModal(false);
                    setPinTarget(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md cursor-pointer"
                >
                  Update PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
