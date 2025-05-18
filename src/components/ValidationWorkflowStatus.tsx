import React, { useState, useEffect } from 'react';
import { getValidationWorkflow } from '../data/validationApi';
import { AlertCircle, CheckCircle, Clock, Loader2, CheckSquare, XCircle, HelpCircle } from 'lucide-react';

interface ValidationWorkflowStatusProps {
  workflowId: string;
}

const ValidationWorkflowStatus: React.FC<ValidationWorkflowStatusProps> = ({ workflowId }) => {
  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<number>(3000); // 3 second initial polling

  useEffect(() => {
    let isMounted = true;
    let pollTimer: ReturnType<typeof setTimeout>;

    const fetchWorkflowStatus = async () => {
      try {
        const data = await getValidationWorkflow(workflowId);
        
        if (isMounted) {
          setWorkflow(data);
          setLoading(false);
          
          // If validation is still in progress, continue polling
          if (data.status === 'pending' || data.status === 'in_progress') {
            // Increase polling interval for longer-running validations
            setPollingInterval(prev => Math.min(prev * 1.2, 10000)); // Cap at 10 seconds
            pollTimer = setTimeout(fetchWorkflowStatus, pollingInterval);
          } else {
            // Stop polling for completed or failed validations
            setPollingInterval(0);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load validation workflow status');
          setLoading(false);
        }
      }
    };

    fetchWorkflowStatus();

    // Cleanup
    return () => {
      isMounted = false;
      clearTimeout(pollTimer);
    };
  }, [workflowId, pollingInterval]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle size={14} className="mr-1" />
            Completed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock size={14} className="mr-1" />
            Pending
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Loader2 size={14} className="mr-1 animate-spin" />
            In Progress
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
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <HelpCircle size={14} className="mr-1" />
            Unknown
          </span>
        );
    }
  };

  const getStepStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
            <CheckSquare size={12} className="mr-1" />
            Completed
          </span>
        );
      case 'queued':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
            <Clock size={12} className="mr-1" />
            Queued
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
            <Loader2 size={12} className="mr-1 animate-spin" />
            Running
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
            <XCircle size={12} className="mr-1" />
            Failed
          </span>
        );
      case 'skipped':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle size={12} className="mr-1" />
            Skipped
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
            <HelpCircle size={12} className="mr-1" />
            Unknown
          </span>
        );
    }
  };

  const formatStepType = (stepType: string) => {
    // Convert snake_case to Title Case
    return stepType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-md p-6">
        <div className="flex justify-center items-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="ml-3 text-gray-600">Loading validation status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-md p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="bg-white shadow rounded-md p-6">
        <p className="text-gray-600">No validation workflow data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-md p-6">
      <div className="mb-4 border-b pb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium text-gray-900">Validation Status</h3>
          {getStatusBadge(workflow.status)}
        </div>
        
        {workflow.summary && (
          <p className="text-sm text-gray-600 mt-2">{workflow.summary}</p>
        )}
        
        {workflow.repository_url && (
          <div className="mt-2 text-sm">
            <span className="text-gray-500">Repository: </span>
            <a 
              href={workflow.repository_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              {workflow.repository_url}
              {workflow.commit_id ? ` (${workflow.commit_id.substring(0, 7)})` : ''}
            </a>
          </div>
        )}
        
        <div className="mt-2 text-xs text-gray-500 flex space-x-4">
          <div>Started: {new Date(workflow.created_at).toLocaleString()}</div>
          {workflow.completed_at && (
            <div>Completed: {new Date(workflow.completed_at).toLocaleString()}</div>
          )}
        </div>
      </div>
      
      <h4 className="text-md font-medium text-gray-700 mb-3">Validation Steps</h4>
      
      <div className="space-y-3">
        {workflow.steps.map((step: any) => (
          <div key={step.id} className="border rounded-md p-3">
            <div className="flex justify-between items-center mb-2">
              <div className="font-medium">{formatStepType(step.step_type)}</div>
              {getStepStatusBadge(step.status)}
            </div>
            
            {step.result_summary && (
              <p className="text-sm text-gray-600 mb-2">{step.result_summary}</p>
            )}
            
            {step.error_message && (
              <div className="mt-2 text-sm text-red-600">
                <span className="font-medium">Error: </span>
                {step.error_message}
              </div>
            )}
            
            {step.status === 'completed' && step.details && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="text-xs text-gray-500">Details:</div>
                <div className="mt-1 bg-gray-50 p-2 rounded-sm text-xs overflow-auto max-h-24">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(step.details, null, 2)}</pre>
                </div>
              </div>
            )}
            
            {step.started_at && (
              <div className="mt-2 text-xs text-gray-500 flex space-x-4">
                <div>Started: {new Date(step.started_at).toLocaleString()}</div>
                {step.completed_at && (
                  <div>Completed: {new Date(step.completed_at).toLocaleString()}</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {(workflow.status === 'pending' || workflow.status === 'in_progress') && (
        <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-sm rounded flex items-center">
          <Loader2 size={16} className="mr-2 animate-spin" />
          Validation in progress. This page will refresh automatically.
        </div>
      )}
      
      {workflow.status === 'completed' && workflow.overall_compliance === true && (
        <div className="mt-4 p-3 bg-green-50 text-green-700 text-sm rounded flex items-center">
          <CheckCircle size={16} className="mr-2" />
          All validation steps passed successfully!
        </div>
      )}
      
      {workflow.status === 'completed' && workflow.overall_compliance === false && (
        <div className="mt-4 p-3 bg-yellow-50 text-yellow-700 text-sm rounded flex items-center">
          <AlertCircle size={16} className="mr-2" />
          Some validation steps failed. Review the findings for details.
        </div>
      )}
      
      {workflow.status === 'failed' && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded flex items-center">
          <XCircle size={16} className="mr-2" />
          Validation process failed to complete. Please try again.
        </div>
      )}
    </div>
  );
};

export default ValidationWorkflowStatus; 