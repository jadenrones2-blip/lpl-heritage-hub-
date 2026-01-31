"""
LPL Heritage Hub - Main Application
A Flask web server for processing paperwork and summarizing portfolios using AWS services.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import os
import boto3
from botocore.exceptions import ClientError
import json
from datetime import datetime

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Configuration
app.config['DEBUG'] = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
app.config['PORT'] = int(os.getenv('PORT', 5000))
app.config['AWS_REGION'] = os.getenv('AWS_REGION', 'us-east-1')
app.config['DEMO_MODE'] = os.getenv('DEMO_MODE', 'True').lower() == 'true'  # Default to demo mode

# Initialize AWS clients (only if not in demo mode and credentials are provided)
textract_client = None
bedrock_client = None
s3_client = None

if not app.config['DEMO_MODE']:
    try:
        textract_client = boto3.client(
            'textract',
            region_name=app.config['AWS_REGION'],
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
        )
        bedrock_client = boto3.client(
            'bedrock-runtime',
            region_name=app.config['AWS_REGION'],
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
        )
        s3_client = boto3.client(
            's3',
            region_name=app.config['AWS_REGION'],
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
        )
        print("✓ AWS clients initialized successfully")
    except Exception as e:
        print(f"⚠ Warning: AWS clients not initialized: {e}")
        print("  Falling back to demo mode. Set DEMO_MODE=False and add AWS credentials to use real services.")
        app.config['DEMO_MODE'] = True
else:
    print("🎭 Running in DEMO MODE - using mock responses (no AWS credentials needed)")
    print("   Set DEMO_MODE=False in .env to use real AWS services")


@app.route('/')
def index():
    """Health check endpoint."""
    return jsonify({
        'status': 'ok',
        'message': 'LPL Heritage Hub API is running',
        'version': '1.0.0'
    })


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    if app.config['DEMO_MODE']:
        aws_status = 'demo_mode'
    else:
        aws_status = 'connected' if textract_client and bedrock_client else 'not_configured'
    return jsonify({
        'status': 'healthy',
        'service': 'LPL Heritage Hub',
        'aws_status': aws_status,
        'demo_mode': app.config['DEMO_MODE']
    })


@app.route('/api/textract/analyze', methods=['POST'])
def analyze_document():
    """
    Analyze a document using AWS Textract to find NIGO (Not In Good Order) errors.
    Expects a file upload or S3 bucket/key in the request.
    """
    # Demo mode - return mock response
    if app.config['DEMO_MODE']:
        return jsonify({
            'status': 'success',
            'extracted_text': 'Sample extracted text from document:\n\nName: John Doe\nDate: 2024-01-30\nAccount Number: 123456789\nSignature: [Present]\n\nThis is a mock response. Enable real AWS Textract by setting DEMO_MODE=False in .env',
            'nigo_errors': [
                {
                    'type': 'missing_field',
                    'field': 'beneficiary_name',
                    'severity': 'high',
                    'priority': 'HIGH',
                    'message': 'Required field "beneficiary_name" not found in document. This is a NIGO error that will delay account opening.',
                    'confidence': 'high'
                },
                {
                    'type': 'incomplete_form',
                    'severity': 'medium',
                    'priority': 'MEDIUM',
                    'message': 'Document appears to have incomplete form fields',
                    'confidence': 'medium'
                }
            ],
            'nigo_status': 'NIGO',
            'confidence_score': 65.0,
            'confidence_level': 'YELLOW',
            'agent': 'The Echo (Document Intelligence)',
            'total_account_value': 50000.0,  # Mock account value for demo
            'demo_mode': True,
            'note': 'This is a mock response. Set DEMO_MODE=False and add AWS credentials for real analysis.'
        })

    if not textract_client:
        return jsonify({
            'error': 'AWS Textract client not configured. Please check your AWS credentials.'
        }), 500

    try:
        # Check if file is uploaded directly
        if 'file' in request.files:
            file = request.files['file']
            if file.filename == '':
                return jsonify({'error': 'No file provided'}), 400
            
            # Read file bytes
            file_bytes = file.read()
            
            # Call Textract
            response = textract_client.analyze_document(
                Document={'Bytes': file_bytes},
                FeatureTypes=['FORMS', 'TABLES']
            )
            
        # Check if S3 bucket/key is provided
        elif 's3_bucket' in request.json and 's3_key' in request.json:
            response = textract_client.analyze_document(
                Document={
                    'S3Object': {
                        'Bucket': request.json['s3_bucket'],
                        'Name': request.json['s3_key']
                    }
                },
                FeatureTypes=['FORMS', 'TABLES']
            )
        else:
            return jsonify({
                'error': 'Please provide either a file upload or S3 bucket/key'
            }), 400

        # Extract text and analyze for NIGO errors
        extracted_text = extract_text_from_textract(response)
        nigo_analysis = detect_nigo_errors(extracted_text, response)
        
        # Extract total account value from Textract response
        total_account_value = extract_account_value(response, extracted_text)
        
        # Determine confidence level for HITL (Human-in-the-Loop)
        confidence_level = determine_confidence_level(nigo_analysis)

        return jsonify({
            'status': 'success',
            'extracted_text': extracted_text,
            'nigo_errors': nigo_analysis.get('errors', []),
            'nigo_status': nigo_analysis.get('nigo_status', 'UNKNOWN'),
            'confidence_score': nigo_analysis.get('confidence_score', 0),
            'confidence_level': confidence_level,  # GREEN, YELLOW, or RED
            'agent': 'The Echo (Document Intelligence)',
            'total_account_value': total_account_value,  # Added for goal generation
            'raw_response': response
        })

    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', '')
        if 'AccessDeniedException' in str(e) or 'AccessDenied' in error_code:
            return jsonify({
                'error': 'AWS Textract access denied. Please add Textract permissions to your IAM user, or set DEMO_MODE=True in .env to use mock responses.',
                'error_details': str(e),
                'suggestion': 'To fix: Add AmazonTextractFullAccess policy to your IAM user, or enable demo mode.'
            }), 403
        return jsonify({
            'error': f'AWS Textract error: {str(e)}'
        }), 500
    except Exception as e:
        return jsonify({
            'error': f'Unexpected error: {str(e)}'
        }), 500


@app.route('/api/bedrock/summarize', methods=['POST'])
def summarize_portfolio():
    """
    Summarize a portfolio using Amazon Bedrock for heirs.
    Expects portfolio data in the request body.
    """
    data = request.get_json()
    if not data or 'portfolio_data' not in data:
        return jsonify({
            'error': 'Please provide portfolio_data in the request body'
        }), 400

    portfolio_data = data['portfolio_data']
    model_id = data.get('model_id', 'us.anthropic.claude-3-sonnet-20240229-v1:0')

    # Demo mode - return mock summary with Goal Cards
    if app.config['DEMO_MODE']:
        total_value = portfolio_data.get('total_value', sum(
            h.get('value', 0) for h in portfolio_data.get('holdings', [])
        ))
        
        # Generate Goal Cards (The Bridge format)
        goal_cards = parse_goal_cards_from_response('', portfolio_data)
        
        mock_summary = f"""## Portfolio Summary - The Bridge Translation

This portfolio has a total value of ${total_value:,.2f}. Below are your personalized Goal Cards that translate each holding into understandable goals.

**Agent**: The Bridge (Portfolio Summarizer)
**Confidence Level**: GREEN (Automated)"""

        return jsonify({
            'status': 'success',
            'summary': mock_summary,
            'goal_cards': goal_cards,  # The Bridge format
            'model_used': f'{model_id} (demo mode)',
            'agent': 'The Bridge (Portfolio Summarizer)',
            'confidence_level': 'GREEN',
            'demo_mode': True,
            'note': 'This is a mock response. Set DEMO_MODE=False and add AWS credentials for real AI summaries.'
        })

    if not bedrock_client:
        return jsonify({
            'error': 'AWS Bedrock client not configured. Please check your AWS credentials.'
        }), 500

    try:

        # Create prompt for portfolio summarization (The Bridge agent)
        # Transform portfolio into Goal Cards format
        prompt = f"""You are The Bridge - an AI agent that translates complex investment portfolios into understandable "Goal Cards" for Gen Z and Millennial heirs.

Portfolio Data:
{json.dumps(portfolio_data, indent=2)}

Your task: Transform each holding into a "Goal Card" that explains:
- What the holding is in plain language
- What goal it serves (e.g., "This is your 5-year Home Downpayment fund")
- Current value and purpose
- Timeline/relevance

Example transformation:
- "10% Large Cap Value" → Goal Card: "Home Downpayment Fund - $50,000 in stable, dividend-paying stocks. This portion of your portfolio is designed to grow steadily over 5 years to help you buy your first home."

Use LPL Financial's professional but accessible tone. Reference that LPL recommends "putting cash to work" if there's excess cash. Mention diversification benefits. Be empathetic to heirs who may be overwhelmed.

Format your response as JSON with a "goal_cards" array. Each card should have:
- title (plain language goal name)
- holding_description (what it is technically)
- purpose (why it exists, what goal it serves)
- current_value (if available)
- timeline (short/medium/long term)
- next_steps (what the heir should know/do)

Also provide a brief overall portfolio summary."""

        # Prepare Bedrock request
        if 'claude' in model_id.lower():
            body = json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 4000,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            })
        else:
            # Default format for other models
            body = json.dumps({
                "inputText": prompt,
                "textGenerationConfig": {
                    "maxTokenCount": 4000,
                    "temperature": 0.7,
                    "topP": 0.9
                }
            })

        # Invoke Bedrock
        response = bedrock_client.invoke_model(
            modelId=model_id,
            body=body,
            contentType='application/json',
            accept='application/json'
        )

        # Parse response
        response_body = json.loads(response['body'].read())
        
        if 'claude' in model_id.lower():
            summary_text = response_body['content'][0]['text']
        else:
            summary_text = response_body.get('results', [{}])[0].get('outputText', '')
        
        # Try to parse Goal Cards from response, or create them from the summary
        goal_cards = parse_goal_cards_from_response(summary_text, portfolio_data)
        confidence_level = determine_portfolio_confidence_level(portfolio_data)

        return jsonify({
            'status': 'success',
            'summary': summary_text,
            'goal_cards': goal_cards,  # The Bridge transforms portfolio into Goal Cards
            'model_used': model_id,
            'agent': 'The Bridge (Portfolio Summarizer)',
            'confidence_level': confidence_level
        })

    except ClientError as e:
        return jsonify({
            'error': f'AWS Bedrock error: {str(e)}'
        }), 500
    except Exception as e:
        return jsonify({
            'error': f'Unexpected error: {str(e)}'
        }), 500


@app.route('/api/portfolio/upload', methods=['POST'])
def upload_portfolio():
    """
    Upload portfolio document (PDF/image), extract data with Textract, 
    summarize it with Bedrock, and store in S3.
    Expects a document file upload (PDF, PNG, JPG).
    """
    try:
        portfolio_data = None
        extracted_text = None
        
        # Check if file is uploaded
        if 'file' not in request.files or not request.files['file'].filename:
            return jsonify({
                'error': 'Please upload a portfolio document (PDF, PNG, or JPG)'
            }), 400
        
        file = request.files['file']
        filename = file.filename.lower()
        
        # Validate file type
        if not (filename.endswith('.pdf') or filename.endswith('.png') or 
                filename.endswith('.jpg') or filename.endswith('.jpeg')):
            return jsonify({
                'error': 'Invalid file type. Please upload a PDF, PNG, or JPG file.'
            }), 400
        
        # Read file content
        file_content = file.read()
        file.seek(0)  # Reset file pointer for potential re-read
        
        # Extract text from document using Textract
        if app.config['DEMO_MODE']:
            # Demo mode - mock extraction
            extracted_text = f"""Portfolio Statement for Sample Client
Date: {datetime.now().strftime('%Y-%m-%d')}

Account Summary:
- Roth IRA: $125,000.00
  Holdings: Large Cap Value, Bonds, ETFs
  
- Traditional IRA: $75,000.00
  Holdings: Large Cap Value, Bonds
  
- Brokerage Account: $50,000.00
  Holdings: Stocks, ETFs

Total Portfolio Value: $250,000.00

This is a mock extraction. Enable real AWS Textract by setting DEMO_MODE=False."""
        else:
            # Real Textract extraction
            if not textract_client:
                return jsonify({
                    'error': 'AWS Textract client not configured. Please check your AWS credentials.'
                }), 500
            
            try:
                # Use Textract to extract text
                if filename.endswith('.pdf'):
                    response = textract_client.analyze_document(
                        Document={'Bytes': file_content},
                        FeatureTypes=['TABLES', 'FORMS']
                    )
                else:
                    # For images
                    response = textract_client.detect_document_text(
                        Document={'Bytes': file_content}
                    )
                
                extracted_text = extract_text_from_textract(response)
                
            except ClientError as e:
                error_code = e.response.get('Error', {}).get('Code', '')
                if error_code == 'AccessDeniedException':
                    return jsonify({
                        'error': 'AWS Textract access denied. Please check your IAM permissions.'
                    }), 403
                else:
                    return jsonify({
                        'error': f'AWS Textract error: {str(e)}'
                    }), 500
            except Exception as e:
                return jsonify({
                    'error': f'Failed to extract text from document: {str(e)}'
                }), 500
        
        # Parse extracted text to create portfolio data structure
        portfolio_data = parse_portfolio_from_text(extracted_text, filename)
        
        if not portfolio_data:
            return jsonify({
                'error': 'Could not extract portfolio data from document. Please ensure the document contains account information.'
            }), 400

        # Generate case ID and timestamp
        case_id = f"portfolio_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        timestamp = datetime.now().isoformat()
        
        # Add metadata
        portfolio_data['case_id'] = case_id
        portfolio_data['uploaded_at'] = timestamp
        portfolio_data['source_document'] = file.filename
        portfolio_data['extracted_text'] = extracted_text
        
        # Summarize portfolio using Bedrock
        summary_response = None
        try:
            model_id = 'us.anthropic.claude-3-sonnet-20240229-v1:0'
            if app.config['DEMO_MODE']:
                total_value = portfolio_data.get('total_value', sum(
                    h.get('value', 0) for h in portfolio_data.get('holdings', [])
                ))
                goal_cards = parse_goal_cards_from_response('', portfolio_data)
                summary_response = {
                    'summary': f'Portfolio with total value of ${total_value:,.2f}',
                    'goal_cards': goal_cards,
                    'confidence_level': 'GREEN'
                }
            else:
                # Call summarize_portfolio logic directly
                if bedrock_client:
                    prompt = f"""You are The Bridge - an AI agent that translates complex investment portfolios into understandable "Goal Cards" for Gen Z and Millennial heirs.

Portfolio Data:
{json.dumps(portfolio_data, indent=2)}

Transform each holding into a "Goal Card" that explains what it is in plain language, what goal it serves, current value, and timeline."""
                    
                    body = json.dumps({
                        "anthropic_version": "bedrock-2023-05-31",
                        "max_tokens": 4000,
                        "messages": [{"role": "user", "content": prompt}]
                    })
                    
                    response = bedrock_client.invoke_model(
                        modelId=model_id,
                        body=body,
                        contentType='application/json',
                        accept='application/json'
                    )
                    
                    response_body = json.loads(response['body'].read())
                    summary_text = response_body['content'][0]['text']
                    goal_cards = parse_goal_cards_from_response(summary_text, portfolio_data)
                    confidence_level = determine_portfolio_confidence_level(portfolio_data)
                    
                    summary_response = {
                        'summary': summary_text,
                        'goal_cards': goal_cards,
                        'confidence_level': confidence_level
                    }
                else:
                    summary_response = {
                        'summary': 'Portfolio uploaded successfully',
                        'goal_cards': [],
                        'confidence_level': 'YELLOW'
                    }
        except Exception as e:
            print(f"Warning: Summary generation failed: {e}")
            summary_response = {
                'summary': 'Portfolio uploaded successfully',
                'goal_cards': [],
                'confidence_level': 'YELLOW'
            }

        # Store in S3 (or localStorage in demo mode)
        s3_key = None
        if not app.config['DEMO_MODE'] and s3_client:
            try:
                bucket_name = os.getenv('S3_BUCKET_NAME', 'lpl-heritage-hub-portfolios')
                s3_key = f"portfolios/{case_id}.json"
                
                # Ensure bucket exists (create if not)
                try:
                    s3_client.head_bucket(Bucket=bucket_name)
                except ClientError:
                    # Bucket doesn't exist, create it
                    s3_client.create_bucket(
                        Bucket=bucket_name,
                        CreateBucketConfiguration={'LocationConstraint': app.config['AWS_REGION']}
                    )
                
                # Upload to S3
                s3_client.put_object(
                    Bucket=bucket_name,
                    Key=s3_key,
                    Body=json.dumps(portfolio_data, indent=2),
                    ContentType='application/json'
                )
            except Exception as e:
                print(f"Warning: S3 upload failed: {e}")
                # Continue without S3 storage
        else:
            # Demo mode - just log
            print(f"Demo mode: Would save portfolio to S3 at portfolios/{case_id}.json")

        # Combine portfolio data with summary
        result = {
            'status': 'success',
            'case_id': case_id,
            'portfolio_data': portfolio_data,
            'summary': summary_response.get('summary', ''),
            'goal_cards': summary_response.get('goal_cards', []),
            'confidence_level': summary_response.get('confidence_level', 'GREEN'),
            's3_key': s3_key,
            'uploaded_at': timestamp,
            'demo_mode': app.config['DEMO_MODE']
        }

        return jsonify(result), 200

    except Exception as e:
        return jsonify({
            'error': f'Failed to upload portfolio: {str(e)}'
        }), 500


def extract_text_from_textract(response):
    """Extract text from Textract response."""
    text = ""
    if 'Blocks' in response:
        for block in response['Blocks']:
            if block['BlockType'] == 'LINE':
                text += block['Text'] + "\n"
    return text.strip()


def parse_portfolio_from_text(extracted_text, filename):
    """
    Parse portfolio data from extracted text.
    Looks for account types, balances, holdings, etc.
    """
    import re
    
    portfolio_data = {
        'total_value': 0,
        'holdings': [],
        'source_file': filename
    }
    
    # Look for dollar amounts
    dollar_pattern = r'\$[\d,]+\.?\d*'
    amounts = re.findall(dollar_pattern, extracted_text)
    
    # Look for account types
    account_types = ['Roth IRA', 'Traditional IRA', 'IRA', '401\(k\)', 'Brokerage', 
                     'Savings', 'Checking', 'Investment Account', 'Retirement Account']
    
    # Look for asset classes
    asset_classes = ['Stocks', 'Bonds', 'ETFs', 'Mutual Funds', 'Large Cap', 
                     'Small Cap', 'Value', 'Growth', 'Real Estate', 'Cash']
    
    # Try to extract account information
    lines = extracted_text.split('\n')
    current_account = None
    
    for line in lines:
        line_upper = line.upper()
        
        # Check for account type
        for acc_type in account_types:
            if acc_type.upper() in line_upper:
                # Extract balance from this line or next few lines
                balance_match = re.search(dollar_pattern, line)
                if balance_match:
                    balance_str = balance_match.group(0).replace('$', '').replace(',', '')
                    try:
                        balance = float(balance_str)
                        
                        # Find asset classes mentioned nearby
                        found_assets = []
                        for asset in asset_classes:
                            if asset.upper() in line_upper or asset.upper() in extracted_text.upper():
                                found_assets.append(asset)
                        
                        portfolio_data['holdings'].append({
                            'type': acc_type,
                            'category': acc_type,
                            'value': balance,
                            'asset_classes': found_assets if found_assets else ['Mixed Assets'],
                            'description': line.strip()
                        })
                        portfolio_data['total_value'] += balance
                    except ValueError:
                        pass
                break
    
    # If no structured accounts found, create a generic one from total
    if len(portfolio_data['holdings']) == 0:
        # Try to find total value
        total_match = re.search(r'(?:total|value|balance)[:\s]+\$?([\d,]+\.?\d*)', extracted_text, re.IGNORECASE)
        if total_match:
            try:
                total_value = float(total_match.group(1).replace(',', ''))
                portfolio_data['total_value'] = total_value
                portfolio_data['holdings'].append({
                    'type': 'Portfolio',
                    'category': 'Investment Portfolio',
                    'value': total_value,
                    'asset_classes': ['Mixed Assets'],
                    'description': 'Portfolio extracted from document'
                })
            except ValueError:
                pass
    
    # If still no data, create a default portfolio
    if portfolio_data['total_value'] == 0:
        # Extract any dollar amount as total
        if amounts:
            try:
                largest_amount = max([float(a.replace('$', '').replace(',', '')) for a in amounts])
                portfolio_data['total_value'] = largest_amount
                portfolio_data['holdings'].append({
                    'type': 'Portfolio',
                    'category': 'Investment Portfolio',
                    'value': largest_amount,
                    'asset_classes': ['Mixed Assets'],
                    'description': 'Portfolio extracted from document'
                })
            except (ValueError, TypeError):
                pass
    
    return portfolio_data if portfolio_data['total_value'] > 0 else None


def extract_account_value(textract_response, extracted_text):
    """
    Extract total account value from Textract response.
    Looks for dollar amounts, account balances, total values, etc.
    """
    import re
    
    # Look for dollar amounts in the text
    dollar_patterns = [
        r'\$[\d,]+\.?\d*',  # $50,000 or $50000.00
        r'total[:\s]+\$?[\d,]+\.?\d*',  # Total: $50,000
        r'balance[:\s]+\$?[\d,]+\.?\d*',  # Balance: $50,000
        r'account value[:\s]+\$?[\d,]+\.?\d*',  # Account Value: $50,000
    ]
    
    amounts = []
    for pattern in dollar_patterns:
        matches = re.findall(pattern, extracted_text, re.IGNORECASE)
        for match in matches:
            # Extract numeric value
            numbers = re.findall(r'[\d,]+\.?\d*', match)
            for num_str in numbers:
                try:
                    amount = float(num_str.replace(',', ''))
                    if amount > 100:  # Filter out small amounts (likely not account value)
                        amounts.append(amount)
                except:
                    pass
    
    # Return the largest amount found, or 0 if none
    if amounts:
        return max(amounts)
    return 0.0


                'Create digital backup of important papers'
            ]
        },
        {
            'id': 'goal_2',
            'title': '💼 Meet with Financial Advisor',
            'description': 'Schedule a comprehensive portfolio review',
            'category': 'planning',
            'priority': 'high',
            'points_reward': 100,
            'estimated_time': '1-2 hours',
            'status': 'not_started',
            'steps': [
                'Research qualified financial advisors',
                'Schedule initial consultation',
                'Prepare questions about portfolio'
            ]
        }
    ]
    
    # Add risk-appropriate goals
    if risk_tolerance == 'conservative':
        base_goals.append({
            'id': 'goal_3',
            'title': '🛡️ Preserve Capital Strategy',
            'description': 'Develop a conservative investment strategy to preserve inherited wealth',
            'category': 'investment',
            'priority': 'medium',
            'points_reward': 75,
            'estimated_time': 'Ongoing',
            'status': 'not_started',
            'steps': [
                'Review current asset allocation',
                'Consider shifting to more conservative investments',
                'Set up emergency fund'
            ]
        })
    elif risk_tolerance == 'aggressive':
        base_goals.append({
            'id': 'goal_3',
            'title': '📈 Growth Strategy Development',
            'description': 'Create a plan to grow the portfolio for future generations',
            'category': 'investment',
            'priority': 'medium',
            'points_reward': 75,
            'estimated_time': 'Ongoing',
            'status': 'not_started',
            'steps': [
                'Research growth investment opportunities',
                'Diversify into growth assets',
                'Set long-term growth targets'
            ]
        })
    
    # Add tax planning goal
    base_goals.append({
        'id': 'goal_4',
        'title': '💰 Tax Optimization Review',
        'description': 'Consult with tax advisor about inheritance tax implications',
        'category': 'tax',
        'priority': 'high',
        'points_reward': 100,
        'estimated_time': '2-3 hours',
        'status': 'not_started',
        'steps': [
            'Understand step-up in basis rules',
            'Review tax-efficient withdrawal strategies',
            'Plan for annual tax obligations'
        ]
    })
    
    # Add estate planning goal
    base_goals.append({
        'id': 'goal_5',
        'title': '📜 Update Estate Plan',
        'description': 'Review and update your own estate planning documents',
        'category': 'estate',
        'priority': 'medium',
        'points_reward': 125,
        'estimated_time': '4-6 hours',
        'status': 'not_started',
        'steps': [
            'Review current will and beneficiaries',
            'Consider creating or updating trusts',
            'Update beneficiary designations on accounts'
        ]
    })
    
    return base_goals


@app.route('/api/goals/generate/<case_id>', methods=['POST'])
def generate_goals_for_case(case_id):
    """
    Generate goal cards for a specific case from portfolio data.
    Uses total_account_value from portfolio analysis.
    Expects: { "portfolio_data": {...}, "total_account_value": 50000.0 }
    """
    try:
        from goal_generator import generate_goals
    except ImportError:
        # Fallback if goal_generator not available
        return jsonify({
            'error': 'Goal generator module not found',
            'goal_cards': []
        }), 500
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Please provide request body'}), 400
    
    portfolio_data = data.get('portfolio_data', {})
    total_account_value = data.get('total_account_value', 0)
    
    # If total_account_value not provided, try to get from case data or use default
    if not total_account_value:
        # In a real app, you'd fetch this from case storage (S3, database, etc.)
        total_account_value = 50000.0  # Default for demo
    
    try:
        # Generate goals from portfolio data instead of quiz answers
        goal_cards = generate_goals_from_portfolio(portfolio_data, total_account_value)
        
        return jsonify({
            'status': 'success',
            'case_id': case_id,
            'total_account_value': total_account_value,
            'goal_cards': goal_cards,
            'budget_used': sum(g.get('allocated_amount', 0) for g in goal_cards),
            'budget_remaining': total_account_value - sum(g.get('allocated_amount', 0) for g in goal_cards)
        })
    except Exception as e:
        import traceback
        print(f"Error generating goals: {e}")
        traceback.print_exc()
        return jsonify({
            'error': f'Failed to generate goals: {str(e)}',
            'goal_cards': []
        }), 500


def generate_goals_from_portfolio(portfolio_data, total_value):
    """Generate goal cards from portfolio data."""
    # This would use the portfolio data to generate relevant goals
    # For now, return basic goal structure
    return [
        {
            'id': 'goal_1',
            'title': 'Portfolio Review',
            'description': 'Review and understand your inherited portfolio',
            'current_value': total_value,
            'target_amount': total_value,
            'timeline': 'Ongoing'
        }
    ]


@app.route('/api/goals/complete', methods=['POST'])
def complete_goal():
    """Mark a goal as completed and award points."""
    data = request.get_json()
    if not data or 'goal_id' not in data:
        return jsonify({
            'error': 'Please provide goal_id in the request body'
        }), 400
    
    goal_id = data['goal_id']
    user_id = data.get('user_id', 'default_user')
    
    # In a real app, this would update a database
    # For now, return success with points awarded
    goal_points = data.get('points_reward', 50)
    
    return jsonify({
        'status': 'success',
        'message': f'Goal {goal_id} marked as completed!',
        'points_awarded': goal_points,
        'achievement': {
            'badge': '✅ Goal Completed',
            'message': f'You earned {goal_points} points!'
        }
    })


@app.route('/api/gamification/progress', methods=['GET'])
def get_progress():
    """Get user's gamification progress and statistics."""
    user_id = request.args.get('user_id', 'default_user')
    
    # In a real app, this would fetch from a database
    return jsonify({
        'status': 'success',
        'user_id': user_id,
        'stats': {
            'total_points': 0,
            'current_level': 'Newcomer',
            'level_number': 1,
            'badges_earned': [],
            'goals_completed': 0,
            'goals_in_progress': 0,
            'streak_days': 0,
            'next_level_points': 5
        },
        'leaderboard_position': None  # Could implement leaderboard
    })


@app.route('/api/mentor/explain', methods=['POST'])
def explain_concept():
    """
    The Mentor agent - Just-in-Time tutor that explains financial concepts.
    Context-aware explanations based on assets being viewed.
    """
    data = request.get_json()
    if not data or 'concept' not in data:
        return jsonify({
            'error': 'Please provide "concept" in the request body'
        }), 400
    
    concept = data['concept']
    context = data.get('context', {})  # Portfolio context, current holding, etc.
    
    # Use Bedrock to explain the concept in context
    if not app.config['DEMO_MODE'] and bedrock_client:
        try:
            prompt = f"""You are The Mentor - a Just-in-Time financial education tutor for heirs.

The user is viewing: {json.dumps(context, indent=2)}

They want to understand: {concept}

Explain this concept in simple, accessible language:
- Use analogies and examples
- Relate it to their specific portfolio/holdings if provided
- Keep it concise (2-3 paragraphs)
- Be empathetic and encouraging
- Avoid excessive jargon

If explaining a concept like "diversification", relate it to their actual holdings if available."""

            model_id = data.get('model_id', 'us.anthropic.claude-3-sonnet-20240229-v1:0')
            
            body = json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 1000,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            })
            
            response = bedrock_client.invoke_model(
                modelId=model_id,
                body=body,
                contentType='application/json',
                accept='application/json'
            )
            
            response_body = json.loads(response['body'].read())
            explanation = response_body['content'][0]['text']
            
            return jsonify({
                'status': 'success',
                'concept': concept,
                'explanation': explanation,
                'agent': 'The Mentor (Embedded Education)',
                'context_used': context
            })
        except Exception as e:
            return jsonify({
                'error': f'Error generating explanation: {str(e)}'
            }), 500
    
    # Demo mode - return mock explanation
    explanations = {
        'diversification': """Diversification is like not putting all your eggs in one basket. In your portfolio, you have different types of investments (stocks, bonds, cash) so that if one performs poorly, others can help balance it out. This reduces your overall risk while still allowing for growth.""",
        'risk tolerance': """Risk tolerance is how comfortable you are with the possibility of losing money in exchange for potential gains. Conservative investors prefer stability, while aggressive investors are willing to take more risk for higher returns. Your portfolio should match your personal risk tolerance.""",
        'large cap value': """Large Cap Value stocks are shares of big, established companies that are considered undervalued. Think of companies like Coca-Cola or Johnson & Johnson - they're stable, pay dividends, and are less volatile than growth stocks. In your portfolio, this provides steady growth and income."""
    }
    
    explanation = explanations.get(concept.lower(), f"""**{concept}** is an important financial concept. In the context of your portfolio, it relates to how your investments are structured and managed. For a detailed explanation tailored to your specific holdings, enable real AWS Bedrock access.""")
    
    return jsonify({
        'status': 'success',
        'concept': concept,
        'explanation': explanation,
        'agent': 'The Mentor (Embedded Education)',
        'context_used': context,
        'demo_mode': app.config['DEMO_MODE']
    })


def determine_confidence_level(nigo_analysis):
    """
    Determine confidence level for Human-in-the-Loop (HITL) system.
    Returns: 'GREEN' (Automated), 'YELLOW' (Assisted), or 'RED' (Manual)
    """
    errors = nigo_analysis.get('errors', [])
    confidence_score = nigo_analysis.get('confidence_score', 0)
    
    # RED: High severity errors or complex legal issues
    high_severity_errors = [e for e in errors if e.get('severity') == 'high']
    if len(high_severity_errors) > 0:
        return 'RED'  # Manual review required
    
    # YELLOW: Medium severity errors or low confidence
    if len(errors) > 0 or confidence_score < 80:
        return 'YELLOW'  # Assisted - AI summarizes but highlights for review
    
    # GREEN: Clean document, high confidence
    return 'GREEN'  # Automated - AI handles


def parse_goal_cards_from_response(summary_text, portfolio_data):
    """
    Parse Goal Cards from AI response or create them from portfolio data.
    Implements The Bridge agent functionality.
    """
    goal_cards = []
    
    # Try to extract JSON from response if it's formatted that way
    try:
        # Look for JSON in the response
        import re
        json_match = re.search(r'\{.*"goal_cards".*\}', summary_text, re.DOTALL)
        if json_match:
            parsed = json.loads(json_match.group())
            return parsed.get('goal_cards', [])
    except:
        pass
    
    # Fallback: Create Goal Cards from portfolio data
    holdings = portfolio_data.get('holdings', [])
    total_value = portfolio_data.get('total_value', 0)
    
    for holding in holdings:
        name = holding.get('name', 'Unknown Holding')
        value = holding.get('value', 0)
        shares = holding.get('shares', 0)
        
        # Transform technical names into goal cards
        goal_card = {
            'title': transform_to_goal_name(name),
            'holding_description': name,
            'purpose': determine_goal_purpose(name, value),
            'current_value': value,
            'timeline': determine_timeline(name),
            'next_steps': get_next_steps_for_holding(name)
        }
        goal_cards.append(goal_card)
    
    # Add cash goal card if applicable
    cash_holdings = [h for h in holdings if 'cash' in h.get('name', '').lower()]
    if not cash_holdings and total_value > 0:
        invested_value = sum(h.get('value', 0) for h in holdings)
        cash_value = total_value - invested_value
        if cash_value > 0:
            goal_cards.append({
                'title': 'Put Cash to Work',
                'holding_description': f'Cash Position: ${cash_value:,.2f}',
                'purpose': f'LPL recommends putting excess cash to work in high-quality bonds or equities based on current market outlook.',
                'current_value': cash_value,
                'timeline': 'Immediate',
                'next_steps': 'Consider moving excess cash into productive investments per LPL guidance'
            })
    
    return goal_cards


def transform_to_goal_name(holding_name):
    """Transform technical holding names into goal-oriented names."""
    name_lower = holding_name.lower()
    
    if 'large cap' in name_lower or 'value' in name_lower:
        return 'Home Downpayment Fund'
    elif 'bond' in name_lower:
        return 'Stability & Income Fund'
    elif 'growth' in name_lower:
        return 'Future Generations Fund'
    elif 'index' in name_lower or 's&p' in name_lower:
        return 'Market Growth Fund'
    elif 'cash' in name_lower:
        return 'Immediate Needs Reserve'
    else:
        return f'{holding_name} - Investment Goal'


def determine_goal_purpose(holding_name, value):
    """Determine the purpose/goal of a holding."""
    name_lower = holding_name.lower()
    
    if 'large cap' in name_lower or 'value' in name_lower:
        return f'This ${value:,.2f} portion is designed to grow steadily over 5 years to help you achieve major goals like buying a home.'
    elif 'bond' in name_lower:
        return f'This ${value:,.2f} provides stability and regular income, acting as a safety net for your portfolio.'
    elif 'growth' in name_lower:
        return f'This ${value:,.2f} is positioned for long-term growth to benefit future generations.'
    elif 'index' in name_lower:
        return f'This ${value:,.2f} tracks the overall market, providing diversification and broad market exposure.'
    else:
        return f'This ${value:,.2f} holding is part of your diversified portfolio strategy.'


def determine_timeline(holding_name):
    """Determine timeline for a holding."""
    name_lower = holding_name.lower()
    
    if 'bond' in name_lower or 'cash' in name_lower:
        return 'Short to Medium Term'
    elif 'growth' in name_lower:
        return 'Long Term (10+ years)'
    else:
        return 'Medium to Long Term (5-10 years)'


def get_next_steps_for_holding(holding_name):
    """Get next steps for a specific holding."""
    name_lower = holding_name.lower()
    
    if 'cash' in name_lower:
        return 'Review with advisor about putting cash to work per LPL 2026 market outlook'
    elif 'bond' in name_lower:
        return 'Understand current yield and maturity dates'
    else:
        return 'Review allocation and ensure it aligns with your goals'


def determine_portfolio_confidence_level(portfolio_data):
    """
    Determine confidence level for portfolio summarization.
    Simple portfolios = GREEN, Complex = YELLOW, Very complex = RED
    """
    holdings = portfolio_data.get('holdings', [])
    
    if len(holdings) <= 3:
        return 'GREEN'  # Simple - AI can fully handle
    elif len(holdings) <= 6:
        return 'YELLOW'  # Moderate - AI summarizes but advisor should review
    else:
        return 'RED'  # Complex - Advisor must review


def detect_nigo_errors(extracted_text, textract_response):
    """
    Detect NIGO (Not In Good Order) errors using LPL compliance rules.
    Implements The Echo agent - Document Intelligence.
    Checks all 10 compliance rules:
    1. SSN Present
    2. Physical Address (No PO Box)
    3. Vague Occupation
    4. Signature Present
    5. Signature Date
    6. Beneficiary Name
    7. Beneficiary Relationship
    8. Date of Birth
    9. Account Type Selected
    10. Investment Objective
    """
    errors = []
    text_lower = extracted_text.lower()
    import re
    
    # Rule 1: SSN Present (must be 9 digits)
    ssn_pattern = r'\b\d{3}-?\d{2}-?\d{4}\b'
    ssn_found = re.search(ssn_pattern, extracted_text)
    if not ssn_found:
        errors.append({
            'type': 'missing_field',
            'field': 'ssn',
            'severity': 'high',
            'priority': 'HIGH',
            'message': 'SSN not found or invalid format. Must be 9 digits.',
            'confidence': 'high'
        })
    
    # Rule 2: Physical Address (No PO Box as primary)
    po_box_patterns = ['p.o. box', 'po box', 'p.o box', 'post office box', 'p.o.b', 'pob']
    has_po_box = any(pattern in text_lower for pattern in po_box_patterns)
    has_physical_address = any(term in text_lower for term in ['street', 'avenue', 'road', 'drive', 'lane', 'boulevard', 'way', 'physical address'])
    if has_po_box and not has_physical_address:
        errors.append({
            'type': 'invalid_address',
            'field': 'physical_address',
            'severity': 'high',
            'priority': 'HIGH',
            'message': 'P.O. Box found but physical street address is required as primary address.',
            'confidence': 'high'
        })
    elif not has_physical_address and not has_po_box:
        errors.append({
            'type': 'missing_field',
            'field': 'physical_address',
            'severity': 'medium',
            'priority': 'MEDIUM',
            'message': 'Physical address not found in document.',
            'confidence': 'medium'
        })
    
    # Rule 3: Vague Occupation
    vague_occupations = ['business', 'self-employed', 'self employed', 'retired', 'unemployed', 'other']
    occupation_terms = ['occupation', 'employment', 'employer', 'job', 'work']
    has_occupation_field = any(term in text_lower for term in occupation_terms)
    if has_occupation_field:
        # Check if occupation is vague
        found_vague = False
        for vague in vague_occupations:
            if vague in text_lower:
                # Check if there's more detail nearby
                vague_index = text_lower.find(vague)
                context = text_lower[max(0, vague_index-50):vague_index+50]
                # If it's just "business" or "self-employed" without details, it's vague
                if vague in ['business', 'self-employed', 'self employed'] and len(context.split()) < 10:
                    found_vague = True
                    break
        if found_vague:
            errors.append({
                'type': 'vague_occupation',
                'field': 'occupation',
                'severity': 'medium',
                'priority': 'MEDIUM',
                'message': 'Occupation is too vague. Must provide specific business type or employer name.',
                'confidence': 'medium'
            })
    
    # Rule 4: Signature Present
    signature_terms = ['signature', 'signed', 'sign here', 'signature of']
    has_signature = any(term in text_lower for term in signature_terms)
    if not has_signature:
        errors.append({
            'type': 'missing_field',
            'field': 'signature',
            'severity': 'high',
            'priority': 'HIGH',
            'message': 'Signature not found. Wet signature required.',
            'confidence': 'high'
        })
    
    # Rule 5: Signature Date
    if has_signature:
        date_pattern = r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}'
        dates = re.findall(date_pattern, extracted_text)
        if not dates:
            errors.append({
                'type': 'missing_date',
                'field': 'signature_date',
                'severity': 'high',
                'priority': 'HIGH',
                'message': 'Signature found but signature date is missing or unclear.',
                'confidence': 'high'
            })
        else:
            # Check if date is within 90 days (basic check)
            from datetime import datetime, timedelta
            try:
                for date_str in dates:
                    # Try to parse date
                    for fmt in ['%m/%d/%Y', '%m-%d-%Y', '%m/%d/%y', '%m-%d-%y']:
                        try:
                            date_obj = datetime.strptime(date_str, fmt)
                            if date_obj < datetime.now() - timedelta(days=90):
                                errors.append({
                                    'type': 'stale_date',
                                    'field': 'signature_date',
                                    'severity': 'medium',
                                    'priority': 'MEDIUM',
                                    'message': f'Signature date ({date_str}) is more than 90 days old.',
                                    'confidence': 'medium'
                                })
                            break
                        except:
                            continue
            except:
                pass
    
    # Rule 6: Beneficiary Name
    beneficiary_terms = ['beneficiary', 'beneficiary name', 'primary beneficiary']
    has_beneficiary = any(term in text_lower for term in beneficiary_terms)
    if not has_beneficiary:
        errors.append({
            'type': 'missing_field',
            'field': 'beneficiary_name',
            'severity': 'high',
            'priority': 'HIGH',
            'message': 'Beneficiary name not found in document.',
            'confidence': 'high'
        })
    
    # Rule 7: Beneficiary Relationship
    if has_beneficiary:
        relationship_terms = ['relationship', 'relation', 'spouse', 'child', 'son', 'daughter', 'brother', 'sister', 'parent']
        has_relationship = any(term in text_lower for term in relationship_terms)
        if not has_relationship:
            errors.append({
                'type': 'incomplete_beneficiary',
                'field': 'beneficiary_relationship',
                'severity': 'medium',
                'priority': 'MEDIUM',
                'message': 'Beneficiary name found but relationship is missing.',
                'confidence': 'medium'
            })
    
    # Rule 8: Date of Birth
    dob_terms = ['date of birth', 'dob', 'birth date', 'born']
    has_dob = any(term in text_lower for term in dob_terms)
    if not has_dob:
        errors.append({
            'type': 'missing_field',
            'field': 'date_of_birth',
            'severity': 'medium',
            'priority': 'MEDIUM',
            'message': 'Date of birth not found in document.',
            'confidence': 'medium'
        })
    
    # Rule 9: Account Type Selected
    account_types = ['ira', 'roth', '401', 'brokerage', 'savings', 'checking', 'account type']
    has_account_type = any(term in text_lower for term in account_types)
    if not has_account_type:
        errors.append({
            'type': 'missing_field',
            'field': 'account_type',
            'severity': 'medium',
            'priority': 'MEDIUM',
            'message': 'Account type not clearly selected or specified.',
            'confidence': 'medium'
        })
    
    # Rule 10: Investment Objective
    objective_terms = ['investment objective', 'objective', 'goal', 'purpose', 'investment goal']
    has_objective = any(term in text_lower for term in objective_terms)
    if not has_objective:
        errors.append({
            'type': 'missing_field',
            'field': 'investment_objective',
            'severity': 'medium',
            'priority': 'MEDIUM',
            'message': 'Investment objective not specified.',
            'confidence': 'medium'
        })
    
    # LPL Required Fields (legacy support)
    required_fields_high = [
        ('signature', 'signature', 'HIGH'),
        ('ssn', 'social security number', 'HIGH'),
        ('ssn', 'ssn', 'HIGH'),
        ('beneficiary', 'beneficiary', 'HIGH'),
        ('legal name', 'full legal name', 'HIGH'),
        ('legal name', 'legal name', 'HIGH')
    ]
    
    required_fields_medium = [
        ('address', 'physical address', 'MEDIUM'),
        ('address', 'address', 'MEDIUM'),
        ('date of birth', 'date of birth', 'MEDIUM'),
        ('date of birth', 'dob', 'MEDIUM'),
        ('account type', 'account type', 'MEDIUM'),
        ('investment objective', 'investment objective', 'MEDIUM'),
        ('risk tolerance', 'risk tolerance', 'MEDIUM')
    ]
    
    # Check for HIGH priority missing fields
    for field_key, search_term, priority in required_fields_high:
        if search_term not in text_lower:
            errors.append({
                'type': 'missing_field',
                'field': field_key,
                'severity': 'high',
                'priority': priority,
                'message': f'Required field "{field_key}" not found in document. This is a NIGO error that will delay account opening.',
                'confidence': 'high'
            })
    
    # Check for MEDIUM priority missing fields
    for field_key, search_term, priority in required_fields_medium:
        if search_term not in text_lower:
            errors.append({
                'type': 'missing_field',
                'field': field_key,
                'severity': 'medium',
                'priority': priority,
                'message': f'Required field "{field_key}" not found in document.',
                'confidence': 'medium'
            })
    
    # Check for signature date (must be present and recent)
    if 'signature' in text_lower:
        # Look for date patterns near signature
        import re
        date_pattern = r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}'
        dates = re.findall(date_pattern, extracted_text)
        if not dates:
            errors.append({
                'type': 'missing_date',
                'field': 'signature_date',
                'severity': 'high',
                'priority': 'HIGH',
                'message': 'Signature found but signature date is missing or unclear.',
                'confidence': 'high'
            })
    
    # Check for incomplete beneficiary info
    if 'beneficiary' in text_lower:
        if 'relationship' not in text_lower and 'relation' not in text_lower:
            errors.append({
                'type': 'incomplete_beneficiary',
                'field': 'beneficiary_relationship',
                'severity': 'medium',
                'priority': 'MEDIUM',
                'message': 'Beneficiary name found but relationship is missing.',
                'confidence': 'medium'
            })
    
    # Check for P.O. Box as primary address (not acceptable)
    po_box_patterns = ['p.o. box', 'po box', 'p.o box', 'post office box']
    if any(pattern in text_lower for pattern in po_box_patterns):
        if 'physical address' not in text_lower and 'street' not in text_lower:
            errors.append({
                'type': 'invalid_address',
                'field': 'physical_address',
                'severity': 'medium',
                'priority': 'MEDIUM',
                'message': 'P.O. Box found but physical address is required as primary address.',
                'confidence': 'high'
            })
    
    # Calculate confidence score for overall document
    total_checks = len(required_fields_high) + len(required_fields_medium)
    passed_checks = total_checks - len(errors)
    confidence_score = (passed_checks / total_checks) * 100 if total_checks > 0 else 0
    
    return {
        'errors': errors,
        'confidence_score': round(confidence_score, 1),
        'total_checks': total_checks,
        'passed_checks': passed_checks,
        'nigo_status': 'NIGO' if len([e for e in errors if e['severity'] == 'high']) > 0 else 'REVIEW' if len(errors) > 0 else 'CLEAN'
    }


if __name__ == '__main__':
    print(f"Starting LPL Heritage Hub server on port {app.config['PORT']}")
    app.run(
        host='0.0.0.0',
        port=app.config['PORT'],
        debug=app.config['DEBUG']
    )
