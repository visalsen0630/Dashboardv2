import { useState, useEffect } from "react";
import { getPaymentMethods, updatePaymentMethod } from "../firebase/db";
import DashboardLayout from "../components/DashboardLayout";

export default function PaymentMethods() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});

  const user = JSON.parse(localStorage.getItem("user"));
  const companyId = localStorage.getItem("selectedCompanyId") || user?.company_id;
  const locationId = localStorage.getItem("selectedLocationId");

  useEffect(() => {
    fetchPaymentMethods();
  }, [companyId, locationId]);

  const fetchPaymentMethods = async () => {
    setLoading(true);
    try {
      const response = await getPaymentMethods(companyId, locationId);
      setMethods(response);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (method) => {
    setEditingId(method.id);
    setFormData({
      display_name: method.display_name,
      is_enabled: method.is_enabled,
      sort_order: method.sort_order
    });
  };

  const handleSave = async (id) => {
    try {
      await updatePaymentMethod(id, formData);
      await fetchPaymentMethods();
      setEditingId(null);
    } catch (err) {
      alert("Failed to update payment method");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Payment Methods</h1>
          <p className="text-gray-600 mt-1">Configure payment methods for your POS system</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Display Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sort Order</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {methods.map(method => (
                  <tr key={method.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{method.method_name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === method.id ? (
                        <input
                          value={formData.display_name}
                          onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{method.display_name}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === method.id ? (
                        <select
                          value={formData.is_enabled}
                          onChange={(e) => setFormData({...formData, is_enabled: e.target.value === 'true'})}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="true">Enabled</option>
                          <option value="false">Disabled</option>
                        </select>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          method.is_enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {method.is_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === method.id ? (
                        <input
                          type="number"
                          value={formData.sort_order}
                          onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value)})}
                          className="w-20 px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{method.sort_order}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingId === method.id ? (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleSave(method.id)}
                            className="text-green-600 hover:text-green-900 font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-gray-600 hover:text-gray-900 font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(method)}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
