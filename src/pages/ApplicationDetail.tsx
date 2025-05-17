import React, { useState, useEffect } from 'react';
import { useParams, Navigate, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Clock3, Circle, PlusCircle, Save, Clipboard, ArrowLeft, Trash2 } from 'lucide-react';
import ApplicationHeader from '../components/ApplicationHeader';
import ChecklistTable from '../components/ChecklistTable';
import { Status, Application, ApplicationStatus } from '../types';
import { useAuth, useAuthorization } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { getApplication, deleteApplication, updateApplication } from '../data/api';

const ApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'application' | 'platform'>('application');
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const { role } = useAuth();
  const canEdit = useAuthorization(['admin', 'reviewer']);
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchApplication = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        console.log('Fetching application with ID:', id);
        const data = await getApplication(id);
        console.log('API response:', data);
        
        // Ensure applicationCategories and platformCategories exist with default empty arrays
        const normalizedData = {
          ...data,
          applicationCategories: data.applicationCategories || data.application_categories || [],
          platformCategories: data.platformCategories || data.platform_categories || []
        };
        
        setApplication(normalizedData);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch application:', err);
        setError('Failed to load application details');
        addNotification('error', 'Failed to load application details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchApplication();
  }, [id, addNotification]);
  
  if (loading) {
    return (
      <div className="pt-20 pb-6 bg-neutral-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error || !application) {
    return (
      <div className="pt-20 pb-6 bg-neutral-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 p-4 rounded-md text-red-700 text-center">
            <p>{error || 'Application not found'}</p>
            <button 
              onClick={() => navigate('/applications')}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
            >
              Back to Applications
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate completion statistics for visualization
  const calculateStats = (categories: typeof application.applicationCategories) => {
    let total = 0;
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;
    let verified = 0;
    
    if (!categories || !Array.isArray(categories)) {
      console.warn('Invalid categories data:', categories);
      return { total: 0, completed: 0, inProgress: 0, notStarted: 0, verified: 0, completionPercentage: 0 };
    }
    
    categories.forEach(category => {
      if (!category.items || !Array.isArray(category.items)) {
        console.warn('Category missing items array:', category);
        return;
      }
      
      category.items.forEach(item => {
        total++;
        if (item.status === 'Completed') completed++;
        else if (item.status === 'In Progress') inProgress++;
        else if (item.status === 'Not Started') notStarted++;
        else if (item.status === 'Verified') verified++;
      });
    });
    
    return {
      total,
      completed,
      inProgress,
      notStarted,
      verified,
      completionPercentage: total > 0 ? Math.round(((completed + verified) / total) * 100) : 0
    };
  };

  // Safely access categories
  const appCategories = application.applicationCategories || [];
  const platformCategories = application.platformCategories || [];

  const appStats = calculateStats(appCategories);
  const platformStats = calculateStats(platformCategories);
  const currentStats = activeTab === 'application' ? appStats : platformStats;
  
  // Status icon mapper
  const getStatusIcon = (status: Status) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'In Progress':
        return <Clock3 className="h-5 w-5 text-secondary" />;
      case 'Not Started':
        return <Circle className="h-5 w-5 text-neutral-400" />;
      case 'Verified':
        return <CheckCircle2 className="h-5 w-5 text-navy" />;
      default:
        return null;
    }
  };
  
  const handleDelete = async () => {
    if (!application) return;
    
    const confirm = window.confirm(`Are you sure you want to delete ${application.name}?`);
    if (!confirm) return;
    
    try {
      await deleteApplication(application.id);
      addNotification('success', `Application "${application.name}" deleted successfully`);
      navigate('/applications');
    } catch (err) {
      console.error('Failed to delete application:', err);
      addNotification('error', 'Failed to delete application');
    }
  };
  
  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    if (!application) return;
    
    try {
      const updated = await updateApplication(application.id, { status: newStatus });
      setApplication(updated);
      addNotification('success', `Application status updated to ${newStatus}`);
    } catch (err) {
      console.error('Failed to update application status:', err);
      addNotification('error', 'Failed to update application status');
    }
  };
  
  return (
    <div className="pt-20 pb-6 bg-neutral-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link to="/applications" className="inline-flex items-center text-sm font-medium text-navy hover:text-primary">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Applications
          </Link>
        </div>
        
        <ApplicationHeader application={application} />

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Sidebar with stats */}
          <div className="lg:col-span-1 space-y-5">
            <div className="bg-white shadow-sm border border-neutral-200 rounded-sm p-5">
              <h3 className="text-lg font-medium text-navy mb-4">Readiness Summary</h3>
              
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-neutral-700">Overall Progress</span>
                  <span className="text-sm font-medium text-navy">{currentStats.completionPercentage}%</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-sm h-2">
                  <div 
                    className="bg-primary h-2 rounded-sm" 
                    style={{ width: `${currentStats.completionPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm text-neutral-600">Completed</span>
                  </div>
                  <span className="text-sm font-medium">{currentStats.completed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-navy mr-2" />
                    <span className="text-sm text-neutral-600">Verified</span>
                  </div>
                  <span className="text-sm font-medium">{currentStats.verified}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock3 className="h-5 w-5 text-secondary mr-2" />
                    <span className="text-sm text-neutral-600">In Progress</span>
                  </div>
                  <span className="text-sm font-medium">{currentStats.inProgress}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Circle className="h-5 w-5 text-neutral-400 mr-2" />
                    <span className="text-sm text-neutral-600">Not Started</span>
                  </div>
                  <span className="text-sm font-medium">{currentStats.notStarted}</span>
                </div>
              </div>
              
              {canEdit && (
                <div className="mt-5 pt-3 border-t border-neutral-200">
                  <button 
                    className="w-full flex items-center justify-center gap-1 px-3 py-2 border border-transparent text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-sm"
                    onClick={() => setShowAddItemModal(true)}
                  >
                    <PlusCircle className="h-4 w-4" />
                    Add New Item
                  </button>
                </div>
              )}
            </div>
            
            <div className="bg-white shadow-sm border border-neutral-200 rounded-sm p-5">
              <h3 className="text-lg font-medium text-navy mb-3">Actions</h3>
              <div className="space-y-2">
                {canEdit && (
                  <button className="w-full flex items-center text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 border border-neutral-200 rounded-sm">
                    <Save className="h-4 w-4 mr-2 text-primary" />
                    <span>Save Progress</span>
                  </button>
                )}
                <button className="w-full flex items-center text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 border border-neutral-200 rounded-sm">
                  <Clipboard className="h-4 w-4 mr-2 text-primary" />
                  <span>Generate Report</span>
                </button>
                {canEdit && (
                  <button className="w-full flex items-center text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 border border-neutral-200 rounded-sm">
                    <AlertCircle className="h-4 w-4 mr-2 text-primary" />
                    <span>Request Validation</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Main content */}
          <div className="lg:col-span-3">
            <div className="bg-white shadow-sm border border-neutral-200 rounded-sm mb-6">
              <div className="border-b border-neutral-200">
                <nav className="flex" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('application')}
                    className={`w-1/2 py-3 px-1 text-center font-medium text-sm ${
                      activeTab === 'application'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-neutral-600 hover:text-navy'
                    }`}
                  >
                    Application Requirements
                  </button>
                  <button
                    onClick={() => setActiveTab('platform')}
                    className={`w-1/2 py-3 px-1 text-center font-medium text-sm ${
                      activeTab === 'platform'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-neutral-600 hover:text-navy'
                    }`}
                  >
                    Platform Requirements
                  </button>
                </nav>
              </div>
            </div>
            
            <div className="space-y-5">
              {activeTab === 'application' ? (
                <>
                  {appCategories.length > 0 ? (
                    appCategories.map(category => (
                      <ChecklistTable key={category.id} category={category} canEdit={canEdit} />
                    ))
                  ) : (
                    <div className="bg-white p-4 text-center text-gray-500">
                      No application categories found.
                    </div>
                  )}
                </>
              ) : (
                <>
                  {platformCategories.length > 0 ? (
                    platformCategories.map(category => (
                      <ChecklistTable key={category.id} category={category} canEdit={canEdit} />
                    ))
                  ) : (
                    <div className="bg-white p-4 text-center text-gray-500">
                      No platform categories found.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-neutral-900 opacity-75" onClick={() => setShowAddItemModal(false)}></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            
            <div 
              className="inline-block align-bottom bg-white rounded-sm text-left overflow-hidden shadow-sm border border-neutral-200 transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-navy" id="modal-title">
                      Add New Checklist Item
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="item-description" className="block text-sm font-medium text-neutral-700">
                          Description
                        </label>
                        <textarea
                          id="item-description"
                          name="item-description"
                          rows={3}
                          className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-neutral-300 rounded-sm p-2 border"
                          placeholder="Enter item description"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="item-category" className="block text-sm font-medium text-neutral-700">
                          Category
                        </label>
                        <select
                          id="item-category"
                          name="item-category"
                          className="mt-1 block w-full py-2 px-3 border border-neutral-300 bg-white rounded-sm shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        >
                          {activeTab === 'application' ? (
                            appCategories.map(category => (
                              <option key={category.id} value={category.id}>{category.name}</option>
                            ))
                          ) : (
                            platformCategories.map(category => (
                              <option key={category.id} value={category.id}>{category.name}</option>
                            ))
                          )}
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="item-status" className="block text-sm font-medium text-neutral-700">
                          Status
                        </label>
                        <select
                          id="item-status"
                          name="item-status"
                          defaultValue="Not Started"
                          className="mt-1 block w-full py-2 px-3 border border-neutral-300 bg-white rounded-sm shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Verified">Verified</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-neutral-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-neutral-200">
                <button 
                  type="button" 
                  className="w-full inline-flex justify-center rounded-sm border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-dark focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowAddItemModal(false)}
                >
                  Add Item
                </button>
                <button 
                  type="button" 
                  className="mt-3 w-full inline-flex justify-center rounded-sm border border-neutral-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowAddItemModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationDetail;