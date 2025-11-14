import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

export default function DashboardLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [companies, setCompanies] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    // Load saved selections or use defaults from user
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

    // Fetch companies
    axios.get("http://localhost:5000/api/companies")
      .then(res => setCompanies(res.data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    // Fetch locations when company changes
    if (selectedCompany?.id) {
      axios.get(`http://localhost:5000/api/companies/${selectedCompany.id}/locations`)
        .then(res => {
          setLocations(res.data);
          // If no location selected yet, select the first one
          if (!selectedLocation && res.data.length > 0) {
            handleLocationChange(res.data[0]);
          }
        })
        .catch(err => console.error(err));
    }
  }, [selectedCompany?.id]);

  const handleCompanyChange = (company) => {
    setSelectedCompany(company);
    setSelectedLocation(null); // Reset location when company changes
    localStorage.setItem("selectedCompanyId", company.id);
    localStorage.setItem("selectedCompanyName", company.name);
    localStorage.removeItem("selectedLocationId");
    localStorage.removeItem("selectedLocationName");
    setShowCompanyDropdown(false);
  };

  const handleLocationChange = (location) => {
    setSelectedLocation(location);
    localStorage.setItem("selectedLocationId", location.id);
    localStorage.setItem("selectedLocationName", location.name);
    setShowLocationDropdown(false);
  };

  const navItems = [
    { path: "/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", label: "Dashboard" },
    { path: "/inventory", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", label: "Inventory" },
    { path: "/reports", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", label: "Reports" },
    { path: "/transactions", icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z", label: "Transactions" },
    { path: "/customers", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z", label: "Customers" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg fixed h-full z-10">
        <div className="p-4 border-b">
          <h1 className="font-bold text-xl text-gray-800">POS Dashboard</h1>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                location.pathname === item.path
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User Info at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
          <div className="text-sm mb-3">
            <div className="font-semibold text-gray-800">{user?.full_name}</div>
            <div className="text-xs text-gray-500">{user?.role}</div>
          </div>
          <button
            className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition text-sm font-medium"
            onClick={() => { localStorage.clear(); window.location.href = "/"; }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
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
                        <button
                          key={company.id}
                          onClick={() => handleCompanyChange(company)}
                          className={`w-full text-left px-4 py-2 hover:bg-blue-50 transition ${
                            selectedCompany?.id === company.id ? "bg-blue-100 font-semibold" : ""
                          }`}
                        >
                          {company.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Terminal/Location Switcher */}
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
                      {locations.length > 0 ? (
                        locations.map(location => (
                          <button
                            key={location.id}
                            onClick={() => handleLocationChange(location)}
                            className={`w-full text-left px-4 py-2 hover:bg-green-50 transition ${
                              selectedLocation?.id === location.id ? "bg-green-100 font-semibold" : ""
                            }`}
                          >
                            <div>{location.name}</div>
                            {location.city && (
                              <div className="text-xs text-gray-500">{location.city}</div>
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500 text-sm">No terminals available</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <main>
          {children}
        </main>
      </div>
    </div>
  );
}
