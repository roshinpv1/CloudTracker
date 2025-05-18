import { Application, ChecklistItem, DashboardMetrics, RecentActivity, AuthResponse, Category } from '../types';

// Use a relative URL if in development or the actual URL in production
const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:8000/api' : '/api';

// Log API configuration for debugging
console.log('API URL configured as:', API_URL);

// Auth token
let token: string | null = null;

// Helper function to get auth headers
const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Create a custom event for authentication errors
const createAuthErrorEvent = () => {
  const event = new CustomEvent('auth-error', {
    detail: { message: 'Authentication failed' }
  });
  window.dispatchEvent(event);
};

// Helper function to handle authentication errors
const handleAuthError = (error: any) => {
  // Check if it's an auth error (401)
  if (error.status === 401) {
    // Don't clear token on API requests - let the auth context handle it
    console.error('Authentication error:', error);
    // Dispatch a custom event for auth errors that the AuthContext can listen for
    createAuthErrorEvent();
  }
  throw error;
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

// Authentication functions
export const login = async (username: string, password: string): Promise<AuthResponse> => {
  // Get token
  const response = await fetch(`${API_URL}/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      username,
      password,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Invalid credentials');
  }
  
  const data = await response.json();
  token = data.access_token;
  localStorage.setItem('token', data.access_token);
  
  // Fetch user data
  try {
    const userResponse = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${data.access_token}`
      }
    });
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      return { ...data, user: userData };
    }
    
    // If we can't get user info, create a basic user object
    return { 
      ...data, 
      user: { 
        id: "", 
        username, 
        email: "", 
        is_active: true,
        role: "user"
      } 
    };
  } catch (error) {
    console.error("Failed to fetch user data:", error);
    // Return with token but minimal user info
    return { 
      ...data, 
      user: { 
        id: "", 
        username, 
        email: "", 
        is_active: true,
        role: "user"
      } 
    };
  }
};

export const logout = () => {
  token = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('role');
};

export const initializeAuth = () => {
  // Get token from localStorage and assign it to our token variable
  const storedToken = localStorage.getItem('token');
  if (storedToken) {
    token = storedToken;
  }
};

// Application functions
export const getApplications = async (): Promise<Application[]> => {
  try {
    const response = await fetch(`${API_URL}/applications`, {
      headers: getHeaders(),
    });
    
    checkResponseStatus(response);
    
    const data = await response.json();
    
    // Normalize data to match frontend naming conventions
    return data.map((app: any) => ({
      ...app,
      createdAt: app.created_at,
      updatedAt: app.updated_at,
      applicationCategories: Array.isArray(app.application_categories) ? app.application_categories.map((cat: any) => ({
        ...cat,
        items: Array.isArray(cat.checklist_items) ? cat.checklist_items.map((item: any) => ({
          ...item,
          lastUpdated: item.last_updated
        })) : []
      })) : [],
      platformCategories: Array.isArray(app.platform_categories) ? app.platform_categories.map((cat: any) => ({
        ...cat,
        items: Array.isArray(cat.checklist_items) ? cat.checklist_items.map((item: any) => ({
          ...item,
          lastUpdated: item.last_updated
        })) : []
      })) : [],
    }));
  } catch (error) {
    console.error('Error fetching applications:', error);
    handleAuthError(error);
    throw error;
  }
};

export const getApplication = async (id: string): Promise<Application> => {
  try {
    console.log(`Fetching application with ID ${id} from ${API_URL}/applications/${id}`);
    
    const response = await fetch(`${API_URL}/applications/${id}`, {
      headers: getHeaders(),
    });
    
    checkResponseStatus(response);
    
    const data = await response.json();
    console.log('Application API response data:', data);
    
    // Access debug information to help diagnose issues
    console.log('API response applicationCategories type:', data.applicationCategories ? 'exists' : 'missing');
    console.log('API response application_categories type:', data.application_categories ? 'exists' : 'missing');
    
    if (data.applicationCategories) {
      data.applicationCategories.forEach((cat: any, index: number) => {
        console.log(`Category ${index}: ${cat.name}, items: ${cat.items ? cat.items.length : 'missing'}, checklist_items: ${cat.checklist_items ? cat.checklist_items.length : 'missing'}`);
      });
    }
    
    // Normalize data to match frontend naming conventions
    const normalized = {
      ...data,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      applicationCategories: Array.isArray(data.applicationCategories) ? data.applicationCategories.map((cat: any) => ({
        ...cat,
        items: Array.isArray(cat.items) 
          ? cat.items.map((item: any) => ({
              ...item,
              lastUpdated: item.last_updated || item.lastUpdated
            }))
          : Array.isArray(cat.checklist_items) 
            ? cat.checklist_items.map((item: any) => ({
                ...item,
                lastUpdated: item.last_updated || item.lastUpdated
              })) 
            : []
      })) : [],
      platformCategories: Array.isArray(data.platformCategories) ? data.platformCategories.map((cat: any) => ({
        ...cat,
        items: Array.isArray(cat.items)
          ? cat.items.map((item: any) => ({
              ...item,
              lastUpdated: item.last_updated || item.lastUpdated
            }))
          : Array.isArray(cat.checklist_items)
            ? cat.checklist_items.map((item: any) => ({
                ...item,
                lastUpdated: item.last_updated || item.lastUpdated
              }))
            : []
      })) : [],
    };
    
    console.log('Normalized application data:', normalized);
    console.log('Application categories after normalization:', 
      normalized.applicationCategories && normalized.applicationCategories.map((c: any) => 
        `${c.name}: ${c.items ? c.items.length : 0} items`));
    
    return normalized;
  } catch (error) {
    console.error(`Error fetching application ${id}:`, error);
    handleAuthError(error);
    throw error;
  }
};

export const createApplication = async (application: Partial<Application>): Promise<Application> => {
  try {
    const response = await fetch(`${API_URL}/applications`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(application),
    });
    
    checkResponseStatus(response);
    
    const data = await response.json();
    console.log('Created application response:', data);
    
    // Normalize data to match frontend naming conventions
    const normalized = {
      ...data,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      applicationCategories: Array.isArray(data.application_categories) ? data.application_categories.map((cat: any) => ({
        ...cat,
        items: Array.isArray(cat.checklist_items) ? cat.checklist_items.map((item: any) => ({
          ...item,
          lastUpdated: item.last_updated
        })) : []
      })) : [],
      platformCategories: Array.isArray(data.platform_categories) ? data.platform_categories.map((cat: any) => ({
        ...cat,
        items: Array.isArray(cat.checklist_items) ? cat.checklist_items.map((item: any) => ({
          ...item,
          lastUpdated: item.last_updated
        })) : []
      })) : [],
    };
    
    console.log('Normalized created application:', normalized);
    return normalized;
  } catch (error) {
    console.error('Error creating application:', error);
    handleAuthError(error);
    throw error;
  }
};

export const updateApplication = async (id: string, application: Partial<Application>): Promise<Application> => {
  try {
    const response = await fetch(`${API_URL}/applications/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(application),
    });
    
    checkResponseStatus(response);
    
    const data = await response.json();
    console.log('Updated application response:', data);
    
    // Normalize data to match frontend naming conventions
    const normalized = {
      ...data,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      applicationCategories: Array.isArray(data.application_categories) ? data.application_categories.map((cat: any) => ({
        ...cat,
        items: Array.isArray(cat.checklist_items) ? cat.checklist_items.map((item: any) => ({
          ...item,
          lastUpdated: item.last_updated
        })) : []
      })) : [],
      platformCategories: Array.isArray(data.platform_categories) ? data.platform_categories.map((cat: any) => ({
        ...cat,
        items: Array.isArray(cat.checklist_items) ? cat.checklist_items.map((item: any) => ({
          ...item,
          lastUpdated: item.last_updated
        })) : []
      })) : [],
    };
    
    console.log('Normalized updated application:', normalized);
    return normalized;
  } catch (error) {
    console.error('Error updating application:', error);
    handleAuthError(error);
    throw error;
  }
};

export const deleteApplication = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/applications/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    
    checkResponseStatus(response);
  } catch (error) {
    console.error('Error deleting application:', error);
    handleAuthError(error);
    throw error;
  }
};

// Dashboard functions
export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  try {
    const response = await fetch(`${API_URL}/dashboard/metrics`, {
      headers: getHeaders(),
    });
    
    checkResponseStatus(response);
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    handleAuthError(error);
    throw error;
  }
};

export const getRecentActivities = async (limit = 8): Promise<RecentActivity[]> => {
  try {
    const response = await fetch(`${API_URL}/dashboard/recent-activities?limit=${limit}`, {
      headers: getHeaders(),
    });
    
    checkResponseStatus(response);
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    handleAuthError(error);
    throw error;
  }
};

// Checklist functions
export const getCategories = async (): Promise<Category[]> => {
  try {
    console.log('Fetching all categories');
    
    const response = await fetch(`${API_URL}/categories`, {
      headers: getHeaders(),
    });
    
    checkResponseStatus(response);
    
    const data = await response.json();
    console.log('Categories API response:', data);
    
    // Normalize data to match frontend naming conventions
    const normalized = data.map((cat: any) => ({
      ...cat,
      items: Array.isArray(cat.checklist_items) ? cat.checklist_items.map((item: any) => ({
        ...item,
        lastUpdated: item.last_updated || new Date().toISOString()
      })) : []
    }));
    
    console.log('Normalized categories:', normalized);
    return normalized;
  } catch (error) {
    console.error('Error fetching categories:', error);
    handleAuthError(error);
    throw error;
  }
};

export const getCategoryItems = async (categoryId: string): Promise<ChecklistItem[]> => {
  try {
    console.log(`Fetching items for category: ${categoryId}`);
    
    const response = await fetch(`${API_URL}/categories/${categoryId}/items`, {
      headers: getHeaders(),
    });
    
    checkResponseStatus(response);
    
    const data = await response.json();
    console.log(`Category ${categoryId} items response:`, data);
    
    // Normalize data to match frontend naming conventions
    const normalized = data.map((item: any) => ({
      ...item,
      lastUpdated: item.last_updated || new Date().toISOString(),
      category_id: categoryId
    }));
    
    console.log(`Normalized items for category ${categoryId}:`, normalized);
    return normalized;
  } catch (error) {
    console.error(`Error fetching checklist items for category ${categoryId}:`, error);
    handleAuthError(error);
    throw error;
  }
};

export const createChecklistItem = async (categoryId: string, item: Partial<ChecklistItem>): Promise<ChecklistItem> => {
  try {
    console.log(`Creating checklist item for category ${categoryId}:`, item);
    
    // Prepare the item data with snake_case properties for the backend
    const apiItem = {
      description: item.description,
      status: item.status || 'Not Started',
      comments: item.comments || '',
      evidence: item.evidence || ''
    };
    
    const response = await fetch(`${API_URL}/categories/${categoryId}/items`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(apiItem),
    });
    
    checkResponseStatus(response);
    
    const data = await response.json();
    console.log('Created checklist item response:', data);
    
    // Normalize data to match frontend naming conventions
    const normalized = {
      ...data,
      lastUpdated: data.last_updated || new Date().toISOString(),
      category_id: categoryId
    };
    
    console.log('Normalized checklist item:', normalized);
    return normalized;
  } catch (error) {
    console.error('Error creating checklist item:', error);
    handleAuthError(error);
    throw error;
  }
};

export const updateChecklistItem = async (itemId: string, item: Partial<ChecklistItem>): Promise<ChecklistItem> => {
  try {
    console.log(`Updating checklist item ${itemId}:`, item);
    
    // Prepare the item data with snake_case properties for the backend
    const apiItem: Record<string, any> = {};
    if (item.description !== undefined) apiItem.description = item.description;
    if (item.status !== undefined) apiItem.status = item.status;
    if (item.comments !== undefined) apiItem.comments = item.comments;
    if (item.evidence !== undefined) apiItem.evidence = item.evidence;
    
    const response = await fetch(`${API_URL}/checklist-items/${itemId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(apiItem),
    });
    
    checkResponseStatus(response);
    
    const data = await response.json();
    console.log('Updated checklist item response:', data);
    
    // Normalize data to match frontend naming conventions
    const normalized = {
      ...data,
      lastUpdated: data.last_updated || new Date().toISOString()
    };
    
    console.log('Normalized updated checklist item:', normalized);
    return normalized;
  } catch (error) {
    console.error('Error updating checklist item:', error);
    handleAuthError(error);
    throw error;
  }
};

export const deleteChecklistItem = async (itemId: string): Promise<void> => {
  try {
    console.log(`Deleting checklist item: ${itemId}`);
    
    const response = await fetch(`${API_URL}/checklist-items/${itemId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    
    checkResponseStatus(response);
    console.log(`Successfully deleted checklist item: ${itemId}`);
  } catch (error) {
    console.error(`Error deleting checklist item ${itemId}:`, error);
    handleAuthError(error);
    throw error;
  }
};

// Integration Functions
export interface IntegrationConfig {
  id: string;
  name: string;
  integration_type: string;
  description?: string;
  base_url?: string;
  additional_config?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IntegrationConfigCreate {
  name: string;
  integration_type: string;
  description?: string;
  base_url?: string;
  api_key?: string;
  username?: string;
  password?: string;
  additional_config?: string;
  is_active?: boolean;
}

export interface AutomatedCheck {
  id: string;
  checklist_item_id: string;
  integration_config_id: string;
  check_type: string;
  check_query?: string;
  success_criteria?: string;
  is_active: boolean;
  created_at: string;
}

export interface AutomatedCheckCreate {
  checklist_item_id: string;
  integration_config_id: string;
  check_type: string;
  check_query?: string;
  success_criteria?: string;
  is_active?: boolean;
}

export interface AutomatedCheckResult {
  id: string;
  automated_check_id: string;
  status: string;
  result_value?: string;
  result_details?: string;
  evidence_url?: string;
  executed_at: string;
}

// Get all integrations
export const getIntegrations = async (): Promise<IntegrationConfig[]> => {
  try {
    const response = await fetch(`${API_URL}/automations/integrations`, {
      headers: getHeaders(),
    });
    
    checkResponseStatus(response);
    return await response.json();
  } catch (error) {
    console.error('Error fetching integrations:', error);
    handleAuthError(error);
    throw error;
  }
};

// Get a specific integration
export const getIntegration = async (id: string): Promise<IntegrationConfig> => {
  try {
    const response = await fetch(`${API_URL}/automations/integrations/${id}`, {
      headers: getHeaders(),
    });
    
    checkResponseStatus(response);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching integration ${id}:`, error);
    handleAuthError(error);
    throw error;
  }
};

// Create a new integration
export const createIntegration = async (data: IntegrationConfigCreate): Promise<IntegrationConfig> => {
  try {
    const response = await fetch(`${API_URL}/automations/integrations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    
    checkResponseStatus(response);
    return await response.json();
  } catch (error) {
    console.error('Error creating integration:', error);
    handleAuthError(error);
    throw error;
  }
};

// Update an integration
export const updateIntegration = async (id: string, data: Partial<IntegrationConfigCreate>): Promise<IntegrationConfig> => {
  try {
    const response = await fetch(`${API_URL}/automations/integrations/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    
    checkResponseStatus(response);
    return await response.json();
  } catch (error) {
    console.error(`Error updating integration ${id}:`, error);
    handleAuthError(error);
    throw error;
  }
};

// Delete an integration
export const deleteIntegration = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/automations/integrations/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    
    checkResponseStatus(response);
  } catch (error) {
    console.error(`Error deleting integration ${id}:`, error);
    handleAuthError(error);
    throw error;
  }
};

// Get automated checks
export const getAutomatedChecks = async (checklistItemId?: string): Promise<AutomatedCheck[]> => {
  try {
    const url = checklistItemId 
      ? `${API_URL}/automations/checks?checklist_item_id=${checklistItemId}`
      : `${API_URL}/automations/checks`;
      
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    
    checkResponseStatus(response);
    return await response.json();
  } catch (error) {
    console.error('Error fetching automated checks:', error);
    handleAuthError(error);
    throw error;
  }
};

// Create an automated check
export const createAutomatedCheck = async (data: AutomatedCheckCreate): Promise<AutomatedCheck> => {
  try {
    const response = await fetch(`${API_URL}/automations/checks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    
    checkResponseStatus(response);
    return await response.json();
  } catch (error) {
    console.error('Error creating automated check:', error);
    handleAuthError(error);
    throw error;
  }
};

// Run a specific check
export const runAutomatedCheck = async (checkId: string): Promise<AutomatedCheckResult> => {
  try {
    const response = await fetch(`${API_URL}/automations/checks/${checkId}/run`, {
      method: 'POST',
      headers: getHeaders(),
    });
    
    checkResponseStatus(response);
    return await response.json();
  } catch (error) {
    console.error(`Error running automated check ${checkId}:`, error);
    handleAuthError(error);
    throw error;
  }
};

// Get results for a specific check
export const getAutomatedCheckResults = async (checkId: string): Promise<AutomatedCheckResult[]> => {
  try {
    const response = await fetch(`${API_URL}/automations/checks/${checkId}/results`, {
      headers: getHeaders(),
    });
    
    checkResponseStatus(response);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching results for check ${checkId}:`, error);
    handleAuthError(error);
    throw error;
  }
};

// Run all checks for an application
export const runAllChecksForApplication = async (applicationId: string): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/automations/applications/${applicationId}/run-all-checks`, {
      method: 'POST',
      headers: getHeaders(),
    });
    
    checkResponseStatus(response);
    return await response.json();
  } catch (error) {
    console.error(`Error running all checks for application ${applicationId}:`, error);
    handleAuthError(error);
    throw error;
  }
};