import { useState, useEffect } from "react";
import {
  getCompanyUsers, getCompanyLocations, getRoles, createRole, deleteRole,
  updateUserRole, getUserAssignments, assignUserToLocation, createUser
} from "../firebase/db";
import DashboardLayout from "../components/DashboardLayout";
import { FaPlus, FaTrash, FaUsers, FaUserShield, FaUserPlus } from 'react-icons/fa';

const DEFAULT_ROLES = ['admin', 'manager', 'cashier'];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [roles, setRoles] = useState([]);
  const [assignments, setAssignments] = useState({}); // userId -> location_id
  const [loading, setLoading] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: "", email: "", password: "", role: "cashier", locationId: "" });

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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.fullName.trim() || !newUser.email.trim() || !newUser.password || !newUser.locationId) {
      alert("Please fill in name, email, password, and assign a store.");
      return;
    }
    if (newUser.password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    setCreatingUser(true);
    try {
      await createUser({
        fullName: newUser.fullName.trim(),
        email: newUser.email.trim(),
        password: newUser.password,
        companyId: selectedCompanyId,
        role: newUser.role,
        locationId: newUser.locationId,
      });
      setNewUser({ fullName: "", email: "", password: "", role: "cashier", locationId: "" });
      setShowCreateUser(false);
      fetchData();
    } catch (err) {
      alert(err.message || "Failed to create user");
    } finally {
      setCreatingUser(false);
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
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><FaUsers /> All Users</h2>
            <button onClick={() => setShowCreateUser(prev => !prev)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
              <FaUserPlus /> Create User
            </button>
          </div>

          {showCreateUser && (
            <form onSubmit={handleCreateUser} className="px-6 py-4 border-b border-gray-200 bg-gray-50 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" value={newUser.fullName}
                  onChange={(e) => setNewUser(prev => ({ ...prev, fullName: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                <input type="password" value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  required minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                <select value={newUser.role}
                  onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
                  {allRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Assigned Store *</label>
                <select value={newUser.locationId}
                  onChange={(e) => setNewUser(prev => ({ ...prev, locationId: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
                  <option value="">Select store</option>
                  {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-5 flex justify-end gap-2">
                <button type="button" onClick={() => setShowCreateUser(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
                  Cancel
                </button>
                <button type="submit" disabled={creatingUser}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50">
                  {creatingUser ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          )}
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
