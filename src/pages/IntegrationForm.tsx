import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import IntegrationFormComponent from '../components/IntegrationForm';
import { createIntegration, getIntegration, updateIntegration, IntegrationConfigCreate } from '../data/api';
import { useNotification } from '../context/NotificationContext';

const IntegrationFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [integration, setIntegration] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(!!id);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const isEdit = !!id;

  useEffect(() => {
    const fetchIntegration = async () => {
      if (id) {
        try {
          const data = await getIntegration(id);
          setIntegration(data);
        } catch (error) {
          console.error('Error fetching integration:', error);
          addNotification('error', 'Failed to load integration data');
          navigate('/automations');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchIntegration();
  }, [id, addNotification, navigate]);

  const handleSubmit = async (data: IntegrationConfigCreate) => {
    setSubmitting(true);
    try {
      if (isEdit && id) {
        await updateIntegration(id, data);
        addNotification('success', 'Integration updated successfully');
      } else {
        await createIntegration(data);
        addNotification('success', 'Integration created successfully');
      }
      navigate('/automations');
    } catch (error) {
      console.error('Error saving integration:', error);
      addNotification('error', `Failed to ${isEdit ? 'update' : 'create'} integration`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-20 pb-6 bg-neutral-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-6 bg-neutral-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link to="/automations" className="text-primary hover:text-primary-dark inline-flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Back to Automations</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            {isEdit ? 'Edit Integration' : 'Add New Integration'}
          </h1>
        </div>

                 <IntegrationFormComponent
            integration={integration}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/automations')}
            isUpdating={submitting}
            isEdit={isEdit}
          />
      </div>
    </div>
  );
};

export default IntegrationFormPage; 