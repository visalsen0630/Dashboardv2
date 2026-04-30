import { useState, useEffect } from "react";
import { getProducts, createProduct, updateProduct, deleteProduct, getCategories, createCategory, uploadProductImage } from "../firebase/db";
import DashboardLayout from "../components/DashboardLayout";
import { FaPlus, FaEdit, FaTrash, FaImage, FaEllipsisV, FaSearch } from 'react-icons/fa';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const selectedCompanyId = localStorage.getItem("selectedCompanyId") || user?.company_id;
  const selectedLocationId = localStorage.getItem("selectedLocationId");
  const selectedLocationName = localStorage.getItem("selectedLocationName");

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    barcode: "",
    price: "",
    cost: "",
    stock: "",
    category_id: "",
    backorder_allowed: false,
    track_stock: true,
    image_url: "",
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: ""
  });

  useEffect(() => {
    if (selectedLocationId) {
      fetchProducts();
    }
  }, [selectedLocationId]);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchCategories();
    }
  }, [selectedCompanyId]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await getProducts(selectedLocationId, selectedCompanyId);
      setProducts(res);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await getCategories(selectedCompanyId, selectedLocationId);
      setCategories(res);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        ...formData,
        company_id: selectedCompanyId,
        location_id: selectedLocationId,
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost),
        stock: parseInt(formData.stock) || 0,
        track_stock: formData.track_stock !== false,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
      } else {
        await createProduct(productData);
      }

      fetchProducts();
      resetForm();
      setShowModal(false);
    } catch (err) {
      console.error("Error saving product:", err);
      alert(err.response?.data?.error || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createCategory({
        ...categoryForm,
        company_id: selectedCompanyId,
        location_id: selectedLocationId,
      });
      fetchCategories();
      setCategoryForm({ name: "", description: "" });
      setShowCategoryModal(false);
    } catch (err) {
      console.error("Error creating category:", err);
      alert("Failed to create category");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku || "",
      barcode: product.barcode || "",
      price: product.price,
      cost: product.cost,
      stock: product.stock || 0,
      category_id: product.category_id || "",
      backorder_allowed: product.backorder_allowed || false,
      track_stock: product.track_stock !== false,
      image_url: product.image_url || "",
    });
    setShowModal(true);
  };

  const handleToggleTrackStock = async (product) => {
    const newValue = product.track_stock === false ? true : false;
    try {
      await updateProduct(product.id, { track_stock: newValue });
      setProducts(products.map(p => p.id === product.id ? { ...p, track_stock: newValue } : p));
    } catch (err) {
      console.error('Error updating track_stock:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    setLoading(true);
    try {
      await deleteProduct(id);
      fetchProducts();
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("Failed to delete product");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      barcode: "",
      price: "",
      cost: "",
      stock: "",
      category_id: "",
      backorder_allowed: false,
      track_stock: true,
      image_url: "",
    });
    setEditingProduct(null);
  };

  const handleImageUpload = async (file) => {
    setUploadingImage(true);
    try {
      const imageUrl = await uploadProductImage(file);
      setFormData(prev => ({ ...prev, image_url: imageUrl }));
      alert('Image uploaded successfully!');
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (!selectedLocationId) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            Please select a terminal/location first to manage inventory.
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Inventory Management</h1>
              <p className="text-sm text-gray-600">Location: {selectedLocationName}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCategoryModal(true)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
              >
                <FaPlus /> New Category
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <FaPlus /> New Product
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex">
          {/* Left Sidebar - Categories */}
          <div className="w-64 bg-white border-r p-4 h-[calc(100vh-280px)] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">CATEGORIES</h3>
              <button className="text-gray-600 hover:text-gray-900">
                <FaEllipsisV />
              </button>
            </div>

            <button
              onClick={() => setShowCategoryModal(true)}
              className="w-full px-3 py-2 border border-dashed border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition text-sm flex items-center justify-center gap-2 mb-4"
            >
              <FaPlus /> NEW CATEGORY
            </button>

            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left px-3 py-2 rounded-lg transition ${
                  !selectedCategory
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                All Products ({products.length})
              </button>
              {categories.map((category) => {
                const count = products.filter(p => p.category_id === category.id).length;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition relative ${
                      selectedCategory === category.id
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {category.name} ({count})
                    {count === 0 && (
                      <span className="absolute right-2 top-2 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Content - Products Grid */}
          <div className="flex-1 p-6">
            {/* Search and Filter Bar */}
            <div className="mb-6 flex items-center gap-4">
              <div className="flex-1 max-w-md relative">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by product name, item code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option>Sort by: Name</option>
                <option>Sort by: Price</option>
                <option>Sort by: Stock</option>
              </select>
            </div>

            {/* Products Grid */}
            {loading && products.length === 0 ? (
              <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {searchQuery ? "No products found matching your search" : "No products in this category"}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition group"
                  >
                    {/* Product Image */}
                    <div className="relative bg-gray-100 h-40 flex items-center justify-center overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
                          }}
                        />
                      ) : null}
                      {!product.image_url && (
                        <FaImage className="text-gray-300 text-4xl" />
                      )}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg"
                        >
                          <FaEdit size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-lg"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-2 truncate">{product.name}</h4>
                      {product.sku && (
                        <p className="text-xs text-gray-500 mb-2">SKU: {product.sku}</p>
                      )}

                      {/* Stock Status */}
                      <div className="mb-3">
                        {product.track_stock === false ? (
                          <div className="w-full px-3 py-1.5 border border-gray-200 bg-gray-50 text-gray-400 rounded-lg text-sm font-medium text-center">
                            — Not tracked
                          </div>
                        ) : (
                          <select
                            value={product.stock > 0 ? 'in_stock' : 'out_of_stock'}
                            className={`w-full px-3 py-1.5 border rounded-lg text-sm font-medium ${
                              product.stock > 0
                                ? 'border-green-300 bg-green-50 text-green-700'
                                : 'border-red-300 bg-red-50 text-red-700'
                            }`}
                          >
                            <option value="in_stock">✓ In stock</option>
                            <option value="out_of_stock">✗ Out of stock</option>
                            <option value="low_stock">⚠ Low stock</option>
                          </select>
                        )}
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500">Price</p>
                          <p className="text-lg font-bold text-gray-900">
                            ${parseFloat(product.price).toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Stock</p>
                          {product.track_stock === false ? (
                            <p className="text-lg font-bold text-gray-400">—</p>
                          ) : (
                            <p className={`text-lg font-bold ${
                              product.stock > 10 ? 'text-green-600' :
                              product.stock > 0 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {product.stock}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Track Stock Toggle */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <span className="text-xs text-gray-500">Track Qty</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTrackStock(product);
                          }}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                            product.track_stock !== false ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            product.track_stock !== false ? 'translate-x-5' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>

                      {product.backorder_allowed && (
                        <div className="mt-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded text-center">
                          Backorder Allowed
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Product Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">Select category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SKU / Item Code
                      </label>
                      <input
                        type="text"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Barcode
                      </label>
                      <input
                        type="text"
                        value={formData.barcode}
                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Product Image Upload */}
                  <div className="col-span-2 border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Upload from Computer</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0])}
                          disabled={uploadingImage}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {uploadingImage && (
                          <p className="text-xs text-blue-600 mt-1">Uploading...</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Or Enter Image URL</label>
                        <input
                          type="url"
                          value={formData.image_url}
                          onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                          placeholder="https://example.com/image.jpg"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                        />
                      </div>
                    </div>

                    {formData.image_url && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-600 mb-2">Preview:</p>
                        <img
                          src={formData.image_url}
                          alt="Product preview"
                          className="w-32 h-32 object-cover rounded border border-gray-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price * ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cost ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stock Quantity
                      </label>
                      <input
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="track_stock"
                      checked={formData.track_stock !== false}
                      onChange={(e) => setFormData({ ...formData, track_stock: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="track_stock" className="text-sm text-gray-700">
                      Track stock quantity (deduct from stock on sale)
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="backorder"
                      checked={formData.backorder_allowed}
                      onChange={(e) => setFormData({ ...formData, backorder_allowed: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="backorder" className="text-sm text-gray-700">
                      Allow backorder (sell when out of stock)
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
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
                      {loading ? "Saving..." : editingProduct ? "Update Product" : "Add Product"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Category Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Create New Category</h2>
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g., Electronics, Clothing, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (optional)
                    </label>
                    <textarea
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Category description..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCategoryModal(false);
                        setCategoryForm({ name: "", description: "" });
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
                      {loading ? "Creating..." : "Create Category"}
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
