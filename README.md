# LPL Heritage Hub

**AI-Powered Bridge for Generational Wealth Continuity**

A comprehensive platform that helps heirs understand and manage inherited portfolios by translating complex financial documents into personalized, actionable goal cards.

## 🎯 Overview

LPL Heritage Hub bridges the gap between complex financial documents and personal financial goals. It uses AWS AI services to:

- **Analyze documents** for NIGO (Not In Good Order) errors
- **Extract portfolio data** from statements and reports
- **Generate personalized Goal Cards** that translate holdings into understandable milestones
- **Track progress** toward financial objectives

## ✨ Key Features

### 1. **Simplified Personalization Quiz**
- 3-question minimalist onboarding experience
- Sets target values for Goal Cards
- Professional LPL Financial tone and UX

### 2. **Echo Document Intelligence (NIGO Analysis)**
- Upload financial documents (PDF, PNG, JPG)
- AWS Textract-powered document analysis
- NIGO error detection and compliance checking
- Separate from Portfolio Summarizer

### 3. **Portfolio Summarizer (The Bridge)**
- Upload portfolio documents (PDF, images)
- AWS Textract extracts account data
- AWS Bedrock generates AI summaries
- Creates personalized Goal Cards
- Stores data in AWS S3

### 4. **Goal Cards with Progress Tracking**
- Real-time progress calculation
- Verified account badges
- Timeline and milestone tracking
- Advisor scheduling integration

## 🏗️ Architecture

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- Modern, responsive UI with LPL Financial branding

### Backend
- **Flask** REST API
- **AWS Services Integration**:
  - **Textract**: Document text extraction
  - **Bedrock (Claude 3 Sonnet)**: AI-powered summarization
  - **S3**: Portfolio data storage

### Data Flow
1. User completes quiz → Sets target values
2. User uploads document → Textract extracts data
3. Portfolio data aggregated → Progress calculated
4. Goal Cards display → Current progress / Target amount

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- AWS Account (optional - demo mode available)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lpl-heritage-hub
   ```

2. **Backend Setup**
   ```bash
   # Install Python dependencies
   pip install -r requirements.txt
   
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your AWS credentials (or leave DEMO_MODE=True)
   ```

3. **Frontend Setup**
   ```bash
   # Install Node dependencies
   npm install
   ```

4. **Start the Application**
   ```bash
   # Terminal 1: Start backend (port 5001)
   python3 app.py
   
   # Terminal 2: Start frontend (port 5173)
   npm run dev
   ```

5. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5001
   - Health Check: http://localhost:5001/health

## ⚙️ Configuration

### Environment Variables (.env)

```bash
# Demo Mode (set to False to use real AWS services)
DEMO_MODE=False

# AWS Credentials
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
S3_BUCKET_NAME=lpl-heritage-hub-portfolios

# Flask Configuration
FLASK_DEBUG=True
PORT=5001
```

### Demo Mode

The application runs in **DEMO MODE by default** (no AWS credentials needed). This is perfect for:
- Development and testing
- Hackathons and demos
- Learning the system

Set `DEMO_MODE=False` in `.env` to use real AWS services.

## 📁 Project Structure

```
lpl-heritage-hub/
├── app.py                 # Flask backend server
├── src/
│   ├── App.jsx           # Main React app
│   ├── pages/
│   │   ├── QuizPage.jsx   # 3-question onboarding quiz
│   │   ├── EchoAgent.jsx  # NIGO document analysis
│   │   ├── BridgeAgent.jsx # Portfolio summarizer
│   │   └── CaseDetail.jsx # Compliance rules display
│   ├── components/
│   │   ├── GoalCard.jsx   # Goal progress card component
│   │   ├── Header.jsx     # App header
│   │   └── Navigation.jsx # Tab navigation
│   ├── services/
│   │   ├── api.js         # API service layer
│   │   └── portfolioService.js # Portfolio data management
│   └── styles/
│       └── App.css        # LPL Financial design system
├── requirements.txt        # Python dependencies
├── package.json           # Node dependencies
└── README.md             # This file
```

## 🔌 API Endpoints

### Health Check
- `GET /health` - Server status and AWS connection info

### Quiz
- `GET /api/quiz/start` - Get quiz questions
- `POST /api/quiz/submit` - Submit quiz answers

### Document Analysis (Echo)
- `POST /api/textract/analyze` - Analyze document for NIGO errors
  - Accepts: File upload or S3 bucket/key
  - Returns: Extracted text, NIGO status, confidence score

### Portfolio (Bridge)
- `POST /api/portfolio/upload` - Upload portfolio document
  - Accepts: PDF, PNG, JPG files
  - Extracts data with Textract
  - Summarizes with Bedrock
  - Stores in S3
  - Returns: Summary, Goal Cards, S3 key

- `POST /api/bedrock/summarize` - Summarize portfolio data
  - Accepts: Portfolio data JSON
  - Returns: AI-generated summary and Goal Cards

## 🎨 Design System

The application uses LPL Financial's institutional design system:

- **Primary Color**: Navy (#002D72)
- **Accent Colors**: Green (#287E33), Amber (#FFB81C)
- **Typography**: Inter font family
- **Spacing**: Consistent 8px grid system

## 🔐 Security Notes

- `.env` file is gitignored - never commit AWS credentials
- Use IAM roles with least privilege for AWS services
- In production, use environment variables or secrets management

## 🧪 Testing

### Manual Testing Flow

1. **Complete Quiz**
   - Navigate to Dashboard tab
   - Answer 3 questions (Focus, Target Amount, Timeline)
   - Verify "Generating Your Heritage Hub" animation
   - Should redirect to Echo tab

2. **Upload Document (Echo)**
   - Upload a financial document
   - Verify NIGO analysis results
   - Check compliance rules display

3. **Upload Portfolio (Portfolio Tab)**
   - Upload portfolio document
   - Verify data extraction
   - Check Goal Cards generation
   - Verify progress calculation

## 📝 Key Features Explained

### Simplified Quiz
- **Question 1**: Primary financial focus (Home, Retirement, Emergency Fund)
- **Question 2**: Target amount ($10k - $1M slider)
- **Question 3**: Timeline (1-3 Years, 5 Years, 10+ Years)
- Saves to `user_profile` (simulating DynamoDB)
- Goal Cards use target values from quiz

### Goal Card Progress
- Formula: `(Current Progress / Target Amount) × 100`
- Example: $20,000 extracted / $100,000 target = 20% progress
- Updates automatically when portfolio data changes

## 🐛 Troubleshooting

### Backend won't start
- Check Python version: `python3 --version` (needs 3.9+)
- Verify dependencies: `pip install -r requirements.txt`
- Check port 5001 is available

### Frontend won't start
- Check Node version: `node --version` (needs 18+)
- Clear cache: `rm -rf node_modules && npm install`
- Check port 5173 is available

### AWS Services not working
- Verify credentials in `.env`
- Check `DEMO_MODE=False`
- Verify IAM permissions for Textract, Bedrock, S3
- Check AWS region matches your credentials

## 📚 Additional Documentation

- `DEMO_GUIDE.md` - Demo mode usage guide
- `QUICKSTART.md` - Quick start instructions
- `IMPLEMENTATION.md` - Technical implementation details

## 👥 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

[Add your license here]

## 🙏 Acknowledgments

Built for LPL Financial to help bridge generational wealth continuity through AI-powered financial education and goal tracking.

---

**Need Help?** Check the troubleshooting section or open an issue on GitHub.
