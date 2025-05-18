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