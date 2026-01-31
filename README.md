# LPL Heritage Hub

**The AI-Powered Bridge for Generational Wealth Continuity & Paperwork Integrity**

An application that uses Agentic AI to automate document checks while humanizing the legacy planning experience for Gen Z and Millennial heirs.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. The app runs in **DEMO MODE by default** (no AWS credentials needed!):
   - Copy `.env.example` to `.env` (already done)
   - Demo mode uses mock responses - perfect for hackathons and testing
   - No API costs, works immediately

3. To use real AWS services (when you have credentials):
   - Edit `.env` and set `DEMO_MODE=False`
   - Add your AWS credentials:
   ```
   DEMO_MODE=False
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=us-east-1
   ```

4. Run the backend server:
```bash
python app.py
```

The backend will start on `http://localhost:5001` (or port 5000 if available)

5. Run the frontend (in a new terminal):
```bash
npm install  # First time only
npm run dev
```

The frontend will start on `http://localhost:3000`

**Note**: Demo mode is perfect for hackathons - you can demo the full functionality without AWS credits!

## Project Structure

```
.
├── app.py              # Main Flask application (Backend)
├── requirements.txt    # Python dependencies
├── package.json        # Node.js dependencies (Frontend)
├── vite.config.js     # Vite configuration
├── index.html          # Frontend entry point
├── src/                # React frontend source
│   ├── components/    # React components
│   ├── pages/          # Page components (Echo, Bridge, Mentor, Quiz)
│   ├── services/       # API service layer
│   └── styles/         # CSS styles (LPL brand)
├── context/           # Project context and documentation
│   ├── lpl_logic.md   # LPL business logic documentation
│   ├── lpl_brand.txt  # LPL brand guidelines
│   ├── lpl_compliance_rules.txt  # NIGO detection rules
│   └── market_outlook.txt       # LPL market outlook
└── README.md          # This file
```

## The Triple-Agent Solution

### 1. The Echo (Document Intelligence)
- Uses Amazon Textract to pre-scan establishment docs
- Flags NIGO (Not In Good Order) issues before submission
- Implements LPL compliance rules for required fields
- Confidence scoring: GREEN (Automated), YELLOW (Assisted), RED (Manual)

### 2. The Bridge (Portfolio Summarizer)
- Uses Amazon Bedrock to translate investment reports into "Goal Cards"
- Converts technical terms like "10% Large Cap Value" into "This is your 5-year Home Downpayment fund"
- Makes portfolios understandable for Gen Z and Millennial heirs

### 3. The Mentor (Embedded Education)
- Just-in-Time tutor that explains financial concepts
- Context-aware explanations based on assets being viewed
- Helps heirs understand diversification, risk, etc.

## API Endpoints

### Health & Status
- `GET /` - Health check endpoint
- `GET /health` - Health check endpoint with AWS connection status

### The Echo - Document Analysis
- `POST /api/textract/analyze` - Analyze documents for NIGO errors
  - **File upload**: Send `file` in form-data
  - **S3 object**: Send JSON with `s3_bucket` and `s3_key`
  - Returns: extracted text, NIGO errors, confidence level (GREEN/YELLOW/RED)

### The Bridge - Portfolio Summarization
- `POST /api/bedrock/summarize` - Transform portfolio into Goal Cards
  - **Body**: JSON with `portfolio_data` and optional `model_id`
  - Returns: AI-generated summary and Goal Cards array

### The Mentor - Financial Education
- `POST /api/mentor/explain` - Explain financial concepts in context
  - **Body**: JSON with `concept` and optional `context`
  - Returns: Context-aware explanation

### Quiz & Gamification
- `GET /api/quiz/start` - Get financial goals assessment quiz
- `POST /api/quiz/submit` - Submit answers and receive Goal Cards
- `POST /api/goals/complete` - Mark goal as completed
- `GET /api/gamification/progress` - Get user progress stats

## Usage Examples

### 1. Analyze a Document (File Upload)
```bash
curl -X POST http://localhost:5000/api/textract/analyze \
  -F "file=@document.pdf"
```

### 2. Analyze a Document (S3)
```bash
curl -X POST http://localhost:5000/api/textract/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "s3_bucket": "my-bucket",
    "s3_key": "documents/form.pdf"
  }'
```

### 3. Summarize a Portfolio
```bash
curl -X POST http://localhost:5000/api/bedrock/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "portfolio_data": {
      "total_value": 500000,
      "holdings": [
        {"name": "AAPL", "shares": 100, "value": 15000},
        {"name": "Bonds", "value": 200000}
      ]
    },
    "model_id": "anthropic.claude-3-sonnet-20240229-v1:0"
  }'
```

## Next Steps

1. Copy `.env.example` to `.env` and add your AWS credentials
2. Customize NIGO detection logic in `detect_nigo_errors()` function
3. Adjust portfolio summarization prompt in `summarize_portfolio()` function
