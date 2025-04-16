import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Layout from "./components/Layout";
import Import from "./pages/Import";
import Reports from "./pages/Reports";
import Products from "./pages/Products";
import Exports from "./pages/Exports";
import Supplier from "./pages/Suppliers";
import Warehouse from "./pages/Warehouse";
import Account from "./pages/Account";
import LogIn from "./pages/LogIn";
import DisplayProducts from "./pages/displayProducts";
import ProtectedRoute from "./components/ProtectedRoute";
import { ImportProvider } from "./contexts/ImportContext";


function App() {
  return (
    <Router>
      <ImportProvider>
        <Routes>

          {/* 👇 Route đăng nhập (không cần bảo vệ) */}
          <Route path="/login" element={<LogIn />} />

          {/* 👇 Các route cần đăng nhập */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                {/* <Layout><Home /></Layout> */}
                <Layout><Home /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Layout><Products /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/import"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Layout><Import /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/exports"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Layout><Exports /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={["admin", "staff"]}>
                <Layout><Reports /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/suppliers"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Layout><Supplier /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/warehouse"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Layout><Warehouse /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Layout><Account /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/displayProducts"
            element={
              <ProtectedRoute allowedRoles={["admin", "staff"]}>
                <Layout><DisplayProducts /></Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </ImportProvider>
    </Router>
  );
}

export default App;
