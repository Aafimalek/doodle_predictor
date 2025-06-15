# 🎨 Quick Draw AI - Doodle Predictor Game

A fun and interactive drawing game where you sketch objects and an AI tries to guess what you're drawing! Built with Flask, JavaScript, and Google Gemini AI.

## 🌟 Features

### 🎮 **Game Mechanics**
- **20-second drawing challenges** with 6 rounds per game
- **Real-time AI prediction** using Google Gemini AI
- **Smart prediction timing** - AI analyzes drawings after you stop drawing
- **Comprehensive scoring system** with performance feedback
- **Speech synthesis** for audio feedback

### 🎯 **AI Intelligence**
- **Advanced image recognition** powered by Google Gemini 2.0 Flash
- **Forgiving matching system** with 600+ synonyms and variations
- **Robust error handling** - game continues even if AI fails
- **Optimized for quick sketches** and imperfect drawings

### 🎨 **Drawing Experience**
- **Smooth canvas drawing** with touch support for mobile
- **Precise 4px brush size** for detailed sketches
- **Clear canvas functionality** with keyboard shortcuts
- **Responsive design** that works on all devices

### 🎭 **Visual Design**
- **Modern UI** with gradient backgrounds and glass-morphism effects
- **Animated feedback** for correct/incorrect answers
- **Professional typography** using Google Fonts
- **Beautiful color schemes** and smooth transitions

### 📚 **Word Database**
- **250+ carefully curated words** optimized for 2D drawing
- **Anti-repeat system** ensures variety across game sessions
- **Simple, recognizable objects** suitable for quick sketches
- **Categorized by difficulty** and drawing complexity

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Google AI API key (Gemini)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Aafimalek/doodle-predictor.git
   cd doodle-predictor
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt 
   ```

4. **Set up environment variables**
   Create a `.env` file in the `backend` directory:
   ```env
   GOOGLE_API_KEY=your_gemini_api_key_here
   ```

5. **Run the application**
   ```bash
   cd backend
   python app.py
   ```

6. **Open your browser**
   Navigate to `http://localhost:5000`

## 🎯 How to Play

1. **Click "Start Game"** to begin your drawing challenge
2. **Read the word** you need to draw (e.g., "cat", "car", "tree")
3. **Draw on the canvas** - you have 20 seconds per round
4. **AI analyzes your drawing** automatically after you stop drawing
5. **Get instant feedback** - correct answers earn points!
6. **Complete 6 rounds** to see your final score

### 🎮 Controls
- **Mouse/Touch**: Draw on canvas
- **Space**: Start new game
- **C**: Clear canvas during game
- **Clear Canvas**: Reset drawing area

## 🛠️ Technology Stack

### Backend
- **Flask** - Web framework
- **Google Gemini AI** - Image recognition and text generation
- **PIL (Pillow)** - Image processing
- **Python-dotenv** - Environment management

### Frontend
- **HTML5 Canvas** - Drawing interface
- **Vanilla JavaScript** - Game logic and interactions
- **CSS3** - Modern styling with gradients and animations
- **Web Speech API** - Audio feedback

### AI Configuration
- **Model**: Google Gemini 2.0 Flash
- **Temperature**: 0.3 (consistent results)
- **Image preprocessing**: Auto-contrast with 512x512 resolution
- **Fallback handling**: Graceful degradation for failed predictions

## 📁 Project Structure

```
doodle-predictor/
├── backend/
│   ├── app.py              # Flask application
│   ├── gemini_predict.py   # AI prediction logic
│   ├── check.py           # API testing utility
│   └── .env               # Environment variables
├── static/
│   └── script.js          # Frontend JavaScript
├── templates/
│   └── index.html         # Game interface
└── README.md              # This file
```

## 🙏 Acknowledgments

- **Google Gemini AI** for powerful image recognition
- **Quick Draw by Google** for inspiration
- **Modern CSS techniques** for beautiful UI design
- **Open source community** for tools and libraries

## 🐛 Troubleshooting

### Common Issues

**API Key Error**
```bash
# Make sure your .env file contains:
GOOGLE_API_KEY=your_actual_api_key
```

**Canvas Not Working**
- Check browser compatibility (modern browsers required)
- Ensure JavaScript is enabled
- Try clearing browser cache

**AI Predictions Failing**
- Verify internet connection
- Check API key validity
- Monitor console for error messages

**Game Too Easy/Hard**
- Adjust word list in `backend/app.py`
- Modify synonym matching in `static/script.js`
- Change timer settings for difficulty

## 📊 Performance Tips

- **Drawing**: Simple, clear shapes work best
- **Timing**: Let the AI analyze after you finish drawing
- **Strategy**: Focus on key features of objects
- **Practice**: Common objects are easier to recognize

---

**Enjoy drawing and testing your artistic skills against AI!** 🎨🤖

Made with ❤️ and lots of ☕ 