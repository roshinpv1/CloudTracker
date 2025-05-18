import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ValidationRequest, requestValidation } from '../data/validationApi';
import { useNotification } from '../context/NotificationContext';

interface ValidationRequestFormProps {
  checklistItemId: string;
  checklistItemDescription: string;
  onCancel: () => void;
  onValidationRequested: (validationId: string) => void;
  isUpdating?: boolean;
}

const ValidationRequestForm: React.FC<ValidationRequestFormProps> = ({
  checklistItemId,
  checklistItemDescription,
  onCancel,
  onValidationRequested,
  isUpdating = false
}) => {
  const { addNotification } = useNotification();
  const [formData, setFormData] = useState<ValidationRequest>({
    checklist_item_id: checklistItemId,
    validation_type: 'ai_assisted',
    evidence_context: '',
    code_snippets: [''],
    repository_url: '',
    commit_id: ''
  });

  // State to track form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle code snippet changes
  const handleSnippetChange = (index: number, value: string) => {
    const newSnippets = [...(formData.code_snippets || [''])];
    newSnippets[index] = value;
    setFormData(prev => ({
      ...prev,
      code_snippets: newSnippets
    }));
  };

  // Add a new code snippet field
  const addCodeSnippet = () => {
    setFormData(prev => ({
      ...prev,
      code_snippets: [...(prev.code_snippets || []), '']
    }));
  };

  // Remove a code snippet field
  const removeCodeSnippet = (index: number) => {
    const newSnippets = [...(formData.code_snippets || [''])];
    newSnippets.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      code_snippets: newSnippets.length > 0 ? newSnippets : ['']
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // At least evidence context or code snippets should be provided
    if (!formData.evidence_context && (!formData.code_snippets || formData.code_snippets.every(s => !s.trim()))) {
      newErrors.evidence_context = 'Please provide either evidence context or code snippets';
    }

    // If repo URL is provided, commit ID should also be provided
    if (formData.repository_url && !formData.commit_id) {
      newErrors.commit_id = 'Please provide a commit ID when repository URL is specified';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Filter out empty code snippets
    const filteredData = {
      ...formData,
      code_snippets: formData.code_snippets?.filter(s => s.trim()) || []
    };

    try {
      const response = await requestValidation(filteredData);
      addNotification('success', 'Validation request submitted successfully');
      onValidationRequested(response.validation_id);
    } catch (error) {
      console.error('Error submitting validation request:', error);
      addNotification('error', 'Failed to submit validation request');
    }
  };

  return (
    <div className="bg-white shadow rounded-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Request Validation</h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      <div className="mb-4 p-3 bg-gray-50 rounded">
        <h3 className="font-medium text-gray-700 mb-2">Checklist Item:</h3>
        <p className="text-gray-600">{checklistItemDescription}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="validation_type" className="block text-sm font-medium text-gray-700 mb-1">
            Validation Type
          </label>
          <select
            id="validation_type"
            name="validation_type"
            value={formData.validation_type}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ai_assisted">AI-Assisted Validation</option>
            <option value="manual">Manual Validation</option>
            <option value="automated">Automated Validation</option>
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="evidence_context" className="block text-sm font-medium text-gray-700 mb-1">
            Evidence Context
          </label>
          <textarea
            id="evidence_context"
            name="evidence_context"
            value={formData.evidence_context}
            onChange={handleChange}
            rows={3}
            className={`w-full p-2 border ${
              errors.evidence_context ? 'border-red-500' : 'border-gray-300'
            } rounded-md focus:ring-blue-500 focus:border-blue-500`}
            placeholder="Provide context about how this requirement is implemented"
          />
          {errors.evidence_context && (
            <p className="mt-1 text-sm text-red-600">{errors.evidence_context}</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Code Snippets
          </label>
          {formData.code_snippets?.map((snippet, index) => (
            <div key={index} className="mb-2 flex">
              <textarea
                value={snippet}
                onChange={(e) => handleSnippetChange(index, e.target.value)}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="Paste relevant code snippet here"
              />
              {formData.code_snippets!.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCodeSnippet(index)}
                  className="ml-2 inline-flex items-center text-red-600 hover:text-red-800"
                  aria-label="Remove code snippet"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addCodeSnippet}
            className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            + Add another code snippet
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="repository_url" className="block text-sm font-medium text-gray-700 mb-1">
              Repository URL
            </label>
            <input
              type="text"
              id="repository_url"
              name="repository_url"
              value={formData.repository_url}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://github.com/org/repo"
            />
          </div>
          <div>
            <label htmlFor="commit_id" className="block text-sm font-medium text-gray-700 mb-1">
              Commit ID
            </label>
            <input
              type="text"
              id="commit_id"
              name="commit_id"
              value={formData.commit_id}
              onChange={handleChange}
              className={`w-full p-2 border ${
                errors.commit_id ? 'border-red-500' : 'border-gray-300'
              } rounded-md focus:ring-blue-500 focus:border-blue-500`}
              placeholder="e.g., a1b2c3d4e5"
            />
            {errors.commit_id && (
              <p className="mt-1 text-sm text-red-600">{errors.commit_id}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={isUpdating}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 flex items-center ${
              isUpdating ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <><span className="mr-2">Processing...</span><span className="animate-spin">⟳</span></>
            ) : (
              'Request Validation'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ValidationRequestForm; 