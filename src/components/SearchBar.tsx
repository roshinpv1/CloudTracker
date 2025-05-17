import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Application } from '../types';
import { getApplications } from '../data/api';

const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setIsLoading(true);
        const data = await getApplications();
        setApplications(data);
      } catch (error) {
        console.error('Failed to fetch applications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const filteredApps = query
    ? applications.filter(app => 
        app.name.toLowerCase().includes(query.toLowerCase()) || 
        (app.id && app.id.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  const handleSelect = (appId: string) => {
    setQuery('');
    setShowResults(false);
    navigate(`/application/${appId}`);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowResults(false);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
          placeholder="Search applications..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value) {
              setShowResults(true);
            }
          }}
          onFocus={() => {
            if (query) {
              setShowResults(true);
            }
          }}
          aria-label="Search applications"
        />
        {query && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => {
              setQuery('');
              setShowResults(false);
            }}
            aria-label="Clear search"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-500" />
          </button>
        )}
      </div>

      {showResults && query && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm border border-gray-200">
          {isLoading ? (
            <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
          ) : filteredApps.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {filteredApps.map((app) => (
                <li 
                  key={app.id} 
                  className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleSelect(app.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-600">{app.name}</span>
                    <span className="text-sm text-gray-500">{app.id}</span>
                  </div>
                  <div className="mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      app.status === 'In Review' ? 'bg-yellow-100 text-yellow-800' :
                      app.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                      app.status === 'Onboarded' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">No applications found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;