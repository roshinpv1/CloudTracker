import React from 'react';
import { Application } from '../types';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ApplicationHeaderProps {
  application: Application;
}

const ApplicationHeader: React.FC<ApplicationHeaderProps> = ({ application }) => {
  // Function to safely format dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
      <div className="px-6 py-5 sm:flex sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center">
            <Link to="/" className="text-blue-600 hover:text-blue-800 mr-3">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{application.name}</h1>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Application ID: {application.id}
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <span className={`px-3 py-1.5 inline-flex text-sm leading-5 font-semibold rounded-full ${
            application.status === 'In Review' ? 'bg-yellow-100 text-yellow-800' :
            application.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
            application.status === 'Onboarded' ? 'bg-purple-100 text-purple-800' :
            'bg-green-100 text-green-800'
          }`}>
            {application.status}
          </span>
        </div>
      </div>
      <div className="border-t border-gray-200 px-6 py-4">
        <div className="flex space-x-8">
          <div>
            <span className="text-sm font-medium text-gray-500">Created</span>
            <p className="mt-1 text-sm text-gray-900">
              {formatDate(application.createdAt || application.created_at)}
            </p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Last Updated</span>
            <p className="mt-1 text-sm text-gray-900">
              {formatDate(application.updatedAt || application.updated_at)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationHeader;