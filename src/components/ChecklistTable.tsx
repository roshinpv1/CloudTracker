import React, { useState } from 'react';
import { Category, ChecklistItem, Status } from '../types';
import StatusBadge from './StatusBadge';
import { Edit, Link as LinkIcon, Save, X, Trash2 } from 'lucide-react';
import { updateChecklistItem, deleteChecklistItem } from '../data/api';
import { useNotification } from '../context/NotificationContext';

interface ChecklistTableProps {
  category: Category;
  canEdit?: boolean;
  onItemUpdated?: () => void;  // Callback to refresh data
}

const ChecklistTable: React.FC<ChecklistTableProps> = ({ category, canEdit = false, onItemUpdated }) => {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<ChecklistItem>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const { addNotification } = useNotification();

  const handleEditClick = (item: ChecklistItem) => {
    if (!canEdit) return;
    setEditingItemId(item.id);
    setEditData({
      status: item.status,
      comments: item.comments || '',
      evidence: item.evidence || ''
    });
  };

  const handleSaveClick = async (item: ChecklistItem) => {
    if (!canEdit) return;
    setIsUpdating(true);
    
    try {
      console.log('Saving item with data:', editData);
      await updateChecklistItem(item.id, editData);
      addNotification('success', 'Checklist item updated successfully');
      
      // Call the callback to refresh data if provided
      if (onItemUpdated) {
        onItemUpdated();
      }
    } catch (error) {
      console.error('Failed to update checklist item:', error);
      addNotification('error', 'Failed to update checklist item');
    } finally {
      setIsUpdating(false);
      setEditingItemId(null);
      setEditData({});
    }
  };

  const handleCancelClick = () => {
    setEditingItemId(null);
    setEditData({});
  };

  const handleDeleteClick = async (item: ChecklistItem) => {
    if (!canEdit) return;
    if (!window.confirm('Are you sure you want to delete this checklist item?')) return;
    
    setIsUpdating(true);
    
    try {
      await deleteChecklistItem(item.id);
      addNotification('success', 'Checklist item deleted successfully');
      
      // Call the callback to refresh data if provided
      if (onItemUpdated) {
        onItemUpdated();
      }
    } catch (error) {
      console.error('Failed to delete checklist item:', error);
      addNotification('error', 'Failed to delete checklist item');
    } finally {
      setIsUpdating(false);
    }
  };

  // Function to safely format dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error, 'for date string:', dateString);
      return 'Invalid date';
    }
  };

  // Ensure category has items
  if (!category.items || !Array.isArray(category.items) || category.items.length === 0) {
    return (
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="px-4 py-4 sm:px-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {category.name}
          </h3>
        </div>
        <div className="p-4 text-center text-gray-500">
          No items in this category.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
      <div className="px-4 py-4 sm:px-6 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          {category.name}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Requirement
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Updated
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Comments
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Evidence
              </th>
              {canEdit && (
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {category.items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{item.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingItemId === item.id ? (
                    <select
                      className="block w-full py-1 px-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={editData.status || item.status}
                      onChange={(e) => setEditData({ ...editData, status: e.target.value as Status })}
                      disabled={isUpdating}
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Verified">Verified</option>
                    </select>
                  ) : (
                    <StatusBadge status={item.status} />
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(item.lastUpdated)}
                </td>
                <td className="px-6 py-4">
                  {editingItemId === item.id ? (
                    <textarea
                      className="block w-full py-1 px-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={editData.comments || ''}
                      onChange={(e) => setEditData({ ...editData, comments: e.target.value })}
                      rows={2}
                      disabled={isUpdating}
                    />
                  ) : (
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {item.comments || '-'}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingItemId === item.id ? (
                    <input
                      type="text"
                      className="block w-full py-1 px-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={editData.evidence || ''}
                      onChange={(e) => setEditData({ ...editData, evidence: e.target.value })}
                      placeholder="URL to evidence"
                      disabled={isUpdating}
                    />
                  ) : (
                    <div className="text-sm text-gray-900">
                      {item.evidence ? (
                        <a
                          href={item.evidence}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <LinkIcon size={14} />
                          View
                        </a>
                      ) : (
                        '-'
                      )}
                    </div>
                  )}
                </td>
                {canEdit && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingItemId === item.id ? (
                      <div className="flex space-x-2 justify-end">
                        <button
                          onClick={() => handleSaveClick(item)}
                          className="text-green-600 hover:text-green-900"
                          disabled={isUpdating}
                        >
                          <Save size={18} />
                        </button>
                        <button
                          onClick={handleCancelClick}
                          className="text-gray-600 hover:text-gray-900"
                          disabled={isUpdating}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-2 justify-end">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="text-blue-600 hover:text-blue-900"
                          disabled={isUpdating}
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(item)}
                          className="text-red-600 hover:text-red-900"
                          disabled={isUpdating}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChecklistTable;