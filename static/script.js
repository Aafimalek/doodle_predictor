const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
ctx.lineWidth = 4;
ctx.lineCap = "round";
ctx.strokeStyle = "#000000";

let drawing = false, timer, countdown = 20;
let target = "", currentRound = 0, score = 0, maxRounds = 6;
let gameActive = false, hasDrawnAnything = false;
let lastPredictionTime = 0, lastDrawTime = 0;
let roundInProgress = false;
let predictionInProgress = false;
const PREDICTION_THROTTLE = 2000; // Wait 5 seconds between predictions
const DRAW_SETTLE_TIME = 2000; // Wait 3 seconds after user stops drawing

// Helper function to get accurate mouse coordinates
function getMouseCoordinates(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

// --- Drawing Setup ---
canvas.addEventListener("mousedown", e => {
  if (!gameActive) return;
  const coords = getMouseCoordinates(e);
  drawing = true;
  hasDrawnAnything = true;
  lastDrawTime = Date.now();
  ctx.beginPath();
  ctx.moveTo(coords.x, coords.y);
});

canvas.addEventListener("mousemove", e => {
  if (drawing && gameActive) {
    lastDrawTime = Date.now(); // Update draw time on every move
    const coords = getMouseCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  }
});

canvas.addEventListener("mouseup", () => {
  drawing = false;
  if (gameActive && hasDrawnAnything) {
    lastDrawTime = Date.now(); // Mark when user stopped drawing
  }
});

// Helper function to get accurate touch coordinates
function getTouchCoordinates(touch) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  return {
    x: (touch.clientX - rect.left) * scaleX,
    y: (touch.clientY - rect.top) * scaleY
  };
}

// Add touch support for mobile
canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  if (!gameActive) return;
  const touch = e.touches[0];
  const coords = getTouchCoordinates(touch);
  drawing = true;
  hasDrawnAnything = true;
  lastDrawTime = Date.now();
  ctx.beginPath();
  ctx.moveTo(coords.x, coords.y);
});

canvas.addEventListener("touchmove", e => {
  e.preventDefault();
  if (drawing && gameActive) {
    lastDrawTime = Date.now();
    const touch = e.touches[0];
    const coords = getTouchCoordinates(touch);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  }
});

canvas.addEventListener("touchend", e => {
  e.preventDefault();
  drawing = false;
  if (gameActive && hasDrawnAnything) {
    lastDrawTime = Date.now();
  }
});

document.getElementById("clear").onclick = clearCanvas;

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  hasDrawnAnything = false;
  lastDrawTime = 0;
  if (gameActive) {
    const predictionEl = document.getElementById("prediction");
    predictionEl.innerText = "Start drawing...";
    predictionEl.className = "";
  }
}

// --- Game Flow ---
async function startGame() {
  if (gameActive) return;
  
  speechSynthesis.cancel();
  
  gameActive = true;
  roundInProgress = false;
  currentRound = 0;
  score = 0;
  document.getElementById("start").innerText = "Playing...";
  document.getElementById("start").disabled = true;
  
  nextRound();
}

async function nextRound() {
  if (roundInProgress || !gameActive) return;
  
  if (currentRound >= maxRounds) return endGame();

  roundInProgress = true;
  currentRound++;
  
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  
  clearCanvas();
  hasDrawnAnything = false;
  lastDrawTime = 0;
  lastPredictionTime = 0;
  predictionInProgress = false;
  
  document.getElementById("word").innerText = `Round ${currentRound}/${maxRounds} - Loading...`;
  document.getElementById("prediction").innerText = "Loading word...";
  
  try {
    await fetchWord();
    document.getElementById("prediction").innerText = "Start drawing...";
  } catch (error) {
    console.error("Failed to fetch word:", error);
    document.getElementById("word").innerText = "Error loading word. Try again.";
    endGame();
    return;
  }

  countdown = 20;
  updateTimer();
  
  timer = setInterval(async () => {
    if (!gameActive || !roundInProgress) {
      clearInterval(timer);
      return;
    }
    
    countdown--;
    updateTimer();

    // Smart prediction logic
    const now = Date.now();
    const timeSinceLastDraw = now - lastDrawTime;
    const timeSinceLastPrediction = now - lastPredictionTime;
    
    // Only predict if:
    // 1. User has drawn something
    // 2. User hasn't drawn for at least 3 seconds (stopped drawing)
    // 3. At least 5 seconds since last prediction
    // 4. Not currently predicting
    if (hasDrawnAnything && 
        timeSinceLastDraw >= DRAW_SETTLE_TIME && 
        timeSinceLastPrediction >= PREDICTION_THROTTLE && 
        !predictionInProgress) {
      
      await makePrediction();
    }

    if (countdown <= 0) {
      handleRoundEnd(false);
    }
  }, 1000);
}

async function makePrediction() {
  if (!gameActive || !roundInProgress || predictionInProgress) return;
  
  predictionInProgress = true;
  document.getElementById("prediction").innerText = "Analyzing drawing...";
  
  try {
    const label = await predictDrawing();
    
    if (gameActive && roundInProgress) {
      // Clean up the prediction text
      const cleanLabel = cleanPredictionText(label);
      document.getElementById("prediction").innerText = `Prediction: ${cleanLabel}`;
      lastPredictionTime = Date.now();

      if (isCorrectGuess(cleanLabel, target)) {
        handleRoundEnd(true);
        return;
      }
    }
  } catch (error) {
    console.error("Prediction error:", error);
    if (gameActive && roundInProgress) {
      document.getElementById("prediction").innerText = "Prediction failed - keep drawing!";
    }
  } finally {
    predictionInProgress = false;
  }
}

function cleanPredictionText(prediction) {
  if (!prediction) return "unknown";
  
  // Remove common unwanted phrases and clean the text
  let cleaned = prediction.toLowerCase()
    .replace(/^(this is a|it's a|looks like a|appears to be a|seems like a)/i, '')
    .replace(/\b(doodle|drawing|sketch|image|picture)\b/gi, '')
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .trim();
  
  // Take only the first meaningful word
  const words = cleaned.split(/\s+/).filter(word => word.length > 2);
  return words[0] || "unknown";
}

async function handleRoundEnd(isCorrect) {
  if (!roundInProgress || !gameActive) return;
  
  roundInProgress = false;
  predictionInProgress = false;
  
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  
  speechSynthesis.cancel();
  
  if (isCorrect) {
    score++;
    celebrate();
    const predictionEl = document.getElementById("prediction");
    predictionEl.innerText = `✅ Correct! It was a ${target}`;
    predictionEl.className = "success";
    speak(`Correct! It's a ${target}`);
  } else {
    timeUp();
    const predictionEl = document.getElementById("prediction");
    predictionEl.innerText = `❌ Time's up! It was a ${target}`;
    predictionEl.className = "error";
    speak(`Time's up! It was a ${target}`);
  }
  
  await delay(3000);
  
  if (gameActive) {
    nextRound();
  }
}

function updateTimer() {
  const timerElement = document.getElementById("timer");
  timerElement.innerText = `⏱️ ${countdown}`;
  
  if (countdown <= 5) {
    timerElement.style.color = "#ff4444";
    timerElement.style.fontWeight = "bold";
  } else if (countdown <= 10) {
    timerElement.style.color = "#ff8800";
  } else {
    timerElement.style.color = "#000";
    timerElement.style.fontWeight = "normal";
  }
}

function celebrate() {
  const wordElement = document.getElementById("word");
  wordElement.style.color = "#00aa00";
  wordElement.style.transform = "scale(1.1)";
  setTimeout(() => {
    if (gameActive) {
      wordElement.style.color = "#000";
      wordElement.style.transform = "scale(1)";
    }
  }, 1000);
}

function timeUp() {
  const timerElement = document.getElementById("timer");
  timerElement.style.backgroundColor = "#ff4444";
  timerElement.style.color = "white";
  timerElement.style.padding = "5px";
  setTimeout(() => {
    if (gameActive) {
      timerElement.style.backgroundColor = "transparent";
      timerElement.style.color = "#000";
      timerElement.style.padding = "0";
    }
  }, 1000);
}

function endGame() {
  gameActive = false;
  roundInProgress = false;
  predictionInProgress = false;
  
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  
  speechSynthesis.cancel();
  
  document.getElementById("word").innerText = "🎉 Game Complete!";
  document.getElementById("timer").innerText = "";
  
  const percentage = Math.round((score / maxRounds) * 100);
  let performanceMsg = "";
  if (percentage >= 80) performanceMsg = " - Excellent! 🏆";
  else if (percentage >= 60) performanceMsg = " - Good job! 👍";
  else if (percentage >= 40) performanceMsg = " - Keep practicing! 📈";
  else performanceMsg = " - Try again! 💪";
  
  document.getElementById("prediction").innerText = `🎯 Final Score: ${score}/${maxRounds} (${percentage}%)${performanceMsg}`;
  
  document.getElementById("start").innerText = "Play Again";
  document.getElementById("start").disabled = false;
  
  speak(`Game complete! You scored ${score} out of ${maxRounds}. ${performanceMsg.replace(/[^\w\s]/gi, '')}`);
}

// --- Helpers ---
async function fetchWord() {
  const res = await fetch("/random-word");
  if (!res.ok) throw new Error("Failed to fetch word");
  const data = await res.json();
  target = data.word;
  document.getElementById("word").innerText = `Draw: ${target} (Round ${currentRound}/${maxRounds})`;
}

async function predictDrawing() {
  if (!hasDrawnAnything) return "nothing drawn";
  
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const ctx2 = tempCanvas.getContext("2d");

  ctx2.fillStyle = "#fff";
  ctx2.fillRect(0, 0, canvas.width, canvas.height);
  ctx2.drawImage(canvas, 0, 0);

  const image = tempCanvas.toDataURL("image/png");
  const res = await fetch("/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image })
  });
  
  if (!res.ok) throw new Error("Prediction failed");
  const data = await res.json();
  return data.label || "unknown";
}

function isCorrectGuess(prediction, target) {
  if (!prediction || !target) return false;
  
  const pred = prediction.toLowerCase().trim();
  const targ = target.toLowerCase().trim();
  
  // Exact match
  if (pred === targ) return true;
  
  // Contains match (more lenient)
  if (pred.includes(targ) || targ.includes(pred)) return true;
  
  // Remove common words that might be added
  const cleanPred = pred.replace(/\b(a|an|the|drawing|sketch|doodle|picture|image|of)\b/g, '').trim();
  if (cleanPred === targ || cleanPred.includes(targ) || targ.includes(cleanPred)) return true;
  
  // Expanded synonyms and similar words
  const synonyms = {
    // Transportation
    'car': ['automobile', 'vehicle', 'truck', 'van', 'bus', 'auto', 'sedan', 'suv', 'taxi', 'cab'],
    'plane': ['airplane', 'aircraft', 'jet', 'airliner', 'fighter', 'chopper', 'helicopter'],
    'boat': ['ship', 'yacht', 'vessel', 'sailboat', 'motorboat', 'cruise', 'ferry'],
    'bike': ['bicycle', 'cycle', 'motorbike', 'motorcycle', 'scooter'],
    'train': ['locomotive', 'subway', 'metro', 'rail', 'choo choo'],
    'truck': ['lorry', 'pickup', 'semi', 'trailer', 'delivery'],
    'bus': ['coach', 'shuttle', 'transit'],
    
    // Buildings & Structures
    'house': ['home', 'building', 'hut', 'cabin', 'cottage', 'mansion', 'residence', 'dwelling'],
    'door': ['entrance', 'exit', 'gate', 'portal'],
    'window': ['glass', 'pane', 'opening'],
    'table': ['desk', 'counter', 'surface'],
    'chair': ['seat', 'stool', 'bench'],
    'bed': ['mattress', 'bunk', 'cot'],
    
    // Animals
    'cat': ['kitten', 'feline', 'kitty', 'pussy', 'tabby', 'tom'],
    'dog': ['puppy', 'canine', 'pup', 'doggy', 'hound', 'mutt', 'pooch'],
    'bird': ['duck', 'chicken', 'eagle', 'owl', 'robin', 'crow', 'pigeon', 'sparrow', 'parrot'],
    'fish': ['shark', 'goldfish', 'salmon', 'tuna', 'bass', 'trout', 'cod'],
    'cow': ['bull', 'cattle', 'beef', 'ox', 'calf'],
    'pig': ['hog', 'swine', 'boar', 'piglet'],
    'horse': ['pony', 'stallion', 'mare', 'foal', 'colt'],
    'sheep': ['lamb', 'ewe', 'ram', 'wool'],
    'rabbit': ['bunny', 'hare', 'cottontail'],
    'mouse': ['rat', 'rodent', 'hamster'],
    'bear': ['cub', 'grizzly', 'panda', 'polar'],
    'lion': ['cat', 'feline', 'mane', 'king'],
    'fox': ['vixen', 'red', 'arctic'],
    'owl': ['hoot', 'barn', 'screech'],
    'bat': ['wing', 'vampire', 'fruit'],
    'bee': ['wasp', 'hornet', 'bumble', 'honey'],
    'ant': ['insect', 'worker', 'fire'],
    'spider': ['web', 'tarantula', 'black widow'],
    'butterfly': ['moth', 'wings', 'caterpillar'],
    'snake': ['serpent', 'viper', 'python', 'cobra'],
    'turtle': ['tortoise', 'shell', 'sea'],
    'frog': ['toad', 'tadpole', 'amphibian'],
    
    // Shapes & Symbols
    'circle': ['ring', 'round', 'oval', 'ball', 'sphere', 'dot', 'wheel'],
    'square': ['rectangle', 'box', 'cube', 'block', 'tile'],
    'triangle': ['arrow', 'pyramid', 'cone', 'peak'],
    'star': ['stars', 'asterisk', 'sparkle', 'twinkle'],
    'heart': ['love', 'valentine', 'cardiac'],
    'cross': ['plus', 'x', 'crucifix', 'intersection'],
    'arrow': ['pointer', 'direction', 'bow'],
    'diamond': ['gem', 'jewel', 'crystal', 'stone'],
    'line': ['stripe', 'bar', 'dash', 'stroke'],
    'dot': ['point', 'spot', 'circle', 'period'],
    
    // Body Parts
    'face': ['head', 'person', 'human', 'portrait'],
    'eye': ['eyes', 'eyeball', 'pupil', 'iris'],
    'mouth': ['lips', 'smile', 'teeth', 'tongue'],
    'nose': ['nostril', 'snout'],
    'ear': ['ears', 'hearing'],
    'hand': ['palm', 'fist', 'fingers'],
    'foot': ['feet', 'toe', 'heel'],
    'hair': ['mane', 'fur', 'locks'],
    'head': ['skull', 'brain', 'face'],
    
    // Food & Drinks
    'apple': ['fruit', 'red', 'green', 'granny'],
    'banana': ['fruit', 'yellow', 'peel'],
    'orange': ['fruit', 'citrus', 'juice'],
    'pizza': ['pie', 'slice', 'cheese', 'pepperoni'],
    'cake': ['dessert', 'birthday', 'sweet', 'frosting'],
    'cookie': ['biscuit', 'cracker', 'sweet'],
    'bread': ['loaf', 'slice', 'toast', 'bun'],
    'cheese': ['dairy', 'cheddar', 'swiss'],
    'egg': ['yolk', 'shell', 'oval', 'chicken'],
    'milk': ['dairy', 'white', 'cow'],
    'ice cream': ['dessert', 'cold', 'scoop', 'cone'],
    'donut': ['doughnut', 'ring', 'glazed'],
    'hamburger': ['burger', 'patty', 'bun'],
    'hot dog': ['sausage', 'wiener', 'frank'],
    
    // Nature
    'tree': ['plant', 'pine', 'oak', 'maple', 'branch', 'trunk', 'leaves'],
    'flower': ['rose', 'daisy', 'tulip', 'bloom', 'blossom', 'petal'],
    'leaf': ['leaves', 'green', 'autumn', 'fall'],
    'grass': ['lawn', 'green', 'field', 'turf'],
    'sun': ['sunshine', 'bright', 'yellow', 'solar'],
    'moon': ['crescent', 'full', 'lunar', 'night'],
    'cloud': ['sky', 'white', 'fluffy', 'storm'],
    'rain': ['water', 'drops', 'storm', 'wet'],
    'snow': ['white', 'flake', 'cold', 'winter'],
    'fire': ['flame', 'burn', 'hot', 'red'],
    'water': ['liquid', 'blue', 'wet', 'ocean'],
    'rock': ['stone', 'boulder', 'pebble'],
    'mountain': ['hill', 'peak', 'summit'],
    'rainbow': ['colors', 'arc', 'spectrum'],
    'lightning': ['bolt', 'electric', 'thunder'],
    
    // Objects & Tools
    'cup': ['mug', 'glass', 'coffee', 'tea'],
    'bottle': ['container', 'glass', 'plastic'],
    'ball': ['sphere', 'round', 'toy', 'sport'],
    'book': ['novel', 'read', 'pages', 'story'],
    'pen': ['pencil', 'write', 'ink'],
    'pencil': ['pen', 'write', 'draw', 'graphite'],
    'key': ['keys', 'lock', 'door', 'metal'],
    'phone': ['telephone', 'mobile', 'cell', 'smartphone'],
    'clock': ['time', 'watch', 'hour', 'minute'],
    'lamp': ['light', 'bulb', 'bright'],
    'umbrella': ['rain', 'cover', 'protection'],
    'hammer': ['tool', 'nail', 'bang'],
    'scissors': ['cut', 'sharp', 'blade'],
    'brush': ['paint', 'hair', 'clean'],
    'comb': ['hair', 'teeth', 'brush'],
    'mirror': ['reflection', 'glass', 'look'],
    'picture': ['photo', 'image', 'frame'],
    'box': ['container', 'square', 'package'],
    'bag': ['sack', 'purse', 'container'],
    'rope': ['string', 'cord', 'tie'],
    'chain': ['link', 'metal', 'connect'],
    
    // Clothing
    'shirt': ['top', 'blouse', 'tee', 't-shirt'],
    'pants': ['trousers', 'jeans', 'slacks'],
    'dress': ['gown', 'frock', 'outfit'],
    'shoe': ['shoes', 'boot', 'sneaker', 'sandal'],
    'hat': ['cap', 'beanie', 'helmet'],
    'sock': ['socks', 'stocking', 'foot'],
    'gloves': ['mittens', 'hand', 'fingers'],
    'tie': ['necktie', 'bow', 'formal'],
    'belt': ['strap', 'waist', 'buckle'],
    
    // Miscellaneous
    'flag': ['banner', 'country', 'pole'],
    'crown': ['king', 'queen', 'royal', 'jewels'],
    'ring': ['circle', 'jewelry', 'wedding'],
    'coin': ['money', 'penny', 'dollar', 'metal'],
    'gift': ['present', 'box', 'surprise'],
    'candle': ['flame', 'wax', 'light'],
    'bell': ['ring', 'sound', 'church'],
    'musical note': ['music', 'song', 'sound'],
    'peace sign': ['peace', 'symbol', 'fingers'],
    'stop sign': ['stop', 'red', 'octagon'],
    'exclamation mark': ['exclamation', 'surprise', 'wow'],
    'question mark': ['question', 'ask', 'wonder'],
    'checkmark': ['check', 'correct', 'yes', 'tick'],
    'kite': ['fly', 'wind', 'string', 'diamond'],
    'balloon': ['air', 'float', 'party', 'helium']
  };
  
  // Check synonyms both ways
  if (synonyms[targ] && synonyms[targ].includes(pred)) return true;
  if (synonyms[pred] && synonyms[pred].includes(targ)) return true;
  
  // Partial word matching (for compound words)
  const predWords = pred.split(/\s+/);
  const targWords = targ.split(/\s+/);
  
  for (const pw of predWords) {
    for (const tw of targWords) {
      if (pw.length > 2 && tw.length > 2 && (pw.includes(tw) || tw.includes(pw))) {
        return true;
      }
    }
  }
  
  return false;
}

function speak(msg) {
  try {
    speechSynthesis.cancel();
    setTimeout(() => {
      const utter = new SpeechSynthesisUtterance(msg);
      utter.rate = 0.9;
      utter.pitch = 1.0;
      speechSynthesis.speak(utter);
    }, 100);
  } catch (error) {
    console.warn("Speech synthesis not available:", error);
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// --- Event Listeners ---
document.getElementById("start").onclick = startGame;

document.addEventListener("keydown", e => {
  if (e.code === "Space" && !gameActive) {
    e.preventDefault();
    startGame();
  } else if (e.code === "KeyC" && gameActive) {
    e.preventDefault();
    clearCanvas();
  }
});

// Initialize
clearCanvas();
document.getElementById("prediction").innerText = "Click 'Start Game' to begin! ✨";
