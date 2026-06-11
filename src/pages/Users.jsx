import { useState, useEffect } from "react";
import {
  getCompanyUsers, getCompanyLocations, getRoles, createRole, deleteRole,
  updateUserRole, getUserAssignments, assignUserToLocation
} from "../firebase/db";
import DashboardLayout from "../components/DashboardLayout";
import { FaPlus, FaTrash, FaUsers, FaUserShield } from 'react-icons/fa';

const DEFAULT_ROLES = ['admin', 'manager', 'cashier'];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [roles, setRoles] = useState([]);
  const [assignments, setAssignments] = useState({}); // userId -> location_id
  const [loading, setLoading] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const selectedCompanyId = localStorage.getItem("selectedCompanyId") || user?.company_id;

  const allRoles = [...new Set([...DEFAULT_ROLES, ...roles.map(r => r.name)])];

  useEffect(() => {
    if (selectedCompanyId) fetchData();
  }, [selectedCompanyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersList, locationsList, rolesList] = await Promise.all([
        getCompanyUsers(selectedCompanyId),
        getCompanyLocations(selectedCompanyId),
        getRoles(selectedCompanyId),
      ]);
      setUsers(usersList);
      setLocations(locationsList);
      setRoles(rolesList);

      const assignmentEntries = await Promise.all(
        usersList.map(async (u) => {
          const a = await getUserAssignments(u.id, selectedCompanyId);
          return [u.id, a[0]?.location_id || ""];
        })
      );
      setAssignments(Object.fromEntries(assignmentEntries));
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, role) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    try {
      await updateUserRole(userId, role);
    } catch (err) {
      alert("Failed to update role");
    }
  };

  const handleStoreChange = async (userId, locationId) => {
    setAssignments(prev => ({ ...prev, [userId]: locationId }));
    try {
      await assignUserToLocation(userId, selectedCompanyId, locationId);
    } catch (err) {
      alert("Failed to assign store");
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    try {
      await createRole(selectedCompanyId, newRoleName.trim());
      setNewRoleName("");
      fetchData();
    } catch (err) {
      alert("Failed to create role");
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!confirm("Delete this role?")) return;
    try {
      await deleteRole(roleId);
      fetchData();
    } catch (err) {
      alert("Failed to delete role");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">View users, manage roles, and assign users to a store</p>
        </div>

        {/* Roles */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><FaUserShield /> Roles</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {DEFAULT_ROLES.map(r => (
              <span key={r} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{r}</span>
            ))}
            {roles.map(r => (
              <span key={r.id} className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {r.name}
                <button onClick={() => handleDeleteRole(r.id)} className="text-blue-400 hover:text-red-600">
                  <FaTrash size={10} />
                </button>
              </span>
            ))}
          </div>
          <form onSubmit={handleCreateRole} className="flex gap-2 max-w-md">
            <input type="text" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="New role name (e.g. supervisor)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              <FaPlus /> Create Role
            </button>
          </form>
        </div>

        {/* Users */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><FaUsers /> All Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Assigned Store</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-500">Loading users...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-500">No users found</td></tr>
                ) : users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{u.full_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-sm">
                      <select value={u.role || ''} onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
                        <option value="">Select role</option>
                        {allRoles.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <select value={assignments[u.id] || ''} onChange={(e) => handleStoreChange(u.id, e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
                        <option value="">No store</option>
                        {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
