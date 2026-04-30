import { useState, useEffect } from "react";
import { getCategories, createCategory, updateCategory, deleteCategory, getUserLocations } from "../firebase/db";
import DashboardLayout from "../components/DashboardLayout";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedLocationFilter, setSelectedLocationFilter] = useState("all");
  const user = JSON.parse(localStorage.getItem("user"));
  const selectedCompanyId = localStorage.getItem("selectedCompanyId") || user?.company_id;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location_id: "",
  });

  useEffect(() => {
    if (selectedCompanyId) {
      fetchLocations();
      fetchCategories();
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchCategories();
    }
  }, [selectedLocationFilter]);

  const fetchLocations = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const res = await getUserLocations(user.id, selectedCompanyId);
      setLocations(res);
    } catch (err) {
      console.error("Error fetching locations:", err);
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const locationId = selectedLocationFilter !== "all" ? selectedLocationFilter : null;
      const res = await getCategories(selectedCompanyId, locationId);
      setCategories(res);
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const categoryData = {
        ...formData,
        company_id: selectedCompanyId,
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryData);
      } else {
        await createCategory(categoryData);
      }

      fetchCategories();
      resetForm();
      setShowModal(false);
    } catch (err) {
      console.error("Error saving category:", err);
      const errorMessage = err.response?.data?.error || err.message || "Failed to save category";
      alert("Failed to save category: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      location_id: category.location_id || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    setLoading(true);
    try {
      await deleteCategory(id);
      fetchCategories();
    } catch (err) {
      console.error("Error deleting category:", err);
      alert("Failed to delete category");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", location_id: "" });
    setEditingCategory(null);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold">Categories</h1>
              <p className="text-gray-600 text-sm">Manage product categories</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Category
            </button>
          </div>

          {/* Location Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Filter by Location:</label>
            <select
              value={selectedLocationFilter}
              onChange={(e) => setSelectedLocationFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">All Locations</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading && categories.length === 0 ? (
            <div className="col-span-3 text-center py-8 text-gray-500">Loading...</div>
          ) : categories.length === 0 ? (
            <div className="col-span-3 text-center py-8 text-gray-500">
              No categories yet. Create your first category!
            </div>
          ) : (
            categories.map((category) => {
              const categoryLocation = locations.find(loc => loc.id === category.location_id);
              return (
                <div key={category.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{category.name}</h3>
                    {category.location_id ? (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {categoryLocation?.name || 'Location'}
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                        All Locations
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{category.description || "No description"}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">
                  {editingCategory ? "Edit Category" : "Add New Category"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g., Electronics, Food, Clothing"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Optional description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location (Optional)
                    </label>
                    <select
                      value={formData.location_id}
                      onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">All Locations</option>
                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Leave blank to make this category available to all locations
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                    >
                      {loading ? "Saving..." : editingCategory ? "Update" : "Create"}
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
