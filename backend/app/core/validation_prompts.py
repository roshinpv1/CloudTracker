"""
This module contains structured validation prompts for different checklist categories.
Each prompt is designed to validate compliance with specific requirements.
"""

# Generic validation prompt template
GENERIC_VALIDATION_PROMPT = """
You are a specialized validator for cloud application compliance requirements.

CONTEXT:
- Checklist Item: {description}
- Current Status: {status}
- Application Description: {app_description}
- Evidence Context: {evidence_context}
- Repository: {repository_url} (Commit: {commit_id})

INSTRUCTIONS:
Evaluate if the provided evidence demonstrates compliance with the checklist requirement.
Analyze the given code snippets, documentation, or context thoroughly.
Base your evaluation only on the information provided.

CODE SNIPPETS TO ANALYZE:
{code_snippets}

VALIDATION TASKS:
1. Determine whether the application complies with the checklist requirement
2. Identify specific evidence that supports your determination
3. Find any issues that prevent full compliance
4. Provide actionable recommendations for improvement

REQUIRED OUTPUT FORMAT (JSON):
{{
  "is_compliant": boolean,
  "confidence": "high|medium|low",
  "summary": "Brief assessment summary, 1-2 sentences",
  "detailed_analysis": "Detailed explanation of your findings",
  "findings": [
    {{
      "description": "Description of finding",
      "severity": "info|warning|error|critical",
      "code_location": "file:line (if applicable)",
      "recommendation": "Specific recommendation to address this finding"
    }}
  ],
  "evidence": "Specific, concrete evidence from the provided context that supports your determination"
}}
"""

# Security validation prompts
SECURITY_VALIDATION_PROMPTS = {
    "authentication": """
You are a specialized validator for application authentication requirements.

CONTEXT:
- Checklist Item: {description}
- Current Status: {status}
- Application Description: {app_description}
- Evidence Context: {evidence_context}
- Repository: {repository_url} (Commit: {commit_id})

SPECIFIC INSTRUCTIONS:
Evaluate the authentication mechanisms implemented in the code. Look specifically for:
1. Proper authentication methods (OAuth2, JWT, session-based)
2. Secure credential handling (no hardcoded secrets, proper encryption)
3. Authentication error handling and logging
4. Session management (timeouts, refresh mechanisms)
5. Multi-factor authentication if required

CODE SNIPPETS TO ANALYZE:
{code_snippets}

VALIDATION TASKS:
1. Determine whether the application implements secure authentication mechanisms
2. Identify specific evidence that supports your determination
3. Find any security vulnerabilities in the authentication process
4. Provide actionable recommendations for improvement

REQUIRED OUTPUT FORMAT (JSON):
{{
  "is_compliant": boolean,
  "confidence": "high|medium|low",
  "summary": "Brief assessment summary, 1-2 sentences",
  "detailed_analysis": "Detailed explanation of your findings",
  "findings": [
    {{
      "description": "Description of finding",
      "severity": "info|warning|error|critical",
      "code_location": "file:line (if applicable)",
      "recommendation": "Specific recommendation to address this finding"
    }}
  ],
  "evidence": "Specific code examples or documentation that supports your determination"
}}
""",

    "authorization": """
You are a specialized validator for application authorization requirements.

CONTEXT:
- Checklist Item: {description}
- Current Status: {status}
- Application Description: {app_description}
- Evidence Context: {evidence_context}
- Repository: {repository_url} (Commit: {commit_id})

SPECIFIC INSTRUCTIONS:
Evaluate the authorization mechanisms implemented in the code. Look specifically for:
1. Role-based access control (RBAC) implementation
2. Proper permission checks before resource access
3. API endpoint protection
4. Least privilege principle application
5. Authorization bypass vulnerabilities

CODE SNIPPETS TO ANALYZE:
{code_snippets}

VALIDATION TASKS:
1. Determine whether the application implements secure authorization controls
2. Identify specific evidence that supports your determination
3. Find any authorization vulnerabilities or privilege escalation risks
4. Provide actionable recommendations for improvement

REQUIRED OUTPUT FORMAT (JSON):
{{
  "is_compliant": boolean,
  "confidence": "high|medium|low",
  "summary": "Brief assessment summary, 1-2 sentences",
  "detailed_analysis": "Detailed explanation of your findings",
  "findings": [
    {{
      "description": "Description of finding",
      "severity": "info|warning|error|critical",
      "code_location": "file:line (if applicable)",
      "recommendation": "Specific recommendation to address this finding"
    }}
  ],
  "evidence": "Specific code examples or documentation that supports your determination"
}}
""",

    "data_protection": """
You are a specialized validator for data protection requirements.

CONTEXT:
- Checklist Item: {description}
- Current Status: {status}
- Application Description: {app_description}
- Evidence Context: {evidence_context}
- Repository: {repository_url} (Commit: {commit_id})

SPECIFIC INSTRUCTIONS:
Evaluate the data protection mechanisms implemented in the code. Look specifically for:
1. Encryption of sensitive data at rest and in transit
2. Proper key management
3. Data anonymization/pseudonymization where appropriate
4. Secure storage of credentials and secrets
5. Data leakage prevention

CODE SNIPPETS TO ANALYZE:
{code_snippets}

VALIDATION TASKS:
1. Determine whether sensitive data is properly protected
2. Identify specific evidence that supports your determination
3. Find any data protection vulnerabilities
4. Provide actionable recommendations for improvement

REQUIRED OUTPUT FORMAT (JSON):
{{
  "is_compliant": boolean,
  "confidence": "high|medium|low",
  "summary": "Brief assessment summary, 1-2 sentences",
  "detailed_analysis": "Detailed explanation of your findings",
  "findings": [
    {{
      "description": "Description of finding",
      "severity": "info|warning|error|critical",
      "code_location": "file:line (if applicable)",
      "recommendation": "Specific recommendation to address this finding"
    }}
  ],
  "evidence": "Specific code examples or documentation that supports your determination"
}}
"""
}

# Operational validation prompts
OPERATIONAL_VALIDATION_PROMPTS = {
    "logging": """
You are a specialized validator for application logging requirements.

CONTEXT:
- Checklist Item: {description}
- Current Status: {status}
- Application Description: {app_description}
- Evidence Context: {evidence_context}
- Repository: {repository_url} (Commit: {commit_id})

SPECIFIC INSTRUCTIONS:
Evaluate the logging mechanisms implemented in the code. Look specifically for:
1. Consistent use of logging framework
2. Appropriate log levels (INFO, WARN, ERROR)
3. Useful log context (timestamps, correlation IDs, request details)
4. Sensitive data protection in logs (no PII, passwords, etc.)
5. Error and exception logging

CODE SNIPPETS TO ANALYZE:
{code_snippets}

VALIDATION TASKS:
1. Determine whether the application implements proper logging
2. Identify specific evidence that supports your determination
3. Find any logging implementation issues
4. Provide actionable recommendations for improvement

REQUIRED OUTPUT FORMAT (JSON):
{{
  "is_compliant": boolean,
  "confidence": "high|medium|low",
  "summary": "Brief assessment summary, 1-2 sentences",
  "detailed_analysis": "Detailed explanation of your findings",
  "findings": [
    {{
      "description": "Description of finding",
      "severity": "info|warning|error|critical",
      "code_location": "file:line (if applicable)",
      "recommendation": "Specific recommendation to address this finding"
    }}
  ],
  "evidence": "Specific code examples or documentation that supports your determination"
}}
""",

    "monitoring": """
You are a specialized validator for application monitoring requirements.

CONTEXT:
- Checklist Item: {description}
- Current Status: {status}
- Application Description: {app_description}
- Evidence Context: {evidence_context}
- Repository: {repository_url} (Commit: {commit_id})

SPECIFIC INSTRUCTIONS:
Evaluate the monitoring capabilities implemented in the code. Look specifically for:
1. Health check endpoints
2. Performance metrics collection
3. Integration with monitoring tools (Prometheus, Datadog, etc.)
4. Custom metrics for business-critical operations
5. Alerting configurations

CODE SNIPPETS TO ANALYZE:
{code_snippets}

VALIDATION TASKS:
1. Determine whether the application implements sufficient monitoring
2. Identify specific evidence that supports your determination
3. Find any monitoring gaps
4. Provide actionable recommendations for improvement

REQUIRED OUTPUT FORMAT (JSON):
{{
  "is_compliant": boolean,
  "confidence": "high|medium|low",
  "summary": "Brief assessment summary, 1-2 sentences",
  "detailed_analysis": "Detailed explanation of your findings",
  "findings": [
    {{
      "description": "Description of finding",
      "severity": "info|warning|error|critical",
      "code_location": "file:line (if applicable)",
      "recommendation": "Specific recommendation to address this finding"
    }}
  ],
  "evidence": "Specific code examples or documentation that supports your determination"
}}
"""
}

# Reliability validation prompts
RELIABILITY_VALIDATION_PROMPTS = {
    "error_handling": """
You are a specialized validator for application error handling requirements.

CONTEXT:
- Checklist Item: {description}
- Current Status: {status}
- Application Description: {app_description}
- Evidence Context: {evidence_context}
- Repository: {repository_url} (Commit: {commit_id})

SPECIFIC INSTRUCTIONS:
Evaluate the error handling mechanisms implemented in the code. Look specifically for:
1. Proper try-catch blocks around critical operations
2. Graceful error recovery
3. User-friendly error messages
4. Structured error responses for APIs
5. Error logging and monitoring

CODE SNIPPETS TO ANALYZE:
{code_snippets}

VALIDATION TASKS:
1. Determine whether the application handles errors appropriately
2. Identify specific evidence that supports your determination
3. Find any error handling weaknesses
4. Provide actionable recommendations for improvement

REQUIRED OUTPUT FORMAT (JSON):
{{
  "is_compliant": boolean,
  "confidence": "high|medium|low",
  "summary": "Brief assessment summary, 1-2 sentences",
  "detailed_analysis": "Detailed explanation of your findings",
  "findings": [
    {{
      "description": "Description of finding",
      "severity": "info|warning|error|critical",
      "code_location": "file:line (if applicable)",
      "recommendation": "Specific recommendation to address this finding"
    }}
  ],
  "evidence": "Specific code examples or documentation that supports your determination"
}}
""",

    "resilience": """
You are a specialized validator for application resilience requirements.

CONTEXT:
- Checklist Item: {description}
- Current Status: {status}
- Application Description: {app_description}
- Evidence Context: {evidence_context}
- Repository: {repository_url} (Commit: {commit_id})

SPECIFIC INSTRUCTIONS:
Evaluate the resilience mechanisms implemented in the code. Look specifically for:
1. Circuit breaker patterns
2. Retry mechanisms with backoff
3. Fallback strategies
4. Graceful degradation
5. Timeout handling

CODE SNIPPETS TO ANALYZE:
{code_snippets}

VALIDATION TASKS:
1. Determine whether the application implements resilience patterns
2. Identify specific evidence that supports your determination
3. Find any resilience gaps
4. Provide actionable recommendations for improvement

REQUIRED OUTPUT FORMAT (JSON):
{{
  "is_compliant": boolean,
  "confidence": "high|medium|low",
  "summary": "Brief assessment summary, 1-2 sentences",
  "detailed_analysis": "Detailed explanation of your findings",
  "findings": [
    {{
      "description": "Description of finding",
      "severity": "info|warning|error|critical",
      "code_location": "file:line (if applicable)",
      "recommendation": "Specific recommendation to address this finding"
    }}
  ],
  "evidence": "Specific code examples or documentation that supports your determination"
}}
"""
}

# Map categories to appropriate prompts
CATEGORY_PROMPT_MAPPING = {
    # Security categories
    "security": SECURITY_VALIDATION_PROMPTS.get("data_protection", GENERIC_VALIDATION_PROMPT),
    "authentication": SECURITY_VALIDATION_PROMPTS.get("authentication", GENERIC_VALIDATION_PROMPT),
    "authorization": SECURITY_VALIDATION_PROMPTS.get("authorization", GENERIC_VALIDATION_PROMPT),
    "data-security": SECURITY_VALIDATION_PROMPTS.get("data_protection", GENERIC_VALIDATION_PROMPT),
    
    # Operational categories
    "logging": OPERATIONAL_VALIDATION_PROMPTS.get("logging", GENERIC_VALIDATION_PROMPT),
    "monitoring": OPERATIONAL_VALIDATION_PROMPTS.get("monitoring", GENERIC_VALIDATION_PROMPT),
    "observability": OPERATIONAL_VALIDATION_PROMPTS.get("monitoring", GENERIC_VALIDATION_PROMPT),
    
    # Reliability categories
    "error-handling": RELIABILITY_VALIDATION_PROMPTS.get("error_handling", GENERIC_VALIDATION_PROMPT),
    "resilience": RELIABILITY_VALIDATION_PROMPTS.get("resilience", GENERIC_VALIDATION_PROMPT),
    "availability": RELIABILITY_VALIDATION_PROMPTS.get("resilience", GENERIC_VALIDATION_PROMPT),
}

def get_validation_prompt(category_name=None, checklist_item_description=None):
    """
    Get the appropriate validation prompt based on category name or item description.
    
    Args:
        category_name (str, optional): The category name to get prompt for
        checklist_item_description (str, optional): The description to analyze for keywords
        
    Returns:
        str: The validation prompt template
    """
    if category_name and category_name.lower() in CATEGORY_PROMPT_MAPPING:
        return CATEGORY_PROMPT_MAPPING[category_name.lower()]
    
    # If no direct category match, try to infer from description
    if checklist_item_description:
        description_lower = checklist_item_description.lower()
        
        # Check for keywords in the description to determine the appropriate prompt
        if any(keyword in description_lower for keyword in ["auth", "login", "credential", "password"]):
            return SECURITY_VALIDATION_PROMPTS.get("authentication", GENERIC_VALIDATION_PROMPT)
        
        if any(keyword in description_lower for keyword in ["role", "permission", "access control", "rbac"]):
            return SECURITY_VALIDATION_PROMPTS.get("authorization", GENERIC_VALIDATION_PROMPT)
        
        if any(keyword in description_lower for keyword in ["encrypt", "sensitive data", "pii", "personal information"]):
            return SECURITY_VALIDATION_PROMPTS.get("data_protection", GENERIC_VALIDATION_PROMPT)
        
        if any(keyword in description_lower for keyword in ["log", "audit", "trace"]):
            return OPERATIONAL_VALIDATION_PROMPTS.get("logging", GENERIC_VALIDATION_PROMPT)
        
        if any(keyword in description_lower for keyword in ["monitor", "metrics", "alert", "observe"]):
            return OPERATIONAL_VALIDATION_PROMPTS.get("monitoring", GENERIC_VALIDATION_PROMPT)
        
        if any(keyword in description_lower for keyword in ["error", "exception", "fault"]):
            return RELIABILITY_VALIDATION_PROMPTS.get("error_handling", GENERIC_VALIDATION_PROMPT)
        
        if any(keyword in description_lower for keyword in ["retry", "circuit breaker", "resilient", "failover"]):
            return RELIABILITY_VALIDATION_PROMPTS.get("resilience", GENERIC_VALIDATION_PROMPT)
    
    # Default to generic prompt if no specific match found
    return GENERIC_VALIDATION_PROMPT 