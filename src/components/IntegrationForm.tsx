import React, { useState } from 'react';
import { X } from 'lucide-react';
import { IntegrationConfigCreate } from '../data/api';

interface IntegrationFormProps {
  integration?: any;
  onSubmit: (data: IntegrationConfigCreate) => void;
  onCancel: () => void;
  isUpdating?: boolean;
  isEdit?: boolean;
}

const IntegrationForm: React.FC<IntegrationFormProps> = ({ 
  integration,
  onSubmit, 
  onCancel,
  isUpdating = false,
  isEdit = false
}) => {
  const [formData, setFormData] = useState<IntegrationConfigCreate>({
    name: integration?.name || '',
    integration_type: integration?.integration_type || 'github',
    description: integration?.description || '',
    base_url: integration?.base_url || '',
    api_key: '',
    username: '',
    password: '',
    additional_config: integration?.additional_config || '',
    is_active: integration?.is_active !== false
  });

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
                  {isEdit ? 'Edit Integration' : 'Add New Integration'}
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
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Integration Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-sm shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="integration_type" className="block text-sm font-medium text-gray-700">
                    Integration Type *
                  </label>
                  <select
                    name="integration_type"
                    id="integration_type"
                    required
                    value={formData.integration_type}
                    onChange={handleChange}
                    className="mt-1 block w-full bg-white border border-gray-300 rounded-sm shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  >
                    <option value="github">GitHub</option>
                    <option value="jenkins">Jenkins</option>
                    <option value="sonarqube">SonarQube</option>
                    <option value="security">Security Scanner</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-sm shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="base_url" className="block text-sm font-medium text-gray-700">
                    Base URL
                  </label>
                  <input
                    type="url"
                    name="base_url"
                    id="base_url"
                    value={formData.base_url}
                    onChange={handleChange}
                    placeholder="https://api.example.com"
                    className="mt-1 block w-full border border-gray-300 rounded-sm shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>

                {!isEdit && (
                  <>
                    <div>
                      <label htmlFor="api_key" className="block text-sm font-medium text-gray-700">
                        API Key
                      </label>
                      <input
                        type="password"
                        name="api_key"
                        id="api_key"
                        value={formData.api_key}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-sm shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                        Username
                      </label>
                      <input
                        type="text"
                        name="username"
                        id="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-sm shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <input
                        type="password"
                        name="password"
                        id="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-sm shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="additional_config" className="block text-sm font-medium text-gray-700">
                    Additional Configuration
                  </label>
                  <textarea
                    name="additional_config"
                    id="additional_config"
                    rows={3}
                    value={formData.additional_config}
                    onChange={handleChange}
                    placeholder="JSON format configuration (optional)"
                    className="mt-1 block w-full border border-gray-300 rounded-sm shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  />
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
                disabled={isUpdating}
                className={`w-full inline-flex justify-center rounded-sm border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm ${
                  isUpdating ? 'opacity-70 cursor-not-allowed' : ''
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

export default IntegrationForm; 