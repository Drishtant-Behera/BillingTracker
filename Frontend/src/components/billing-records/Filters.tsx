import React from 'react';
import { X } from 'lucide-react';
import { Category, PaymentMode } from '../../types/billing';

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
};

type FiltersProps = {
  filters: any;
  setFilters: (filters: any) => void;
  categories: Category[];
  paymentModes: PaymentMode[];
  paidBy: Profile[];
  resetFilters: () => void;
  recordCount: number;
};

export function Filters({ filters, setFilters, categories, paymentModes, paidBy, resetFilters, recordCount }: FiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow mb-6 p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">{recordCount} records found</span>
        <button
          onClick={resetFilters}
          className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <X className="w-4 h-4" />
          Reset Filters
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Paid By</label>
          <select
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={filters.paidById}
            onChange={(e) => setFilters({ ...filters, paidById: e.target.value })}
          >
            <option value="">All</option>
            {paidBy.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name ? `${user.full_name} (${user.email})` : user.email}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={filters.categoryId}
            onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
          >
            <option value="">All</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
          <select
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={filters.paymentModeId}
            onChange={(e) => setFilters({ ...filters, paymentModeId: e.target.value })}
          >
            <option value="">All</option>
            {paymentModes.map((mode) => (
              <option key={mode.id} value={mode.id}>{mode.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
          <input
            type="number"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={filters.amountMin}
            onChange={(e) => setFilters({ ...filters, amountMin: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount</label>
          <input
            type="number"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={filters.amountMax}
            onChange={(e) => setFilters({ ...filters, amountMax: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
          <input
            type="text"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={filters.vendor}
            onChange={(e) => setFilters({ ...filters, vendor: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
          <input
            type="text"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={filters.gstin}
            onChange={(e) => setFilters({ ...filters, gstin: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Invoice</label>
          <input
            type="text"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={filters.invoice}
            onChange={(e) => setFilters({ ...filters, invoice: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">GST Applicable</label>
          <select
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={filters.gstApplicable}
            onChange={(e) => setFilters({ ...filters, gstApplicable: e.target.value })}
          >
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
      </div>
    </div>
  );
}