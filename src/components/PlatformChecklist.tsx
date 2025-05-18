import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Platform, Category } from '../types';
import { getPlatform, getPlatformChecklist } from '../data/api';
import { requestBatchValidation } from '../data/validationApi';
import ChecklistTable from './ChecklistTable';
import Loading from './Loading';
import { Play, AlertCircle } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const PlatformChecklist: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const { addNotification } = useNotification();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (id) {
          const platformData = await getPlatform(id);
          setPlatform(platformData);
          
          const checklistData = await getPlatformChecklist(id);
          setCategories(checklistData);
        }
      } catch (err) {
        console.error("Error fetching platform checklist:", err);
        setError("Failed to load platform checklist");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const refreshChecklist = async () => {
    try {
      if (id) {
        const checklistData = await getPlatformChecklist(id);
        setCategories(checklistData);
      }
    } catch (err) {
      console.error("Error refreshing checklist:", err);
      addNotification('error', 'Failed to refresh checklist');
    }
  };

  // Handle requesting validation for the entire platform checklist
  const handleFullValidation = async () => {
    if (!categories || categories.length === 0) {
      addNotification('warning', 'No checklist items to validate');
      return;
    }
    
    setIsValidating(true);
    
    try {
      // Collect all checklist item IDs from all categories
      const allItemIds = categories.flatMap(category => 
        category.items ? category.items.map(item => item.id) : []
      );
      
      if (allItemIds.length === 0) {
        addNotification('warning', 'No checklist items to validate');
        return;
      }
      
      const response = await requestBatchValidation({
        checklist_item_ids: allItemIds,
        validation_type: 'ai_assisted',
        evidence_context: `Full platform validation for ${platform?.name || 'platform'}`
      });
      
      addNotification('success', `Validation requested for ${allItemIds.length} items across all categories`);
      
      // Refresh the checklist to show updated status
      refreshChecklist();
    } catch (error) {
      console.error('Failed to request full validation:', error);
      addNotification('error', 'Failed to request full validation');
    } finally {
      setIsValidating(false);
    }
  };

  if (loading) return <Loading />;
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-md mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white shadow rounded-lg p-4 mb-5">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{platform?.name} Checklist</h2>
            <p className="text-gray-600">{platform?.description || 'No description available'}</p>
          </div>
          <button
            onClick={handleFullValidation}
            disabled={isValidating}
            className={`inline-flex items-center px-4 py-2 border border-indigo-300 text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 ${isValidating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Play size={18} className="mr-2" />
            {isValidating ? 'Processing...' : 'Request Full Validation'}
          </button>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-4 text-center text-gray-500">
          No checklist categories found for this platform.
        </div>
      ) : (
        categories.map(category => (
          <ChecklistTable 
            key={category.id} 
            category={category} 
            canEdit={true}
            onItemUpdated={refreshChecklist}
          />
        ))
      )}
    </div>
  );
};

export default PlatformChecklist; 