import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Edit, PlayCircle, RefreshCw, Server, CheckCircle, XCircle, AlertCircle, Shield } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useAuthorization } from '../context/AuthContext';
import { 
  getIntegrations, 
  getAutomatedChecks, 
  deleteIntegration,
  IntegrationConfig, 
  AutomatedCheck,
  runAutomatedCheck
} from '../data/api';

const Automation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'integrations' | 'checks'>('integrations');
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [automatedChecks, setAutomatedChecks] = useState<AutomatedCheck[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [runningCheckId, setRunningCheckId] = useState<string | null>(null);
  const { addNotification } = useNotification();
  const canEdit = useAuthorization(['admin', 'reviewer']);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [integrationsData, checksData] = await Promise.all([
          getIntegrations(),
          getAutomatedChecks()
        ]);
        
        setIntegrations(integrationsData);
        setAutomatedChecks(checksData);
      } catch (error) {
        console.error('Error fetching automation data:', error);
        addNotification('error', 'Failed to load automation data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [addNotification]);

  const handleDeleteIntegration = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this integration?')) return;
    
    try {
      await deleteIntegration(id);
      setIntegrations(integrations.filter(integration => integration.id !== id));
      addNotification('success', 'Integration deleted successfully');
    } catch (error) {
      console.error('Error deleting integration:', error);
      addNotification('error', 'Failed to delete integration');
    }
  };

  const handleRunCheck = async (checkId: string) => {
    setRunningCheckId(checkId);
    
    try {
      const result = await runAutomatedCheck(checkId);
      
      if (result.status === 'success') {
        addNotification('success', 'Check ran successfully');
      } else if (result.status === 'failure') {
        addNotification('warning', 'Check ran but did not pass');
      } else {
        addNotification('error', 'Error running check');
      }
      
      // Refresh the checks list
      const updatedChecks = await getAutomatedChecks();
      setAutomatedChecks(updatedChecks);
    } catch (error) {
      console.error('Error running check:', error);
      addNotification('error', 'Failed to run check');
    } finally {
      setRunningCheckId(null);
    }
  };

  const getIntegrationTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'github':
        return <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
        </svg>;
      case 'jenkins':
      case 'ci':
        return <RefreshCw className="h-5 w-5" />;
      case 'sonarqube':
      case 'quality':
        return <CheckCircle className="h-5 w-5" />;
      case 'security':
        return <Shield className="h-5 w-5" />;
      default:
        return <Server className="h-5 w-5" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failure':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="pt-20 pb-6 bg-neutral-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-6 bg-neutral-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Automated Verification</h1>
          {canEdit && (
            <div className="flex gap-3">
              {activeTab === 'integrations' && (
                <Link 
                  to="/integrations/new" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Integration
                </Link>
              )}
              {activeTab === 'checks' && (
                <Link 
                  to="/checks/new" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Automated Check
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="bg-white shadow border border-gray-200 rounded-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('integrations')}
                className={`w-1/2 py-3 px-1 text-center font-medium text-sm ${
                  activeTab === 'integrations'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-neutral-600 hover:text-navy'
                }`}
              >
                Integrations
              </button>
              <button
                onClick={() => setActiveTab('checks')}
                className={`w-1/2 py-3 px-1 text-center font-medium text-sm ${
                  activeTab === 'checks'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-neutral-600 hover:text-navy'
                }`}
              >
                Automated Checks
              </button>
            </nav>
          </div>

          {activeTab === 'integrations' ? (
            <div className="p-4">
              {integrations.length === 0 ? (
                <div className="text-center py-6 px-4">
                  <Server className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900">No integrations configured</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by adding your first integration.
                  </p>
                  {canEdit && (
                    <div className="mt-6">
                      <Link 
                        to="/integrations/new" 
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Integration
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        {canEdit && (
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {integrations.map((integration) => (
                        <tr key={integration.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{integration.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="flex-shrink-0 h-6 w-6 text-gray-500">
                                {getIntegrationTypeIcon(integration.integration_type)}
                              </span>
                              <span className="ml-2 text-sm text-gray-500">{integration.integration_type}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500 max-w-md truncate">
                              {integration.description || 'No description'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              integration.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {integration.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          {canEdit && (
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex space-x-2 justify-end">
                                <Link 
                                  to={`/integrations/edit/${integration.id}`} 
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  <Edit size={18} />
                                </Link>
                                <button
                                  onClick={() => handleDeleteIntegration(integration.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4">
              {automatedChecks.length === 0 ? (
                <div className="text-center py-6 px-4">
                  <PlayCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900">No automated checks configured</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Set up automated checks to verify your checklist items.
                  </p>
                  {canEdit && (
                    <div className="mt-6">
                      <Link 
                        to="/checks/new" 
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Automated Check
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Checklist Item
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Integration
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Check Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Success Criteria
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {automatedChecks.map((check) => (
                        <tr key={check.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {/* In a real app, you'd fetch the checklist item details */}
                              {check.checklist_item_id}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {/* In a real app, you'd fetch the integration details */}
                              {check.integration_config_id}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{check.check_type}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{check.success_criteria || 'Default'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex space-x-2 justify-end">
                              <button
                                onClick={() => handleRunCheck(check.id)}
                                disabled={runningCheckId === check.id}
                                className="text-green-600 hover:text-green-900 disabled:opacity-50"
                              >
                                {runningCheckId === check.id ? (
                                  <RefreshCw className="h-5 w-5 animate-spin" />
                                ) : (
                                  <PlayCircle size={18} />
                                )}
                              </button>
                              {canEdit && (
                                <>
                                  <Link 
                                    to={`/checks/edit/${check.id}`} 
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    <Edit size={18} />
                                  </Link>
                                  <button
                                    onClick={() => {/* Delete check function */}}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Automation; 