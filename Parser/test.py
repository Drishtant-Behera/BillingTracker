from main import process_file

def main():
    print("Welcome to the Llama Parser Tester!")
    file_path = input("Enter the file path to process: ").strip()
    
    print("\n--- Parsing... ---")
    parsed_json = process_file(file_path) 

    if "error" in parsed_json:
        print(parsed_json["error"])
        return

    print("\n--- JSON File Saved Successfully ---")
    print(parsed_json)

if __name__ == "__main__":
    main()
