import json
import re
import logging
from typing import Dict, Any, List, Optional, Union
from pydantic import BaseModel, ValidationError

from ..schemas.validation import (
    LoggingAnalysisResult, 
    AvailabilityAnalysisResult, 
    ErrorHandlingAnalysisResult,
    CodeQualityAnalysisResult
)

# Configure logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

class LLMProcessor:
    """
    Utility class to process LLM outputs and convert them to structured schema objects
    """
    
    @staticmethod
    def extract_json_from_markdown(text: str) -> Optional[Dict[str, Any]]:
        """
        Extract JSON data from markdown text that might contain JSON code blocks
        
        Args:
            text: Markdown text potentially containing JSON code blocks
            
        Returns:
            Extracted JSON as dict or None if extraction failed
        """
        # Look for JSON in code blocks
        json_block_pattern = r'```(?:json)?\s*({[\s\S]*?})\s*```'
        matches = re.findall(json_block_pattern, text)
        
        for match in matches:
            try:
                return json.loads(match)
            except json.JSONDecodeError:
                continue
        
        # If no valid JSON blocks found, try parsing the whole text as JSON
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
        
        # If still no valid JSON, look for any {} block
        curly_braces_pattern = r'{[\s\S]*?}'
        matches = re.findall(curly_braces_pattern, text)
        
        for match in matches:
            try:
                return json.loads(match)
            except json.JSONDecodeError:
                continue
        
        return None
    
    @staticmethod
    def parse_logging_section(text: str) -> LoggingAnalysisResult:
        """
        Parse the logging section of LLM analysis into structured data
        
        Args:
            text: Text containing logging analysis
            
        Returns:
            Structured LoggingAnalysisResult
        """
        result = LoggingAnalysisResult()
        
        # Extract frameworks
        framework_pattern = r'(?:using|identified|found).*?(Log4j|SLF4J|Logback|Winston|Bunyan|java\.util\.logging)'
        frameworks = set(re.findall(framework_pattern, text, re.IGNORECASE))
        result.logging_frameworks = list(frameworks)
        
        # Determine if centralized logging is present
        result.has_centralized_logging = bool(frameworks) and (
            'centralized' in text.lower() or 
            any(sink in text.lower() for sink in ['splunk', 'elk', 'elasticsearch', 'logstash', 'kibana', 'datadog'])
        )
        
        # Check for sensitive data protection
        sensitive_data_section = re.search(r'(?:sensitive|confidential|pii).*?data.*?protection', text, re.IGNORECASE)
        result.has_sensitive_data_protection = bool(sensitive_data_section) and not ('missing' in sensitive_data_section.group(0).lower() if sensitive_data_section else '')
        
        # Check for audit trail logging
        result.has_audit_trail_logging = 'audit' in text.lower() and not ('missing audit' in text.lower() or 'no audit' in text.lower())
        
        # Check for correlation IDs
        result.has_correlation_tracking_ids = any(term in text.lower() for term in ['correlation id', 'tracking id', 'trace id', 'request id'])
        
        # Check for API call logging
        result.has_api_call_logging = 'api call' in text.lower() and 'log' in text.lower()
        
        # Check for consistent log levels
        result.consistent_log_levels = 'consistent' in text.lower() and 'log level' in text.lower()
        
        # Check for frontend error logging
        result.has_frontend_error_logging = ('frontend' in text.lower() or 'client' in text.lower()) and 'error' in text.lower() and 'log' in text.lower()
        
        # Extract issues and recommendations
        issue_pattern = r'(?:Issue|Missing|Recommendation|Need to)[\s:]+(.*?)(?:\.|$)'
        issues = re.findall(issue_pattern, text)
        result.identified_issues = [issue.strip() for issue in issues if issue.strip()]
        
        # Extract pattern examples
        pattern_examples = {}
        if 'example' in text.lower():
            # Try to extract code examples
            code_pattern = r'`(.*?)`'
            code_examples = re.findall(code_pattern, text)
            if code_examples:
                pattern_examples['code_examples'] = code_examples
        
        result.detected_patterns = pattern_examples
        
        return result
    
    @staticmethod
    def parse_availability_section(text: str) -> AvailabilityAnalysisResult:
        """
        Parse the availability section of LLM analysis into structured data
        
        Args:
            text: Text containing availability analysis
            
        Returns:
            Structured AvailabilityAnalysisResult
        """
        result = AvailabilityAnalysisResult()
        
        # Check for retry logic
        result.has_retry_logic = 'retry' in text.lower() and not ('missing retry' in text.lower() or 'no retry' in text.lower())
        
        # Check for high availability configuration
        result.has_high_availability_config = ('high availability' in text.lower() or 'ha' in text.lower()) and not ('missing' in text.lower() or 'no high availability' in text.lower())
        
        # Check for timeout settings
        result.has_timeout_settings = 'timeout' in text.lower() and not ('missing timeout' in text.lower() or 'no timeout' in text.lower())
        
        # Check for auto-scaling
        result.has_auto_scaling = ('auto-scaling' in text.lower() or 'autoscaling' in text.lower()) and not ('missing auto' in text.lower() or 'no auto' in text.lower())
        
        # Check for throttling
        result.has_throttling = ('throttling' in text.lower() or 'rate limit' in text.lower()) and not ('missing throttling' in text.lower() or 'no throttling' in text.lower())
        
        # Check for circuit breakers
        result.has_circuit_breakers = 'circuit break' in text.lower() and not ('missing circuit' in text.lower() or 'no circuit' in text.lower())
        
        # Extract issues and recommendations
        issue_pattern = r'(?:Issue|Missing|Recommendation|Need to)[\s:]+(.*?)(?:\.|$)'
        issues = re.findall(issue_pattern, text)
        result.identified_issues = [issue.strip() for issue in issues if issue.strip()]
        
        # Extract pattern examples
        pattern_examples = {}
        if 'example' in text.lower():
            # Try to extract code examples
            code_pattern = r'`(.*?)`'
            code_examples = re.findall(code_pattern, text)
            if code_examples:
                pattern_examples['code_examples'] = code_examples
        
        result.detected_patterns = pattern_examples
        
        return result
    
    @staticmethod
    def parse_error_handling_section(text: str) -> ErrorHandlingAnalysisResult:
        """
        Parse the error handling section of LLM analysis into structured data
        
        Args:
            text: Text containing error handling analysis
            
        Returns:
            Structured ErrorHandlingAnalysisResult
        """
        result = ErrorHandlingAnalysisResult()
        
        # Check for backend error handling
        result.has_backend_error_handling = 'error handling' in text.lower() and 'backend' in text.lower() and not ('missing' in text.lower() or 'no error handling' in text.lower())
        
        # Check for standard HTTP codes
        result.has_standard_http_codes = ('http' in text.lower() and 'status' in text.lower() and 'code' in text.lower()) and not ('missing' in text.lower() or 'no standard' in text.lower())
        
        # Check for client error handling
        result.has_client_error_handling = ('client' in text.lower() or 'frontend' in text.lower()) and 'error' in text.lower() and not ('missing client' in text.lower() or 'no client' in text.lower())
        
        # Check for error documentation
        result.has_error_documentation = 'documentation' in text.lower() and 'error' in text.lower() and not ('missing documentation' in text.lower() or 'no documentation' in text.lower())
        
        # Extract issues and recommendations
        issue_pattern = r'(?:Issue|Missing|Recommendation|Need to)[\s:]+(.*?)(?:\.|$)'
        issues = re.findall(issue_pattern, text)
        result.identified_issues = [issue.strip() for issue in issues if issue.strip()]
        
        # Extract pattern examples
        pattern_examples = {}
        if 'example' in text.lower():
            # Try to extract code examples
            code_pattern = r'`(.*?)`'
            code_examples = re.findall(code_pattern, text)
            if code_examples:
                pattern_examples['code_examples'] = code_examples
        
        result.detected_patterns = pattern_examples
        
        return result
    
    @staticmethod
    def extract_quality_score(text: str) -> int:
        """
        Extract an overall quality score from the LLM analysis
        
        Args:
            text: Full LLM analysis text
            
        Returns:
            Integer score from 0-100, defaults to 50 if not found
        """
        # Look for score patterns
        score_patterns = [
            r'overall(?:\s+quality)?\s+score(?:\s+of)?\s*[:-]?\s*(\d+)',
            r'(?:quality|overall)\s+rating(?:\s+of)?\s*[:-]?\s*(\d+)',
            r'score[:-]?\s*(\d+)'
        ]
        
        for pattern in score_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    score = int(match.group(1))
                    # Normalize to 0-100 range
                    if 0 <= score <= 10:
                        return score * 10
                    elif 0 <= score <= 100:
                        return score
                except ValueError:
                    continue
        
        # Default score if not found
        return 50
    
    @classmethod
    def process_llm_code_quality_analysis(
        cls, 
        llm_output: str,
        repository_url: str,
        project_name: str,
        file_info: Dict[str, Any]
    ) -> CodeQualityAnalysisResult:
        """
        Process the full LLM code quality analysis output into a structured format
        
        Args:
            llm_output: The full text output from the LLM
            repository_url: URL of the analyzed repository
            project_name: Name of the analyzed project
            file_info: Dictionary containing file counts and types
            
        Returns:
            Structured CodeQualityAnalysisResult
        """
        # Split the analysis into sections
        sections = {}
        
        # Extract executive summary
        exec_summary_match = re.search(r'# Executive Summary\s+(.*?)(?=\n#|\Z)', llm_output, re.DOTALL)
        executive_summary = exec_summary_match.group(1).strip() if exec_summary_match else ""
        
        # Extract logging section
        logging_match = re.search(r'# Logging Analysis\s+(.*?)(?=\n# [A-Z]|\Z)', llm_output, re.DOTALL)
        logging_section = logging_match.group(1).strip() if logging_match else ""
        
        # Extract availability section
        availability_match = re.search(r'# Availability Analysis\s+(.*?)(?=\n# [A-Z]|\Z)', llm_output, re.DOTALL)
        availability_section = availability_match.group(1).strip() if availability_match else ""
        
        # Extract error handling section
        error_handling_match = re.search(r'# Error Handling Analysis\s+(.*?)(?=\n# [A-Z]|\Z)', llm_output, re.DOTALL)
        error_handling_section = error_handling_match.group(1).strip() if error_handling_match else ""
        
        # Parse each section
        logging_analysis = cls.parse_logging_section(logging_section)
        availability_analysis = cls.parse_availability_section(availability_section)
        error_handling_analysis = cls.parse_error_handling_section(error_handling_section)
        
        # Extract overall quality score
        overall_quality_score = cls.extract_quality_score(llm_output)
        
        # Create the final structured result
        result = CodeQualityAnalysisResult(
            repository_url=repository_url,
            project_name=project_name,
            file_count=file_info.get('file_count', 0),
            test_file_count=file_info.get('test_file_count', 0),
            file_types=file_info.get('file_types', {}),
            analyzed_files=file_info.get('analyzed_files', []),
            logging_analysis=logging_analysis,
            availability_analysis=availability_analysis,
            error_handling_analysis=error_handling_analysis,
            overall_quality_score=overall_quality_score,
            summary=llm_output[:1000] if len(llm_output) > 1000 else llm_output,  # Truncate summary if too long
            executive_summary=executive_summary
        )
        
        return result 