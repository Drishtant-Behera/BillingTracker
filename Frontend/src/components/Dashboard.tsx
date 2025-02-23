import React, { useState, useEffect, useMemo } from 'react';
import {
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { format, parseISO, startOfYear, endOfYear } from 'date-fns';
import { supabase } from '../lib/supabase';
import { Category } from '../types/billing';
import { Filter } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const THEME_BLUE = '#3B82F6'; // Tailwind blue-500

type DashboardData = {
  id: string;
  date: string;
  amount: number;
  vendor: string;
  category_id: string;
  categories: { name: string };
};

type FilterState = {
  startDate: string;
  endDate: string;
  categoryId: string;
  vendor: string;
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    startDate: startOfYear(new Date()).toISOString().split('T')[0],
    endDate: endOfYear(new Date()).toISOString().split('T')[0],
    categoryId: '',
    vendor: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      const [recordsResponse, categoriesResponse] = await Promise.all([
        supabase
          .from('billing_records')
          .select(`
            id,
            date,
            amount,
            vendor,
            category_id,
            categories (name)
          `)
          .gte('date', filters.startDate)
          .lte('date', filters.endDate)
          .order('date', { ascending: true }),
        supabase
          .from('categories')
          .select('*')
          .order('name')
      ]);

      if (recordsResponse.error) throw recordsResponse.error;
      if (categoriesResponse.error) throw categoriesResponse.error;

      setData(recordsResponse.data || []);
      setCategories(categoriesResponse.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(record => {
      const matchesCategory = !filters.categoryId || record.category_id === filters.categoryId;
      const matchesVendor = !filters.vendor || 
        record.vendor.toLowerCase().includes(filters.vendor.toLowerCase());
      return matchesCategory && matchesVendor;
    });
  }, [data, filters]);

  const categoryData = useMemo(() => {
    const categoryTotals = filteredData.reduce((acc, record) => {
      const categoryName = record.categories?.name || 'Uncategorized';
      acc[categoryName] = (acc[categoryName] || 0) + record.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2))
    }));
  }, [filteredData]);

  const monthlyData = useMemo(() => {
    const monthlyTotals = filteredData.reduce((acc, record) => {
      const month = format(parseISO(record.date), 'MMM yyyy');
      acc[month] = (acc[month] || 0) + record.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(monthlyTotals).map(([month, amount]) => ({
      month,
      amount: Number(amount.toFixed(2))
    }));
  }, [filteredData]);

  const vendorData = useMemo(() => {
    const vendorTotals = filteredData.reduce((acc, record) => {
      acc[record.vendor] = (acc[record.vendor] || 0) + record.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(vendorTotals)
      .map(([name, value]) => ({
        name,
        amount: Number(value.toFixed(2))
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [filteredData]);

  const totalYearlyExpenses = useMemo(() => {
    return filteredData.reduce((total, record) => total + record.amount, 0);
  }, [filteredData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Financial Dashboard</h1>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <span className="text-sm text-gray-600">Filters</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="date"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={filters.categoryId}
            onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Vendor</label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={filters.vendor}
            onChange={(e) => setFilters({ ...filters, vendor: e.target.value })}
            placeholder="Search vendor..."
          />
        </div>
      </div>

      {/* Total Yearly Expenses */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-medium text-gray-700 mb-2">Total Expenses</h2>
        <p className="text-4xl font-bold text-blue-600">
          {new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
          }).format(totalYearlyExpenses)}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categorical Expenses */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium text-gray-700 mb-4">Expenses by Category</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => entry.name}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => 
                  new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR'
                  }).format(value as number)
                } />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium text-gray-700 mb-4">Monthly Expenses</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => 
                  new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR'
                  }).format(value as number)
                } />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke={THEME_BLUE}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Vendor Spending */}
        <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
          <h2 className="text-lg font-medium text-gray-700 mb-4">Top Vendors by Spending</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={vendorData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" />
                <Tooltip formatter={(value) => 
                  new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR'
                  }).format(value as number)
                } />
                <Legend />
                <Bar dataKey="amount" fill={THEME_BLUE} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}