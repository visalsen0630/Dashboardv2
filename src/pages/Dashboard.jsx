import { useEffect, useState } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getUserLocations, getSalesDashboard } from "../firebase/db";
import DashboardLayout from "../components/DashboardLayout";
import { FaShoppingCart, FaMoneyBillWave, FaChartLine, FaUsers, FaInfoCircle, FaPercentage, FaTag, FaBoxes, FaChartBar } from 'react-icons/fa';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [timePeriod, setTimePeriod] = useState('today');
  const [customDateRange, setCustomDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [data, setData] = useState({
    overview: {},
    sales_by_stores: [],
    top_items: [],
    top_categories: [],
    sales_by_payment: [],
    sales_by_channels: []
  });
  const [loading, setLoading] = useState(true);
  const [userLocations, setUserLocations] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));
  const selectedCompanyId = localStorage.getItem("selectedCompanyId") || user?.company_id;
  const selectedLocationId = localStorage.getItem("selectedLocationId");

  // Fetch user's accessible locations
  useEffect(() => {
    const fetchUserLocations = async () => {
      if (user?.id && selectedCompanyId) {
        try {
          const locations = await getUserLocations(user.id, selectedCompanyId);
          setUserLocations(locations);
        } catch (err) {
          console.error("Error fetching user locations:", err);
        }
      }
    };

    fetchUserLocations();
  }, [selectedCompanyId, user?.id]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        if (selectedCompanyId) {
          let period = 'month';
          if (timePeriod === 'today') period = 'day';
          else if (timePeriod === 'yesterday') period = 'yesterday';
          else if (timePeriod === '7d') period = 'week';
          else if (timePeriod === '30d') period = 'month';
          else if (timePeriod === '90d') period = '90days';
          else if (timePeriod === 'all') period = 'all';
          else if (timePeriod === 'custom') period = 'custom';

          const analytics = await getSalesDashboard(
            selectedCompanyId,
            period,
            timePeriod === 'custom' ? customDateRange : null
          );
          setData(analytics);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedCompanyId, selectedLocationId, timePeriod, customDateRange]);

  const { overview } = data;

  // Top 5 Items data
  const topItems = data.top_items?.slice(0, 5) || [];

  // Hourly data - use real data from API or fallback to empty array
  const hourlyData = data.hourly_trends || Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    orders: 0,
    revenue: 0
  }));

  // Payment methods pie chart data
  const COLORS = ['#10b981', '#3b82f6', '#ec4899', '#f97316', '#8b5cf6'];
  const paymentData = data.sales_by_payment?.map((p, idx) => ({
    name: p.method.charAt(0).toUpperCase() + p.method.slice(1),
    value: parseFloat(p.total_amount),
    count: parseInt(p.transaction_count),
    color: COLORS[idx % COLORS.length]
  })) || [];

  // Order types data
  const orderTypes = data.sales_by_channels?.map(c => ({
    type: c.channel === 'dine_in' ? 'At store' :
          c.channel === 'takeout' ? 'Take away' :
          c.channel === 'delivery' ? 'Delivery' :
          c.channel === 'pickup' ? 'Self pickup' : c.channel,
    count: parseInt(c.transaction_count),
    color: c.channel === 'dine_in' ? '#92400e' :
           c.channel === 'takeout' ? '#fb923c' :
           c.channel === 'delivery' ? '#10b981' :
           '#3b82f6'
  })) || [];

  // Shipping partners data - mock
  const shippingPartners = data.sales_by_stores?.slice(0, 4).map(store => ({
    name: store.store_name?.replace(/Store \d+ - /, '') || 'Partner',
    orders: parseInt(store.transaction_count) || 0
  })) || [];
  const maxOrders = Math.max(...shippingPartners.map(p => p.orders), 1);

  const totalOrders = parseInt(overview?.total_receipts || 0);
  const totalRevenue = parseFloat(overview?.net_sales || 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalCustomers = Math.floor(totalOrders * 0.65); // Mock estimate

  // Additional retail metrics
  const totalTax = parseFloat(overview?.total_tax || 0);
  const totalDiscounts = parseFloat(overview?.total_discounts || 0);
  const grossSales = parseFloat(overview?.gross_sales || totalRevenue + totalDiscounts);
  const itemsSold = parseInt(overview?.total_items_sold || totalOrders * 2.3); // Mock estimate
  const grossProfit = parseFloat(overview?.gross_profit || totalRevenue * 0.4); // Mock estimate

  const maxOrderTypes = Math.max(...orderTypes.map(o => o.count), 1);

  return (
    <DashboardLayout>
      <div className="bg-gray-50 min-h-screen">
        {/* Time Period Filters */}
        <div className="bg-white border-b">
          <div className="px-6 py-3">
            <div className="flex gap-6 items-center">
              {[
                { label: 'All time', value: 'all' },
                { label: 'Today', value: 'today' },
                { label: 'Yesterday', value: 'yesterday' },
                { label: '7d', value: '7d' },
                { label: '30d', value: '30d' },
                { label: '90d', value: '90d' },
                { label: 'Custom', value: 'custom' }
              ].map(period => (
                <button
                  key={period.value}
                  onClick={() => setTimePeriod(period.value)}
                  className={`px-2 py-1 text-sm font-medium transition relative ${
                    timePeriod === period.value
                      ? 'text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {period.label}
                  {timePeriod === period.value && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>

            {/* Custom Date Range Picker */}
            {timePeriod === 'custom' && (
              <div className="flex items-center gap-3 mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <label className="text-sm font-medium text-gray-700">Start Date:</label>
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
                <span className="text-gray-500">-</span>
                <label className="text-sm font-medium text-gray-700">End Date:</label>
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
                <div className="flex items-center gap-2 ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                  ⏰ Times shown in GMT+7 (Asia/Phnom Penh)
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {/* Sales Overview Section */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Sales Overview</h2>
            <div className="grid grid-cols-4 gap-4">
              {/* Total Items Sold */}
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-100 shadow-sm">
                <div className="text-sm text-blue-600 font-medium mb-2">Total Items Sold</div>
                <div className="text-4xl font-bold text-gray-900">{itemsSold.toLocaleString()}</div>
              </div>

              {/* Gross Sales */}
              <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-100 shadow-sm">
                <div className="text-sm text-yellow-700 font-medium mb-2">Gross Sales</div>
                <div className="text-4xl font-bold text-gray-900">
                  ${grossSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Total Discounts */}
              <div className="bg-red-50 rounded-lg p-6 border border-red-100 shadow-sm">
                <div className="text-sm text-red-600 font-medium mb-2">Total Discounts</div>
                <div className="text-4xl font-bold text-gray-900">
                  ${totalDiscounts.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Net Sales */}
              <div className="bg-green-50 rounded-lg p-6 border border-green-100 shadow-sm">
                <div className="text-sm text-green-600 font-medium mb-2">Net Sales</div>
                <div className="text-4xl font-bold text-gray-900">
                  ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Sales By Day */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Sales by Day</h3>
            <div className="overflow-x-auto">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.daily_sales || hourlyData}>
                  <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="orders" name="Orders" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sales By Store/Terminal */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Sales By Store</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Store</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Gross Sale</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Discount</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Net Sale</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sales_by_stores && data.sales_by_stores.length > 0 ? (
                    data.sales_by_stores
                      .map((store, idx) => {
                        const storeGrossSales = parseFloat(store.gross_sales || parseFloat(store.total_amount) + parseFloat(store.total_discount || 0));
                        const storeDiscount = parseFloat(store.total_discount || 0);
                        const storeNetSales = parseFloat(store.total_amount || 0);

                        return (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition">
                            <td className="py-3 px-4">
                              <div className="font-medium text-gray-900">{store.store_name || store.location_name}</div>
                              <div className="text-xs text-gray-500">Ticket: {store.transaction_count} | Items: {parseInt(store.items_sold || store.transaction_count * 2.3)} | Avg: ${(storeNetSales / parseInt(store.transaction_count || 1)).toFixed(2)}</div>
                            </td>
                            <td className="text-right py-3 px-4 font-semibold text-gray-900">
                              ${storeGrossSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="text-right py-3 px-4 font-semibold text-gray-900">
                              ${storeDiscount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="text-right py-3 px-4 font-semibold text-gray-900">
                              ${storeNetSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-gray-500">
                        No store data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sales Analysis */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Sales Analysis</h3>
            <div className="flex gap-2 mb-4">
              <button className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50">Sales Trend</button>
              <button className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50">Sales Comparison</button>
              <button className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50">Sales Pattern</button>
            </div>
            <div className="h-64 flex items-center justify-center border border-dashed border-gray-300 rounded">
              <div className="text-gray-400 text-center">
                <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p>Sales trend analysis will appear here</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Status & Cancellation Reason */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Status & Cancellation reason</h3>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="text-sm text-gray-600 mb-3">Order status</div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-green-700 font-medium">Success</span>
                      <span className="text-green-900 font-bold">{totalOrders}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <span className="text-red-700 font-medium">Canceled</span>
                      <span className="text-red-900 font-bold">0</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="text-blue-700 font-medium">Processing</span>
                      <span className="text-blue-900 font-bold">0</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-3">Cancel reason</div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-4">
                        <div className="text-sm mb-1">Out of stock</div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-2 bg-red-500 rounded-full" style={{ width: '0%' }}></div>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-700 w-12 text-right">0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-4">
                        <div className="text-sm mb-1 flex items-center gap-2">
                          Other <a href="#" className="text-blue-500 text-xs hover:underline">See details</a>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-2 bg-orange-500 rounded-full" style={{ width: '0%' }}></div>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-700 w-12 text-right">0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-4">
                        <div className="text-sm mb-1">This is no driver</div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-2 bg-yellow-500 rounded-full" style={{ width: '0%' }}></div>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-700 w-12 text-right">0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-4">
                        <div className="text-sm mb-1">Customer requested</div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-2 bg-pink-500 rounded-full" style={{ width: '0%' }}></div>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-700 w-12 text-right">0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hourly Order Trends */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Hourly order trends</h3>
                <a href="#" className="text-blue-500 text-sm hover:underline flex items-center gap-1">
                  See all <span>→</span>
                </a>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={hourlyData}>
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Top 5 Items */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Top 5 Items</h3>

              {topItems.length > 0 ? (
                <div className="space-y-4">
                  {topItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{item.product_name}</div>
                        <div className="text-sm text-gray-500">
                          {parseInt(item.units_sold)} units sold
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">
                          ${parseFloat(item.revenue).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">Revenue</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No sales data available
                </div>
              )}
            </div>

            {/* Payment Methods & Order Types */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Payment methods & Order types</h3>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-600 mb-3 font-medium">Payment</div>
                  {paymentData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={150}>
                        <PieChart>
                          <Pie
                            data={paymentData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            dataKey="value"
                            strokeWidth={2}
                            stroke="#fff"
                          >
                            {paymentData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2 mt-4">
                        {paymentData.map((p, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: p.color }}></div>
                            <span className="text-gray-700">{p.name} ({p.count})</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-gray-400 py-8 text-sm">No payment data</div>
                  )}
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-3 font-medium">Order types</div>
                  <div className="space-y-3">
                    {orderTypes.length > 0 ? orderTypes.map((type, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm flex items-center gap-1 text-gray-700">
                            {type.type} <FaInfoCircle className="text-gray-400 text-xs" />
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              backgroundColor: type.color,
                              width: `${(type.count / maxOrderTypes) * 80}px`,
                              minWidth: '8px'
                            }}
                          ></div>
                          <span className="font-semibold text-gray-700 w-8 text-right text-sm">{type.count}</span>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center text-gray-400 py-8 text-sm">No order type data</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
