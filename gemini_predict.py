import google.generativeai as genai
from PIL import Image, ImageOps
import os
import logging

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Configure model with more reliable settings
generation_config = {
    "temperature": 0.3,  # Lower temperature for more consistent results
    "top_p": 0.8,       # More focused responses
    "top_k": 20,        # Fewer token options for reliability
    "max_output_tokens": 20,  # Shorter responses
}

# Use the more reliable standard model instead of experimental one
model_vision = genai.GenerativeModel(
    "models/gemini-2.0-flash",  # More stable model
    generation_config=generation_config
)

def preprocess_image(image):
    # More forgiving image preprocessing
    image = image.resize((512, 512))
    image = ImageOps.autocontrast(image, cutoff=2)  # Less aggressive contrast
    return image

def classify_image(image):
    try:
        image = preprocess_image(image)
        
        # Simplified, safer prompt
        prompt = (
            "Look at this simple doodle drawing and identify what object it shows. "
            "Give me just one word for the main object you see. "
            "Examples: cat, car, house, tree, ball, etc."
        )
        
        response = model_vision.generate_content([prompt, image])
        
        # Proper error handling for failed responses
        if response.candidates and len(response.candidates) > 0:
            candidate = response.candidates[0]
            
            # Check if response was blocked or filtered
            if candidate.finish_reason == 2:  # SAFETY
                print("Response blocked by safety filter, returning default")
                return "unknown"
            elif candidate.finish_reason == 3:  # RECITATION  
                print("Response blocked by recitation filter, returning default")
                return "unknown"
            elif candidate.finish_reason == 4:  # OTHER
                print("Response blocked for other reasons, returning default")
                return "unknown"
            
            # Try to get the text content
            if candidate.content and candidate.content.parts:
                text = candidate.content.parts[0].text
                if text:
                    return text.strip().lower()
        
        # If we get here, something went wrong
        print("No valid response content, returning default")
        return "unknown"
        
    except Exception as e:
        print(f"Error in classify_image: {str(e)}")
        return "unknown"

