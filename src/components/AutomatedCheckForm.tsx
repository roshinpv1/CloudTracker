import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { AutomatedCheckCreate, getIntegrations, IntegrationConfig } from '../data/api';
import { useNotification } from '../context/NotificationContext';

interface AutomatedCheckFormProps {
  check?: any;
  checklistItemId?: string;
  onSubmit: (data: AutomatedCheckCreate) => void;
  onCancel: () => void;
  isUpdating?: boolean;
  isEdit?: boolean;
}

const AutomatedCheckForm: React.FC<AutomatedCheckFormProps> = ({ 
  check,
  checklistItemId,
  onSubmit, 
  onCancel,
  isUpdating = false,
  isEdit = false
}) => {
  const [formData, setFormData] = useState<AutomatedCheckCreate>({
    checklist_item_id: check?.checklist_item_id || checklistItemId || '',
    integration_config_id: check?.integration_config_id || '',
    check_type: check?.check_type || 'code_quality',
    check_query: check?.check_query || '',
    success_criteria: check?.success_criteria || '',
    is_active: check?.is_active !== false
  });

  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { addNotification } = useNotification();

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const data = await getIntegrations();
        setIntegrations(data);
      } catch (error) {
        console.error('Error fetching integrations:', error);
        addNotification('error', 'Failed to load integrations');
      } finally {
        setLoading(false);
      }
    };

    fetchIntegrations();
  }, [addNotification]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const getIntegrationTypesByValue = (type: string) => {
    switch (type) {
      case 'code_quality':
        return ['sonarqube', 'custom'];
      case 'test_coverage':
        return ['jenkins', 'sonarqube', 'custom'];
      case 'security':
        return ['security', 'github', 'custom'];
      case 'compliance':
        return ['github', 'jenkins', 'custom'];
      default:
        return ['github', 'jenkins', 'sonarqube', 'security', 'custom'];
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Filter integrations based on check type
  const filteredIntegrations = integrations.filter(
    integration => getIntegrationTypesByValue(formData.check_type).includes(integration.integration_type)
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex justify-between items-start">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {isEdit ? 'Edit Automated Check' : 'Add New Automated Check'}
                </h3>
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {!checklistItemId && (
                  <div>
                    <label htmlFor="checklist_item_id" className="block text-sm font-medium text-gray-700">
                      Checklist Item ID *
                    </label>
                    <input
                      type="text"
                      name="checklist_item_id"
                      id="checklist_item_id"
                      required
                      value={formData.checklist_item_id}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-sm shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Enter the ID of the checklist item this check will verify
                    </p>
                  </div>
                )}

                <div>
                  <label htmlFor="check_type" className="block text-sm font-medium text-gray-700">
                    Check Type *
                  </label>
                  <select
                    name="check_type"
                    id="check_type"
                    required
                    value={formData.check_type}
                    onChange={handleChange}
                    className="mt-1 block w-full bg-white border border-gray-300 rounded-sm shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  >
                    <option value="code_quality">Code Quality</option>
                    <option value="test_coverage">Test Coverage</option>
                    <option value="security">Security Check</option>
                    <option value="compliance">Compliance</option>
                    <option value="custom">Custom Check</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="integration_config_id" className="block text-sm font-medium text-gray-700">
                    Integration *
                  </label>
                  {filteredIntegrations.length > 0 ? (
                    <select
                      name="integration_config_id"
                      id="integration_config_id"
                      required
                      value={formData.integration_config_id}
                      onChange={handleChange}
                      className="mt-1 block w-full bg-white border border-gray-300 rounded-sm shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    >
                      <option value="">Select an integration</option>
                      {filteredIntegrations.map(integration => (
                        <option key={integration.id} value={integration.id}>
                          {integration.name} ({integration.integration_type})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="mt-1 p-2 bg-yellow-50 text-yellow-700 border border-yellow-300 rounded-sm text-sm">
                      No compatible integrations found. Please add an integration first.
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="check_query" className="block text-sm font-medium text-gray-700">
                    Check Query
                  </label>
                  <textarea
                    name="check_query"
                    id="check_query"
                    rows={3}
                    value={formData.check_query}
                    onChange={handleChange}
                    placeholder="E.g. Coverage metrics or path to resource to check"
                    className="mt-1 block w-full border border-gray-300 rounded-sm shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Specify what to check in the external system (query, path, etc.)
                  </p>
                </div>

                <div>
                  <label htmlFor="success_criteria" className="block text-sm font-medium text-gray-700">
                    Success Criteria
                  </label>
                  <input
                    type="text"
                    name="success_criteria"
                    id="success_criteria"
                    value={formData.success_criteria}
                    onChange={handleChange}
                    placeholder="E.g. minimum threshold, no_errors, pass"
                    className="mt-1 block w-full border border-gray-300 rounded-sm shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Criteria for determining if the check passes
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                    Active
                  </label>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isUpdating || filteredIntegrations.length === 0}
                className={`w-full inline-flex justify-center rounded-sm border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm ${
                  (isUpdating || filteredIntegrations.length === 0) ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isUpdating ? 'Saving...' : isEdit ? 'Update' : 'Add'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="mt-3 w-full inline-flex justify-center rounded-sm border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AutomatedCheckForm; 