import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { ValidationResult, getValidationResult } from '../data/validationApi';

interface ValidationResultsProps {
  validationId: string;
  onClose: () => void;
}

const ValidationResults: React.FC<ValidationResultsProps> = ({ validationId, onClose }) => {
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<number>(2000); // Start with 2 second polling

  // Load validation result
  useEffect(() => {
    let isMounted = true;
    let pollTimer: ReturnType<typeof setTimeout>;

    const fetchResult = async () => {
      try {
        const data = await getValidationResult(validationId);
        
        if (isMounted) {
          setResult(data);
          setLoading(false);
          
          // If validation is still in progress, continue polling
          if (data.status === 'pending' || data.status === 'in_progress') {
            // Increase polling interval for longer-running validations
            setPollInterval(prev => Math.min(prev * 1.5, 10000)); // Cap at 10 seconds
            pollTimer = setTimeout(fetchResult, pollInterval);
          } else {
            // Stop polling for completed or failed validations
            setPollInterval(0);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load validation result');
          setLoading(false);
        }
      }
    };

    fetchResult();

    // Cleanup
    return () => {
      isMounted = false;
      clearTimeout(pollTimer);
    };
  }, [validationId, pollInterval]);

  // Get status badge based on validation status
  const getStatusBadge = () => {
    if (!result) return null;

    switch (result.status) {
      case 'completed':
        return result.is_compliant ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle size={14} className="mr-1" />
            Compliant
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle size={14} className="mr-1" />
            Non-Compliant
          </span>
        );
      case 'pending':
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock size={14} className="mr-1" />
            {result.status === 'pending' ? 'Pending' : 'In Progress'}
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle size={14} className="mr-1" />
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  // Get severity badge for findings
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
            Critical
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
            Error
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
            Warning
          </span>
        );
      case 'info':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
            Info
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Validation Results</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          <p className="ml-3 text-gray-600">Loading validation results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Validation Results</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-white shadow rounded-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Validation Results</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <p className="text-gray-600">No validation results available</p>
        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Validation Results</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <h3 className="font-medium text-gray-900">Status:</h3>
            <div className="ml-2">{getStatusBadge()}</div>
          </div>
          {result.completion_timestamp && (
            <p className="text-sm text-gray-500">
              Completed: {new Date(result.completion_timestamp).toLocaleString()}
            </p>
          )}
        </div>

        {/* If validation is still in progress, show a progress indicator */}
        {(result.status === 'pending' || result.status === 'in_progress') && (
          <div className="my-6 text-center">
            <div className="inline-flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
              <p>Validation in progress...</p>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              This may take a minute or two to complete.
            </p>
          </div>
        )}

        {/* Summary for completed validations */}
        {result.status === 'completed' && (
          <>
            <div className={`p-4 rounded-md mb-4 ${
              result.is_compliant ? 'bg-green-50' : 'bg-yellow-50'
            }`}>
              <h3 className="font-medium text-gray-900 mb-2">Summary:</h3>
              <p className="text-gray-700">{result.summary}</p>
            </div>

            {/* Evidence link if available */}
            {result.evidence_url && (
              <div className="mb-4">
                <h3 className="font-medium text-gray-900 mb-2">Evidence:</h3>
                <a 
                  href={result.evidence_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  View code repository
                </a>
              </div>
            )}

            {/* Findings section */}
            {result.findings && result.findings.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-3">Findings:</h3>
                <div className="space-y-4">
                  {result.findings.map((finding) => (
                    <div 
                      key={finding.id} 
                      className="border border-gray-200 rounded-md p-4"
                    >
                      <div className="flex justify-between mb-2">
                        <div className="font-medium">{finding.description}</div>
                        <div>{getSeverityBadge(finding.severity)}</div>
                      </div>
                      
                      {finding.code_location && (
                        <div className="bg-gray-50 p-2 rounded my-2 font-mono text-sm">
                          Location: {finding.code_location}
                        </div>
                      )}
                      
                      {finding.recommendation && (
                        <div className="text-sm text-gray-700 mt-2">
                          <span className="font-medium">Recommendation:</span> {finding.recommendation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Error message for failed validations */}
        {result.status === 'failed' && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {result.summary || 'Validation failed. Please try again later.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ValidationResults; 