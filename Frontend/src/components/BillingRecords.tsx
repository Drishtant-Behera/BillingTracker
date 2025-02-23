import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Table } from 'lucide-react';
import { BillingRecord, Category, PaymentMode } from '../types/billing';
import { RecordsTable } from './billing-records/RecordsTable';
import { Filters } from './billing-records/Filters';
import { EditModal } from './billing-records/EditModal';
import { ImagePreviewModal } from './billing-records/ImagePreviewModal';

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
};

export default function BillingRecords() {
  const [records, setRecords] = useState<BillingRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [editingRecord, setEditingRecord] = useState<BillingRecord | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    paidById: '',
    categoryId: '',
    paymentModeId: '',
    amountMin: '',
    amountMax: '',
    vendor: '',
    gstin: '',
    invoice: '',
    gstApplicable: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [records, filters]);

  async function fetchData() {
    try {
      const [recordsData, categoriesData, paymentModesData] = await Promise.all([
        supabase
          .from('billing_records')
          .select(`
            *,
            categories(name),
            payment_modes(name)
          `)
          .order('date', { ascending: false }),
        supabase.from('categories').select('*').order('name'),
        supabase.from('payment_modes').select('*').order('name')
      ]);

      if (recordsData.error) throw recordsData.error;
      if (categoriesData.error) throw categoriesData.error;
      if (paymentModesData.error) throw paymentModesData.error;

      // Get all unique paid_by_ids
      const paidByIds = [...new Set(recordsData.data.map(record => record.paid_by_id))];
      
      // Fetch user emails and additional info
      const { data: userData, error: userError } = await supabase.rpc('get_user_emails', {
        user_ids: paidByIds
      });

      if (userError) {
        console.error('Error fetching user emails:', userError);
        throw userError;
      }

      // Get additional user info
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, full_name');

      if (usersError) {
        console.error('Error fetching user data:', usersError);
        throw usersError;
      }

      // Create a map of user IDs to full names
      const fullNameMap = new Map(usersData?.map(user => [user.id, user.full_name]) || []);

      // Create a map of user IDs to emails
      const userEmailMap = new Map(userData?.map(user => [user.id, user.email]) || []);

      // Add user email to each record
      const recordsWithEmail = recordsData.data.map(record => ({
        ...record,
        user_email: userEmailMap.get(record.paid_by_id) || 'Unknown'
      }));

      // Combine user data for profiles
      const allProfiles = userData.map(user => ({
        id: user.id,
        email: user.email,
        full_name: fullNameMap.get(user.id) || null
      }));

      setRecords(recordsWithEmail);
      setFilteredRecords(recordsWithEmail);
      setCategories(categoriesData.data || []);
      setPaymentModes(paymentModesData.data || []);
      setProfiles(allProfiles);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error fetching records. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const applyFilters = () => {
    let filtered = [...records];

    if (filters.startDate) {
      filtered = filtered.filter(record => record.date >= filters.startDate);
    }
    if (filters.endDate) {
      filtered = filtered.filter(record => record.date <= filters.endDate);
    }
    if (filters.paidById) {
      filtered = filtered.filter(record => record.paid_by_id === filters.paidById);
    }
    if (filters.categoryId) {
      filtered = filtered.filter(record => record.category_id === filters.categoryId);
    }
    if (filters.paymentModeId) {
      filtered = filtered.filter(record => record.payment_mode_id === filters.paymentModeId);
    }
    if (filters.amountMin) {
      filtered = filtered.filter(record => record.amount >= parseFloat(filters.amountMin));
    }
    if (filters.amountMax) {
      filtered = filtered.filter(record => record.amount <= parseFloat(filters.amountMax));
    }
    if (filters.vendor) {
      filtered = filtered.filter(record => 
        record.vendor.toLowerCase().includes(filters.vendor.toLowerCase())
      );
    }
    if (filters.gstin) {
      filtered = filtered.filter(record => 
        record.vendor_gstin?.toLowerCase().includes(filters.gstin.toLowerCase())
      );
    }
    if (filters.invoice) {
      filtered = filtered.filter(record => 
        record.invoice_number?.toLowerCase().includes(filters.invoice.toLowerCase())
      );
    }
    if (filters.gstApplicable !== '') {
      filtered = filtered.filter(record => 
        record.gst_or_nongst === (filters.gstApplicable === 'true')
      );
    }

    setFilteredRecords(filtered);
  };

  const handleEditRecord = async (record: BillingRecord) => {
    try {
      const { error } = await supabase
        .from('billing_records')
        .update({
          date: record.date,
          amount: record.amount,
          payment_mode_id: record.payment_mode_id,
          vendor: record.vendor,
          vendor_gstin: record.vendor_gstin,
          invoice_number: record.invoice_number,
          paid_by_id: record.paid_by_id,
          category_id: record.category_id,
          gst_or_nongst: record.gst_or_nongst
        })
        .eq('id', record.id);

      if (error) throw error;

      alert('Record updated successfully!');
      fetchData();
      setShowEditModal(false);
      setEditingRecord(null);
    } catch (error) {
      console.error('Error updating record:', error);
      alert('Error updating record. Please try again.');
    }
  };

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      paidById: '',
      categoryId: '',
      paymentModeId: '',
      amountMin: '',
      amountMax: '',
      vendor: '',
      gstin: '',
      invoice: '',
      gstApplicable: ''
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center">Loading records...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <Table className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Billing Records</h2>
      </div>

      <Filters
        filters={filters}
        setFilters={setFilters}
        categories={categories}
        paymentModes={paymentModes}
        paidBy={profiles}
        resetFilters={resetFilters}
        recordCount={filteredRecords.length}
      />

      <RecordsTable
        records={filteredRecords}
        onEdit={(record) => {
          setEditingRecord(record);
          setShowEditModal(true);
        }}
        onImagePreview={setPreviewImage}
        formatDate={formatDate}
        formatAmount={formatAmount}
      />

      <EditModal
        editingRecord={editingRecord}
        setEditingRecord={setEditingRecord}
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        handleEditRecord={handleEditRecord}
        categories={categories}
        paymentModes={paymentModes}
        profiles={profiles}
      />

      <ImagePreviewModal
        previewImage={previewImage}
        setPreviewImage={setPreviewImage}
      />
    </div>
  );
}