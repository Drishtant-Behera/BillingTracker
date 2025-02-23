import os
import asyncio
import json
import requests
import shutil
import tempfile
import nest_asyncio
from docling.document_converter import DocumentConverter
from dotenv import load_dotenv
import pytesseract
from PIL import Image
import re

# Load environment variables
load_dotenv()
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434/api/generate")

# Set Tesseract path if necessary (adjust based on your installation)
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# Auto-detect Tesseract if not found
if not os.path.exists(pytesseract.pytesseract.tesseract_cmd):
    pytesseract.pytesseract.tesseract_cmd = shutil.which("tesseract")
    if not pytesseract.pytesseract.tesseract_cmd:
        raise FileNotFoundError("Tesseract OCR not found. Please install it and add it to your PATH.")

nest_asyncio.apply()

def parse_docling(file_path):
    try:
        converter = DocumentConverter()
        result = converter.convert(file_path)
        parsed_text = result.document.export_to_markdown()
        
        if not parsed_text.strip():
            return {"error": "Docling returned empty parsed text."}
        
        return parsed_text
    except Exception as e:
        return {"error": f"Error in Docling Parsing: {str(e)}"}

def parse_tesseract(file_path):
    try:
        image = Image.open(file_path)
        parsed_text = pytesseract.image_to_string(image)
        
        if not parsed_text.strip():
            return {"error": "Tesseract returned empty parsed text."}
        
        return parsed_text
    except Exception as e:
        return {"error": f"Error in Tesseract Parsing: {str(e)}"}

async def filter_with_ollama(parsed_text, filename):
    try:
        if not parsed_text.strip():
            return {"error": "Parsed text is empty. Cannot process."}

        # Simple structured JSON extraction prompt with improved instructions
        final_prompt = f"""
        Extract structured JSON fields from the following invoice text. Focus only on the key fields listed below:

        - **"date"**: Extract the **invoice date** from fields explicitly labeled **"Invoice Date"** or **"Dated"**.
          - **Ignore service dates** or any other general dates.
          - **Format**: `YYYY-MM-DD` only.
          - **If not found**, set to `null`.

        - **"amount"**: Extract the **total invoice amount**.
          - **Source**: Fields like **"Invoice Total", "Grand Total", "Total Payable"**.
          - **Format**: A **float** (e.g., `1917.00`).
          - **If not found**, set to `null`.

        - **"payment_mode_id"**: Extract the **payment method** if mentioned.
          - **Look for**: "Payment Mode", "Paid via", "Payment Type".
          - **Valid values**: "Credit Card", "Bank Transfer", "Cash", "UPI", "Cheque".
          - **Format**: String. If absent, set to `null`.

        - **"vendor"**: Extract the **vendor name** from the **"Billed From", "Seller", "Issued By"** sections.
          - **Exclude** any addresses, GST numbers, or extra details.
          - **Format**: A **string**. **If not found**, set to `null`.

        - **"vendor_gstin"**: Extract the **GSTIN of the vendor** if available.
          - **Must match**: A **15-character alphanumeric pattern**.
          - **Ignore the GSTIN** `29AAHCC34641ZR` entirely.
          - **Format**: A **string** or `null`.

        - **"invoice_number"**: Extract the **unique invoice number**.
          - **Look for**: "Invoice No.", "Invoice Number", or similar.
          - **Ignore placeholder text** like "PPP ET Invoice No.".
          - **Format**: String. **If not found**, set to `null`.

        - **"paid_by_id"**: Extract the **individual name** from the **"Bill To"** section.
          - **Ignore company names** or organization names.
          - **If no valid name found**, set to `null`.
          - **Format**: A **string**.

        - **"gst_or_nongst"**: Determine if this is a **GST invoice**.
          - **`true`** if a valid GSTIN **(other than `29AAHCC34641ZR`)** is present.
          - **`false`** otherwise.

### **Rules:**
1. **Strictly return valid JSON.**  
2. **No comments, explanations, or trailing text.**  
3. **Ensure correct types**:  
   - `date`: `YYYY-MM-DD`  
   - `amount`: `float`  
   - `payment_mode_id`: `string`  
   - `vendor`: `string`  
   - `vendor_gstin`: `string` or `null`  
   - `invoice_number`: `string`  
   - `paid_by_id`: `string` or `null`  
   - `gst_or_nongst`: `boolean`  
4. **If a field is missing, always return `null`.**

{parsed_text}
        """

        payload = {
            "model": OLLAMA_MODEL,
            "prompt": final_prompt,
            "stream": False
        }

        response = requests.post(OLLAMA_API_URL, json=payload)

        if response.status_code != 200:
            return {"error": f"Ollama API request failed with status {response.status_code}"}

        result = response.json()

        if "response" not in result or not result["response"].strip():
            return {"error": "Ollama returned an empty response."}

        raw_response = result["response"].strip()
        json_start = raw_response.find("{")
        json_end = raw_response.rfind("}")

        if json_start == -1 or json_end == -1:
            return {"error": "Ollama response did not contain valid JSON."}

        cleaned_json = raw_response[json_start:json_end+1]

        try:
            extracted_json = json.loads(cleaned_json)

            # Correct the GSTIN if invalid
            gstin_pattern = r"^[0-9A-Z]{15}$"
            if not re.match(gstin_pattern, str(extracted_json.get("vendor_gstin", ""))):
                extracted_json["vendor_gstin"] = None

            # Correct the gst_or_nongst field
            if extracted_json.get("vendor_gstin", "") == "29AAHCC34641ZR":
                extracted_json["gst_or_nongst"] = False
            else:
                extracted_json["gst_or_nongst"] = bool(extracted_json["vendor_gstin"])

            # Ensure missing fields are set to null
            for field in ["date", "amount", "payment_mode_id", "vendor", "vendor_gstin", "invoice_number", "paid_by_id"]:
                if field not in extracted_json:
                    extracted_json[field] = None

            # Save JSON file
            os.makedirs("processed_json", exist_ok=True)
            json_filename = f"processed_json/{filename}.json"
            with open(json_filename, "w", encoding="utf-8") as json_file:
                json.dump(extracted_json, json_file, indent=4)

            print("\n--- Extracted JSON ---")
            print(json.dumps(extracted_json, indent=4))
            print(f"\nJSON file saved as: {json_filename}")

            return {"message": "JSON file saved successfully.", "file_path": json_filename}
        except json.JSONDecodeError as e:
            print("Ollama cleaned response:", cleaned_json)
            return {"error": f"Ollama response is not valid JSON: {str(e)}"}
    except Exception as e:
        return {"error": f"Error in Ollama Filtering: {str(e)}"}

def process_file(file_path):
    try:
        parser = input("Which parser would you like to use? (docling/tesseract): ").strip().lower()
        if parser == "docling":
            parsed_text = parse_docling(file_path)
        elif parser == "tesseract":
            parsed_text = parse_tesseract(file_path)
        else:
            return {"error": "Invalid parser specified."}

        if isinstance(parsed_text, dict) and "error" in parsed_text:
            return parsed_text

        print("\n--- Parsed Text from Parser ---")
        print(parsed_text)

        print("\nFiltering parsed text using Ollama...")

        filename = os.path.splitext(os.path.basename(file_path))[0]  # Extract filename without extension
        filtered_json = asyncio.run(filter_with_ollama(parsed_text, filename))

        print("\nFiltered JSON response from Ollama:")
        print(filtered_json)

        return filtered_json
    except Exception as e:
        return {"error": f"Error in processing file: {str(e)}"}



