import React, { useEffect, useState } from 'react';
import { Category, PaymentMode } from '../../types/billing';
import { supabase } from '../../lib/supabase';

type FormFieldsProps = {
  formData: any;
  setFormData: (data: any) => void;
  categories: Category[];
  paymentModes: PaymentMode[];
};

export function FormFields({ formData, setFormData, categories, paymentModes }: FormFieldsProps) {
  const [users, setUsers] = useState<{ id: string; email: string; full_name: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [manualPaidBy, setManualPaidBy] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all users from auth.users using the get_user_emails function
      const { data: userData, error: emailError } = await supabase.rpc('get_user_emails', {
        user_ids: [] // Empty array to get all users
      });

      if (emailError) {
        console.error('Error fetching user emails:', emailError);
        setError('Failed to fetch user emails');
        return;
      }

      // Get additional user info from the users table
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, full_name');

      if (usersError) {
        console.error('Error fetching user data:', usersError);
        setError('Failed to fetch user data');
        return;
      }

      // Create a map of user IDs to full names
      const fullNameMap = new Map(usersData?.map(user => [user.id, user.full_name]) || []);

      // Combine the data
      const combinedUsers = userData.map(user => ({
        id: user.id,
        email: user.email,
        full_name: fullNameMap.get(user.id) || null
      }));

      setUsers(combinedUsers);

      // Set current user as default if no paid_by_id is set
      if (!formData.paid_by_id && !useManualEntry) {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          setFormData({ ...formData, paid_by_id: currentUser.id });
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePaidByChange = (value: string) => {
    if (useManualEntry) {
      setManualPaidBy(value);
      setFormData({ ...formData, paid_by_id: value });
    } else {
      setFormData({ ...formData, paid_by_id: value });
    }
  };

  const togglePaidByMode = () => {
    setUseManualEntry(!useManualEntry);
    // Reset the paid_by_id when switching modes
    setFormData({ ...formData, paid_by_id: '' });
    setManualPaidBy('');
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Amount</label>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={formData.amount || ''}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value ? parseFloat(e.target.value) : 0 })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={formData.category_id || ''}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Payment Mode</label>
          <select
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={formData.payment_mode_id || ''}
            onChange={(e) => setFormData({ ...formData, payment_mode_id: e.target.value })}
          >
            <option value="">Select payment mode</option>
            {paymentModes.map((mode) => (
              <option key={mode.id} value={mode.id}>{mode.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Vendor</label>
        <input
          type="text"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={formData.vendor || ''}
          onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Vendor GSTIN</label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={formData.vendor_gstin || ''}
            onChange={(e) => setFormData({ ...formData, vendor_gstin: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={formData.invoice_number || ''}
            onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700">Paid By</label>
            <button
              type="button"
              onClick={togglePaidByMode}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              {useManualEntry ? 'Use Dropdown' : 'Manual Entry'}
            </button>
          </div>
          
          {useManualEntry ? (
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={manualPaidBy}
              onChange={(e) => handlePaidByChange(e.target.value)}
              placeholder="Enter name"
            />
          ) : (
            <select
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={formData.paid_by_id || ''}
              onChange={(e) => handlePaidByChange(e.target.value)}
            >
              <option value="">Select user</option>
              {loading ? (
                <option value="" disabled>Loading users...</option>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name ? `${user.full_name} (${user.email})` : user.email}
                  </option>
                ))
              ) : (
                <option value="" disabled>No users found</option>
              )}
            </select>
          )}
          {error && (
            <div className="mt-1 text-sm text-red-600">
              {error}
            </div>
          )}
          {loading && !useManualEntry && (
            <div className="mt-1 text-sm text-gray-500">
              Loading users...
            </div>
          )}
        </div>
        <div className="flex items-center mt-6">
          <input
            type="checkbox"
            id="gst_or_nongst"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            checked={formData.gst_or_nongst || false}
            onChange={(e) => setFormData({ ...formData, gst_or_nongst: e.target.checked })}
          />
          <label htmlFor="gst_or_nongst" className="ml-2 block text-sm text-gray-700">
            GST Applicable
          </label>
        </div>
      </div>
    </>
  );
}