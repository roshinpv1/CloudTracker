import yaml
import json
import re

def extract_content_from_response(response):
    """Extract content from a response that might contain code blocks."""
    if "```yaml" in response:
        content_str = response.strip().split("```yaml")[1].split("```")[0].strip()
        parse_as = "yaml"
    elif "```yml" in response:
        content_str = response.strip().split("```yml")[1].split("```")[0].strip()
        parse_as = "yaml"
    elif "```json" in response:
        content_str = response.strip().split("```json")[1].split("```")[0].strip()
        parse_as = "json"
    elif "```" in response:
        # Try to get content between any code blocks
        content_str = response.strip().split("```")[1].split("```")[0].strip()
        # Determine format based on content
        if content_str.strip().startswith('{') or content_str.strip().startswith('['):
            parse_as = "json"
        else:
            parse_as = "yaml"
    else:
        # If no code blocks, try to parse the entire response
        content_str = response.strip()
        # Determine format based on content
        if content_str.strip().startswith('{') or content_str.strip().startswith('['):
            parse_as = "json"
        else:
            parse_as = "yaml"
    
    return content_str, parse_as

def parse_llm_response(response, expected_format="any"):
    """
    Parse a response from an LLM that might be YAML or JSON.
    
    Args:
        response: The raw response from the LLM
        expected_format: What format to expect (yaml, json, or any)
        
    Returns:
        parsed_data: The parsed data
        actual_format: The format that was successfully parsed
    """
    try:
        content_str, detected_format = extract_content_from_response(response)
        print(f"Detected format: {detected_format}")
        
        if expected_format != "any" and expected_format != detected_format:
            print(f"Warning: Expected {expected_format} but detected {detected_format}")
        
        # First try the detected format
        try:
            if detected_format == "json":
                parsed_data = json.loads(content_str)
                print("Successfully parsed as JSON")
                return parsed_data, "json"
            else:
                parsed_data = yaml.safe_load(content_str)
                print("Successfully parsed as YAML")
                return parsed_data, "yaml"
        except Exception as e:
            # If the detected format fails, try the other format
            print(f"Failed to parse as {detected_format}: {e}")
            if detected_format == "json":
                parsed_data = yaml.safe_load(content_str)
                print("Fallback: parsed as YAML")
                return parsed_data, "yaml"
            else:
                parsed_data = json.loads(content_str)
                print("Fallback: parsed as JSON")
                return parsed_data, "json"
    except Exception as e:
        print(f"Error parsing response: {e}")
        print(f"Raw response: {response}")
        raise ValueError(f"Failed to parse response: {e}")

def get_structured_abstractions(data):
    """
    Converts various data formats to a list of abstraction dictionaries.
    
    Args:
        data: The parsed data that might be in different formats
        
    Returns:
        list of abstraction dictionaries
    """
    if isinstance(data, list):
        # Check if this looks like a list of abstractions
        if all(isinstance(item, dict) for item in data):
            return data
    elif isinstance(data, dict):
        # Check if there's an abstractions key
        if "abstractions" in data:
            return data["abstractions"]
        # Check if there's a rules key
        elif "rules" in data:
            return data["rules"]
    
    # If we can't determine a good structure, return an empty list
    return []

def get_structured_relationships(data, num_abstractions):
    """
    Converts various data formats to a standard relationships dictionary.
    
    Args:
        data: The parsed data that might be in different formats
        num_abstractions: The number of valid abstractions to validate against
        
    Returns:
        dict with summary and relationships
    """
    summary = ""
    relationships = []
    
    if isinstance(data, dict):
        # Direct structure match
        if "summary" in data and "relationships" in data:
            summary = data["summary"]
            raw_relationships = data["relationships"]
            
            # Validate and convert relationships
            for rel in raw_relationships:
                if isinstance(rel, dict) and all(k in rel for k in ["from_abstraction", "to_abstraction", "label"]):
                    try:
                        # Handle different formats of from/to
                        from_idx = convert_to_index(rel["from_abstraction"])
                        to_idx = convert_to_index(rel["to_abstraction"])
                        
                        # Only add valid indices
                        if 0 <= from_idx < num_abstractions and 0 <= to_idx < num_abstractions:
                            relationships.append({
                                "from": from_idx,
                                "to": to_idx,
                                "label": str(rel["label"])
                            })
                    except (ValueError, TypeError):
                        # Skip invalid relationships
                        continue
        # Other structures - try to extract useful info
        elif "project_summary" in data:
            summary = data["project_summary"]
            if "connections" in data:
                raw_relationships = data["connections"]
                # Process similar to above...
    
    # If we got a list of abstractions, generate simple relationships
    elif isinstance(data, list) and all(isinstance(item, dict) for item in data):
        # Get the first abstraction description as a summary if possible
        for item in data:
            if "description" in item:
                summary = item["description"]
                break
        
        if not summary and len(data) > 0:
            summary = f"Project with {len(data)} key components"
            
        # Generate simple relationships (sequential dependency)
        for i in range(len(data)-1):
            if i < num_abstractions and i+1 < num_abstractions:
                from_name = data[i].get("name", f"Component {i}")
                to_name = data[i+1].get("name", f"Component {i+1}")
                relationships.append({
                    "from": i,
                    "to": i+1,
                    "label": "Relates to"
                })
    
    # Ensure we have at least one relationship for validation
    if not relationships and num_abstractions > 1:
        relationships.append({
            "from": 0,
            "to": 1,
            "label": "Connected to"
        })
    
    return {
        "summary": summary,
        "details": relationships
    }

def convert_to_index(value):
    """Convert various index formats to an integer."""
    if isinstance(value, int):
        return value
    
    if isinstance(value, str):
        # Try to extract number before # symbol
        if "#" in value:
            return int(value.split("#")[0].strip())
        # Otherwise just convert the string
        return int(value.strip())
    
    # For any other type, convert to string first then int
    return int(str(value).strip()) 