"""
Goal Generator - Creates personalized goal cards based on quiz answers and account value.
Uses total_account_value extracted by Textract as the budget.
"""

def generate_goals(quiz_answers, total_account_value, selected_goals=None):
    """
    Generate goal cards based on quiz answers and account value.
    
    Args:
        quiz_answers: List of quiz answer objects
        total_account_value: Total account value extracted from Textract (float)
        selected_goals: List of selected goal types (e.g., ['pay_off_loans', 'home_down_payment'])
    
    Returns:
        List of goal card dictionaries
    """
    goal_cards = []
    
    # Extract selected goals from quiz answers
    if not selected_goals:
        selected_goals = extract_selected_goals(quiz_answers)
    
    budget = float(total_account_value) if total_account_value else 0
    
    # Process each selected goal
    for goal_type in selected_goals:
        if goal_type == 'pay_off_loans':
            goal_card = generate_loan_payoff_goal(budget, goal_cards)
            if goal_card:
                goal_cards.append(goal_card)
        
        elif goal_type == 'home_down_payment':
            goal_card = generate_home_down_payment_goal(budget, goal_cards)
            if goal_card:
                goal_cards.append(goal_card)
        
        elif goal_type == 'retirement':
            goal_card = generate_retirement_goal(budget, goal_cards)
            if goal_card:
                goal_cards.append(goal_card)
        
        elif goal_type == 'emergency_fund':
            goal_card = generate_emergency_fund_goal(budget, goal_cards)
            if goal_card:
                goal_cards.append(goal_card)
        
        elif goal_type == 'education':
            goal_card = generate_education_goal(budget, goal_cards)
            if goal_card:
                goal_cards.append(goal_card)
    
    return goal_cards


def extract_selected_goals(quiz_answers):
    """Extract selected goals from quiz answers."""
    selected_goals = []
    
    for answer in quiz_answers:
        question_id = answer.get('question_id')
        selected = answer.get('selected', [])
        
        # Question 1: Primary financial goal
        if question_id == 1:
            if 'b' in selected:  # Grow portfolio
                selected_goals.append('retirement')
            elif 'c' in selected:  # Immediate needs
                selected_goals.append('pay_off_loans')
                selected_goals.append('emergency_fund')
            elif 'a' in selected:  # Preserve assets
                selected_goals.append('emergency_fund')
        
        # Question 4: Estate planning tasks
        if question_id == 4:
            if 'e' in selected:  # Document organization
                selected_goals.append('emergency_fund')
    
    # Default goals if none selected
    if not selected_goals:
        selected_goals = ['emergency_fund', 'retirement']
    
    return selected_goals


def generate_loan_payoff_goal(budget, existing_goals):
    """
    Generate loan payoff goal card.
    Logic: If user selects 'Pay off Loans' and has $50k, 
    card MUST say: 'Plan: We found $50,000. We can pay your loans and have $X left over.'
    """
    # Estimate loan amount (in real app, this would come from user input or financial data)
    estimated_loan_amount = budget * 0.6  # Assume 60% of account value for loans
    
    remaining_budget = budget - sum(g.get('allocated_amount', 0) for g in existing_goals)
    available_for_loans = min(remaining_budget, estimated_loan_amount)
    left_over = remaining_budget - available_for_loans
    
    return {
        'id': 'goal_loan_payoff',
        'title': 'Pay Off Loans',
        'description': f'Plan: We found ${budget:,.2f}. We can pay your loans and have ${left_over:,.2f} left over.',
        'category': 'debt',
        'priority': 'high',
        'points_reward': 100,
        'estimated_time': 'Immediate',
        'status': 'not_started',
        'target_amount': estimated_loan_amount,
        'allocated_amount': available_for_loans,
        'current_progress': 0,
        'steps': [
            'Review outstanding loan balances',
            'Prioritize high-interest debt',
            'Create payoff schedule',
            'Track progress monthly'
        ]
    }


def generate_home_down_payment_goal(budget, existing_goals):
    """
    Generate home down payment goal card.
    Logic: Calculate 20% of total value as suggested 'House Fund'.
    """
    remaining_budget = budget - sum(g.get('allocated_amount', 0) for g in existing_goals)
    suggested_down_payment = budget * 0.20  # 20% of total value
    allocated_amount = min(remaining_budget, suggested_down_payment)
    
    return {
        'id': 'goal_home_down_payment',
        'title': 'Home Down Payment Fund',
        'description': f'Plan: We found ${budget:,.2f}. We suggest allocating ${suggested_down_payment:,.2f} (20%) for your home down payment fund.',
        'category': 'housing',
        'priority': 'high',
        'points_reward': 125,
        'estimated_time': '5-7 years',
        'status': 'not_started',
        'target_amount': suggested_down_payment,
        'allocated_amount': allocated_amount,
        'current_progress': 0,
        'steps': [
            'Determine target home price',
            'Calculate 20% down payment needed',
            'Set up dedicated savings account',
            'Automate monthly contributions'
        ]
    }


def generate_retirement_goal(budget, existing_goals):
    """Generate retirement goal card."""
    remaining_budget = budget - sum(g.get('allocated_amount', 0) for g in existing_goals)
    retirement_allocation = remaining_budget * 0.50  # 50% for retirement
    
    return {
        'id': 'goal_retirement',
        'title': 'Retirement Savings',
        'description': f'Plan: We found ${budget:,.2f}. Allocating ${retirement_allocation:,.2f} for long-term retirement planning.',
        'category': 'retirement',
        'priority': 'high',
        'points_reward': 150,
        'estimated_time': 'Long-term (10+ years)',
        'status': 'not_started',
        'target_amount': retirement_allocation * 2,  # Target is 2x allocation
        'allocated_amount': retirement_allocation,
        'current_progress': 0,
        'steps': [
            'Maximize IRA contributions',
            'Consider 401(k) if available',
            'Diversify retirement portfolio',
            'Review annually'
        ]
    }


def generate_emergency_fund_goal(budget, existing_goals):
    """Generate emergency fund goal card."""
    remaining_budget = budget - sum(g.get('allocated_amount', 0) for g in existing_goals)
    emergency_target = budget * 0.10  # 10% for emergency fund
    allocated_amount = min(remaining_budget, emergency_target)
    
    return {
        'id': 'goal_emergency_fund',
        'title': 'Emergency Fund',
        'description': f'Plan: We found ${budget:,.2f}. Setting aside ${allocated_amount:,.2f} for emergency expenses (3-6 months expenses).',
        'category': 'safety',
        'priority': 'high',
        'points_reward': 75,
        'estimated_time': 'Immediate',
        'status': 'not_started',
        'target_amount': emergency_target,
        'allocated_amount': allocated_amount,
        'current_progress': 0,
        'steps': [
            'Calculate 3-6 months expenses',
            'Open high-yield savings account',
            'Set up automatic transfers',
            'Keep fund easily accessible'
        ]
    }


def generate_education_goal(budget, existing_goals):
    """Generate education goal card."""
    remaining_budget = budget - sum(g.get('allocated_amount', 0) for g in existing_goals)
    education_allocation = remaining_budget * 0.15  # 15% for education
    
    return {
        'id': 'goal_education',
        'title': 'Education Fund',
        'description': f'Plan: We found ${budget:,.2f}. Allocating ${education_allocation:,.2f} for education expenses (529 plan or similar).',
        'category': 'education',
        'priority': 'medium',
        'points_reward': 100,
        'estimated_time': '5-15 years',
        'status': 'not_started',
        'target_amount': education_allocation * 1.5,
        'allocated_amount': education_allocation,
        'current_progress': 0,
        'steps': [
            'Research 529 plan options',
            'Determine education timeline',
            'Set contribution schedule',
            'Review investment options'
        ]
    }
