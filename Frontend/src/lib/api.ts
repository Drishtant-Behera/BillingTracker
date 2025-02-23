import { handleSupabaseError } from './supabase';

const API_URL = 'http://localhost:8000'; // Update this with your FastAPI server URL

export async function uploadInvoice(file: File) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload invoice');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error uploading invoice:', error);
    throw new Error(handleSupabaseError(error));
  }
}

export async function confirmValidation(data: any, confirmed: boolean) {
  try {
    const formData = new FormData();
    formData.append('json_data', JSON.stringify(data));
    formData.append('confirmed', confirmed.toString());

    const response = await fetch(`${API_URL}/confirm-validation`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to confirm validation');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error confirming validation:', error);
    throw new Error(handleSupabaseError(error));
  }
}