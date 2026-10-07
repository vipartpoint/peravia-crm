'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { 
  Plus, Shield, Info, X, CheckSquare, Square, Eye, Save, 
  Loader2, Check, CheckCheck, RotateCcw, LockKeyhole, Settings,
  Users, Building, PhoneCall, Presentation, MapPin, Map,
  ReceiptText, CreditCard, BadgeDollarSign, Wallet, Package,
  Warehouse, Archive, Target, Award, PieChart, Lock,
  TrendingUp, FileCheck2, Trophy, BrainCircuit, Calendar,
  UserCheck, Search, Sparkles
} from 'lucide-react';

const ROLE_NAMES_FA: Record<string, string> = {
  SystemAdmin: 'ادمین کل سیستم (دسترسی کامل)',
  CompanyAdmin: 'ادمین شرکت (قابل سفارشی‌سازی)',
  CEO: 'مدیرعامل',
  SalesManager: 'مدیر فروش',
  RegionalManager: 'مدیر منطقه',
  SalesRep: 'کارشناس فروش',
  Finance: 'مدیر / کارشناس مالی',
  SupportOperator: 'اپراتور پشتیبانی',
  WarehouseManager: 'مدیر انبار',
};

const CATEGORY_NAMES_FA: Record<string, { label: string; icon: any }> = {
  Users: { label: 'کاربران سیستم', icon: Users },
  Roles: { label: 'نقش‌ها و دسترسی‌ها', icon: Shield },
  Security: { label: 'امنیت و نشست‌های فعال', icon: LockKeyhole },
  Settings: { label: 'تنظیمات و پیکربندی سیستم', icon: Settings },
  CustomerTiers: { label: 'سطوح مشتریان', icon: Award },
  Customers: { label: 'مشتریان', icon: Building },
  Contacts: { label: 'مخاطبین', icon: PhoneCall },
  Leads: { label: 'سرنخ‌های فروش', icon: Users },
  Opportunities: { label: 'فرصت‌های فروش', icon: TrendingUp },
  Presentations: { label: 'جلسات ارائه', icon: Presentation },
  Visits: { label: 'ویزیت‌های حضوری', icon: MapPin },
  Territories: { label: 'مناطق جغرافیایی', icon: Map },
  Orders: { label: 'سفارشات', icon: ReceiptText },
  Payments: { label: 'دریافتی‌ها', icon: BadgeDollarSign },
  Cheques: { label: 'اسناد دریافتی / چک‌ها', icon: CreditCard },
  Receivables: { label: 'مطالبات', icon: Wallet },
  Products: { label: 'محصولات و کالاها', icon: Package },
  PriceLists: { label: 'لیست‌های قیمت', icon: ReceiptText },
  Warehouses: { label: 'انبارها', icon: Warehouse },
  Inventory: { label: 'موجودی و گردش کالا', icon: Archive },
  KPIs: { label: 'اهداف فروش (KPI)', icon: Target },
  Commissions: { label: 'پورسانت‌ها', icon: Award },
  Reports: { label: 'گزارشات عمومی', icon: PieChart },
  FinancialReports: { label: 'گزارشات مالی', icon: PieChart },
  Tasks: { label: 'وظایف و پیگیری‌ها', icon: CheckSquare },
  Approvals: { label: 'مرکز تاییدات و درخواست‌ها', icon: FileCheck2 },
  StockCertificates: { label: 'گواهی‌های سهام', icon: FileCheck2 },
  Loyalty: { label: 'باشگاه مشتریان (Loyalty)', icon: Trophy },
  ContentCalendar: { label: 'تقویم محتوایی', icon: Calendar },
  AiAssistant: { label: 'دستیار هوشمند AI', icon: BrainCircuit },
};

const ACTION_NAMES_FA: Record<string, string> = {
  View: 'مشاهده',
  Create: 'ایجاد',
  Edit: 'ویرایش',
  Delete: 'حذف',
  Export: 'خروجی اکسل/PDF',
  RevealSensitiveData: 'مشاهده شماره همراه/حساس',
  Manage: 'مدیریت کامل',
  Adjust: 'تعدیل/تنظیم',
  ViewMovements: 'گردش کالا',
  ViewAuditLogs: 'لاگ‌های امنیتی',
  ManageSessions: 'مدیریت نشست‌ها',
};

export default function PermissionsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'roles' | 'users'>('roles');
  
  const [loading, setLoading] = useState(true);
  const [rolePermsLoading, setRolePermsLoading] = useState(false);
  const [savingPermissionsState, setSavingPermissionsState] = useState(false);
  
  // Roles state
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  const [selectedRole, setSelectedRole] = useState<string>('');
  
  // Users state
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [userSearch, setUserSearch] = useState('');
  const [userRolePerms, setUserRolePerms] = useState<string[]>([]);
  const [userOverrides, setUserOverrides] = useState<Record<string, boolean>>({});
  const [userPermsLoading, setUserPermsLoading] = useState(false);
  const [savingUserPerms, setSavingUserPerms] = useState(false);

  // New role modal state
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [creatingRole, setCreatingRole] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        api.get('/users/roles'),
        api.get('/permissions')
      ]);
      setRoles(rolesRes);
      setPermissions(permsRes);

      if (rolesRes.length > 0) {
        const savedRoleId = typeof window !== 'undefined' ? localStorage.getItem('rbac_selected_role') : null;
        const targetRole = rolesRes.find((r: any) => r.id === savedRoleId) 
          || rolesRes.find((r: any) => r.name === 'CompanyAdmin') 
          || rolesRes[0];

        setSelectedRole(targetRole.id);
        await fetchRolePermissions(targetRole.id);
      }
    } catch (e) {
      console.error(e);
      toast({ type: 'error', title: 'خطا', description: 'خطا در دریافت اطلاعات نقش‌ها و دسترسی‌ها' });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (users.length > 0) return;
    try {
      setUsersLoading(true);
      const uRes = await api.get('/users');
      const userList = Array.isArray(uRes) ? uRes : (uRes.users || []);
      setUsers(userList);
      if (userList.length > 0 && !selectedUser) {
        handleUserChange(userList[0].id, userList);
      }
    } catch (e) {
      console.error(e);
      toast({ type: 'error', title: 'خطا', description: 'خطا در بارگذاری لیست کاربران' });
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchRolePermissions = async (roleId: string) => {
    try {
      setRolePermsLoading(true);
      const data = await api.get(`/permissions/role/${roleId}?t=${Date.now()}`);
      const permsArray = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      const permIds = permsArray.map((p: any) => p.id);
      setRolePermissions(prev => ({ ...prev, [roleId]: permIds }));
    } catch (e) {
      console.error('Failed to fetch role permissions:', e);
      toast({ type: 'error', title: 'خطا', description: 'خطا در بارگذاری دسترسی‌های نقش انتخاب‌شده' });
    } finally {
      setRolePermsLoading(false);
    }
  };

  const fetchUserPermissions = async (userId: string, roleId?: string) => {
    try {
      setUserPermsLoading(true);
      const [uPermsRes, rPermsRes] = await Promise.all([
        api.get(`/permissions/user/${userId}?t=${Date.now()}`),
        roleId ? api.get(`/permissions/role/${roleId}?t=${Date.now()}`) : Promise.resolve([])
      ]);

      const rPermsArray = Array.isArray(rPermsRes) ? rPermsRes : (Array.isArray(rPermsRes?.data) ? rPermsRes.data : []);
      setUserRolePerms(rPermsArray.map((p: any) => p.id));

      const overridesMap: Record<string, boolean> = {};
      const uPermsArray = Array.isArray(uPermsRes) ? uPermsRes : (uPermsRes.data || []);
      for (const item of uPermsArray) {
        overridesMap[item.permissionId] = item.isGranted;
      }
      setUserOverrides(overridesMap);
    } catch (e) {
      console.error('Failed to fetch user permissions:', e);
      toast({ type: 'error', title: 'خطا', description: 'خطا در دریافت دسترسی‌های کاربر' });
    } finally {
      setUserPermsLoading(false);
    }
  };

  const handleRoleChange = (roleId: string) => {
    setSelectedRole(roleId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('rbac_selected_role', roleId);
    }
    fetchRolePermissions(roleId);
  };

  const handleUserChange = (userId: string, userList = users) => {
    setSelectedUser(userId);
    const u = userList.find((usr: any) => usr.id === userId);
    fetchUserPermissions(userId, u?.roleId || u?.role?.id);
  };

  const togglePermission = (permId: string) => {
    const current = rolePermissions[selectedRole] || [];
    const updated = current.includes(permId)
      ? current.filter(id => id !== permId)
      : [...current, permId];
    setRolePermissions(prev => ({ ...prev, [selectedRole]: updated }));
  };

  const toggleUserPermission = (permId: string) => {
    // Current effective value:
    const isOverrideSet = userOverrides[permId] !== undefined;
    const currentVal = isOverrideSet ? userOverrides[permId] : userRolePerms.includes(permId);
    const nextVal = !currentVal;

    setUserOverrides(prev => ({
      ...prev,
      [permId]: nextVal
    }));
  };

  const selectAllPermissions = () => {
    const allIds = permissions.map(p => p.id);
    setRolePermissions(prev => ({ ...prev, [selectedRole]: allIds }));
    toast({ type: 'info', title: 'انتخاب همه', description: 'تمام دسترسی‌های موجود انتخاب شدند.' });
  };

  const deselectAllPermissions = () => {
    setRolePermissions(prev => ({ ...prev, [selectedRole]: [] }));
    toast({ type: 'info', title: 'لغو همه', description: 'تمام دسترسی‌ها لغو شدند.' });
  };

  const selectReadOnlyPermissions = () => {
    const readOnlyIds = permissions.filter(p => p.action === 'View' || p.action === 'Export' || p.action === 'ViewMovements' || p.action === 'ViewAuditLogs').map(p => p.id);
    setRolePermissions(prev => ({ ...prev, [selectedRole]: readOnlyIds }));
    toast({ type: 'info', title: 'فقط مشاهده', description: 'دسترسی‌های مشاهده و خروجی انتخاب شدند.' });
  };

  const toggleCategoryPermissions = (catName: string) => {
    const catPerms = permissions.filter(p => p.category === catName);
    const catPermIds = catPerms.map(p => p.id);
    const current = rolePermissions[selectedRole] || [];
    const hasAll = catPermIds.every(id => current.includes(id));

    let updated: string[];
    if (hasAll) {
      updated = current.filter(id => !catPermIds.includes(id));
    } else {
      updated = Array.from(new Set([...current, ...catPermIds]));
    }

    setRolePermissions(prev => ({ ...prev, [selectedRole]: updated }));
  };

  const toggleUserCategoryPermissions = (catName: string) => {
    const catPerms = permissions.filter(p => p.category === catName);
    const allActive = catPerms.every(p => {
      const isSet = userOverrides[p.id] !== undefined;
      return isSet ? userOverrides[p.id] : userRolePerms.includes(p.id);
    });

    const nextVal = !allActive;
    const newOverrides = { ...userOverrides };
    for (const p of catPerms) {
      newOverrides[p.id] = nextVal;
    }
    setUserOverrides(newOverrides);
  };

  const toggleActionColumnPermissions = (actionName: string) => {
    const actionPerms = permissions.filter(p => p.action === actionName);
    const actionPermIds = actionPerms.map(p => p.id);
    const current = rolePermissions[selectedRole] || [];
    const hasAll = actionPermIds.every(id => current.includes(id));

    let updated: string[];
    if (hasAll) {
      updated = current.filter(id => !actionPermIds.includes(id));
    } else {
      updated = Array.from(new Set([...current, ...actionPermIds]));
    }

    setRolePermissions(prev => ({ ...prev, [selectedRole]: updated }));
  };

  const savePermissions = async () => {
    if (!selectedRole) return;
    try {
      setSavingPermissionsState(true);
      const currentPerms = rolePermissions[selectedRole] || [];
      await api.post(`/permissions/role/${selectedRole}`, { permissionIds: currentPerms });
      
      const roleObj = roles.find(r => r.id === selectedRole);
      const faName = roleObj ? (ROLE_NAMES_FA[roleObj.name] || roleObj.name) : 'نقش';

      toast({ 
        type: 'success', 
        title: 'ذخیره موفقیت‌آمیز', 
        description: `تعداد ${currentPerms.length} دسترسی برای نقش «${faName}» با موفقیت ذخیره گردید.` 
      });
      
      await fetchRolePermissions(selectedRole);
    } catch (e: any) {
      toast({ type: 'error', title: 'خطا در ذخیره‌سازی', description: e.response?.data?.message || 'خطا در ذخیره‌سازی دسترسی‌ها' });
    } finally {
      setSavingPermissionsState(false);
    }
  };

  const saveUserPermissions = async () => {
    if (!selectedUser) return;
    try {
      setSavingUserPerms(true);
      const overridesArray = Object.entries(userOverrides).map(([permissionId, isGranted]) => ({
        permissionId,
        isGranted
      }));

      await api.post(`/permissions/user/${selectedUser}`, { overrides: overridesArray });
      const targetUser = users.find(u => u.id === selectedUser);

      toast({
        type: 'success',
        title: 'ذخیره دسترسی‌های کاربر',
        description: `دسترسی‌های اختصاصی برای کاربر «${targetUser?.username || 'انتخاب‌شده'}» با موفقیت ذخیره شد.`
      });

      await fetchUserPermissions(selectedUser, targetUser?.roleId || targetUser?.role?.id);
    } catch (e: any) {
      toast({
        type: 'error',
        title: 'خطا در ذخیره‌سازی',
        description: e.response?.data?.message || 'خطا در ذخیره دسترسی‌های کاربر'
      });
    } finally {
      setSavingUserPerms(false);
    }
  };

  const resetUserToRoleDefaults = async () => {
    if (!selectedUser) return;
    try {
      setSavingUserPerms(true);
      // Empty overrides resets to role defaults completely
      await api.post(`/permissions/user/${selectedUser}`, { overrides: [] });
      setUserOverrides({});
      const targetUser = users.find(u => u.id === selectedUser);
      toast({
        type: 'info',
        title: 'بازنشانی انجام شد',
        description: `تمام دسترسی‌های اختصاصی کاربر «${targetUser?.username}» پاک شد و دقیقا به دسترسی‌های نقش پیش‌فرض خود بازگشت.`
      });
      await fetchUserPermissions(selectedUser, targetUser?.roleId || targetUser?.role?.id);
    } catch (e: any) {
      toast({ type: 'error', title: 'خطا', description: 'خطا در بازنشانی دسترسی‌های کاربر' });
    } finally {
      setSavingUserPerms(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    setCreatingRole(true);
    try {
      const res = await api.post('/permissions/role', { name: newRoleName.trim() });
      toast({ type: 'success', title: 'موفقیت', description: `نقش جدید "${newRoleName.trim()}" ایجاد شد.` });
      setNewRoleName('');
      setShowAddRoleModal(false);
      
      const rolesRes = await api.get('/users/roles');
      setRoles(rolesRes);
      const createdId = res.id || res.data?.id || rolesRes[rolesRes.length - 1]?.id;
      if (createdId) {
        handleRoleChange(createdId);
      }
    } catch (e: any) {
      toast({ type: 'error', title: 'خطا', description: e.response?.data?.message || 'خطا در تعریف نقش جدید' });
    } finally {
      setCreatingRole(false);
    }
  };

  const currentRoleObj = roles.find(r => r.id === selectedRole);
  const isSysAdminRole = currentRoleObj?.name === 'SystemAdmin';
  const currentRoleFaName = currentRoleObj ? (ROLE_NAMES_FA[currentRoleObj.name] || currentRoleObj.name) : '';

  const currentUserObj = users.find(u => u.id === selectedUser);
  const isSysAdminUser = currentUserObj?.role?.name === 'SystemAdmin';

  const categoriesList = Array.from(new Set(permissions.map(p => p.category)));
  const actionsOrder = ['View', 'Create', 'Edit', 'Delete', 'Export', 'RevealSensitiveData', 'Manage', 'Adjust', 'ViewMovements', 'ViewAuditLogs', 'ManageSessions'];
  const actionsList = actionsOrder.filter(act => permissions.some(p => p.action === act));

  const filteredUsers = users.filter(u => 
    (u.username || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (ROLE_NAMES_FA[u.role?.name] || u.role?.name || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">مدیریت سطوح دسترسی (RBAC)</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            تعیین و شخصی‌سازی دسترسی ماژول‌ها برای نقش‌های سازمانی و کاربران مجزا (از جمله مناطق جغرافیایی)
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'roles'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            نقش‌های سازمانی (Role-based)
          </button>
          <button
            onClick={() => {
              setActiveTab('users');
              fetchUsers();
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            دسترسی اختصاصی کاربران (User-specific)
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: ROLE-BASED PERMISSIONS */}
      {/* ========================================================= */}
      {activeTab === 'roles' && (
        <>
          <div className="flex justify-end gap-3 mb-4">
            <Button variant="outline" onClick={() => setShowAddRoleModal(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> تعریف نقش جدید
            </Button>
            <Button 
              variant="primary" 
              onClick={savePermissions} 
              isLoading={savingPermissionsState}
              disabled={isSysAdminRole || savingPermissionsState}
              className="shadow-lg shadow-indigo-600/20 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl"
            >
              <Save className="w-4 h-4" /> ذخیره تغییرات نقش
            </Button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Roles Sidebar */}
            <div className="w-full lg:w-1/4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 shrink-0">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-base">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  نقش‌های سازمانی
                </h2>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">{roles.length}</span>
              </div>

              <div className="space-y-2">
                {roles.map(r => {
                  const faName = ROLE_NAMES_FA[r.name] || r.name;
                  const isSelected = selectedRole === r.id;
                  const isCompanyAdmin = r.name === 'CompanyAdmin';

                  return (
                    <button
                      key={r.id}
                      onClick={() => handleRoleChange(r.id)}
                      className={`w-full text-right px-4 py-3 rounded-xl transition-all flex flex-col gap-1.5 ${
                        isSelected 
                          ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20 scale-[1.01]' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-sm font-bold">{faName}</span>
                        {isCompanyAdmin && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                          }`}>
                            ادمین شرکت
                          </span>
                        )}
                      </div>
                      <span className={`text-[11px] ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                        شناسه: {r.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Permissions Matrix Content */}
            <div className="w-full lg:w-3/4 space-y-4">
              
              {currentRoleObj?.name === 'CompanyAdmin' && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-300 text-xs flex items-center gap-3">
                  <Info className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div>
                    <span className="font-bold block text-sm mb-0.5">سفارشی‌سازی نقش «ادمین شرکت (CompanyAdmin)»</span>
                    شما می‌توانید با زدن تیک‌های جدول زیر، مشخص کنید ادمین شرکت به کدام ماژول‌ها دسترسی داشته باشد.
                  </div>
                </div>
              )}

              {currentRoleObj?.name === 'SystemAdmin' && (
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 text-blue-900 dark:text-blue-300 text-xs flex items-center gap-3">
                  <Info className="w-5 h-5 shrink-0 text-blue-600 dark:text-blue-400" />
                  <div>
                    <span className="font-bold block text-sm mb-0.5">نقش «ادمین کل سیستم (SystemAdmin)»</span>
                    این نقش دسترسی کامل زیرساختی دارد و تمامی چک‌باکس‌های آن به صورت دائمی فعال هستند.
                  </div>
                </div>
              )}

              {!isSysAdminRole && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <span>انتخاب سریع:</span>
                    <span className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-black border border-indigo-200 dark:border-indigo-800">
                      {rolePermissions[selectedRole]?.length || 0} دسترسی فعال برای این نقش
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={selectReadOnlyPermissions} disabled={rolePermsLoading} className="text-xs flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-slate-500" /> فقط مشاهده
                    </Button>
                    <Button variant="outline" size="sm" onClick={selectAllPermissions} disabled={rolePermsLoading} className="text-xs flex items-center gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                      <CheckCheck className="w-3.5 h-3.5" /> انتخاب همه دسترسی‌ها
                    </Button>
                    <Button variant="outline" size="sm" onClick={deselectAllPermissions} disabled={rolePermsLoading} className="text-xs text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5" /> لغو همه دسترسی‌ها
                    </Button>
                  </div>
                </div>
              )}

              {loading || rolePermsLoading ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <p className="text-sm text-slate-500 font-bold">در حال بارگذاری سطوح دسترسی...</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                          <th className="p-4 font-black min-w-[220px] sticky right-0 bg-slate-50 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 z-10">
                            ماژول / بخش سیستم
                          </th>
                          {actionsList.map(action => (
                            <th key={action} className="p-4 font-bold text-center whitespace-nowrap min-w-[120px]">
                              <div className="flex flex-col items-center gap-1">
                                <span>{ACTION_NAMES_FA[action] || action}</span>
                                {!isSysAdminRole && (
                                  <button
                                    type="button"
                                    onClick={() => toggleActionColumnPermissions(action)}
                                    title={`انتخاب/لغو همه دسترسی‌های ${ACTION_NAMES_FA[action] || action}`}
                                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-normal"
                                  >
                                    [کل ستون]
                                  </button>
                                )}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {categoriesList.map(cat => {
                          const catConfig = CATEGORY_NAMES_FA[cat] || { label: cat, icon: Shield };
                          const IconComponent = catConfig.icon;
                          const catPerms = permissions.filter(p => p.category === cat);
                          const catPermIds = catPerms.map(p => p.id);
                          const currentSelected = rolePermissions[selectedRole] || [];
                          const isAllCatSelected = catPermIds.length > 0 && catPermIds.every(id => currentSelected.includes(id));
                          const isAnyCatSelected = catPermIds.some(id => currentSelected.includes(id));

                          return (
                            <tr key={cat} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="p-4 sticky right-0 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 font-bold z-10">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shrink-0">
                                      <IconComponent className="w-4 h-4" />
                                    </div>
                                    <span className="text-slate-900 dark:text-slate-100 font-bold">{catConfig.label}</span>
                                  </div>
                                  {!isSysAdminRole && (
                                    <button
                                      type="button"
                                      onClick={() => toggleCategoryPermissions(cat)}
                                      className={`text-xs px-2 py-1 rounded-md font-semibold transition flex items-center gap-1 ${
                                        isAllCatSelected 
                                          ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' 
                                          : (isAnyCatSelected ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900')
                                      }`}
                                    >
                                      {isAllCatSelected ? <CheckSquare className="w-3.5 h-3.5 text-indigo-600" /> : <Square className="w-3.5 h-3.5" />}
                                      <span>سطر</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                              {actionsList.map(action => {
                                const perm = catPerms.find(p => p.action === action);
                                if (!perm) {
                                  return (
                                    <td key={action} className="p-4 text-center text-slate-300 dark:text-slate-700 font-mono select-none">
                                      —
                                    </td>
                                  );
                                }
                                const isChecked = rolePermissions[selectedRole]?.includes(perm.id) || false;
                                return (
                                  <td key={action} className="p-4 text-center">
                                    <label className="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition">
                                      <input 
                                        type="checkbox"
                                        disabled={isSysAdminRole || rolePermsLoading}
                                        checked={isSysAdminRole || isChecked}
                                        onChange={() => togglePermission(perm.id)}
                                        className="w-5 h-5 text-indigo-600 rounded-md border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                                      />
                                    </label>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* TAB 2: USER-SPECIFIC PERMISSIONS (OVERRIDE PER USER) */}
      {/* ========================================================= */}
      {activeTab === 'users' && (
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Users Sidebar */}
          <div className="w-full lg:w-1/4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 shrink-0 flex flex-col h-[750px]">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-base">
                <Users className="w-4 h-4 text-indigo-600" />
                کاربران سیستم
              </h2>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">{users.length}</span>
            </div>

            {/* Search Box */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="جستجوی کاربر یا نقش..."
                className="w-full pr-9 pl-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 bg-slate-50 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {usersLoading ? (
                <div className="p-8 text-center text-slate-400 text-xs">در حال بارگذاری کاربران...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">کاربری یافت نشد.</div>
              ) : (
                filteredUsers.map(u => {
                  const isSelected = selectedUser === u.id;
                  const roleFa = ROLE_NAMES_FA[u.role?.name] || u.role?.name || 'بدون نقش';
                  const initials = (u.username || 'U').slice(0, 2).toUpperCase();

                  return (
                    <button
                      key={u.id}
                      onClick={() => handleUserChange(u.id)}
                      className={`w-full text-right p-3 rounded-xl transition-all flex items-center gap-3 ${
                        isSelected 
                          ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-transparent'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                      }`}>
                        {initials}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs font-bold truncate">{u.username}</span>
                        <span className={`text-[10px] truncate ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                          {roleFa}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* User Matrix Content */}
          <div className="w-full lg:w-3/4 space-y-4">
            
            {/* User Info Bar & Actions */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    دسترسی‌های اختصاصی کاربر: <span className="text-indigo-600 dark:text-indigo-400">{currentUserObj?.username || '---'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    نقش پایه سازمانی: <span className="font-bold text-slate-700 dark:text-slate-300">{ROLE_NAMES_FA[currentUserObj?.role?.name] || currentUserObj?.role?.name || '---'}</span>
                    {' '}| هر تغییری در این بخش، مستقیماً دسترسی این کاربر خاص را شخصی‌سازی می‌کند.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  onClick={resetUserToRoleDefaults} 
                  disabled={savingUserPerms || isSysAdminUser}
                  className="text-xs flex items-center gap-1.5 text-slate-600 hover:text-slate-900"
                  title="پاک کردن تمام دسترسی‌های اختصاصی و بازگشت به تنظیمات پیش‌فرض نقش کاربر"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> بازنشانی به پیش‌فرض نقش
                </Button>
                <Button 
                  variant="primary" 
                  onClick={saveUserPermissions}
                  isLoading={savingUserPerms}
                  disabled={savingUserPerms || isSysAdminUser}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 px-5 py-2.5 rounded-xl"
                >
                  <Save className="w-4 h-4" /> ذخیره دسترسی‌های کاربر
                </Button>
              </div>
            </div>

            {/* SysAdmin Warning */}
            {isSysAdminUser && (
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 text-blue-900 dark:text-blue-300 text-xs flex items-center gap-3">
                <Info className="w-5 h-5 shrink-0 text-blue-600 dark:text-blue-400" />
                <div>
                  <span className="font-bold block text-sm mb-0.5">این کاربر ادمین کل سیستم (SystemAdmin) است</span>
                  ادمین کل سیستم به صورت زیرساختی به تمامی بخش‌ها (شامل تمامی عملیات مناطق) دسترسی کامل و دائمی دارد و نیازی به override ندارد.
                </div>
              </div>
            )}

            {/* Territory Highlight Banner */}
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-300 text-xs flex items-center gap-3">
              <Sparkles className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <span className="font-bold block text-sm mb-0.5">کنترل دسترسی مناطق جغرافیایی (Territories) برای این کاربر</span>
                در جدول زیر، سطر <strong>«مناطق جغرافیایی»</strong> را پیدا کنید. می‌توانید دسترسی‌های <strong>ویرایش (تغییر نام)</strong> و <strong>حذف منطقه (ادغام/رهاسازی ایمن)</strong> را برای این کاربر اختصاصاً فعال یا غیرفعال کنید.
              </div>
            </div>

            {/* Matrix Table */}
            {userPermsLoading ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-sm text-slate-500 font-bold">در حال بارگذاری دسترسی‌های کاربر...</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                        <th className="p-4 font-black min-w-[220px] sticky right-0 bg-slate-50 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 z-10">
                          ماژول / بخش سیستم
                        </th>
                        {actionsList.map(action => (
                          <th key={action} className="p-4 font-bold text-center whitespace-nowrap min-w-[120px]">
                            {ACTION_NAMES_FA[action] || action}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {categoriesList.map(cat => {
                        const catConfig = CATEGORY_NAMES_FA[cat] || { label: cat, icon: Shield };
                        const IconComponent = catConfig.icon;
                        const catPerms = permissions.filter(p => p.category === cat);
                        const isTerritoryRow = cat === 'Territories';

                        return (
                          <tr 
                            key={cat} 
                            className={`transition-colors ${
                              isTerritoryRow 
                                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 font-bold hover:bg-emerald-50/70' 
                                : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            <td className={`p-4 sticky right-0 border-l border-slate-200 dark:border-slate-700 font-bold z-10 ${
                              isTerritoryRow ? 'bg-emerald-50/60 dark:bg-emerald-950/40' : 'bg-white dark:bg-slate-900'
                            }`}>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                  <div className={`p-2 rounded-lg shrink-0 ${
                                    isTerritoryRow 
                                      ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' 
                                      : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                                  }`}>
                                    <IconComponent className="w-4 h-4" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-slate-900 dark:text-slate-100 font-bold">{catConfig.label}</span>
                                    {isTerritoryRow && (
                                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">مدیریت مناطق، تغییر نام و حذف</span>
                                    )}
                                  </div>
                                </div>

                                {!isSysAdminUser && (
                                  <button
                                    type="button"
                                    onClick={() => toggleUserCategoryPermissions(cat)}
                                    className="text-xs px-2 py-1 rounded-md font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-slate-900 transition"
                                  >
                                    سطر
                                  </button>
                                )}
                              </div>
                            </td>

                            {actionsList.map(action => {
                              const perm = catPerms.find(p => p.action === action);
                              if (!perm) {
                                return (
                                  <td key={action} className="p-4 text-center text-slate-300 dark:text-slate-700 font-mono select-none">
                                    —
                                  </td>
                                );
                              }

                              const isOverrideSet = userOverrides[perm.id] !== undefined;
                              const isEffectiveChecked = isSysAdminUser || (isOverrideSet ? userOverrides[perm.id] : userRolePerms.includes(perm.id));

                              return (
                                <td key={action} className="p-4 text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <label className="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition">
                                      <input 
                                        type="checkbox"
                                        disabled={isSysAdminUser || userPermsLoading}
                                        checked={isEffectiveChecked}
                                        onChange={() => toggleUserPermission(perm.id)}
                                        className={`w-5 h-5 rounded-md focus:ring-2 cursor-pointer disabled:opacity-50 ${
                                          isTerritoryRow 
                                            ? 'text-emerald-600 border-emerald-400 focus:ring-emerald-500' 
                                            : 'text-indigo-600 border-slate-300 dark:border-slate-700 focus:ring-indigo-500'
                                        }`}
                                      />
                                    </label>
                                    
                                    {/* Indicator Tag */}
                                    {isOverrideSet && !isSysAdminUser && (
                                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold leading-none ${
                                        userOverrides[perm.id] 
                                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                      }`}>
                                        اختصاصی
                                      </span>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Role Modal */}
      {showAddRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                تعریف نقش کاربری جدید
              </h3>
              <button onClick={() => setShowAddRoleModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نام لاتین نقش (برای شناسه سیستم)
                </label>
                <input 
                  type="text" 
                  value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value)}
                  placeholder="مثال: BranchManager یا HRManager"
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-sm outline-none focus:border-indigo-500 dark:bg-slate-800 dark:text-slate-100"
                  required
                />
                <p className="text-xs text-slate-400 mt-1">از حروف انگلیسی و بدون فاصله استفاده کنید.</p>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setShowAddRoleModal(false)} className="flex-1">
                  انصراف
                </Button>
                <Button type="submit" variant="primary" isLoading={creatingRole} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                  ایجاد نقش
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
