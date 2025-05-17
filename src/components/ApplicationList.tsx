import React, { useState, useMemo } from 'react';
import { ArrowRight, CheckCircle, Clock, FileCheck, Loader2, Search, ChevronLeft, ChevronRight, Filter, ArrowDown, ArrowUp, Trash2, Edit, EyeIcon, MoreHorizontal } from 'lucide-react';
import { Application } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import ApplicationForm from './ApplicationForm';
import { updateApplication, deleteApplication } from '../data/api';
import { useAuth, useAuthorization } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

interface ApplicationListProps {
  applications: Application[];
}

const ApplicationList: React.FC<ApplicationListProps> = ({ applications }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'name' | 'status' | 'createdAt' | 'updatedAt'>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { role } = useAuth();
  const canModify = useAuthorization(['admin', 'reviewer']);
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  
  const itemsPerPage = 5;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'In Review':
        return <Clock size={16} className="text-amber-500" />;
      case 'Approved':
        return <FileCheck size={16} className="text-blue-500" />;
      case 'Onboarded':
        return <Loader2 size={16} className="text-indigo-500" />;
      case 'Production':
        return <CheckCircle size={16} className="text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'In Review':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'Approved':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'Onboarded':
        return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
      case 'Production':
        return 'bg-green-100 text-green-800 border border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const handleSort = (field: typeof sortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredApplications = useMemo(() => {
    let filtered = [...applications];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(app => app.status === statusFilter);
    }
    
    // Apply sorting with safer type handling
    filtered.sort((a, b) => {
      // For date fields, use both snake_case and camelCase
      if (sortField === 'createdAt') {
        const aDate = a.createdAt || a.created_at || '';
        const bDate = b.createdAt || b.created_at || '';
        
        // Compare dates safely
        const aTime = aDate ? new Date(aDate).getTime() : 0;
        const bTime = bDate ? new Date(bDate).getTime() : 0;
        
        return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
      } 
      
      if (sortField === 'updatedAt') {
        const aDate = a.updatedAt || a.updated_at || '';
        const bDate = b.updatedAt || b.updated_at || '';
        
        // Compare dates safely
        const aTime = aDate ? new Date(aDate).getTime() : 0;
        const bTime = bDate ? new Date(bDate).getTime() : 0;
        
        return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
      }
      
      // For other fields
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      
      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    return filtered;
  }, [applications, searchTerm, statusFilter, sortField, sortDirection]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedApps = filteredApplications.slice(startIndex, startIndex + itemsPerPage);
  
  const statusOptions = ['In Review', 'Approved', 'Onboarded', 'Production'];

  const handleActionToggle = (id: string) => {
    setDropdownOpen(dropdownOpen === id ? null : id);
  };

  const handleEditApplication = (app: Application) => {
    if (!canModify) return;
    setEditingApplication(app);
    setDropdownOpen(null);
  };

  const handleFormSubmit = async (formData: Partial<Application>) => {
    if (!editingApplication || !editingApplication.id || !canModify) return;
    
    setIsUpdating(true);
    setError(null);
    
    try {
      const updated = await updateApplication(editingApplication.id, formData);
      addNotification('success', `Application "${updated.name}" updated successfully`);
      // Update the local state instead of reloading the page
      setEditingApplication(null);
      // Refresh the applications list without a full page reload
      navigate('/applications');
    } catch (err) {
      console.error('Failed to update application:', err);
      setError('Failed to update application. Please try again.');
      addNotification('error', 'Failed to update application');
    } finally {
      setIsUpdating(false);
      setEditingApplication(null);
    }
  };

  const handleDeleteApplication = async (id: string) => {
    if (!canModify) return;
    if (!window.confirm('Are you sure you want to delete this application?')) return;
    
    setIsUpdating(true);
    setError(null);
    
    try {
      await deleteApplication(id);
      addNotification('success', 'Application deleted successfully');
      
      // Update the local state instead of refreshing the page
      // This avoids a full page reload that could clear auth state
      setTimeout(() => {
        navigate('/applications');
      }, 1000);
    } catch (err) {
      console.error('Failed to delete application:', err);
      setError('Failed to delete application. Please try again.');
      addNotification('error', 'Failed to delete application');
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-neutral-200">
      <div className="px-6 py-5 border-b border-neutral-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg leading-6 font-medium text-primary">
              Applications
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-neutral-600">
              List of all registered cloud applications
            </p>
          </div>
          <div className="mt-3 sm:mt-0 flex flex-col sm:flex-row gap-3">
            <div className="relative rounded-md shadow-sm max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Search applications"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative inline-block text-left">
              <div>
                <button 
                  type="button" 
                  className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                  onClick={() => setDropdownOpen(dropdownOpen === 'filter' ? null : 'filter')}
                >
                  <Filter size={16} className="mr-2" />
                  {statusFilter || 'Filter Status'}
                  <ChevronDown className="ml-2 h-5 w-5" />
                </button>
              </div>

              {dropdownOpen === 'filter' && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <button
                      className={`block px-4 py-2 text-sm w-full text-left ${!statusFilter ? 'bg-gray-100 text-primary' : 'text-gray-700'}`}
                      onClick={() => {
                        setStatusFilter('');
                        setDropdownOpen(null);
                      }}
                    >
                      All Statuses
                    </button>
                    {statusOptions.map(status => (
                      <button
                        key={status}
                        className={`block px-4 py-2 text-sm w-full text-left ${statusFilter === status ? 'bg-gray-100 text-primary' : 'text-gray-700'}`}
                        onClick={() => {
                          setStatusFilter(status);
                          setDropdownOpen(null);
                        }}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mt-4 mx-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  <span>Name</span>
                  {sortField === 'name' && (
                    sortDirection === 'asc' ? 
                    <ArrowUp size={14} className="ml-1" /> : 
                    <ArrowDown size={14} className="ml-1" />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">
                  <span>Status</span>
                  {sortField === 'status' && (
                    sortDirection === 'asc' ? 
                    <ArrowUp size={14} className="ml-1" /> : 
                    <ArrowDown size={14} className="ml-1" />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('updatedAt')}
              >
                <div className="flex items-center">
                  <span>Last Updated</span>
                  {sortField === 'updatedAt' && (
                    sortDirection === 'asc' ? 
                    <ArrowUp size={14} className="ml-1" /> : 
                    <ArrowDown size={14} className="ml-1" />
                  )}
                </div>
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {paginatedApps.length > 0 ? (
              paginatedApps.map((app) => (
                <tr key={app.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-neutral-900 truncate max-w-xs">
                          {app.name}
                        </div>
                        {app.description && (
                          <div className="text-sm text-neutral-500 truncate max-w-xs">
                            {app.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(app.status)}`}>
                      {getStatusIcon(app.status)}
                      <span className="ml-1">{app.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                    {(app.updatedAt || app.updated_at) ? 
                      new Date(app.updatedAt || app.updated_at || '').toLocaleDateString() : 
                      'N/A'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                    <div className="flex items-center justify-end space-x-2">
                      <Link 
                        to={`/application/${app.id}`} 
                        className="text-primary hover:text-primary-dark p-1.5"
                      >
                        <EyeIcon size={18} />
                      </Link>
                      
                      {canModify && (
                        <>
                          <button
                            className="text-blue-600 hover:text-blue-900 p-1.5"
                            onClick={() => handleEditApplication(app)}
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900 p-1.5"
                            onClick={() => handleDeleteApplication(app.id || '')}
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-neutral-500">
                  No applications found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-neutral-200 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-neutral-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">
                  {Math.min(startIndex + itemsPerPage, filteredApplications.length)}
                </span> of{' '}
                <span className="font-medium">{filteredApplications.length}</span> applications
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(currentPage > 1 ? currentPage - 1 : 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-neutral-300 bg-white text-sm font-medium ${
                    currentPage === 1 ? 'text-neutral-300 cursor-not-allowed' : 'text-neutral-500 hover:bg-neutral-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                
                {/* Page number buttons */}
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === i + 1
                        ? 'z-10 bg-primary-50 border-primary-500 text-primary'
                        : 'bg-white border-neutral-300 text-neutral-500 hover:bg-neutral-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(currentPage < totalPages ? currentPage + 1 : totalPages)}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-neutral-300 bg-white text-sm font-medium ${
                    currentPage === totalPages ? 'text-neutral-300 cursor-not-allowed' : 'text-neutral-500 hover:bg-neutral-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Modal */}
      {editingApplication && (
        <ApplicationForm 
          application={editingApplication}
          onSubmit={handleFormSubmit}
          onCancel={() => setEditingApplication(null)}
          isUpdating={isUpdating}
        />
      )}
    </div>
  );
};

export default ApplicationList;

// Helper component for dropdown icon
const ChevronDown = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);