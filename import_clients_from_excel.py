"""
Import clients from Excel file into the database.
This script reads the client detail Excel file and creates/updates clients in the database.
"""
import sys
import os
import pandas as pd
from sqlalchemy.orm import Session
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.db.session import SessionLocal, engine
from app.models.client import Client

def clean_phone_number(phone):
    """Clean and standardize phone numbers"""
    if pd.isna(phone) or phone is None:
        return None
    phone_str = str(phone).strip()
    # Remove quotes and spaces
    phone_str = phone_str.replace('"', '').replace("'", '').replace(' ', '')
    if not phone_str or phone_str.lower() == 'nan':
        return None
    return phone_str

def clean_string(value):
    """Clean string values, return None for empty/NaN"""
    if pd.isna(value) or value is None:
        return None
    str_val = str(value).strip()
    if not str_val or str_val.lower() == 'nan':
        return None
    return str_val

def parse_registration_type(type_authority):
    """Parse TYPE/AUTHORITY field to determine registration flags"""
    sales_tax = False
    kpra = False
    
    if pd.notna(type_authority):
        type_str = str(type_authority).upper()
        if 'FBR' in type_str or 'SALES TAX' in type_str:
            sales_tax = True
        if 'KPRA' in type_str:
            kpra = True
    
    return sales_tax, kpra

def import_clients_from_excel(excel_path: str, db: Session):
    """Import clients from Excel file"""
    
    print(f"Reading Excel file: {excel_path}")
    
    # Read Excel file - row 0 contains the actual headers
    df = pd.read_excel(excel_path, header=0)
    
    # The actual column names are in the first row (index 0)
    # We need to use that row as headers
    df.columns = df.iloc[0]
    df = df[1:]  # Remove the header row from data
    df = df.reset_index(drop=True)
    
    print(f"Found {len(df)} client records")
    print(f"Columns: {df.columns.tolist()}")
    
    created_count = 0
    updated_count = 0
    skipped_count = 0
    error_count = 0
    
    for idx, row in df.iterrows():
        try:
            # Extract data from Excel columns
            business_name = clean_string(row.get('Name of Business/prop'))
            contact_person = clean_string(row.get('Contact person'))
            contact_number = clean_phone_number(row.get('Contact No.'))
            email_address = clean_string(row.get('Email/ Address'))
            userid = clean_string(row.get('userid'))
            password = clean_string(row.get('Password'))
            pin = clean_string(row.get('Pin'))
            notes = clean_string(row.get('notes about case'))
            type_authority = clean_string(row.get('TYPE/AUTHORITY'))
            material_type = clean_string(row.get('Material/NULL'))
            
            # Skip if no business name
            if not business_name:
                print(f"Row {idx + 1}: Skipping - no business name")
                skipped_count += 1
                continue
            
            # Parse registration types
            sales_tax_reg, kpra_reg = parse_registration_type(type_authority)
            
            # Check if client exists (by NTN/userid or business name)
            existing_client = None
            if userid:
                existing_client = db.query(Client).filter(Client.ntn == userid).first()
            
            if not existing_client:
                existing_client = db.query(Client).filter(Client.business_name == business_name).first()
            
            if existing_client:
                # Update existing client
                print(f"Row {idx + 1}: Updating client '{business_name}'")
                
                existing_client.business_name = business_name
                existing_client.client_name = business_name  # Use business name as client name
                if contact_person:
                    existing_client.contact_person = contact_person
                if contact_number:
                    existing_client.contact_number = contact_number
                if email_address:
                    # Check if it looks like an email (contains @)
                    if '@' in email_address:
                        existing_client.email = email_address
                    else:
                        # It might be an address
                        existing_client.address = email_address
                if userid:
                    existing_client.ntn = userid
                if password:
                    existing_client.client_password = password
                if notes:
                    existing_client.notes = notes
                
                existing_client.sales_tax_registered = sales_tax_reg
                existing_client.kpra_registered = kpra_reg
                existing_client.updated_at = datetime.utcnow()
                
                updated_count += 1
            else:
                # Create new client
                print(f"Row {idx + 1}: Creating new client '{business_name}'")
                
                new_client = Client(
                    client_name=business_name,
                    business_name=business_name,
                    contact_person=contact_person,
                    contact_number=contact_number,
                    ntn=userid,
                    client_password=password,
                    notes=notes,
                    sales_tax_registered=sales_tax_reg,
                    kpra_registered=kpra_reg,
                    is_active=True
                )
                
                # Set email or address
                if email_address:
                    if '@' in email_address:
                        new_client.email = email_address
                    else:
                        new_client.address = email_address
                
                db.add(new_client)
                created_count += 1
            
            # Commit after each record to avoid losing all data on error
            db.commit()
            
        except Exception as e:
            print(f"Row {idx + 1}: Error - {str(e)}")
            db.rollback()
            error_count += 1
            continue
    
    print("\n" + "="*60)
    print("Import Summary:")
    print(f"  Total records processed: {len(df)}")
    print(f"  Created: {created_count}")
    print(f"  Updated: {updated_count}")
    print(f"  Skipped: {skipped_count}")
    print(f"  Errors: {error_count}")
    print("="*60)
    
    return {
        'total': len(df),
        'created': created_count,
        'updated': updated_count,
        'skipped': skipped_count,
        'errors': error_count
    }

def main():
    """Main function"""
    excel_path = "client detail/Info all sales tax clients.xlsx"
    
    if not os.path.exists(excel_path):
        print(f"Error: Excel file not found at {excel_path}")
        sys.exit(1)
    
    print("Starting client import process...")
    print(f"Database: {engine.url}")
    
    # Create database session
    db = SessionLocal()
    
    try:
        results = import_clients_from_excel(excel_path, db)
        print("\nImport completed successfully!")
        
    except Exception as e:
        print(f"\nImport failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
        
    finally:
        db.close()

if __name__ == "__main__":
    main()
