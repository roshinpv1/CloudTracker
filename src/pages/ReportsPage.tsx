import React, { useState } from 'react';
import { BarChart2, PieChart, FileBarChart, Download, Calendar, Filter, Info, ArrowDown, ArrowUp, Check, ArrowUpRight, FileDown } from 'lucide-react';
import { mockApplications } from '../data/mockData';

// Helper function to count applications by status
const countByStatus = () => {
  const counts: Record<string, number> = {
    'In Review': 0,
    'Approved': 0,
    'Onboarded': 0,
    'Production': 0
  };
  
  mockApplications.forEach(app => {
    counts[app.status] += 1;
  });
  
  return counts;
};

// Calculate completion percentages for all applications
const calculateCompletionPercentages = () => {
  return mockApplications.map(app => {
    const allItems = [
      ...app.applicationCategories.flatMap(cat => cat.items),
      ...app.platformCategories.flatMap(cat => cat.items)
    ];
    
    const completed = allItems.filter(item => 
      item.status === 'Completed' || item.status === 'Verified'
    ).length;
    
    return {
      id: app.id,
      name: app.name,
      percentage: Math.round((completed / allItems.length) * 100),
      status: app.status
    };
  });
};

// Calculate category completion statistics
const calculateCategoryStats = () => {
  const categories = {
    'auditability': { completed: 0, total: 0 },
    'availability': { completed: 0, total: 0 },
    'error-handling': { completed: 0, total: 0 },
    'testing': { completed: 0, total: 0 },
    'alerting': { completed: 0, total: 0 },
    'monitoring-infra': { completed: 0, total: 0 },
    'monitoring-app': { completed: 0, total: 0 },
    'recoverability': { completed: 0, total: 0 }
  };
  
  mockApplications.forEach(app => {
    // Application categories
    app.applicationCategories.forEach(category => {
      if (categories[category.id]) {
        categories[category.id].total += category.items.length;
        categories[category.id].completed += category.items.filter(
          item => item.status === 'Completed' || item.status === 'Verified'
        ).length;
      }
    });
    
    // Platform categories
    app.platformCategories.forEach(category => {
      if (categories[category.id]) {
        categories[category.id].total += category.items.length;
        categories[category.id].completed += category.items.filter(
          item => item.status === 'Completed' || item.status === 'Verified'
        ).length;
      }
    });
  });
  
  return Object.entries(categories).map(([id, stats]) => ({
    id,
    name: id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    percentage: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    completed: stats.completed,
    total: stats.total
  }));
};

const ReportsPage: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState('month');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const statusCounts = countByStatus();
  const completionData = calculateCompletionPercentages()
    .sort((a, b) => sortDirection === 'desc' ? b.percentage - a.percentage : a.percentage - b.percentage);
  
  const categoryStats = calculateCategoryStats()
    .sort((a, b) => b.percentage - a.percentage);
  
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
  };
  
  // Mock statistics for reports
  const reportStats = {
    totalApplications: mockApplications.length,
    pendingReview: statusCounts['In Review'],
    completionRate: Math.round(completionData.reduce((sum, app) => sum + app.percentage, 0) / completionData.length),
    productionReady: mockApplications.filter(app => {
      const allItems = [
        ...app.applicationCategories.flatMap(cat => cat.items),
        ...app.platformCategories.flatMap(cat => cat.items)
      ];
      
      const completedPercentage = (allItems.filter(item => 
        item.status === 'Completed' || item.status === 'Verified'
      ).length / allItems.length) * 100;
      
      return completedPercentage >= 90;
    }).length
  };

  const statusColorMap = {
    'In Review': 'bg-amber-500',
    'Approved': 'bg-blue-600',
    'Onboarded': 'bg-indigo-600',
    'Production': 'bg-green-500'
  };
  
  const handleExport = (reportType: string) => {
    alert(`Exporting ${reportType} report...`);
    // In a real application, this would trigger a download of the report
  };

  return (
    <div className="py-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Reports & Analytics</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Comprehensive analytics and reporting for cloud application readiness
            </p>
          </div>
          <div className="mt-4 lg:mt-0 flex items-center gap-4">
            <div className="flex items-center space-x-2 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
              <button 
                className={`px-3 py-1 text-sm rounded-md transition-all ${timeFilter === 'week' ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}
                onClick={() => setTimeFilter('week')}
              >
                Week
              </button>
              <button 
                className={`px-3 py-1 text-sm rounded-md transition-all ${timeFilter === 'month' ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}
                onClick={() => setTimeFilter('month')}
              >
                Month
              </button>
              <button 
                className={`px-3 py-1 text-sm rounded-md transition-all ${timeFilter === 'year' ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}
                onClick={() => setTimeFilter('year')}
              >
                Year
              </button>
            </div>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <Calendar className="h-4 w-4 mr-2" />
              Date Range
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
          </div>
        </div>
        
        {/* Stats Overview Cards */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow-sm rounded-xl">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-primary/10 rounded-md p-3">
                  <BarChart2 className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Applications</dt>
                    <dd>
                      <div className="text-lg font-bold text-gray-900">{reportStats.totalApplications}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="font-medium text-green-700 inline-flex items-center">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  12% increase
                </span>
                <span className="text-gray-500 ml-1">from last {timeFilter}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow-sm rounded-xl">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-amber-500/10 rounded-md p-3">
                  <Info className="h-6 w-6 text-amber-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Review</dt>
                    <dd>
                      <div className="text-lg font-bold text-gray-900">{reportStats.pendingReview}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="font-medium text-amber-700 inline-flex items-center">
                  <ArrowDown className="h-4 w-4 mr-1" />
                  3 applications
                </span>
                <span className="text-gray-500 ml-1">need attention</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow-sm rounded-xl">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500/10 rounded-md p-3">
                  <Check className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Average Completion</dt>
                    <dd>
                      <div className="text-lg font-bold text-gray-900">{reportStats.completionRate}%</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="font-medium text-green-700 inline-flex items-center">
                  <ArrowUp className="h-4 w-4 mr-1" />
                  8% increase
                </span>
                <span className="text-gray-500 ml-1">from last {timeFilter}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow-sm rounded-xl">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500/10 rounded-md p-3">
                  <FileBarChart className="h-6 w-6 text-blue-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Production Ready</dt>
                    <dd>
                      <div className="text-lg font-bold text-gray-900">{reportStats.productionReady}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="font-medium text-blue-700 inline-flex items-center">
                  <ArrowUp className="h-4 w-4 mr-1" />
                  {reportStats.productionReady} apps
                </span>
                <span className="text-gray-500 ml-1">ready for production</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Applications by Status Card */}
          <div className="bg-white shadow-sm rounded-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-primary flex items-center">
                <PieChart className="h-5 w-5 text-primary mr-2" />
                Applications by Status
              </h3>
              <button 
                className="text-sm text-primary hover:text-primary-dark inline-flex items-center"
                onClick={() => handleExport('status')}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <div key={status} className="flex items-center">
                    <div className="w-32 text-sm font-medium text-gray-900">{status}</div>
                    <div className="flex-1">
                      <div className="relative h-5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`absolute top-0 left-0 h-full rounded-full ${statusColorMap[status] || 'bg-gray-500'}`}
                          style={{ width: `${(count / mockApplications.length) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-16 text-right text-sm font-medium text-gray-900">{count} ({Math.round((count / mockApplications.length) * 100)}%)</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Category Completion Card */}
          <div className="bg-white shadow-sm rounded-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-primary flex items-center">
                <BarChart2 className="h-5 w-5 text-primary mr-2" />
                Category Completion Rates
              </h3>
              <button 
                className="text-sm text-primary hover:text-primary-dark inline-flex items-center"
                onClick={() => handleExport('category')}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {categoryStats.map((category) => (
                  <div key={category.id} className="flex items-center">
                    <div className="w-32 text-sm font-medium text-gray-900 truncate" title={category.name}>
                      {category.name}
                    </div>
                    <div className="flex-1">
                      <div className="relative h-5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`absolute top-0 left-0 h-full ${
                            category.percentage >= 80 ? 'bg-green-500' :
                            category.percentage >= 50 ? 'bg-blue-500' :
                            category.percentage >= 30 ? 'bg-amber-500' :
                            'bg-red-500'
                          } rounded-full`}
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-16 text-right text-sm font-medium text-gray-900">{category.percentage}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Application Completion Table */}
          <div className="bg-white shadow-sm rounded-xl overflow-hidden lg:col-span-2">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-primary flex items-center">
                <FileBarChart className="h-5 w-5 text-primary mr-2" />
                Application Readiness Overview
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center"
                  onClick={toggleSortDirection}
                >
                  Sort {sortDirection === 'desc' ? 'Ascending' : 'Descending'}
                  {sortDirection === 'desc' ? 
                    <ArrowUp className="h-4 w-4 ml-1" /> : 
                    <ArrowDown className="h-4 w-4 ml-1" />
                  }
                </button>
                <button 
                  className="text-sm text-primary hover:text-primary-dark inline-flex items-center"
                  onClick={() => handleExport('readiness')}
                >
                  <FileDown className="h-4 w-4 mr-1" />
                  Export CSV
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Application
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completion
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {completionData.slice(0, 8).map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{app.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          app.status === 'In Review' ? 'bg-amber-100 text-amber-800' :
                          app.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                          app.status === 'Onboarded' ? 'bg-indigo-100 text-indigo-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{app.percentage}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-40">
                          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`absolute top-0 left-0 h-full ${
                                app.percentage >= 80 ? 'bg-green-500' :
                                app.percentage >= 50 ? 'bg-blue-500' :
                                app.percentage >= 30 ? 'bg-amber-500' :
                                'bg-red-500'
                              } rounded-full`}
                              style={{ width: `${app.percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Showing 8 of {completionData.length} applications.
                <a href="/applications" className="ml-2 text-primary hover:text-primary-dark">View all applications →</a>
              </div>
            </div>
          </div>
          
          {/* Compliance Report Card */}
          <div className="bg-white shadow-sm rounded-xl overflow-hidden lg:col-span-2">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-primary flex items-center">
                <FileBarChart className="h-5 w-5 text-primary mr-2" />
                Compliance Reports
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-500/10 rounded-md p-2">
                    <Check className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900">Security Compliance</h4>
                    <p className="text-sm text-gray-500 mt-1">Overall compliance against security requirements</p>
                    <button 
                      className="mt-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
                      onClick={() => handleExport('security')}
                    >
                      <Download className="mr-1 h-3 w-3" />
                      Generate Report
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-green-500/10 rounded-md p-2">
                    <Check className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900">Availability Standards</h4>
                    <p className="text-sm text-gray-500 mt-1">Application availability compliance metrics</p>
                    <button 
                      className="mt-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
                      onClick={() => handleExport('availability')}
                    >
                      <Download className="mr-1 h-3 w-3" />
                      Generate Report
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-amber-500/10 rounded-md p-2">
                    <Check className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900">Audit Trail Verification</h4>
                    <p className="text-sm text-gray-500 mt-1">Audit logging and tracking compliance</p>
                    <button 
                      className="mt-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-amber-700 bg-amber-100 hover:bg-amber-200"
                      onClick={() => handleExport('audit')}
                    >
                      <Download className="mr-1 h-3 w-3" />
                      Generate Report
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-indigo-500/10 rounded-md p-2">
                    <Check className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900">Error Handling Assessment</h4>
                    <p className="text-sm text-gray-500 mt-1">Application error handling best practices</p>
                    <button 
                      className="mt-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                      onClick={() => handleExport('error')}
                    >
                      <Download className="mr-1 h-3 w-3" />
                      Generate Report
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-purple-500/10 rounded-md p-2">
                    <Check className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900">Monitoring Coverage</h4>
                    <p className="text-sm text-gray-500 mt-1">Application and infrastructure monitoring</p>
                    <button 
                      className="mt-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200"
                      onClick={() => handleExport('monitoring')}
                    >
                      <Download className="mr-1 h-3 w-3" />
                      Generate Report
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-red-500/10 rounded-md p-2">
                    <Check className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900">Alerting System</h4>
                    <p className="text-sm text-gray-500 mt-1">Alerting configuration and effectiveness</p>
                    <button 
                      className="mt-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                      onClick={() => handleExport('alerting')}
                    >
                      <Download className="mr-1 h-3 w-3" />
                      Generate Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;