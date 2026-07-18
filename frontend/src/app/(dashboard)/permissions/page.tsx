'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export default function PermissionsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  const [selectedRole, setSelectedRole] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.get('/users/roles'),
        api.get('/permissions')
      ]);
      setRoles(rolesRes);
      setPermissions(permsRes);
      if (rolesRes.length > 0) {
        setSelectedRole(rolesRes[0].id);
        fetchRolePermissions(rolesRes[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRolePermissions = async (roleId: string) => {
    try {
      const data = await api.get(`/permissions/role/${roleId}`);
      setRolePermissions(prev => ({ ...prev, [roleId]: data.map((p: any) => p.id) }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleRoleChange = (roleId: string) => {
    setSelectedRole(roleId);
    if (!rolePermissions[roleId]) {
      fetchRolePermissions(roleId);
    }
  };

  const togglePermission = (permId: string) => {
    const current = rolePermissions[selectedRole] || [];
    const updated = current.includes(permId)
      ? current.filter(id => id !== permId)
      : [...current, permId];
    setRolePermissions(prev => ({ ...prev, [selectedRole]: updated }));
  };

  const savePermissions = async () => {
    try {
      await api.post(`/permissions/role/${selectedRole}`, { permissionIds: rolePermissions[selectedRole] });
      toast({ type: 'success', title: 'موفقیت', description: 'سطوح دسترسی نقش با موفقیت ذخیره شد.' });
      fetchRolePermissions(selectedRole);
    } catch (e: any) {
      toast({ type: 'error', title: 'خطا', description: e.response?.data?.message || 'خطا در ذخیره‌سازی' });
    }
  };

  // Build matrix data
  const categories: Record<string, any[]> = {};
  permissions.forEach(p => {
    if (!categories[p.category]) categories[p.category] = [];
    categories[p.category].push(p);
  });

  const allActions = ['View', 'Create', 'Edit', 'Delete', 'Approve', 'Export', 'RevealSensitiveData', 'ManageSessions', 'ViewAuditLogs', 'Manage'];

  const matrixData = Object.keys(categories).map(cat => {
    const rowData: any = { id: cat, category: cat };
    allActions.forEach(action => {
      const perm = categories[cat].find(p => p.action === action);
      rowData[action] = perm ? perm.id : null;
    });
    return rowData;
  });

  const columns = [
    { key: 'category', label: 'دسته‌بندی (ماژول)', render: (val: string) => <span className="font-bold text-slate-900">{val}</span> },
    ...allActions.map(action => ({
      key: action,
      label: action,
      render: (permId: string | null) => {
        if (!permId) return <span className="text-slate-300">-</span>;
        const isChecked = rolePermissions[selectedRole]?.includes(permId) || false;
        return (
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => togglePermission(permId)}
            className="w-5 h-5 text-primary rounded border-slate-300 focus:ring-primary cursor-pointer"
          />
        );
      }
    }))
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">مدیریت سطوح دسترسی</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">ماتریس دسترسی‌ها بر اساس نقش‌های سازمانی</p>
        </div>
        <Button variant="primary" onClick={savePermissions} className="shadow-lg shadow-primary/20">
          ذخیره تغییرات
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Roles Sidebar */}
        <div className="w-full lg:w-1/4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
          <h2 className="font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">نقش‌های کاربری</h2>
          <div className="space-y-2">
            {roles.map(r => (
              <button
                key={r.id}
                onClick={() => handleRoleChange(r.id)}
                className={`w-full text-right px-4 py-3 rounded-xl transition ${
                  selectedRole === r.id 
                    ? 'bg-slate-900 text-white font-bold shadow-md' 
                    : 'hover:bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300'
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>

        {/* Permissions Matrix using DataTable */}
        <div className="w-full lg:w-3/4">
          {loading ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
              <TableSkeleton rows={10} cols={5} />
            </div>
          ) : (
            <DataTable 
              entityType="permission"
              columns={columns}
              data={matrixData}
              totalItems={matrixData.length}
              currentPage={1}
              onPageChange={() => {}}
            />
          )}
        </div>
      </div>
    </div>
  );
}
