import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import InventoryPage from "./pages/InventoryPage";
import Categories from "./pages/Categories";
import Customers from "./pages/Customers";
import Discounts from "./pages/Discounts";
import PaymentMethods from "./pages/PaymentMethods";
import POSConfig from "./pages/POSConfig";

// Report Pages
import RevenueSummary from "./pages/RevenueSummary";
import SaleSummary from "./pages/SaleSummary";
import ProductSale from "./pages/ProductSale";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/discounts" element={<Discounts />} />
        <Route path="/payment-methods" element={<PaymentMethods />} />
        <Route path="/pos-config" element={<POSConfig />} />

        {/* Report Routes */}
        <Route path="/reports/revenue-summary" element={<RevenueSummary />} />
        <Route path="/reports/sale-summary" element={<SaleSummary />} />
        <Route path="/reports/product-sale" element={<ProductSale />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
