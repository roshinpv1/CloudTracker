// The API_URL, getHeaders, checkResponseStatus, and handleAuthError are not exported from api.ts
// We need to copy these from api.ts or use another approach

// Use a relative URL if in development or the actual URL in production
const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:8000/api' : '/api';

// Helper function to get auth headers
const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Helper function to check response status
const checkResponseStatus = (response: Response) => {
  if (!response.ok) {
    if (response.status === 401) {
      const error = new Error('Authentication failed') as any;
      error.status = 401;
      throw error;
    }
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response;
};

// Helper function to handle authentication errors
const handleAuthError = (error: any) => {
  // Check if it's an auth error (401)
  if (error.status === 401) {
    console.error('Authentication error:', error);
    // Dispatch a custom event for auth errors that the AuthContext can listen for
    const event = new CustomEvent('auth-error', {
      detail: { message: 'Authentication failed' }
    });
    window.dispatchEvent(event);
  }
  throw error;
};

// Types for validation requests and responses
export interface ValidationRequest {
  checklist_item_id: string;
  validation_type: 'manual' | 'automated' | 'ai_assisted';
  evidence_context?: string;
  code_snippets?: string[];
  repository_url?: string;
  commit_id?: string;
  additional_context?: Record<string, any>;
}

export interface AppValidationRequest {
  validation_type: 'manual' | 'automated' | 'ai_assisted';
  repository_url: string;
  commit_id?: string;
  steps?: string[];
  integrations?: Record<string, Record<string, any>>;
  additional_context?: Record<string, any>;
}

export interface BatchValidationRequest {
  checklist_item_ids: string[];
  validation_type: 'manual' | 'automated' | 'ai_assisted';
  evidence_context?: string;
  repository_url?: string;
  commit_id?: string;
  additional_context?: Record<string, any>;
}

export interface ValidationResponse {
  validation_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  message: string;
  estimated_completion_time?: string;
}

export interface BatchValidationResponse {
  validation_ids: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  message: string;
  estimated_completion_time?: string;
}

export interface ValidationFinding {
  id: string;
  description: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  code_location?: string;
  recommendation?: string;
}

export interface ValidationResult {
  id: string;
  checklist_item_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  is_compliant?: boolean;
  validation_type: 'manual' | 'automated' | 'ai_assisted';
  source_type: 'user' | 'external_system' | 'ai';
  completion_timestamp?: string;
  evidence_url?: string;
  summary?: string;
  findings: ValidationFinding[];
  raw_response?: Record<string, any>;
}

export interface ValidationStep {
  id: string;
  workflow_id: string;
  step_type: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'skipped';
  started_at?: string;
  completed_at?: string;
  result_summary?: string;
  details?: Record<string, any>;
  error_message?: string;
  integration_source?: string;
}

export interface ValidationWorkflowStatus {
  id: string;
  application_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  completed_at?: string;
  initiated_by?: string;
  repository_url?: string;
  commit_id?: string;
  overall_compliance?: boolean;
  summary?: string;
  steps: ValidationStep[];
}

// Request validation for an entire application with workflow
export const requestAppValidation = async (
  appId: string, 
  request: AppValidationRequest
): Promise<ValidationResponse> => {
  try {
    console.log('Requesting application validation:', request);
    
    const response = await fetch(`${API_URL}/validations/app/${appId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(request),
    });
    
    checkResponseStatus(response);
    
    const data = await response.json();
    console.log('Application validation request response:', data);
    
    return data;
  } catch (error) {
    console.error('Error requesting application validation:', error);
    handleAuthError(error);
    throw error;
  }
};

// Get the latest validation workflow for an application
export const getLatestAppValidation = async (appId: string): Promise<ValidationWorkflowStatus | null> => {
  try {
    console.log(`Getting latest validation for application ${appId}`);
    
    const response = await fetch(`${API_URL}/validations/app/${appId}/latest`, {
      method: 'GET',
      headers: getHeaders(),
    });
    
    // If 404, it means no validations exist yet - return null instead of throwing
    if (response.status === 404) {
      console.log(`No validations found for application ${appId} (404)`);
      return null;
    }
    
    // For other status codes, use standard error handling
    checkResponseStatus(response);
    
    const data = await response.json();
    console.log('Latest validation workflow:', data);
    
    return data;
  } catch (error) {
    console.error('Error getting latest validation workflow:', error);
    handleAuthError(error);
    throw error;
  }
};

// Get a validation workflow status
export const getValidationWorkflow = async (workflowId: string): Promise<ValidationWorkflowStatus> => {
  try {
    console.log(`Getting validation workflow ${workflowId}`);
    
    const response = await fetch(`${API_URL}/validations/workflow/${workflowId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    
    checkResponseStatus(response);
    
    const data = await response.json();
    console.log('Validation workflow status:', data);
    
    return data;
  } catch (error) {
    console.error('Error getting validation workflow status:', error);
    handleAuthError(error);
    throw error;
  }
};

// Request validation for a single checklist item
export const requestValidation = async (request: ValidationRequest): Promise<ValidationResponse> => {
  try {
    console.log('Requesting validation:', request);
    
    const response = await fetch(`${API_URL}/validations/request`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(request),
    });
    
    checkResponseStatus(response);
    
    const data = await response.json();
    console.log('Validation request response:', data);
    
    return data;
  } catch (error) {
    console.error('Error requesting validation:', error);
    handleAuthError(error);
    throw error;
  }
};

// Request validation for multiple checklist items
export const requestBatchValidation = async (request: BatchValidationRequest): Promise<BatchValidationResponse> => {
  try {
    console.log('Requesting batch validation:', request);
    
    const response = await fetch(`${API_URL}/validations/batch`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(request),
    });
    
    checkResponseStatus(response);
    
    const data = await response.json();
    console.log('Batch validation request response:', data);
    
    return data;
  } catch (error) {
    console.error('Error requesting batch validation:', error);
    handleAuthError(error);
    throw error;
  }
};

// Get validation result for a specific validation request
export const getValidationResult = async (validationId: string): Promise<ValidationResult> => {
  try {
    console.log(`Getting validation result for ${validationId}`);
    
    const response = await fetch(`${API_URL}/validations/results/${validationId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    
    checkResponseStatus(response);
    
    const data = await response.json();
    console.log('Validation result:', data);
    
    return data;
  } catch (error) {
    console.error('Error getting validation result:', error);
    handleAuthError(error);
    throw error;
  }
};

// Get all validation results for a specific checklist item
export const getChecklistItemValidations = async (checklistItemId: string): Promise<ValidationResult[]> => {
  try {
    console.log(`Getting validation results for checklist item ${checklistItemId}`);
    
    const response = await fetch(`${API_URL}/validations/checklist-item/${checklistItemId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    
    checkResponseStatus(response);
    
    const data = await response.json();
    console.log('Checklist item validation results:', data);
    
    return data;
  } catch (error) {
    console.error('Error getting checklist item validations:', error);
    handleAuthError(error);
    throw error;
  }
};

// Delete a validation request and its results
export const deleteValidation = async (validationId: string): Promise<void> => {
  try {
    console.log(`Deleting validation ${validationId}`);
    
    const response = await fetch(`${API_URL}/validations/${validationId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    
    checkResponseStatus(response);
    
    console.log('Validation deleted successfully');
  } catch (error) {
    console.error('Error deleting validation:', error);
    handleAuthError(error);
    throw error;
  }
}; 