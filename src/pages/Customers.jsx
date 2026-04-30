import { useState, useEffect } from "react";
import {
  getCustomers, createCustomer, updateCustomer, deleteCustomer, getSales
} from "../firebase/db";
import DashboardLayout from "../components/DashboardLayout";
import { FaFilter, FaShoppingBag, FaStar, FaDollarSign, FaSearch } from 'react-icons/fa';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: "", phone: "", email: "",
    membership_level: "Bronze", membership_discount: 0, owed_amount: 0
  });

  const user = JSON.parse(localStorage.getItem("user"));
  const selectedCompanyId = localStorage.getItem("selectedCompanyId") || user?.company_id;
  const selectedLocationId = localStorage.getItem("selectedLocationId");

  useEffect(() => {
    if (selectedCompanyId) fetchCustomers();
  }, [selectedCompanyId, selectedLocationId]);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedFilter, customers]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const dbCustomers = await getCustomers(selectedCompanyId);
      // Import getSales from db
      const { getSales } = await import('../firebase/db');
      const sales = await getSales(selectedCompanyId, selectedLocationId, { limit: 1000 });

      const salesByPhone = {};
      sales.forEach(sale => {
        const phone = sale.phone || '';
        if (!phone) return;
        if (!salesByPhone[phone]) {
          salesByPhone[phone] = { totalAmount: 0, orders1Month: 0, orders3Months: 0, ordersAllTime: 0, lastPurchase: null };
        }
        const saleDate = sale.created_at instanceof Date ? sale.created_at : new Date(sale.created_at?.seconds ? sale.created_at.seconds * 1000 : sale.created_at);
        const now = new Date();
        salesByPhone[phone].totalAmount += parseFloat(sale.total_amount || 0);
        salesByPhone[phone].ordersAllTime += 1;
        if (saleDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)) salesByPhone[phone].orders1Month += 1;
        if (saleDate >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)) salesByPhone[phone].orders3Months += 1;
        if (!salesByPhone[phone].lastPurchase || saleDate > new Date(salesByPhone[phone].lastPurchase)) {
          salesByPhone[phone].lastPurchase = saleDate;
        }
      });

      const customerList = dbCustomers.map(customer => {
        const stats = salesByPhone[customer.phone] || { totalAmount: 0, orders1Month: 0, orders3Months: 0, ordersAllTime: 0, lastPurchase: null };
        return {
          id: customer.id,
          name: customer.full_name,
          phone: customer.phone || "(None)",
          email: customer.email || "",
          membership_level: customer.membership_level || "Bronze",
          membership_discount: customer.membership_discount || 0,
          owed_amount: parseFloat(customer.owed_amount) || 0,
          ...stats,
        };
      });
      setCustomers(customerList);
    } catch (err) {
      console.error("Error fetching customers:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...customers];
    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedFilter === 'lost') filtered = filtered.filter(c => c.orders3Months === 0);
    else if (selectedFilter === 'new') filtered = filtered.filter(c => c.ordersAllTime <= 2);
    else if (selectedFilter === 'loyal') filtered = filtered.filter(c => c.ordersAllTime >= 5);
    setFilteredCustomers(filtered);
  };

  const handleOpenModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({ name: customer.name || "", phone: customer.phone || "", email: customer.email || "", membership_level: customer.membership_level || "Bronze", membership_discount: customer.membership_discount || 0, owed_amount: customer.owed_amount || 0 });
    } else {
      setEditingCustomer(null);
      setFormData({ name: "", phone: "", email: "", membership_level: "Bronze", membership_discount: 0, owed_amount: 0 });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    setFormData({ name: "", phone: "", email: "", membership_level: "Bronze", membership_discount: 0, owed_amount: 0 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const customerData = {
        full_name: formData.name,
        phone: formData.phone,
        email: formData.email,
        membership_level: formData.membership_level,
        membership_discount: formData.membership_discount,
        owed_amount: formData.owed_amount,
        company_id: selectedCompanyId,
      };
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, customerData);
        alert('Customer updated successfully!');
      } else {
        await createCustomer(customerData);
        alert('Customer created successfully!');
      }
      handleCloseModal();
      fetchCustomers();
    } catch (err) {
      alert("Failed to save customer");
    }
  };

  const handleDelete = async (customer) => {
    if (!confirm(`Are you sure you want to remove ${customer.name}?`)) return;
    try {
      await deleteCustomer(customer.id);
      alert('Customer removed successfully!');
      fetchCustomers();
    } catch (err) {
      alert("Failed to remove customer");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">List Of Customers</h1>
          <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
            ⏰ All times are shown in GMT+7 (Asia/Phnom Penh) timezone
          </div>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <div className="flex-1 max-w-md relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input type="text" placeholder="Find by name, phone, email" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"><FaFilter /> More filters</button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"><FaShoppingBag /> Purchased products history</button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"><FaStar /> Loyalty customers</button>
          <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-2 font-medium"><FaDollarSign /> INCREASE REVENUE $</button>
        </div>

        <div className="mb-4 text-sm text-gray-700">Selected <span className="font-bold">{filteredCustomers.length}</span> customers</div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-orange-500 text-white">
                  <th className="px-4 py-3 text-left text-sm font-semibold"><input type="checkbox" className="w-4 h-4 rounded border-white" /></th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Phone Number</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Point</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Total Amount</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Owed Amount</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Orders (All-Time)</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Last Purchase</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="10" className="px-4 py-8 text-center text-gray-500">Loading customers...</td></tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr><td colSpan="10" className="px-4 py-8 text-center text-gray-500">{searchQuery ? "No customers found matching your search" : "No customers available"}</td></tr>
                ) : filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><input type="checkbox" className="w-4 h-4 rounded border-gray-300" /></td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{customer.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{customer.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{customer.email}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">{Math.floor(customer.totalAmount / 10)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">${customer.totalAmount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      {(customer.owed_amount || 0) > 0 ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded font-medium">${parseFloat(customer.owed_amount || 0).toFixed(2)}</span>
                      ) : <span className="text-gray-400">$0.00</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">{customer.ordersAllTime}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {customer.lastPurchase
                        ? new Date(customer.lastPurchase).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Phnom_Penh' })
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleOpenModal(customer)} className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(customer)} className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredCustomers.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">Show 1 To {filteredCustomers.length} Of {filteredCustomers.length} Entries</div>
            </div>
          )}
        </div>

        <button onClick={() => handleOpenModal()}
          className="fixed bottom-8 right-8 w-12 h-12 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 transition flex items-center justify-center text-2xl">+</button>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">{editingCustomer ? "Edit Customer" : "Add New Customer"}</h2>
                  <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none" placeholder="Enter customer name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none" placeholder="Enter phone number" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none" placeholder="Enter email address" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Membership Level</label>
                      <select value={formData.membership_level} onChange={(e) => setFormData({ ...formData, membership_level: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none">
                        {['Bronze','Silver','Gold','Platinum'].map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                      <input type="number" min="0" max="100" value={formData.membership_discount}
                        onChange={(e) => setFormData({ ...formData, membership_discount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Owed Amount ($)</label>
                    <input type="number" min="0" step="0.01" value={formData.owed_amount}
                      onChange={(e) => setFormData({ ...formData, owed_amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none" />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={handleCloseModal}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">Cancel</button>
                    <button type="submit"
                      className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium">
                      {editingCustomer ? "Update Customer" : "Add Customer"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
