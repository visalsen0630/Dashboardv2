import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getUserCompanies, getUserLocations, logoutUser } from "../firebase/db";

export default function DashboardLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [companies, setCompanies] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showReportsDropdown, setShowReportsDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const savedCompanyId = localStorage.getItem("selectedCompanyId") || user?.company_id;
    const savedCompanyName = localStorage.getItem("selectedCompanyName") || user?.company_name;
    const savedLocationId = localStorage.getItem("selectedLocationId");
    const savedLocationName = localStorage.getItem("selectedLocationName");

    if (savedCompanyId && savedCompanyName) {
      setSelectedCompany({ id: savedCompanyId, name: savedCompanyName });
    }
    if (savedLocationId && savedLocationName) {
      setSelectedLocation({ id: savedLocationId, name: savedLocationName });
    }

    if (user?.id) {
      getUserCompanies(user.id)
        .then(res => setCompanies(res))
        .catch(err => console.error(err));
    }
  }, []);

  useEffect(() => {
    if (selectedCompany?.id && user?.id) {
      getUserLocations(user.id, selectedCompany.id)
        .then(res => {
          setLocations(res);
          if (!selectedLocation && res.length > 0) {
            handleLocationChange(res[0]);
          }
        })
        .catch(err => console.error(err));
    }
  }, [selectedCompany?.id]);

  const handleCompanyChange = (company) => {
    setIsLoading(true);
    setShowCompanyDropdown(false);
    const loadingTime = Math.floor(Math.random() * 2000) + 3000;
    setTimeout(() => {
      setSelectedCompany(company);
      setSelectedLocation(null);
      localStorage.setItem("selectedCompanyId", company.id);
      localStorage.setItem("selectedCompanyName", company.name);
      localStorage.removeItem("selectedLocationId");
      localStorage.removeItem("selectedLocationName");
      setIsLoading(false);
    }, loadingTime);
  };

  const handleLocationChange = (loc) => {
    setIsLoading(true);
    setShowLocationDropdown(false);
    const loadingTime = Math.floor(Math.random() * 2000) + 3000;
    setTimeout(() => {
      setSelectedLocation(loc);
      localStorage.setItem("selectedLocationId", loc.id);
      localStorage.setItem("selectedLocationName", loc.name);
      setIsLoading(false);
    }, loadingTime);
  };

  const handleLogout = async () => {
    await logoutUser();
    localStorage.clear();
    window.location.href = "/";
  };

  const [showInventoryDropdown, setShowInventoryDropdown] = useState(false);
  const [showDiscountDropdown, setShowDiscountDropdown] = useState(false);

  const reportItems = [
    { path: "/reports/revenue-summary", label: "Revenue Summary" },
    { path: "/reports/sale-summary", label: "Sale Summary" },
    { path: "/reports/product-sale", label: "Product Sale" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg fixed h-full z-10">
        <div className="p-4 border-b">
          <h1 className="font-bold text-xl text-gray-800">POS Dashboard</h1>
        </div>

        <nav className="p-4 space-y-2">
          <button
            onClick={() => navigate('/dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              location.pathname === '/dashboard' ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="font-medium">Dashboard</span>
          </button>

          {/* Reports */}
          <div className="relative">
            <button
              onClick={() => setShowReportsDropdown(!showReportsDropdown)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                location.pathname.startsWith('/reports') ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="font-medium flex-1 text-left">Report</span>
              <svg className={`w-4 h-4 transition-transform ${showReportsDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showReportsDropdown && (
              <div className="mt-2 ml-4 space-y-1">
                {reportItems.map((report) => (
                  <button
                    key={report.path}
                    onClick={() => { navigate(report.path); setShowReportsDropdown(false); }}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm transition ${
                      location.pathname === report.path ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {report.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Customer */}
          <button
            onClick={() => navigate('/customers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              location.pathname === '/customers' ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="font-medium">Customer</span>
          </button>

          {/* Inventory */}
          <div className="relative">
            <button
              onClick={() => setShowInventoryDropdown(!showInventoryDropdown)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                location.pathname.startsWith('/inventory') ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className="font-medium flex-1 text-left">Inventory</span>
              <svg className={`w-4 h-4 transition-transform ${showInventoryDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showInventoryDropdown && (
              <div className="mt-2 ml-4 space-y-1">
                <button onClick={() => { navigate('/inventory?view=stock'); setShowInventoryDropdown(false); }}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm transition ${location.pathname === '/inventory' && new URLSearchParams(location.search).get('view') === 'stock' ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`}>
                  Stock
                </button>
                <button onClick={() => { navigate('/inventory?view=category'); setShowInventoryDropdown(false); }}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm transition ${location.pathname === '/inventory' && new URLSearchParams(location.search).get('view') === 'category' ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`}>
                  Category
                </button>
              </div>
            )}
          </div>

          {/* Promotion */}
          <div className="relative">
            <button
              onClick={() => setShowDiscountDropdown(!showDiscountDropdown)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                location.pathname.startsWith('/discounts') ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="font-medium flex-1 text-left">Promotion</span>
              <svg className={`w-4 h-4 transition-transform ${showDiscountDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showDiscountDropdown && (
              <div className="mt-2 ml-4 space-y-1">
                {['voucher','fixed','percentage'].map(type => (
                  <button key={type} onClick={() => { navigate(`/discounts?type=${type}`); setShowDiscountDropdown(false); }}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm transition ${location.pathname === '/discounts' && new URLSearchParams(location.search).get('type') === type ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`}>
                    {type === 'voucher' ? 'Voucher & Coupon' : type === 'fixed' ? 'Fixed Discount' : '% Discount'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Configuration */}
          <button
            onClick={() => navigate('/pos-config')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              location.pathname === '/pos-config' ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-medium">Configuration</span>
          </button>
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
          <div className="text-sm mb-3">
            <div className="font-semibold text-gray-800">{user?.full_name}</div>
            <div className="text-xs text-gray-500">{user?.role}</div>
          </div>
          <button
            className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition text-sm font-medium"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Top Bar */}
        <nav className="bg-white shadow px-6 py-4 sticky top-0 z-20">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-gray-500">Company:</span>
                <span className="ml-2 font-semibold text-blue-600">{selectedCompany?.name || "None"}</span>
              </div>
              <div className="h-4 w-px bg-gray-300"></div>
              <div>
                <span className="text-gray-500">Terminal:</span>
                <span className="ml-2 font-semibold text-green-600">{selectedLocation?.name || "None"}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Company Switcher */}
              <div className="relative">
                <button
                  onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                  className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg border border-blue-200 transition"
                >
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <div className="text-left">
                    <div className="text-xs text-gray-500">Company</div>
                    <div className="font-semibold text-sm">{selectedCompany?.name || "Select Company"}</div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showCompanyDropdown && (
                  <div className="absolute top-full mt-2 right-0 bg-white shadow-lg rounded-lg border border-gray-200 min-w-64 z-50">
                    <div className="py-2">
                      {companies.map(company => (
                        <button key={company.id} onClick={() => handleCompanyChange(company)}
                          className={`w-full text-left px-4 py-2 hover:bg-blue-50 transition ${selectedCompany?.id === company.id ? "bg-blue-100 font-semibold" : ""}`}>
                          {company.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Location Switcher */}
              <div className="relative">
                <button
                  onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                  className="flex items-center gap-2 bg-green-50 hover:bg-green-100 px-4 py-2 rounded-lg border border-green-200 transition"
                  disabled={!selectedCompany}
                >
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-xs text-gray-500">Terminal</div>
                    <div className="font-semibold text-sm">{selectedLocation?.name || "Select Terminal"}</div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showLocationDropdown && (
                  <div className="absolute top-full mt-2 right-0 bg-white shadow-lg rounded-lg border border-gray-200 min-w-64 z-50">
                    <div className="py-2 max-h-64 overflow-y-auto">
                      {locations.length > 0 ? locations.map(loc => (
                        <button key={loc.id} onClick={() => handleLocationChange(loc)}
                          className={`w-full text-left px-4 py-2 hover:bg-green-50 transition ${selectedLocation?.id === loc.id ? "bg-green-100 font-semibold" : ""}`}>
                          <div>{loc.name}</div>
                          {loc.city && <div className="text-xs text-gray-500">{loc.city}</div>}
                        </button>
                      )) : (
                        <div className="px-4 py-2 text-gray-500 text-sm">No terminals available</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        <main>{children}</main>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 shadow-2xl flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-lg font-semibold text-gray-800">Loading...</div>
            <div className="text-sm text-gray-500">Switching location, please wait</div>
          </div>
        </div>
      )}
    </div>
  );
}
