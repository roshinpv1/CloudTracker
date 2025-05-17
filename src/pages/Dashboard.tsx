import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Package, Server, Truck, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import MetricsCard from '../components/MetricsCard';
import SearchBar from '../components/SearchBar';
import ApplicationList from '../components/ApplicationList';
import { getApplications, getDashboardMetrics, getRecentActivities } from '../data/api';
import { Application, DashboardMetrics, RecentActivity } from '../types';

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    inReview: 0,
    approved: 0,
    onboarded: 0,
    production: 0
  });
  const [applications, setApplications] = useState<Application[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState('month');
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all required data in parallel
        const [metricsData, appsData, activitiesData] = await Promise.all([
          getDashboardMetrics(),
          getApplications(),
          getRecentActivities(8)
        ]);
        
        setMetrics(metricsData);
        setApplications(appsData);
        setRecentActivities(activitiesData);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Calculate completion percentages for visualization
  const getTotalProgress = () => {
    let total = 0;
    let completed = 0;
    
    applications.forEach(app => {
      let appItems = 0;
      let appCompleted = 0;
      
      const categories = [
        ...(app.applicationCategories || []), 
        ...(app.platformCategories || [])
      ];
      
      categories.forEach(category => {
        appItems += category.items.length;
        appCompleted += category.items.filter((item: any) => 
          item.status === 'Completed' || item.status === 'Verified'
        ).length;
      });
      
      total += appItems;
      completed += appCompleted;
    });
    
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  return (
    <div className="pt-20 pb-6 bg-neutral-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center mb-6">
          <div>
            <h1 className="text-2xl font-medium text-navy">Dashboard</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Cloud Applications Tracking & Validation
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-3">
            <div className="border border-neutral-200 rounded-sm overflow-hidden flex text-sm">
              <button 
                className={`px-3 py-1.5 ${timeFilter === 'week' ? 'bg-primary text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
                onClick={() => setTimeFilter('week')}
              >
                Week
              </button>
              <button 
                className={`px-3 py-1.5 border-l border-neutral-200 ${timeFilter === 'month' ? 'bg-primary text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
                onClick={() => setTimeFilter('month')}
              >
                Month
              </button>
              <button 
                className={`px-3 py-1.5 border-l border-neutral-200 ${timeFilter === 'year' ? 'bg-primary text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
                onClick={() => setTimeFilter('year')}
              >
                Year
              </button>
            </div>
            <SearchBar />
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {isLoading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-neutral-600">Loading dashboard data...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <MetricsCard 
                title="Applications in Review" 
                value={metrics.inReview} 
                icon={ClipboardCheck} 
                color="bg-primary"
              />
              <MetricsCard 
                title="Applications Approved" 
                value={metrics.approved} 
                icon={Package} 
                color="bg-navy"
              />
              <MetricsCard 
                title="Applications Onboarded" 
                value={metrics.onboarded} 
                icon={Server} 
                color="bg-secondary"
                textColor="text-navy"
              />
              <MetricsCard 
                title="In Production" 
                value={metrics.production} 
                icon={Truck} 
                color="bg-primary"
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Application Status Overview */}
              <div className="bg-white shadow-sm border border-neutral-200 rounded-sm p-6 lg:col-span-2">
                <h2 className="text-lg font-medium text-navy mb-4">Applications Overview</h2>
                <div className="mt-4">
                  <ApplicationList applications={applications.slice(0, 5)} />
                </div>
                <div className="mt-4 flex justify-end">
                  <Link to="/applications" className="text-primary text-sm font-medium hover:underline">
                    View all applications →
                  </Link>
                </div>
              </div>
              
              {/* Recent Activity */}
              <div className="bg-white shadow-sm border border-neutral-200 rounded-sm p-6">
                <h2 className="text-lg font-medium text-navy mb-4">Recent Activity</h2>
                {recentActivities.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivities.slice(0, 5).map((activity, index) => (
                      <div key={index} className="flex items-start gap-3 pb-3 border-b border-neutral-100">
                        <div className="mt-1">
                          {activity.action === 'updated' && <Clock className="h-5 w-5 text-navy" />}
                          {activity.action === 'created' && <Package className="h-5 w-5 text-primary" />}
                          {activity.action === 'status_changed' && <AlertCircle className="h-5 w-5 text-secondary" />}
                          {activity.action === 'reviewed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                        </div>
                        <div>
                          <p className="text-sm text-neutral-700 font-medium">{activity.name} was {activity.action.replace('_', ' ')}</p>
                          <p className="text-xs text-neutral-500">{new Date(activity.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">No recent activities found.</p>
                )}
                <div className="mt-4 pt-2">
                  <div className="mb-2 flex justify-between items-center">
                    <span className="text-sm font-medium text-neutral-700">Overall Completion</span>
                    <span className="text-sm font-medium text-navy">{getTotalProgress()}%</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-sm h-2">
                    <div 
                      className="bg-primary h-2 rounded-sm" 
                      style={{ width: `${getTotalProgress()}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;