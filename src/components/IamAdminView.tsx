import React from 'react';
import { Users, ShieldCheck, Lock, UserPlus, KeyRound, CheckCircle2 } from 'lucide-react';
import { IamUser, IamRole } from '../types';

interface IamAdminViewProps {
  users: IamUser[];
  roles: IamRole[];
}

export const IamAdminView: React.FC<IamAdminViewProps> = ({ users, roles }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#12141c] border border-[#222636] p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
              Role-Based Access Control (RBAC)
            </span>
            <span className="text-xs text-emerald-400 font-mono">SAM/SSO Enterprise IAM</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Identity & Access Management (IAM) Directory</h1>
          <p className="text-xs text-[#8890a6] mt-0.5">
            Manage platform administrators, statutory Information Officers, tenant owners, MFA authentication parameters, and role permissions.
          </p>
        </div>

        <button className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Provision New User
        </button>
      </div>

      {/* IAM Roles Matrix */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#77809a] mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          Configured System & Custom Roles
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roles.map(role => (
            <div key={role.id} className="bg-[#12141c] border border-[#222636] p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{role.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                  {role.isSystemRole ? 'System Default' : 'Custom'}
                </span>
              </div>
              <p className="text-xs text-[#8890a6]">{role.description}</p>
              <div className="flex flex-wrap gap-1 pt-2">
                {role.permissions.map((p, i) => (
                  <span key={i} className="text-[9px] font-mono px-1.5 py-0.5 bg-[#181c28] text-blue-400 rounded border border-[#283046]">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* IAM Users Table */}
      <div className="bg-[#12141c] border border-[#222636] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#222636]">
          <h3 className="text-sm font-bold text-white">Provisioned User Directory</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#161924] text-[10px] uppercase font-mono text-[#77809a] border-b border-[#222636]">
                <th className="p-3.5">User Identity</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Assigned Role</th>
                <th className="p-3.5">Auth Method</th>
                <th className="p-3.5">MFA Status</th>
                <th className="p-3.5 text-right">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222636] text-xs">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-[#181c28] transition-colors">
                  <td className="p-3.5">
                    <div className="font-semibold text-white">{u.name}</div>
                    <div className="text-[10px] text-[#77809a] font-mono">{u.email}</div>
                  </td>
                  <td className="p-3.5 text-[#8890a6]">{u.department}</td>
                  <td className="p-3.5 font-semibold text-blue-300">{u.roleName}</td>
                  <td className="p-3.5 font-mono text-[11px] text-[#8890a6] uppercase">{u.authMethod.replace('_', ' ')}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400">
                      MFA ENFORCED
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-mono text-[#77809a]">{u.lastLogin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
