import { useState, useEffect } from "react";
import { getDiscounts, createDiscount, updateDiscount, deleteDiscount, getVouchers, createVoucher, updateVoucher, deleteVoucher } from "../firebase/db";
import DashboardLayout from "../components/DashboardLayout";
import { FaPlus, FaEdit, FaTrash, FaTicketAlt, FaPercent, FaTags } from 'react-icons/fa';

export default function Promotions() {
  const [activeSection, setActiveSection] = useState('discounts');
  const [discounts, setDiscounts] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const selectedCompanyId = localStorage.getItem("selectedCompanyId") || user?.company_id;
  const selectedLocationId = localStorage.getItem("selectedLocationId");

  // Discount form state
  const [discountForm, setDiscountForm] = useState({
    name: '',
    type: 'percentage', // percentage or fixed
    value: '',
    min_purchase: '',
    max_discount: '',
    start_date: '',
    end_date: '',
    is_active: true
  });

  // Voucher form state
  const [voucherForm, setVoucherForm] = useState({
    code: '',
    name: '',
    type: 'percentage',
    value: '',
    min_purchase: '',
    max_discount: '',
    usage_limit: '',
    used_count: 0,
    start_date: '',
    end_date: '',
    is_active: true
  });

  useEffect(() => {
    if (selectedCompanyId) {
      fetchDiscounts();
      fetchVouchers();
    }
  }, [selectedCompanyId, selectedLocationId]);

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const data = await getDiscounts(selectedCompanyId, selectedLocationId);
      setDiscounts(data);
    } catch (err) {
      console.error("Error fetching discounts:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const data = await getVouchers(selectedCompanyId, selectedLocationId);
      setVouchers(data);
    } catch (err) {
      console.error("Error fetching vouchers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDiscount = async () => {
    try {
      const data = {
        ...discountForm,
        company_id: selectedCompanyId,
        location_id: selectedLocationId
      };

      if (editingItem) {
        await updateDiscount(editingItem.id, data);
      } else {
        await createDiscount(data);
      }

      setShowDiscountModal(false);
      setEditingItem(null);
      resetDiscountForm();
      fetchDiscounts();
    } catch (err) {
      console.error("Error saving discount:", err);
      alert("Failed to save discount");
    }
  };

  const handleSaveVoucher = async () => {
    try {
      const data = {
        ...voucherForm,
        company_id: selectedCompanyId,
        location_id: selectedLocationId
      };

      if (editingItem) {
        await updateVoucher(editingItem.id, data);
      } else {
        await createVoucher(data);
      }

      setShowVoucherModal(false);
      setEditingItem(null);
      resetVoucherForm();
      fetchVouchers();
    } catch (err) {
      console.error("Error saving voucher:", err);
      alert("Failed to save voucher");
    }
  };

  const handleDeleteDiscount = async (id) => {
    if (confirm('Are you sure you want to delete this discount?')) {
      try {
        await deleteDiscount(id);
        fetchDiscounts();
      } catch (err) {
        console.error("Error deleting discount:", err);
      }
    }
  };

  const handleDeleteVoucher = async (id) => {
    if (confirm('Are you sure you want to delete this voucher?')) {
      try {
        await deleteVoucher(id);
        fetchVouchers();
      } catch (err) {
        console.error("Error deleting voucher:", err);
      }
    }
  };

  const handleEditDiscount = (discount) => {
    setEditingItem(discount);
    setDiscountForm({
      name: discount.name,
      type: discount.type,
      value: discount.value,
      min_purchase: discount.min_purchase || '',
      max_discount: discount.max_discount || '',
      start_date: discount.start_date?.split('T')[0] || '',
      end_date: discount.end_date?.split('T')[0] || '',
      is_active: discount.is_active
    });
    setShowDiscountModal(true);
  };

  const handleEditVoucher = (voucher) => {
    setEditingItem(voucher);
    setVoucherForm({
      code: voucher.code,
      name: voucher.name,
      type: voucher.type,
      value: voucher.value,
      min_purchase: voucher.min_purchase || '',
      max_discount: voucher.max_discount || '',
      usage_limit: voucher.usage_limit || '',
      used_count: voucher.used_count || 0,
      start_date: voucher.start_date?.split('T')[0] || '',
      end_date: voucher.end_date?.split('T')[0] || '',
      is_active: voucher.is_active
    });
    setShowVoucherModal(true);
  };

  const resetDiscountForm = () => {
    setDiscountForm({
      name: '',
      type: 'percentage',
      value: '',
      min_purchase: '',
      max_discount: '',
      start_date: '',
      end_date: '',
      is_active: true
    });
  };

  const resetVoucherForm = () => {
    setVoucherForm({
      code: '',
      name: '',
      type: 'percentage',
      value: '',
      min_purchase: '',
      max_discount: '',
      usage_limit: '',
      used_count: 0,
      start_date: '',
      end_date: '',
      is_active: true
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Promotions Management</h1>
          <p className="text-gray-600 mt-1">Create and manage discounts and vouchers for your POS system</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveSection('discounts')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition border-b-2 ${
                activeSection === 'discounts'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <FaPercent /> Discounts
            </button>
            <button
              onClick={() => setActiveSection('vouchers')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition border-b-2 ${
                activeSection === 'vouchers'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <FaTicketAlt /> Vouchers
            </button>
          </div>
        </div>

        {/* Discounts Section */}
        {activeSection === 'discounts' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Active Discounts</h2>
              <button
                onClick={() => {
                  setEditingItem(null);
                  resetDiscountForm();
                  setShowDiscountModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <FaPlus /> Create Discount
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Value</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Min Purchase</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500">Loading...</td>
                    </tr>
                  ) : discounts.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500">No discounts yet. Create one to get started!</td>
                    </tr>
                  ) : (
                    discounts.map((discount) => (
                      <tr key={discount.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{discount.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 capitalize">{discount.type}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value}`}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          ${parseFloat(discount.min_purchase || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            discount.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {discount.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditDiscount(discount)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteDiscount(discount.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Vouchers Section */}
        {activeSection === 'vouchers' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Active Vouchers</h2>
              <button
                onClick={() => {
                  setEditingItem(null);
                  resetVoucherForm();
                  setShowVoucherModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <FaPlus /> Create Voucher
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Code</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Value</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Usage</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500">Loading...</td>
                    </tr>
                  ) : vouchers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500">No vouchers yet. Create one to get started!</td>
                    </tr>
                  ) : (
                    vouchers.map((voucher) => (
                      <tr key={voucher.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono font-bold text-blue-600">{voucher.code}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{voucher.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {voucher.type === 'percentage' ? `${voucher.value}%` : `$${voucher.value}`}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {voucher.used_count || 0} / {voucher.usage_limit || '∞'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            voucher.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {voucher.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditVoucher(voucher)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteVoucher(voucher.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Discount Modal */}
        {showDiscountModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">{editingItem ? 'Edit' : 'Create'} Discount</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Name *</label>
                  <input
                    type="text"
                    value={discountForm.name}
                    onChange={(e) => setDiscountForm({ ...discountForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g., Summer Sale"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    value={discountForm.type}
                    onChange={(e) => setDiscountForm({ ...discountForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Value * {discountForm.type === 'percentage' ? '(%)' : '($)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={discountForm.value}
                    onChange={(e) => setDiscountForm({ ...discountForm, value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder={discountForm.type === 'percentage' ? '10' : '5.00'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Purchase ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={discountForm.min_purchase}
                    onChange={(e) => setDiscountForm({ ...discountForm, min_purchase: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>

                {discountForm.type === 'percentage' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={discountForm.max_discount}
                      onChange={(e) => setDiscountForm({ ...discountForm, max_discount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Optional"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={discountForm.start_date}
                      onChange={(e) => setDiscountForm({ ...discountForm, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={discountForm.end_date}
                      onChange={(e) => setDiscountForm({ ...discountForm, end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={discountForm.is_active}
                    onChange={(e) => setDiscountForm({ ...discountForm, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">Active</label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowDiscountModal(false);
                    setEditingItem(null);
                    resetDiscountForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDiscount}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Voucher Modal */}
        {showVoucherModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">{editingItem ? 'Edit' : 'Create'} Voucher</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Voucher Code *</label>
                  <input
                    type="text"
                    value={voucherForm.code}
                    onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                    placeholder="e.g., SUMMER2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Voucher Name *</label>
                  <input
                    type="text"
                    value={voucherForm.name}
                    onChange={(e) => setVoucherForm({ ...voucherForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g., Summer Promotion"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    value={voucherForm.type}
                    onChange={(e) => setVoucherForm({ ...voucherForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Value * {voucherForm.type === 'percentage' ? '(%)' : '($)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={voucherForm.value}
                    onChange={(e) => setVoucherForm({ ...voucherForm, value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder={voucherForm.type === 'percentage' ? '10' : '5.00'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Purchase ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={voucherForm.min_purchase}
                    onChange={(e) => setVoucherForm({ ...voucherForm, min_purchase: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>

                {voucherForm.type === 'percentage' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={voucherForm.max_discount}
                      onChange={(e) => setVoucherForm({ ...voucherForm, max_discount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Optional"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
                  <input
                    type="number"
                    value={voucherForm.usage_limit}
                    onChange={(e) => setVoucherForm({ ...voucherForm, usage_limit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={voucherForm.start_date}
                      onChange={(e) => setVoucherForm({ ...voucherForm, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={voucherForm.end_date}
                      onChange={(e) => setVoucherForm({ ...voucherForm, end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={voucherForm.is_active}
                    onChange={(e) => setVoucherForm({ ...voucherForm, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">Active</label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowVoucherModal(false);
                    setEditingItem(null);
                    resetVoucherForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveVoucher}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
