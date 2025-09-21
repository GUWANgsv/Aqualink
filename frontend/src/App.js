import React from 'react';
import './App.css';
import { Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './Context/AuthContext';
import { CartProvider } from './Context/CartContext';
import ProtectedRoute from './Components/Auth/ProtectedRoute';
import Login from './Components/Auth/Login';
import Register from './Components/Auth/Register';
import CustomerRegister from './Components/Auth/CustomerRegister';
import FireBrigadeRegister from './Components/Auth/FireBrigadeRegister';

// Import components
import HomePage from './Components/Home/HomePage';
import InitialHomePage from './Components/Home/InitialHomePage';
import MyAccount from './Components/Customer/MyAccount';
import FactoryDashboard from './Components/FactoryManager/FactoryDashboard';
import Inventory from './Components/Inventory/Inventory';
import Orders from './Components/Orders/Orders';
import Reports from './Components/Reports/Reports';
import Settings from './Components/Settings/Settings';
import Recycling from './Components/Recycling/Recycling';
import BranchManager from './Components/BranchManager/BranchManager';

// Customer-facing components
import Products from './Components/Products/Products';
import ProductDetails from './Components/Products/ProductDetails';
import Cart from './Components/Cart/Cart';
import Checkout from './Components/Checkout/Checkout';
import Payment from './Components/Payment/Payment';
import PaymentGateway from './Components/Payment/PaymentGateway';
import Services from './Components/Services/Services';
import Branches from './Components/Branches/Branches';
import About from './Components/About/About';
import Contact from './Components/Contact/Contact';
import Profile from './Components/Profile/Profile';

// Admin components
import AdminDashboard from './Components/Admin/AdminDashboard';
import AddEmployee from './Components/Admin/AddEmployee';
import EditEmployee from './Components/Admin/EditEmployee';
import AddBranch from './Components/Admin/AddBranch';

// Dashboard components
import DriverDashboard from './Components/Driver/DriverDashboard';
import FireBrigadeDashboard from './Components/FireBrigade/FireBrigadeDashboard';
import EmergencySystem from './Components/Emergency/EmergencySystem';

// Role-based redirect component
const RoleBasedRedirect = () => {
  const { user } = useAuth();
  
  if (user?.role === 'Factory Manager') {
    return <Navigate to="/factory-manager" replace />;
  } else if (user?.role === 'Branch Manager') {
    return <Navigate to="/branch-manager" replace />;
  } else if (user?.role === 'Admin') {
    return <Navigate to="/admin-dashboard" replace />;
  } else if (user?.role === 'Customer') {
    return <Navigate to="/customer-dashboard" replace />;
  } else if (user?.role === 'Driver') {
    return <Navigate to="/driver-dashboard" replace />;
  } else if (user?.role === 'Fire Brigade') {
    return <Navigate to="/fire-brigade-dashboard" replace />;
  } else {
    return <Navigate to="/home" replace />;
  }
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <div>
          <React.Fragment>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<InitialHomePage />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/my-account" element={
                <ProtectedRoute requiredRole="Customer">
                  <MyAccount />
                </ProtectedRoute>
              } />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/register/customer" element={<CustomerRegister />} />
              <Route path="/register/fire-brigade" element={<FireBrigadeRegister />} />
              
              {/* Test routes */}
              {/* <Route path="/test/login" element={<LoginTest /> /> */}
              {/* <Route path="/test/emergency" element={<EmergencyRequestTest /> /> */}
              {/* <Route path="/test/emergency-display" element={<EmergencyDisplayTest /> /> */}
              
              {/* Customer-facing routes */}
              <Route path="/products" element={<Products />} />
              <Route path="/products/:category" element={<Products />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/payment-gateway" element={<PaymentGateway />} />
              <Route path="/services" element={<Services />} />
              <Route path="/branches" element={<Branches />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              
              {/* Protected routes */}
              <Route path="/profile" element={
                <ProtectedRoute requiredRole={['Customer', 'Factory Manager', 'Branch Manager', 'Driver', 'Admin', 'Fire Brigade']}>
                  <Profile />
                </ProtectedRoute>
              } />
              
              
              {/* Protected Home route with full functionality */}
              <Route path="/authenticated-home" element={
                <ProtectedRoute requiredRole={['Customer', 'Factory Manager', 'Branch Manager', 'Driver', 'Admin', 'Fire Brigade']}>
                  <HomePage />
                </ProtectedRoute>
              } />
              
              {/* Protected Fire Brigade routes */}
              <Route path="/fire-brigade-dashboard" element={
                <ProtectedRoute requiredRole="Fire Brigade">
                  <FireBrigadeDashboard />
                </ProtectedRoute>
              } />
              
              {/* Protected Admin routes */}
              <Route path="/admin-dashboard" element={
                <ProtectedRoute requiredRole="Admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/add-employee" element={
                <ProtectedRoute requiredRole="Admin">
                  <AddEmployee />
                </ProtectedRoute>
              } />
              <Route path="/admin/edit-employee/:id" element={
                <ProtectedRoute requiredRole="Admin">
                  <EditEmployee />
                </ProtectedRoute>
              } />
              <Route path="/admin/add-branch" element={
                <ProtectedRoute requiredRole="Admin">
                  <AddBranch />
                </ProtectedRoute>
              } />
              
              {/* Protected Driver routes */}
              <Route path="/driver-dashboard" element={
                <ProtectedRoute requiredRole="Driver">
                  <DriverDashboard />
                </ProtectedRoute>
              } />
              
              {/* Protected Factory Manager routes */}
              <Route path="/factory-manager" element={
                <ProtectedRoute requiredRole="Factory Manager">
                  <FactoryDashboard />
                </ProtectedRoute>
              } />
              <Route path="/factory-manager/dashboard" element={
                <ProtectedRoute requiredRole="Factory Manager">
                  <FactoryDashboard />
                </ProtectedRoute>
              } />
              <Route path="/inventory" element={
                <ProtectedRoute requiredRole="Factory Manager">
                  <Inventory />
                </ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute requiredRole="Factory Manager">
                  <Orders />
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute requiredRole="Factory Manager">
                  <Reports />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute requiredRole="Factory Manager">
                  <Settings />
                </ProtectedRoute>
              } />
              
              {/* Protected Branch Manager routes */}
              <Route path="/branch-manager/*" element={
                <ProtectedRoute requiredRole="Branch Manager">
                  <BranchManager />
                </ProtectedRoute>
              } />
              <Route path="/branch-manager/dashboard" element={
                <ProtectedRoute requiredRole="Branch Manager">
                  <BranchManager />
                </ProtectedRoute>
              } />
              <Route path="/recycling" element={
                <ProtectedRoute requiredRole="Branch Manager">
                  <Recycling />
                </ProtectedRoute>
              } />
              
              {/* Emergency System */}
              <Route path="/emergency" element={<EmergencySystem />} />
              
              {/* Role-based redirects for authenticated users */}
              <Route path="/dashboard" element={
                <ProtectedRoute requiredRole={['Customer', 'Factory Manager', 'Branch Manager', 'Driver', 'Admin', 'Fire Brigade']}>
                  <RoleBasedRedirect />
                </ProtectedRoute>
              } />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </React.Fragment>
        </div>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;