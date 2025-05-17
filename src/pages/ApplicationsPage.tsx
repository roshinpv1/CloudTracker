import React, { useState, useEffect } from 'react';
import ApplicationList from '../components/ApplicationList';
import SearchBar from '../components/SearchBar';
import { Application } from '../types';
import { getApplications } from '../data/api';
import { Search } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const ApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { addNotification } = useNotification();

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setIsLoading(true);
        const data = await getApplications();
        setApplications(data);
        setFilteredApplications(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch applications:', err);
        setError('Failed to load applications. Please try again later.');
        addNotification('error', 'Failed to load applications');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [addNotification]);

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredApplications(applications);
      return;
    }
    
    const filtered = applications.filter(app => 
      app.name.toLowerCase().includes(query.toLowerCase()) ||
      (app.description && app.description.toLowerCase().includes(query.toLowerCase())) ||
      (app.id && app.id.toLowerCase().includes(query.toLowerCase()))
    );
    
    setFilteredApplications(filtered);
  };

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage and track all cloud applications
            </p>
          </div>
          <div className="mt-4 sm:mt-0 w-full sm:w-64">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search applications..."
                value={searchQuery}
                onChange={handleSearch}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                aria-label="Search applications"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-center p-6 bg-red-50 rounded-lg">
              <p className="text-red-600">{error}</p>
              <button 
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          ) : (
            <ApplicationList applications={filteredApplications} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationsPage;