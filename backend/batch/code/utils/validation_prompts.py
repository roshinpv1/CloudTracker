"""
Validation prompts for analyzing code quality aspects related to logging, availability, and error handling.
These prompts are designed to be used with the tutorial generation system to focus on specific validation criteria.
"""

LOGGING_VALIDATION_PROMPT = """
Analyze the source code carefully for the following logging aspects:

1. **Centralized Logging Frameworks**:
   - Identify usage of centralized logging frameworks (Log4j, SLF4J, Winston, Bunyan, etc.)
   - Check if logs are routed to centralized sinks (Splunk, ELK, Datadog, etc.)

2. **Sensitive Data Protection**:
   - Scan log statements for potential exposure of confidential data
   - Look for patterns like passwords, SSNs, credit card numbers, tokens, or other PII
   - Identify any masking or redaction mechanisms used

3. **Audit Trail Logging**:
   - Check for logs around create, update, and delete operations on sensitive entities
   - Verify that user actions and system changes are being recorded

4. **Correlation/Tracking IDs**:
   - Validate the presence and propagation of correlation or tracking IDs 
   - Look for UUIDs, transactionIds, or request IDs that follow requests through the system

5. **REST API Call Logging**:
   - Review controller and middleware layers to ensure REST API calls are logged
   - Check for request/response logging patterns

6. **Log Level Usage**:
   - Examine all services and modules for consistent use of log levels (info, error, debug, etc.)
   - Verify appropriate log level usage based on context

7. **Frontend Error Logging**:
   - If frontend code is available, analyze it for error handling and logging
   - Look for console.error or third-party tools like Sentry
"""

AVAILABILITY_VALIDATION_PROMPT = """
Examine the codebase thoroughly for the following availability features:

1. **Retry Logic**:
   - Inspect backend code for retry mechanisms
   - Look for libraries like Resilience4j, Spring Retry, or custom retry loops
   - Identify retry patterns, backoff strategies, and maximum attempt configurations

2. **High Availability Configurations**:
   - Validate high availability setups in infrastructure code
   - Check for Kubernetes readiness/liveness probes or cloud-based failover configurations
   - Look for redundancy and replication patterns

3. **Timeout Settings**:
   - Review all I/O operations, including REST clients and database connections
   - Confirm appropriate timeout settings to prevent hanging operations
   - Check for connection pool configurations

4. **Auto-scaling**:
   - Check infrastructure-as-code for auto scaling configurations
   - Look for Kubernetes HPA, AWS Lambda concurrency settings, or equivalent
   - Identify scaling triggers and policies

5. **Throttling/Rate Limiting**:
   - Identify implementation of throttling using token bucket or rate limiting patterns
   - Look for libraries like Guava, Resilience4j, or custom implementations
   - Check for rate limit configurations and handling

6. **Circuit Breaker Patterns**:
   - Detect circuit breaker mechanisms using Hystrix, Resilience4j, or custom logic
   - Verify fault isolation strategies
   - Look for fallback mechanisms
"""

ERROR_HANDLING_VALIDATION_PROMPT = """
Analyze the codebase for the following error handling practices:

1. **Backend Error Handling**:
   - Evaluate robustness of error handling in backend code
   - Inspect try-catch blocks and usage of logger.error
   - Look for error classification and handling strategies

2. **HTTP Error Codes**:
   - Confirm the correct use of HTTP standard error codes in controller responses
   - Check for global exception handling mechanisms
   - Verify consistent error response formats

3. **Client-side Error Handling**:
   - Check that client-side or middleware components capture and log error responses
   - Look for handling of 4xx and 5xx responses
   - Verify error state management and recovery

4. **Error Documentation**:
   - Check for error documentation in code comments or API specs
   - Verify error message clarity and actionability
"""

# Combined prompt that incorporates all three aspects
COMBINED_VALIDATION_PROMPT = f"""
Thoroughly analyze the provided source code to detect and evaluate implementation quality for logging, availability, and error handling practices.

# Logging Analysis
{LOGGING_VALIDATION_PROMPT}

# Availability Analysis
{AVAILABILITY_VALIDATION_PROMPT}

# Error Handling Analysis
{ERROR_HANDLING_VALIDATION_PROMPT}

For each finding, provide:
1. The specific file and location where the pattern was detected
2. Code snippets demonstrating the implementation (when available)
3. An assessment of the quality and completeness of the implementation
4. Recommendations for improvement where applicable

Focus on providing concrete examples from the codebase rather than general suggestions.
""" 