import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase, handleSupabaseError } from '../lib/supabase';
import { uploadToS3 } from '../lib/s3';
import { FileText } from 'lucide-react';
import { BillingRecord, Category, PaymentMode } from '../types/billing';
import { FormFields } from './billing-form/FormFields';
import { ImageUpload } from './billing-form/ImageUpload';
import { StoragePathSelector } from './billing-form/StoragePathSelector';

type BillingFormData = Omit<BillingRecord, 'id' | 'created_at' | 'updated_at'>;

export default function BillingForm() {
  const location = useLocation();
  const prefillData = location.state?.prefillData;
  const uploadedFile = location.state?.uploadedFile;

  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(uploadedFile || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<BillingFormData>({
    date: prefillData?.date || new Date().toISOString().split('T')[0],
    amount: prefillData?.amount || 0,
    payment_mode_id: prefillData?.payment_mode_id || '',
    vendor: prefillData?.vendor || '',
    vendor_gstin: prefillData?.vendor_gstin || '',
    invoice_number: prefillData?.invoice_number || '',
    paid_by_id: prefillData?.paid_by_id || '',
    category_id: prefillData?.category_id || '',
    gst_or_nongst: prefillData?.gst_or_nongst || false,
    bill_url: null,
    storage_path: null
  });

  useEffect(() => {
    fetchFormData();
  }, []);

  async function fetchFormData() {
    try {
      const [categoriesData, paymentModesData] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('payment_modes').select('*').order('name')
      ]);

      if (categoriesData.error) throw categoriesData.error;
      if (paymentModesData.error) throw paymentModesData.error;

      setCategories(categoriesData.data || []);
      setPaymentModes(paymentModesData.data || []);
    } catch (error: any) {
      const errorMessage = handleSupabaseError(error);
      console.error('Error fetching form data:', { error, message: errorMessage });
      alert(`Error loading form data: ${errorMessage}`);
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));

      // Upload the file immediately
      setIsUploading(true);
      if (formData.storage_path) {
        const billUrl = await uploadToS3(file, formData.storage_path);
        setFormData(prev => ({ ...prev, bill_url: billUrl }));
      } else {
        throw new Error('Please select a storage path first');
      }
    } catch (error: any) {
      alert(error.message);
      event.target.value = '';
    } finally {
      setIsUploading(false);
    }
  };

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => handleFileSelect(e as React.ChangeEvent<HTMLInputElement>);
    input.click();
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setFormData(prev => ({ ...prev, bill_url: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('billing_records')
        .insert([formData]);

      if (error) throw error;

      alert('Billing record added successfully!');
      setFormData({
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        payment_mode_id: '',
        vendor: '',
        vendor_gstin: '',
        invoice_number: '',
        paid_by_id: '',
        category_id: '',
        gst_or_nongst: false,
        bill_url: null,
        storage_path: null
      });
      clearSelectedFile();
    } catch (error: any) {
      const errorMessage = handleSupabaseError(error);
      console.error('Error adding record:', error);
      alert(`Error adding record: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Manual Billing Form</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <StoragePathSelector
          value={formData.storage_path || ''}
          onChange={(path) => setFormData({ ...formData, storage_path: path })}
          date={formData.date}
          gstApplicable={formData.gst_or_nongst}
        />

        <ImageUpload
          handleFileSelect={handleFileSelect}
          handleCameraCapture={handleCameraCapture}
          clearSelectedFile={clearSelectedFile}
          previewUrl={previewUrl}
          isUploading={isUploading}
        />

        <FormFields
          formData={formData}
          setFormData={setFormData}
          categories={categories}
          paymentModes={paymentModes}
        />

        <div className="mt-6">
          <button
            type="submit"
            disabled={isSubmitting || isUploading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Record'}
          </button>
        </div>
      </form>
    </div>
  );
}