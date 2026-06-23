import { lazy, Suspense, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import MarketingLayout from './marketing/components/MarketingLayout.jsx';
import { PageLoader } from './components/ui/Spinner.jsx';
import SplashScreen from './components/brand/SplashScreen.jsx';

// Public marketing site
const Landing = lazy(() => import('./marketing/pages/Landing.jsx'));
const Features = lazy(() => import('./marketing/pages/Features.jsx'));
const PricingPage = lazy(() => import('./marketing/pages/Pricing.jsx'));
const Contact = lazy(() => import('./marketing/pages/Contact.jsx'));

// Auth
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));

// Dashboard application
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Clients = lazy(() => import('./pages/Clients.jsx'));
const ClientDetails = lazy(() => import('./pages/ClientDetails.jsx'));
const Products = lazy(() => import('./pages/Products.jsx'));
const ProductDetails = lazy(() => import('./pages/ProductDetails.jsx'));
const Inventory = lazy(() => import('./pages/Inventory.jsx'));
const Invoices = lazy(() => import('./pages/Invoices.jsx'));
const InvoiceForm = lazy(() => import('./pages/InvoiceForm.jsx'));
const InvoiceDetails = lazy(() => import('./pages/InvoiceDetails.jsx'));
const Quotes = lazy(() => import('./pages/Quotes.jsx'));
const QuoteForm = lazy(() => import('./pages/QuoteForm.jsx'));
const QuoteDetails = lazy(() => import('./pages/QuoteDetails.jsx'));
const Payments = lazy(() => import('./pages/Payments.jsx'));
const Expenses = lazy(() => import('./pages/Expenses.jsx'));
const Reports = lazy(() => import('./pages/Reports.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const Portal = lazy(() => import('./pages/Portal.jsx'));

export default function App() {
  // Show the animated splash once per browser session on startup.
  const [showSplash, setShowSplash] = useState(
    () => !sessionStorage.getItem('sip-splash-shown'),
  );

  const dismissSplash = () => {
    sessionStorage.setItem('sip-splash-shown', '1');
    setShowSplash(false);
  };

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen key="splash" onDone={dismissSplash} />}
      </AnimatePresence>

      <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public marketing site */}
        <Route element={<MarketingLayout />}>
          <Route index element={<Landing />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        {/* Auth + public portal */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/portal/:token" element={<Portal />} />

        {/* Dashboard application (authenticated) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/:id" element={<ClientDetails />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/new" element={<InvoiceForm />} />
            <Route path="/invoices/:id" element={<InvoiceDetails />} />
            <Route path="/invoices/:id/edit" element={<InvoiceForm />} />
            <Route path="/quotes" element={<Quotes />} />
            <Route path="/quotes/new" element={<QuoteForm />} />
            <Route path="/quotes/:id" element={<QuoteDetails />} />
            <Route path="/quotes/:id/edit" element={<QuoteForm />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
      </ErrorBoundary>
    </>
  );
}
