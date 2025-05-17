import { Application, Category, ChecklistItem } from '../types';

// Create mock checklist items for application categories
const createApplicationChecklistItems = (categoryId: string): ChecklistItem[] => {
  const baseItems: Record<string, string[]> = {
    'auditability': [
      'Avoid logging confidential data',
      'Create audit trail logs',
      'Implement tracking ID for log messages',
      'Log REST API calls',
      'Log application messages',
      'Client UI errors are logged',
      'Logs are searchable and available'
    ],
    'availability': [
      'Retry Logic',
      'Set timeouts on IO operation',
      'Auto scale',
      'Throttling, drop request',
      'Set circuit breakers on outgoing requests'
    ],
    'error-handling': [
      'Log system errors',
      'Use HTTP standard error codes',
      'Include Client error tracking'
    ],
    'testing': [
      'Automated Regression Testing'
    ]
  };

  const items = baseItems[categoryId] || [];
  
  return items.map((description, index) => ({
    id: `${categoryId}-item-${index}`,
    description,
    status: ['Not Started', 'In Progress', 'Completed', 'Verified'][Math.floor(Math.random() * 4)] as any,
    lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
    comments: Math.random() > 0.7 ? `Comment for ${description}` : '',
    evidence: Math.random() > 0.6 ? `https://example.com/evidence/${categoryId}/${index}` : '',
  }));
};

// Create mock checklist items for platform categories
const createPlatformChecklistItems = (categoryId: string): ChecklistItem[] => {
  const baseItems: Record<string, string[]> = {
    'alerting': [
      'All alerting is actionable'
    ],
    'availability': [
      'Automated failovers'
    ],
    'monitoring-infra': [
      'Monitor CPU utilization'
    ],
    'monitoring-app': [
      'Monitoring application process',
      'Monitor port availability',
      'URL monitoring',
      'Monitor application heap memory usage',
      'Application CPU Utilization',
      'Monitor Golden'
    ],
    'recoverability': [
      'Demonstrate recovery strategy'
    ]
  };

  const items = baseItems[categoryId] || [];
  
  return items.map((description, index) => ({
    id: `${categoryId}-item-${index}`,
    description,
    status: ['Not Started', 'In Progress', 'Completed', 'Verified'][Math.floor(Math.random() * 4)] as any,
    lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
    comments: Math.random() > 0.7 ? `Comment for ${description}` : '',
    evidence: Math.random() > 0.6 ? `https://example.com/evidence/${categoryId}/${index}` : '',
  }));
};

// Create application categories
const createApplicationCategories = (): Category[] => {
  return [
    {
      id: 'auditability',
      name: 'Auditability',
      items: createApplicationChecklistItems('auditability')
    },
    {
      id: 'availability',
      name: 'Availability',
      items: createApplicationChecklistItems('availability')
    },
    {
      id: 'error-handling',
      name: 'Error Handling',
      items: createApplicationChecklistItems('error-handling')
    },
    {
      id: 'testing',
      name: 'DC.Testing',
      items: createApplicationChecklistItems('testing')
    }
  ];
};

// Create platform categories
const createPlatformCategories = (): Category[] => {
  return [
    {
      id: 'alerting',
      name: 'Alerting',
      items: createPlatformChecklistItems('alerting')
    },
    {
      id: 'availability',
      name: 'Availability',
      items: createPlatformChecklistItems('availability')
    },
    {
      id: 'monitoring-infra',
      name: 'Monitoring Infra',
      items: createPlatformChecklistItems('monitoring-infra')
    },
    {
      id: 'monitoring-app',
      name: 'Monitoring App',
      items: createPlatformChecklistItems('monitoring-app')
    },
    {
      id: 'recoverability',
      name: 'Recoverability',
      items: createPlatformChecklistItems('recoverability')
    }
  ];
};

// Create mock applications
export const mockApplications: Application[] = Array.from({ length: 20 }, (_, i) => {
  const statuses = ['In Review', 'Approved', 'Onboarded', 'Production'];
  return {
    id: `app-${i + 1}`,
    name: `Application ${i + 1}`,
    status: statuses[Math.floor(Math.random() * statuses.length)] as any,
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
    applicationCategories: createApplicationCategories(),
    platformCategories: createPlatformCategories()
  };
});

// Calculate summary metrics
export const calculateMetrics = () => {
  return {
    inReview: mockApplications.filter(app => app.status === 'In Review').length,
    approved: mockApplications.filter(app => app.status === 'Approved').length,
    onboarded: mockApplications.filter(app => app.status === 'Onboarded').length,
    production: mockApplications.filter(app => app.status === 'Production').length,
  };
};