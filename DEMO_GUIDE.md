# LPL Heritage Hub - Demo Guide

## 🚀 Quick Access

**Frontend URL:** http://localhost:5173  
**Backend API:** http://localhost:5001

---

## 📋 Demo Checklist

### 1. **Dashboard/Quiz Page** (Default Tab)
- ✅ Complete the Financial Goals Assessment quiz
- ✅ Answer all 5 questions about financial goals, risk tolerance, time horizon, etc.
- ✅ Click "Submit & Get Goal Cards"
- ✅ View personalized Goal Cards with gamification (points, levels, badges)
- ✅ See recommendations based on quiz results

**Demo Data:** Quiz returns personalized goal cards based on answers

---

### 2. **Echo - Document Intelligence & NIGO Detection**
- ✅ Upload a document (PDF, PNG, JPG)
  - Drag & drop or click to browse
  - Any file will work (demo mode)
- ✅ Click "Analyze Document & Check NIGO"
- ✅ Watch scanning animation
- ✅ **View NIGO Analysis Results:**
  - NIGO Status Badge (NIGO/REVIEW/CLEAN)
  - Confidence Level (GREEN/YELLOW/RED)
  - Confidence Score with progress bar
  - List of NIGO errors with:
    - Severity (High/Medium/Low)
    - Priority (HIGH/MEDIUM/LOW)
    - Field name
    - Error message
- ✅ View Extracted Financial Data:
  - Account Type
  - Total Balance
  - Asset Classes
- ✅ Data automatically syncs to Portfolio Summarizer

**Demo Data:** Returns mock NIGO errors (missing beneficiary_name, incomplete form fields)

---

### 3. **Portfolio - Goals & Summary**
- ✅ View Portfolio Summary sidebar:
  - Total Assets
  - Number of Accounts
  - Account Breakdown by type
- ✅ View Goal Cards (from Quiz):
  - Progress bars showing completion
  - Verified badges for matched accounts
  - Level indicators
  - "Schedule with Advisor" buttons
- ✅ See syncing animation when new data is added from Echo

**Demo Data:** Portfolio updates when documents are analyzed in Echo section

---

## 🎯 Key Features to Highlight

### **NIGO Detection (Main Feature)**
- Flags compliance errors before submission
- Color-coded severity levels
- Confidence scoring for Human-in-the-Loop workflow
- Prevents account opening delays

### **Three AI Agents**
1. **The Echo** - Document Intelligence & NIGO Detection
2. **The Bridge** - Portfolio Summarization & Goal Translation
3. **The Mentor** - Financial Education (embedded)

### **Gamification**
- Points system
- Level progression
- Achievement badges
- Goal completion tracking

---

## 🔧 Troubleshooting

### If Frontend Not Loading:
```bash
cd /Users/jadenrones/lpl-heritage-hub
npm run dev
```

### If Backend Not Responding:
```bash
cd /Users/jadenrones/lpl-heritage-hub
python3 app.py
```
(Should run on port 5001)

### Check Server Status:
```bash
# Frontend (port 5173)
lsof -i :5173

# Backend (port 5001)
lsof -i :5001
```

---

## 📝 Demo Script

1. **Start with Quiz** (Dashboard tab)
   - "Let me show you how we personalize the experience for heirs"
   - Complete quiz, show goal cards

2. **Show NIGO Detection** (Echo tab)
   - "This is our main compliance tool - NIGO detection"
   - Upload document, show NIGO errors prominently
   - Explain severity levels and confidence scoring

3. **Show Portfolio Integration** (Portfolio tab)
   - "See how extracted data flows to goal tracking"
   - Show synced data and progress bars

---

## 🎨 Visual Highlights

- **NIGO Status Badges:** Red (NIGO), Yellow (REVIEW), Green (CLEAN)
- **Confidence Levels:** Green (Automated), Yellow (Assisted), Red (Manual Review)
- **Error Severity:** Color-coded borders (Red=High, Yellow=Medium, Gray=Low)
- **Progress Bars:** Animated goal completion tracking

---

## ✅ Pre-Demo Checklist

- [ ] Frontend running on http://localhost:5173
- [ ] Backend running on http://localhost:5001
- [ ] API proxy working (test /api/quiz/start)
- [ ] Browser opened to frontend URL
- [ ] Demo mode enabled (no AWS credentials needed)

---

**Ready for Demo! 🎉**
