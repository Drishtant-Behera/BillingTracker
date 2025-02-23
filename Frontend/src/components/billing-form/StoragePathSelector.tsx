import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { FolderStructure } from '../../types/billing';

type StoragePathSelectorProps = {
  value: string;
  onChange: (path: string) => void;
  date: string;
  gstApplicable: boolean;
};

export function StoragePathSelector({ value, onChange, date, gstApplicable }: StoragePathSelectorProps) {
  const [folderStructure, setFolderStructure] = useState<FolderStructure[]>([]);
  const [selectedRoot, setSelectedRoot] = useState<string>('');

  useEffect(() => {
    fetchFolderStructure();
  }, []);

  useEffect(() => {
    if (date && selectedRoot) {
      const dateObj = new Date(date);
      const month = dateObj.getMonth();
      const year = dateObj.getFullYear();
      
      // Determine financial year
      let financialYear: string;
      if (month >= 3) { // April onwards
        financialYear = `${year}-${year + 1}`;
      } else { // January to March
        financialYear = `${year - 1}-${year}`;
      }

      // Format month string with correct year (e.g., 'apr-2024' or 'jan-2025')
      const monthNames = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
      const monthIndex = (month + 9) % 12; // Adjust for financial year (April = 0)
      
      // For months Jan-Mar, use the second year of the financial year
      // For months Apr-Dec, use the first year of the financial year
      const monthYear = month >= 3 ? year : year;
      const monthString = `${monthNames[monthIndex]}-${monthYear}`;

      // Build the complete path
      const path = `s3://orgbills/${selectedRoot}/${financialYear}/${gstApplicable ? 'gst' : 'nongst'}/${monthString}/`;
      onChange(path);
    }
  }, [date, selectedRoot, gstApplicable]);

  const fetchFolderStructure = async () => {
    const { data, error } = await supabase
      .from('folder_structure')
      .select('*')
      .eq('path_type', 'root')
      .order('value');
    
    if (error) {
      console.error('Error fetching folder structure:', error);
      return;
    }

    setFolderStructure(data);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Storage Path</label>
        <div className="mt-1">
          <select
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={selectedRoot}
            onChange={(e) => setSelectedRoot(e.target.value)}
          >
            <option value="">Select Root Folder</option>
            {folderStructure.map((folder) => (
              <option key={folder.id} value={folder.value}>
                {folder.value}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="text-sm text-gray-500">
        Selected path: {value || 'No path selected'}
      </div>
    </div>
  );
}