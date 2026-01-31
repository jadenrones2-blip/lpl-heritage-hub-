# LPL Heritage Hub - Quick Start Guide

## 🚀 Running the Complete Application

### Step 1: Start the Backend
```bash
cd /Users/jadenrones/lpl-heritage-hub
python3 app.py
```

You should see:
```
✓ AWS clients initialized successfully
Starting LPL Heritage Hub server on port 5001
```

### Step 2: Start the Frontend (New Terminal)
```bash
cd /Users/jadenrones/lpl-heritage-hub
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:3000/
```

### Step 3: Open in Browser
Navigate to: **http://localhost:3000**

## 🎯 Features to Test

### 1. The Echo (Document Intelligence)
- Go to "The Echo" tab
- Upload a PDF document
- See NIGO errors detected with confidence levels (GREEN/YELLOW/RED)

### 2. The Bridge (Portfolio Summarizer)
- Go to "The Bridge" tab
- Enter portfolio holdings
- Click "Transform to Goal Cards"
- See portfolios converted into understandable Goal Cards

### 3. The Mentor (Financial Education)
- Go to "The Mentor" tab
- Enter a concept (e.g., "Diversification")
- Optionally add context about your portfolio
- Get instant, personalized explanations

### 4. Quiz & Goals
- Go to "Quiz & Goals" tab
- Answer the financial goals assessment
- Receive personalized Goal Cards
- See gamification stats (points, levels, badges)

## 🎨 LPL Brand Compliance

The frontend uses LPL's official brand colors:
- Primary Blue: #003366
- Secondary Blue: #0066CC
- Accent Blue: #00A3E0
- Professional, corporate appearance

## 📡 API Endpoints

All endpoints are available at `http://localhost:5001`:
- `GET /health` - Health check
- `POST /api/textract/analyze` - Document analysis
- `POST /api/bedrock/summarize` - Portfolio summarization
- `POST /api/mentor/explain` - Concept explanation
- `GET /api/quiz/start` - Start quiz
- `POST /api/quiz/submit` - Submit quiz answers

## 🐛 Troubleshooting

**Backend not starting?**
- Check if port 5001 is available
- Verify AWS credentials in `.env` file
- Make sure `DEMO_MODE=False` if using real AWS

**Frontend not connecting?**
- Make sure backend is running first
- Check browser console for errors
- Verify proxy settings in `vite.config.js`

**API errors?**
- Check backend logs in terminal
- Verify AWS permissions for Bedrock/Textract
- Try demo mode if AWS credentials are missing
