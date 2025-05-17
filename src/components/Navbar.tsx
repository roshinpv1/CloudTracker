import React, { useState } from 'react';
import { BarChart, Menu, X, User, Bell, PlusCircle, LogOut, Zap } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ApplicationForm from './ApplicationForm';
import { useAuth, useAuthorization } from '../context/AuthContext';
import { createApplication } from '../data/api';
import { useNotification } from '../context/NotificationContext';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const { addNotification } = useNotification();
  const canAccessReports = useAuthorization(['admin', 'reviewer']);

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      setIsSubmitting(true);
      // Call the createApplication API function
      const newApplication = await createApplication(formData);
      console.log('Application created:', newApplication);
      
      // Close the modal after submission
      setShowAddModal(false);
      
      // Show success notification
      addNotification('success', `Application "${formData.name}" created successfully with default requirement items set to "Not Started"`);
      
      // Navigate to the newly created application page
      navigate(`/application/${newApplication.id}`);
    } catch (error) {
      console.error('Failed to create application:', error);
      addNotification('error', 'Failed to create application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <nav className="bg-white border-b border-neutral-200 fixed w-full z-30">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link to="/" className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-primary rounded-sm flex items-center justify-center">
                    <span className="text-white font-bold text-lg">CT</span>
                  </div>
                  <span className="text-lg font-semibold text-navy">CloudTracker</span>
                </Link>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-6">
                  <Link
                    to="/"
                    className={`px-2 py-1 text-sm font-medium ${
                      isActivePath('/') 
                        ? 'text-primary border-b-2 border-primary' 
                        : 'text-neutral-600 hover:text-primary'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/applications"
                    className={`px-2 py-1 text-sm font-medium ${
                      isActivePath('/applications') 
                        ? 'text-primary border-b-2 border-primary' 
                        : 'text-neutral-600 hover:text-primary'
                    }`}
                  >
                    Applications
                  </Link>
                  <Link
                    to="/automations"
                    className={`px-2 py-1 text-sm font-medium ${
                      isActivePath('/automations') 
                        ? 'text-primary border-b-2 border-primary' 
                        : 'text-neutral-600 hover:text-primary'
                    } flex items-center gap-1.5`}
                  >
                    <Zap size={16} />
                    <span>Automations</span>
                  </Link>
                  {canAccessReports && (
                    <Link
                      to="/reports"
                      className={`px-2 py-1 text-sm font-medium ${
                        isActivePath('/reports') 
                          ? 'text-primary border-b-2 border-primary' 
                          : 'text-neutral-600 hover:text-primary'
                      } flex items-center gap-1.5`}
                    >
                      <BarChart size={16} />
                      <span>Reports</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-4 flex items-center gap-2 md:ml-6">
                <button className="text-neutral-600 p-2 rounded-full hover:bg-neutral-100">
                  <Bell size={18} />
                </button>
                <div className="text-neutral-600 p-2 rounded-full hover:bg-neutral-100 flex items-center">
                  <User size={18} className="mr-2" />
                  <span className="text-sm font-medium">{user?.username || 'User'}</span>
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    {role || 'user'}
                  </span>
                </div>
                <button 
                  className="bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-sm text-sm font-medium transition-colors flex items-center gap-1"
                  onClick={() => setShowAddModal(true)}
                >
                  <PlusCircle size={14} />
                  <span>Add</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="text-neutral-600 p-2 rounded-full hover:bg-neutral-100 ml-2"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
            <div className="-mr-2 flex md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-neutral-600 hover:text-primary hover:bg-neutral-100 focus:outline-none"
              >
                <span className="sr-only">Open main menu</span>
                {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden border-t border-neutral-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                to="/"
                className={`block px-3 py-2 text-base font-medium ${
                  isActivePath('/') 
                    ? 'text-primary border-l-2 border-primary bg-neutral-50' 
                    : 'text-neutral-600 hover:text-primary hover:bg-neutral-50'
                }`}
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/applications"
                className={`block px-3 py-2 text-base font-medium ${
                  isActivePath('/applications') 
                    ? 'text-primary border-l-2 border-primary bg-neutral-50' 
                    : 'text-neutral-600 hover:text-primary hover:bg-neutral-50'
                }`}
                onClick={() => setIsOpen(false)}
              >
                Applications
              </Link>
              <Link
                to="/automations"
                className={`block px-3 py-2 text-base font-medium ${
                  isActivePath('/automations') 
                    ? 'text-primary border-l-2 border-primary bg-neutral-50' 
                    : 'text-neutral-600 hover:text-primary hover:bg-neutral-50'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <div className="flex items-center gap-1.5">
                  <Zap size={16} />
                  <span>Automations</span>
                </div>
              </Link>
              {canAccessReports && (
                <Link
                  to="/reports"
                  className={`block px-3 py-2 text-base font-medium ${
                    isActivePath('/reports') 
                      ? 'text-primary border-l-2 border-primary bg-neutral-50' 
                      : 'text-neutral-600 hover:text-primary hover:bg-neutral-50'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex items-center gap-1.5">
                    <BarChart size={16} />
                    <span>Reports</span>
                  </div>
                </Link>
              )}
            </div>
            <div className="pt-4 pb-3 border-t border-neutral-200 bg-neutral-50">
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  <div className="h-9 w-9 rounded-full bg-navy flex items-center justify-center">
                    <User size={18} className="text-white" />
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-neutral-800">{user?.username || 'User'}</div>
                  <div className="text-sm font-medium text-neutral-500">{user?.email || ''}</div>
                  <div className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full mt-1 inline-block">
                    {role || 'user'}
                  </div>
                </div>
                <button className="ml-auto text-neutral-500 hover:text-neutral-700">
                  <Bell size={18} />
                </button>
              </div>
              <div className="mt-3 px-2 pb-2 flex flex-col gap-2">
                <button 
                  className="w-full bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-sm text-sm font-medium transition-colors flex items-center justify-center gap-1"
                  onClick={() => {
                    setIsOpen(false);
                    setShowAddModal(true);
                  }}
                >
                  <PlusCircle size={14} />
                  <span>Add Application</span>
                </button>
                <button 
                  className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-700 px-3 py-1.5 rounded-sm text-sm font-medium transition-colors flex items-center justify-center gap-1"
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Use the new ApplicationForm component */}
      {showAddModal && (
        <ApplicationForm 
          onSubmit={handleFormSubmit}
          onCancel={() => setShowAddModal(false)}
          isUpdating={isSubmitting}
        />
      )}
    </>
  );
};

export default Navbar;