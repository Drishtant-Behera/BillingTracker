from fastapi import FastAPI, File, UploadFile, HTTPException, Form
import shutil
import os
import json
import csv
import supabase
from parser.main import process_file
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase_client = supabase.create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()
UPLOAD_DIR = "uploaded_files"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/status")
def get_status():
    return {"status": "FastAPI backend is running"}

@app.post("/upload")
async def upload_invoice(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    result = process_file(file_path)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return {"parsed_json": result}

@app.post("/send-parsed-data")
async def send_parsed_data(json_data: str = Form(...)):
    parsed_data = json.loads(json_data)
    return {"parsed_data": parsed_data}

@app.post("/confirm-validation")
async def confirm_validation(json_data: str = Form(...), confirmed: bool = Form(...)):
    parsed_data = json.loads(json_data)
    
    if not confirmed:
        return {"message": "User declined the parsed data", "data": parsed_data}
    
    csv_file_path = os.path.join(UPLOAD_DIR, "invoice_data.csv")
    fieldnames = parsed_data.keys()
    
    with open(csv_file_path, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerow(parsed_data)
    
    supabase_client.table("billing_records").insert(parsed_data).execute()
    
    return {"message": "Data validated and stored successfully", "csv_path": csv_file_path}
