import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ApplicationDetail from './pages/ApplicationDetail';
import ApplicationsPage from './pages/ApplicationsPage';
import ReportsPage from './pages/ReportsPage';
import Automation from './pages/Automation';
import IntegrationForm from './pages/IntegrationForm';
import AutomatedCheckForm from './pages/AutomatedCheckForm';
import LoginPage from './pages/LoginPage';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ToastNotification from './components/ToastNotification';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <div className="min-h-screen bg-gray-100">
            <ToastNotification />
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Protected routes for all authenticated users */}
              <Route element={<PrivateRoute />}>
                <Route
                  path="/"
                  element={
                    <>
                      <Navbar />
                      <div className="pt-16 pb-12">
                        <Dashboard />
                      </div>
                    </>
                  }
                />
                <Route
                  path="/applications"
                  element={
                    <>
                      <Navbar />
                      <div className="pt-16 pb-12">
                        <ApplicationsPage />
                      </div>
                    </>
                  }
                />
                <Route
                  path="/application/:id"
                  element={
                    <>
                      <Navbar />
                      <div className="pt-16 pb-12">
                        <ApplicationDetail />
                      </div>
                    </>
                  }
                />
                <Route
                  path="/automations"
                  element={
                    <>
                      <Navbar />
                      <div className="pt-16 pb-12">
                        <Automation />
                      </div>
                    </>
                  }
                />
                <Route
                  path="/integrations/new"
                  element={
                    <>
                      <Navbar />
                      <div className="pt-16 pb-12">
                        <IntegrationForm />
                      </div>
                    </>
                  }
                />
                <Route
                  path="/integrations/edit/:id"
                  element={
                    <>
                      <Navbar />
                      <div className="pt-16 pb-12">
                        <IntegrationForm />
                      </div>
                    </>
                  }
                />
                <Route
                  path="/checks/new"
                  element={
                    <>
                      <Navbar />
                      <div className="pt-16 pb-12">
                        <AutomatedCheckForm />
                      </div>
                    </>
                  }
                />
                <Route
                  path="/checks/new/:itemId"
                  element={
                    <>
                      <Navbar />
                      <div className="pt-16 pb-12">
                        <AutomatedCheckForm />
                      </div>
                    </>
                  }
                />
                <Route
                  path="/checks/edit/:id"
                  element={
                    <>
                      <Navbar />
                      <div className="pt-16 pb-12">
                        <AutomatedCheckForm />
                      </div>
                    </>
                  }
                />
              </Route>
              
              {/* Protected routes for reviewers and admins only */}
              <Route element={<PrivateRoute requiredRoles={['admin', 'reviewer']} />}>
                <Route
                  path="/reports"
                  element={
                    <>
                      <Navbar />
                      <div className="pt-16 pb-12">
                        <ReportsPage />
                      </div>
                    </>
                  }
                />
              </Route>
            </Routes>
          </div>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;