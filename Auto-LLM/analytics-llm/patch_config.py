import re
with open('config.py', 'r') as f:
    content = f.read()

# Make OPENROUTER_BASE_URL dynamic based on the model name
new_base_url_logic = """
    # Dynamic Base URL: If using Gemini, route to Google's OpenAI-compatible endpoint
    if os.getenv("ANALYTICS_MODEL", "meta-llama/llama-4-maverick:free").startswith("gemini"):
        OPENROUTER_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"
    else:
        OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
"""

content = re.sub(r'OPENROUTER_BASE_URL\s*=\s*"https://openrouter.ai/api/v1"', new_base_url_logic.strip(), content)

with open('config.py', 'w') as f:
    f.write(content)
