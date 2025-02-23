import React from 'react';
import { X } from 'lucide-react';
import { BillingRecord, Category, PaymentMode } from '../../types/billing';

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
};

type EditModalProps = {
  editingRecord: BillingRecord | null;
  setEditingRecord: (record: BillingRecord | null) => void;
  showEditModal: boolean;
  setShowEditModal: (show: boolean) => void;
  handleEditRecord: (record: BillingRecord) => Promise<void>;
  categories: Category[];
  paymentModes: PaymentMode[];
  profiles: Profile[];
};

export function EditModal({
  editingRecord,
  setEditingRecord,
  showEditModal,
  setShowEditModal,
  handleEditRecord,
  categories,
  paymentModes,
  profiles
}: EditModalProps) {
  if (!showEditModal || !editingRecord) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Edit Record</h3>
          <button
            onClick={() => {
              setShowEditModal(false);
              setEditingRecord(null);
            }}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          if (editingRecord) {
            handleEditRecord(editingRecord);
          }
        }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={editingRecord.date}
                onChange={(e) => setEditingRecord({ ...editingRecord, date: e.target.value })}
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
                value={editingRecord.amount}
                onChange={(e) => setEditingRecord({ ...editingRecord, amount: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={editingRecord.category_id}
                onChange={(e) => setEditingRecord({ ...editingRecord, category_id: e.target.value })}
              >
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
                value={editingRecord.payment_mode_id}
                onChange={(e) => setEditingRecord({ ...editingRecord, payment_mode_id: e.target.value })}
              >
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
              value={editingRecord.vendor}
              onChange={(e) => setEditingRecord({ ...editingRecord, vendor: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Vendor GSTIN</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={editingRecord.vendor_gstin || ''}
                onChange={(e) => setEditingRecord({ ...editingRecord, vendor_gstin: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={editingRecord.invoice_number || ''}
                onChange={(e) => setEditingRecord({ ...editingRecord, invoice_number: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Paid By</label>
              <select
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={editingRecord.paid_by_id}
                onChange={(e) => setEditingRecord({ ...editingRecord, paid_by_id: e.target.value })}
              >
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.full_name ? `${profile.full_name} (${profile.email})` : profile.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center mt-6">
              <input
                type="checkbox"
                id="edit_gst_or_nongst"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={editingRecord.gst_or_nongst}
                onChange={(e) => setEditingRecord({ ...editingRecord, gst_or_nongst: e.target.checked })}
              />
              <label htmlFor="edit_gst_or_nongst" className="ml-2 block text-sm text-gray-700">
                GST Applicable
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setEditingRecord(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}