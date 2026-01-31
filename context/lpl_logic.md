# LPL Heritage Hub - Business Logic

## The Triple-Agent Solution

### 1. The Echo (Document Intelligence)
- Uses Amazon Textract to pre-scan establishment docs
- Flags NIGO (Not In Good Order) issues before submission
- Checks for missing signatures, typos, incomplete fields
- Reference: lpl_compliance_rules.txt for specific requirements

### 2. The Bridge (Portfolio Summarizer)
- Uses Amazon Bedrock to translate investment reports into "Goal Cards"
- Converts technical terms like "10% Large Cap Value" into "This is your 5-year Home Downpayment fund"
- Makes portfolios understandable for Gen Z and Millennial heirs
- Reference: market_outlook.txt for LPL's investment philosophy

### 3. The Mentor (Embedded Education)
- Just-in-Time tutor that explains financial concepts
- Context-aware explanations based on assets being viewed
- Helps heirs understand diversification, risk, etc.

## Compliance & Confidence Scoring

### Automated (Green) - AI handles:
- Simple data entry
- Basic field validation
- Format checking

### Assisted (Yellow) - AI summarizes but highlights:
- Original PDF text for advisor verification
- Suggested summaries that need review
- Flagged items requiring human confirmation

### Manual (Red) - Mandatory human review:
- Complex legal clauses
- No auto-summarization allowed
- Advisor must review before proceeding

## Goal Cards Format

Goal Cards translate portfolio holdings into actionable goals:
- "10% Large Cap Value" → "5-year Home Downpayment Fund"
- "20% Bonds" → "Emergency Fund & Stability"
- "Cash Position" → "Immediate Needs Reserve"

Each card includes:
- Goal name (in plain language)
- Current value
- Purpose/explanation
- Timeline
- Next steps
