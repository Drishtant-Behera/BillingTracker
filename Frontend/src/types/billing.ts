export type Category = {
  id: string;
  name: string;
  key: string;
};

export type PaymentMode = {
  id: string;
  name: string;
};

export type AuthUser = {
  id: string;
  email: string;
};

export type FolderStructure = {
  id: string;
  path_type: 'root' | 'year' | 'type' | 'month';
  value: string;
  parent_id: string | null;
};

export type BillingRecord = {
  id: string;
  created_at: string;
  updated_at: string;
  date: string;
  amount: number;
  payment_mode_id: string;
  vendor: string;
  vendor_gstin?: string;
  invoice_number?: string;
  paid_by_id: string;
  category_id: string;
  gst_or_nongst: boolean;
  bill_url?: string | null;
  storage_path?: string | null;
  auth_users?: AuthUser;
};