import logging
import os
from dotenv import load_dotenv
from langchain.prompts import PromptTemplate
from langchain.schema.runnable import RunnableSequence
from langchain_ollama import ChatOllama

# Load environment variables
load_dotenv()
LLAMA_API_KEY = os.getenv("LLAMA_API_KEY", "your_default_api_key_here")  # Replace if needed

# Initialize the LLM model
llm = ChatOllama(
    model="llama3",
    temperature=0,
    api_key=LLAMA_API_KEY
)

def run_llm_chain(prompt_template, text):
    """
    Process text with an LLM using the provided prompt template.

    Parameters:
        prompt_template (str): Template for the prompt.
        text (str): Text to process.

    Returns:
        str: Output from the LLM, or an error message.
    """
    inp_var = "adjective"

    try:
        prompt = PromptTemplate(
            input_variables=[inp_var],
            template=f"{prompt_template} {{{inp_var}}}"
        )

        if prompt:
            chain = prompt | llm
            output = chain.invoke({inp_var: text})

            if output:
                return output
            else:
                logging.error("No output received from the LLM.")
                return "Error: No output received from the LLM."
        else:
            logging.error("Prompt could not be created.")
            return "Error: Prompt could not be created."

    except Exception as e:
        error_message = str(e)
        if "context_length_exceeded" in error_message:
            logging.error("Error sending the file to LLM: Token limit exceeded.")
            return "Error: Token limit exceeded."
        elif "Request too large" in error_message:
            logging.error("Error sending the file to LLM: File size too large.")
            return "Error: File size too large."
        elif "[WinError 10061]" in error_message:
            logging.error("Ollama is not running or the model is unavailable.")
            return "Error: Ollama is not running. Please start Ollama and load the model."
        else:
            logging.error(f"Error processing file: {e}")
            return f"Error: {e}"

def main():
    """
    Main function to interact with the user.
    """
    logging.basicConfig(level=logging.ERROR)  # Configure logging level

    print("Welcome to the Llama 3 Chatbot!")
    print("Type 'exit' to quit the chatbot.\n")

    prompt_template = input("Enter a prompt template (use '{{adjective}}' as a placeholder): ")

    while True:
        user_input = input("\nEnter your text (or 'exit' to quit): ")
        if user_input.lower() == 'exit':
            print("Goodbye!")
            break

        print("\nProcessing your input...")
        response = run_llm_chain(prompt_template, user_input)
        print(f"Response: {response}")

if __name__ == "__main__":
    main()
