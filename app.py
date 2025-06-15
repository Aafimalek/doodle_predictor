from flask import Flask, request, jsonify, render_template
from gemini_predict import classify_image
from dotenv import load_dotenv
from PIL import Image
from io import BytesIO
import os
import base64
import traceback
import random
import google.generativeai as genai


load_dotenv()
app = Flask(__name__, static_folder="static", template_folder="templates")

# Predefined list of drawing-friendly words - Simple 2D objects only
DRAWING_WORDS = [
    # Basic Shapes
    "circle", "square", "triangle", "rectangle", "oval", "diamond", "star", "heart", "cross", "plus",
    "arrow", "line", "dot", "curve", "zigzag", "wave", "spiral", "ring", "moon", "crescent",
    
    # Simple Faces & Expressions
    "face", "eye", "mouth", "smile", "nose", "ear", "head", "hair", "hat", "glasses",
    
    # Basic Animals (simple outlines)
    "cat", "dog", "fish", "bird", "duck", "pig", "cow", "bee", "ant", "snake",
    "rabbit", "mouse", "frog", "turtle", "butterfly", "spider", "worm", "snail", "bat", "owl",
    
    # Simple Objects
    "cup", "ball", "book", "key", "pen", "spoon", "fork", "knife", "plate", "bottle",
    "bag", "box", "can", "jar", "coin", "button", "ring", "clock", "phone", "tv",
    
    # Transportation (simple side view)
    "car", "bus", "bike", "boat", "plane", "train", "truck", "wheel", "balloon", "kite",
    
    # Simple Food
    "apple", "banana", "orange", "cake", "pizza", "ice cream", "cookie", "donut", "egg", "bread",
    "cheese", "hot dog", "hamburger", "pie", "lemon", "cherry", "grape", "carrot", "mushroom", "corn",
    
    # Nature - Simple 2D
    "tree", "flower", "leaf", "grass", "sun", "cloud", "rain", "snow", "lightning", "rainbow",
    "mountain", "hill", "river", "lake", "fire", "rock", "cactus", "palm tree", "rose", "tulip",
    
    # Household Items (simple outline)
    "house", "door", "window", "table", "chair", "bed", "lamp", "umbrella", "broom", "scissors",
    "hammer", "nail", "saw", "brush", "comb", "soap", "towel", "mirror", "picture", "vase",
    
    # Clothing (flat/2D view)
    "shirt", "pants", "dress", "shoe", "sock", "gloves", "tie", "belt", "shorts", "skirt",
    
    # Simple Symbols & Signs
    "flag", "crown", "trophy", "medal", "gift", "present", "candle", "bell", "musical note", "peace sign",
    "stop sign", "arrow sign", "exclamation mark", "question mark", "dollar sign", "percent sign", "at sign", "hashtag", "ampersand", "checkmark",
    
    # Basic Letters & Numbers (as shapes)
    "letter a", "letter b", "letter c", "letter x", "letter o", "number 1", "number 2", "number 3", "number 8", "number 0",
    
    # Simple Games & Toys
    "dice", "cards", "chess piece", "puzzle piece", "yo-yo", "top", "ball", "kite", "balloon", "bubbles",
    
    # Office/School Items
    "paper", "pencil", "crayon", "marker", "eraser", "ruler", "stapler", "clip", "envelope", "stamp",
    
    # Simple Tools
    "wrench", "screwdriver", "pliers", "rope", "chain", "hook", "magnet", "spring", "gear", "screw",
    
    # Additional Simple 2D Objects
    "bone", "feather", "wing", "tail", "paw", "horn", "beak", "fin", "shell", "egg shell",
    "leaf shape", "petal", "stem", "branch", "twig", "acorn", "pinecone", "seed", "berry", "nut",
    "flame", "smoke cloud", "water drop", "icicle", "snowflake", "raindrop", "wind lines", "dust cloud", "bubble", "spark",
    "footprint", "handprint", "fingerprint", "shadow", "silhouette", "outline", "border", "frame", "edge", "corner",
    "bandage", "pill", "thermometer", "stethoscope", "syringe", "mask", "band-aid", "crutch", "wheelchair", "glasses frame"
]

# Keep track of recently used words to avoid immediate repeats
recent_words = []
MAX_RECENT_WORDS = 10

@app.route('/')
def home():
    return render_template("index.html")

@app.route("/random-word", methods=["GET"])
def get_random_word():
    global recent_words
    
    # Get available words (excluding recent ones)
    available_words = [word for word in DRAWING_WORDS if word not in recent_words]
    
    # If we've used too many words, reset but keep the last few
    if len(available_words) < 5:
        recent_words = recent_words[-3:] if len(recent_words) > 3 else []
        available_words = [word for word in DRAWING_WORDS if word not in recent_words]
    
    # Select a random word
    word = random.choice(available_words)
    
    # Add to recent words and maintain the list size
    recent_words.append(word)
    if len(recent_words) > MAX_RECENT_WORDS:
        recent_words.pop(0)
    
    return jsonify({"word": word})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data_url = request.json.get("image")
        header, encoded = data_url.split(",", 1)
        img_bytes = base64.b64decode(encoded)
        img = Image.open(BytesIO(img_bytes)).convert("RGB")
        label = classify_image(img)
        return jsonify({"label": label})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
