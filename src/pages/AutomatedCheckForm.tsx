import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AutomatedCheckFormComponent from '../components/AutomatedCheckForm';
import { createAutomatedCheck, AutomatedCheckCreate } from '../data/api';
import { useNotification } from '../context/NotificationContext';

const AutomatedCheckFormPage: React.FC = () => {
  const { id, itemId } = useParams<{ id?: string; itemId?: string }>();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const isEdit = !!id;

  const handleSubmit = async (data: AutomatedCheckCreate) => {
    setSubmitting(true);
    try {
      await createAutomatedCheck(data);
      addNotification('success', 'Automated check created successfully');
      navigate('/automations');
    } catch (error) {
      console.error('Error creating automated check:', error);
      addNotification('error', 'Failed to create automated check');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-20 pb-6 bg-neutral-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link to="/automations" className="text-primary hover:text-primary-dark inline-flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Back to Automations</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            {isEdit ? 'Edit Automated Check' : 'Add New Automated Check'}
          </h1>
        </div>

                 <AutomatedCheckFormComponent
            checklistItemId={itemId}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/automations')}
            isUpdating={submitting}
            isEdit={isEdit}
          />
      </div>
    </div>
  );
};

export default AutomatedCheckFormPage; 