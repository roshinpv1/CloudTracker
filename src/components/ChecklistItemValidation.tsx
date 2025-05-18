import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Code, Loader } from 'lucide-react';
import { getChecklistItemValidations, ValidationResult } from '../data/validationApi';
import ValidationRequestForm from './ValidationRequestForm';
import ValidationResults from './ValidationResults';

interface ChecklistItemValidationProps {
  checklistItemId: string;
  checklistItemDescription: string;
}

const ChecklistItemValidation: React.FC<ChecklistItemValidationProps> = ({
  checklistItemId,
  checklistItemDescription
}) => {
  const [validations, setValidations] = useState<ValidationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedValidationId, setSelectedValidationId] = useState<string | null>(null);

  // Fetch validations for this checklist item
  const fetchValidations = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await getChecklistItemValidations(checklistItemId);
      setValidations(results);
    } catch (err) {
      setError('Failed to load validation history');
      console.error('Error fetching validations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load validations on mount
  useEffect(() => {
    fetchValidations();
  }, [checklistItemId]);

  // Handle request form submission
  const handleValidationRequested = (validationId: string) => {
    setShowRequestForm(false);
    setSelectedValidationId(validationId);
    // Refresh validations list
    fetchValidations();
  };

  // Get the most recent validation
  const getLatestValidation = (): ValidationResult | null => {
    if (validations.length === 0) return null;
    
    // Sort by completion timestamp (most recent first)
    const sorted = [...validations].sort((a, b) => {
      if (!a.completion_timestamp) return 1;
      if (!b.completion_timestamp) return -1;
      return new Date(b.completion_timestamp).getTime() - new Date(a.completion_timestamp).getTime();
    });
    
    return sorted[0];
  };

  // Get validation status badge
  const getValidationStatus = () => {
    const latestValidation = getLatestValidation();
    
    if (!latestValidation) {
      return (
        <div className="text-gray-500 text-sm">
          No validations yet
        </div>
      );
    }

    if (latestValidation.status === 'pending' || latestValidation.status === 'in_progress') {
      return (
        <div className="flex items-center text-blue-600 text-sm">
          <Loader size={16} className="mr-1 animate-spin" />
          Validation in progress
        </div>
      );
    }

    if (latestValidation.status === 'failed') {
      return (
        <div className="flex items-center text-red-600 text-sm">
          <AlertTriangle size={16} className="mr-1" />
          Validation failed
        </div>
      );
    }

    if (latestValidation.status === 'completed') {
      if (latestValidation.is_compliant) {
        return (
          <div className="flex items-center text-green-600 text-sm">
            <CheckCircle2 size={16} className="mr-1" />
            Compliant
          </div>
        );
      } else {
        return (
          <div className="flex items-center text-yellow-600 text-sm">
            <AlertTriangle size={16} className="mr-1" />
            Non-compliant
          </div>
        );
      }
    }

    return null;
  };

  // If showing the validation request form
  if (showRequestForm) {
    return (
      <ValidationRequestForm
        checklistItemId={checklistItemId}
        checklistItemDescription={checklistItemDescription}
        onCancel={() => setShowRequestForm(false)}
        onValidationRequested={handleValidationRequested}
      />
    );
  }

  // If showing validation results
  if (selectedValidationId) {
    return (
      <ValidationResults
        validationId={selectedValidationId}
        onClose={() => setSelectedValidationId(null)}
      />
    );
  }

  // Show validation status and options
  return (
    <div className="border border-gray-200 rounded-md p-4 mt-2">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700">Validation Status</h3>
        {getValidationStatus()}
      </div>
      
      {loading ? (
        <div className="mt-3 flex justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setShowRequestForm(true)}
            className="inline-flex items-center px-3 py-1 border border-blue-300 text-xs leading-4 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
          >
            <Code size={14} className="mr-1" />
            Request Validation
          </button>
          
          {validations.length > 0 && (
            <button
              onClick={() => setSelectedValidationId(getLatestValidation()?.id || null)}
              className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              View Latest Results
            </button>
          )}
        </div>
      )}
      
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
      
      {!loading && validations.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-medium text-gray-500 mb-2">Validation History</h4>
          <div className="max-h-40 overflow-y-auto">
            {validations.map((validation) => (
              <div 
                key={validation.id}
                className="text-xs py-1 px-2 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                onClick={() => setSelectedValidationId(validation.id)}
              >
                <div className="flex items-center">
                  {validation.status === 'completed' && validation.is_compliant && (
                    <CheckCircle2 size={12} className="text-green-500 mr-1" />
                  )}
                  {validation.status === 'completed' && !validation.is_compliant && (
                    <AlertTriangle size={12} className="text-yellow-500 mr-1" />
                  )}
                  {(validation.status === 'pending' || validation.status === 'in_progress') && (
                    <Loader size={12} className="text-blue-500 mr-1 animate-spin" />
                  )}
                  {validation.status === 'failed' && (
                    <AlertTriangle size={12} className="text-red-500 mr-1" />
                  )}
                  <span>{validation.summary?.substring(0, 50)}{validation.summary && validation.summary.length > 50 ? '...' : ''}</span>
                </div>
                <div className="text-gray-400">
                  {validation.completion_timestamp 
                    ? new Date(validation.completion_timestamp).toLocaleDateString() 
                    : 'Pending'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChecklistItemValidation; 