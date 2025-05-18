import os
import re
from utils.call_llm import call_llm
from utils.validation_prompts import COMBINED_VALIDATION_PROMPT, LOGGING_VALIDATION_PROMPT, AVAILABILITY_VALIDATION_PROMPT, ERROR_HANDLING_VALIDATION_PROMPT
from utils.parse_utils import parse_llm_response
from pocketflow import Node, Flow
import uuid
from utils.chromadb_storage import CodeQualityStorage


class CodeQualityAnalyzer(Node):
    """
    Node that analyzes code quality focusing on logging, availability, and error handling.
    This is compatible with the existing tutorial generation flow but focuses on quality aspects.
    """
    
    def prep(self, shared):
        files_data = shared["files"]
        project_name = shared["project_name"]
        language = shared.get("language", "english")
        use_cache = shared.get("use_cache", True)
        focus_areas = shared.get("focus_areas", ["logging", "availability", "error_handling"])
        
        # Helper to create context from files, limiting size to avoid token overflow
        def create_llm_context(files_data, max_chars=150000):
            context = ""
            file_info = []  # Store tuples of (index, path)
            total_chars = 0
            
            for i, (path, content) in enumerate(files_data):
                entry = f"--- File Index {i}: {path} ---\n{content}\n\n"
                if total_chars + len(entry) > max_chars:
                    break
                    
                context += entry
                total_chars += len(entry)
                file_info.append((i, path))

            return context, file_info, total_chars
        
        # Create the context with file contents
        context, file_info, context_size = create_llm_context(files_data)
        
        # Format file info for the prompt
        file_listing = "\n".join([f"- {idx} # {path}" for idx, path in file_info])
        
        # Select the appropriate prompts based on focus areas
        prompts = {}
        if "logging" in focus_areas:
            prompts["logging"] = LOGGING_VALIDATION_PROMPT
        if "availability" in focus_areas:
            prompts["availability"] = AVAILABILITY_VALIDATION_PROMPT
        if "error_handling" in focus_areas:
            prompts["error_handling"] = ERROR_HANDLING_VALIDATION_PROMPT
        
        # If all areas are selected, use the combined prompt
        if len(prompts) == 3:
            prompts = {"combined": COMBINED_VALIDATION_PROMPT}
        
        return {
            "context": context,
            "file_listing": file_listing,
            "project_name": project_name,
            "prompts": prompts,
            "language": language,
            "use_cache": use_cache,
            "context_size": context_size
        }

    def exec(self, prep_res):
        context = prep_res["context"]
        file_listing = prep_res["file_listing"]
        project_name = prep_res["project_name"]
        prompts = prep_res["prompts"]
        language = prep_res["language"]
        use_cache = prep_res["use_cache"]
        context_size = prep_res["context_size"]
        
        print(f"Analyzing code quality aspects for '{project_name}' (context size: {context_size} chars)")
        
        # Results for each focus area
        analysis_results = {}
        
        # Process each focus area
        for area, prompt_template in prompts.items():
            print(f"Analyzing {area} practices...")
            
            prompt = f"""
For the project `{project_name}`:

Codebase Context:
{context}

Files in the project:
{file_listing}

{prompt_template}

Format your detailed analysis as Markdown with proper headings, bullet points, and code examples.
Be specific about files and line numbers when referencing code.
Note which best practices are implemented, which are missing, and make specific recommendations.
"""
            
            response = call_llm(prompt, use_cache=use_cache)
            
            # Store the raw response
            analysis_results[area] = response
        
        # Generate a combined report
        report_content = f"# Code Quality Analysis: {project_name}\n\n"
        
        if "combined" in analysis_results:
            report_content += analysis_results["combined"]
        else:
            # Add each section separately
            if "logging" in analysis_results:
                report_content += f"## Logging Analysis\n\n{analysis_results['logging']}\n\n"
            if "availability" in analysis_results:
                report_content += f"## Availability Analysis\n\n{analysis_results['availability']}\n\n"
            if "error_handling" in analysis_results:
                report_content += f"## Error Handling Analysis\n\n{analysis_results['error_handling']}\n\n"
        
        # Add summary and conclusions
        summary_prompt = f"""
Based on the following detailed code quality analysis for the project '{project_name}', 
create a concise executive summary highlighting the key findings, strengths, weaknesses, 
and most critical recommendations.

Analysis Details:
{report_content}

Format your response as a Markdown executive summary with 3-5 paragraphs.
"""
        
        executive_summary = call_llm(summary_prompt, use_cache=use_cache)
        final_report = f"# Executive Summary\n\n{executive_summary}\n\n" + report_content
        
        return final_report

    def post(self, shared, prep_res, exec_res):
        # Store the analysis in shared
        shared["code_quality_analysis"] = exec_res
        
        # Create an output directory if it doesn't exist
        output_base_dir = shared.get("output_dir", "output")
        project_name = shared["project_name"]
        output_path = os.path.join(output_base_dir, project_name)
        os.makedirs(output_path, exist_ok=True)
        
        # Write the report to a file
        report_path = os.path.join(output_path, "code_quality_report.md")
        with open(report_path, "w", encoding="utf-8") as f:
            f.write(exec_res)
        
        print(f"Code quality report generated at: {report_path}")
        
        # Store the report path
        shared["code_quality_report_path"] = report_path
        
        # Store in ChromaDB if requested
        if shared.get("store_in_chromadb", False):
            # Get app ID and name
            app_id = shared.get("app_id")
            app_name = shared.get("app_name")
            
            # Generate app_id if not provided
            if not app_id:
                app_id = str(uuid.uuid4())
                shared["app_id"] = app_id
                
            # Use project name as app_name if not provided
            if not app_name:
                app_name = project_name or "unknown_app"
                shared["app_name"] = app_name
            
            # Get ChromaDB storage parameters
            chromadb_dir = shared.get("chromadb_dir", "code_quality_db")
            chromadb_collection = shared.get("chromadb_collection", "code_quality_analyses")
            embedding_model_path = shared.get("embedding_model_path")
            embedding_model_name = shared.get("embedding_model_name")
            additional_metadata = shared.get("additional_metadata")
            focus_areas = shared.get("focus_areas", ["logging", "availability", "error_handling"])
            
            try:
                # Initialize ChromaDB storage
                storage = CodeQualityStorage(
                    persist_directory=chromadb_dir,
                    collection_name=chromadb_collection,
                    embedding_model_path=embedding_model_path,
                    embedding_model_name=embedding_model_name
                )
                
                # Store the analysis
                doc_id = storage.store_analysis(
                    app_id=app_id,
                    app_name=app_name,
                    report_content=exec_res,
                    focus_areas=focus_areas,
                    additional_metadata=additional_metadata
                )
                
                # Store the document ID for reference
                shared["chromadb_doc_id"] = doc_id
                
                print(f"Analysis stored in ChromaDB with ID: {doc_id}")
                print(f"App ID: {app_id}, App Name: {app_name}")
                
            except Exception as e:
                print(f"Error storing analysis in ChromaDB: {str(e)}")
                shared["chromadb_error"] = str(e)


def create_quality_analysis_flow(focus_areas=None):
    """Creates a flow focused on code quality analysis."""
    # Import from the modules directly instead of importing create_code_flow
    from nodes import FetchRepo
    
    # Create the flow structure
    fetch_repo = FetchRepo()
    code_quality_analyzer = CodeQualityAnalyzer()
    
    # Connect the flow
    fetch_repo >> code_quality_analyzer
    
    # Create the flow
    flow = Flow(start=fetch_repo)
    
    return flow


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate a code quality report for a GitHub repository or local directory.")
    
    # Create mutually exclusive group for source
    source_group = parser.add_mutually_exclusive_group(required=True)
    source_group.add_argument("--repo", help="URL of the public GitHub repository.")
    source_group.add_argument("--dir", help="Path to local directory.")
    
    parser.add_argument("-o", "--output", default="output", help="Base directory for output (default: ./output).")
    parser.add_argument("-n", "--name", help="Project name (optional, derived from repo/directory if omitted).")
    parser.add_argument("--focus", choices=["logging", "availability", "error_handling", "all"], default="all", 
                        help="Focus area(s) of the analysis (default: all)")
    
    # Add ChromaDB-related arguments
    chromadb_group = parser.add_argument_group('ChromaDB Storage Options')
    chromadb_group.add_argument("--store-db", action="store_true", help="Store analysis results in ChromaDB")
    chromadb_group.add_argument("--app-id", help="Unique ID for the application (generated if not provided)")
    chromadb_group.add_argument("--app-name", help="Name of the application (defaults to project name)")
    chromadb_group.add_argument("--db-dir", default="code_quality_db", help="Directory for ChromaDB storage (default: ./code_quality_db)")
    chromadb_group.add_argument("--db-collection", default="code_quality_analyses", help="Collection name in ChromaDB")
    chromadb_group.add_argument("--embedding-model", help="Path to local embedding model or name of remote model")
    chromadb_group.add_argument("--meta", nargs="+", help="Additional metadata as key=value pairs")
    
    args = parser.parse_args()
    
    # Convert focus argument to list
    if args.focus == "all":
        focus_areas = ["logging", "availability", "error_handling"]
    else:
        focus_areas = [args.focus]
    
    # Parse additional metadata if provided
    additional_metadata = {}
    if args.meta:
        for item in args.meta:
            if "=" in item:
                key, value = item.split("=", 1)
                additional_metadata[key.strip()] = value.strip()
    
    # Determine embedding model path vs name
    embedding_model_path = None
    embedding_model_name = None
    if args.embedding_model:
        if os.path.exists(args.embedding_model):
            embedding_model_path = args.embedding_model
        else:
            embedding_model_name = args.embedding_model
    
    # Create shared dict similar to main.py
    from main import DEFAULT_INCLUDE_PATTERNS, DEFAULT_EXCLUDE_PATTERNS
    
    shared = {
        "repo_url": args.repo,
        "local_dir": args.dir,
        "project_name": args.name,  # Will be derived if None
        "output_dir": args.output,
        "include_patterns": DEFAULT_INCLUDE_PATTERNS,
        "exclude_patterns": DEFAULT_EXCLUDE_PATTERNS,
        "max_file_size": 1000000,  # About 1MB
        "use_cache": True,
        "focus_areas": focus_areas,
        "files": [],
        
        # ChromaDB options
        "store_in_chromadb": args.store_db,
        "app_id": args.app_id,
        "app_name": args.app_name,
        "chromadb_dir": args.db_dir,
        "chromadb_collection": args.db_collection,
        "embedding_model_path": embedding_model_path,
        "embedding_model_name": embedding_model_name,
        "additional_metadata": additional_metadata if additional_metadata else None
    }
    
    # Display starting message with ChromaDB info if applicable
    print(f"Starting code quality analysis for: {args.repo or args.dir}")
    print(f"Focus areas: {', '.join(focus_areas)}")
    
    if args.store_db:
        app_id = args.app_id or "auto-generated"
        app_name = args.app_name or args.name or (os.path.basename(args.dir) if args.dir else "unknown")
        print(f"Will store results in ChromaDB as {app_name} (ID: {app_id})")
        if embedding_model_path:
            print(f"Using local embedding model: {embedding_model_path}")
        elif embedding_model_name:
            print(f"Using remote embedding model: {embedding_model_name}")
    
    # Create and run the flow
    flow = create_quality_analysis_flow(focus_areas)
    flow.run(shared)
    
    # Final output message
    print(f"\nCode quality analysis complete! Report is in: {shared.get('code_quality_report_path')}")
    
    if args.store_db:
        if "chromadb_doc_id" in shared:
            print(f"Analysis stored in ChromaDB with ID: {shared['chromadb_doc_id']}")
        elif "chromadb_error" in shared:
            print(f"Error storing in ChromaDB: {shared['chromadb_error']}") 