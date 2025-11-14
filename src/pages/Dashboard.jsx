import { useEffect, useState } from "react";
import axios from "axios";
import DashboardLayout from "../components/DashboardLayout";

export default function Dashboard() {
  const [stats, setStats] = useState({});

  useEffect(() => {
    // Fetch stats
    axios.get("http://localhost:5000/api/dashboard/stats")
      .then(res => setStats(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-white shadow p-6 rounded-xl">
            <h2 className="font-semibold text-gray-500 mb-2">Total Sales</h2>
            <p className="text-3xl font-bold text-gray-800">${stats.total_sales || 0}</p>
          </div>
          <div className="bg-white shadow p-6 rounded-xl">
            <h2 className="font-semibold text-gray-500 mb-2">Total Products</h2>
            <p className="text-3xl font-bold text-gray-800">{stats.total_products || 0}</p>
          </div>
          <div className="bg-white shadow p-6 rounded-xl">
            <h2 className="font-semibold text-gray-500 mb-2">Active Locations</h2>
            <p className="text-3xl font-bold text-gray-800">{stats.active_locations || 0}</p>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Welcome to POS Dashboard</h2>
          <p className="text-gray-600">
            Use the sidebar on the left to navigate to different sections. You can manage inventory, view reports, track transactions, and manage customers all from this dashboard.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
