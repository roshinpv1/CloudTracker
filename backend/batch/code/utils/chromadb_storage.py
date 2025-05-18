"""
Utility functions for storing and retrieving code quality analysis in ChromaDB.
Supports local embedding models for text vectorization.
"""

import os
import chromadb
from chromadb.utils import embedding_functions
from typing import Dict, List, Optional, Union, Any

class CodeQualityStorage:
    """
    Storage class for code quality analysis results using ChromaDB.
    Supports both local and remote embedding models.
    """
    
    def __init__(
        self, 
        persist_directory: str = "code_quality_db",
        collection_name: str = "code_quality_analyses",
        embedding_model_path: Optional[str] = None,
        embedding_model_name: Optional[str] = None,
    ):
        """
        Initialize the ChromaDB storage for code quality analyses.
        
        Args:
            persist_directory: Directory where ChromaDB will persist the data
            collection_name: Name of the ChromaDB collection for storing analyses
            embedding_model_path: Path to a local embedding model
            embedding_model_name: Name of a remote embedding model to use (if no local model)
        """
        self.persist_directory = persist_directory
        self.collection_name = collection_name
        
        # Create the persist directory if it doesn't exist
        os.makedirs(persist_directory, exist_ok=True)
        
        # Initialize the ChromaDB client
        self.client = chromadb.PersistentClient(path=persist_directory)
        
        # Set up the embedding function based on provided model
        if embedding_model_path:
            # Use local embedding model when path is provided
            try:
                # Try to load the local model with SentenceTransformer
                from sentence_transformers import SentenceTransformer
                self.embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
                    model_name_or_path=embedding_model_path
                )
                print(f"Using local embedding model from: {embedding_model_path}")
            except ImportError:
                print("Warning: sentence-transformers package not found. Installing basic dependencies...")
                try:
                    import subprocess
                    subprocess.check_call(
                        ["pip", "install", "sentence-transformers"]
                    )
                    # Retry after installation
                    from sentence_transformers import SentenceTransformer
                    self.embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
                        model_name_or_path=embedding_model_path
                    )
                except Exception as e:
                    print(f"Error loading local model: {e}")
                    print("Falling back to default embedding function")
                    self.embedding_function = embedding_functions.DefaultEmbeddingFunction()
            except Exception as e:
                print(f"Error loading local model: {e}")
                print("Falling back to default embedding function")
                self.embedding_function = embedding_functions.DefaultEmbeddingFunction()
        elif embedding_model_name:
            # Use a specified remote model
            try:
                self.embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
                    model_name=embedding_model_name
                )
                print(f"Using remote embedding model: {embedding_model_name}")
            except Exception as e:
                print(f"Error loading remote model: {e}")
                print("Falling back to default embedding function")
                self.embedding_function = embedding_functions.DefaultEmbeddingFunction()
        else:
            # Use default embedding function
            print("Using default embedding function")
            self.embedding_function = embedding_functions.DefaultEmbeddingFunction()
        
        # Get or create the collection
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            embedding_function=self.embedding_function,
            metadata={"description": "Code quality analysis results"}
        )
    
    def store_analysis(
        self,
        app_id: str,
        app_name: str,
        report_content: str,
        focus_areas: List[str],
        additional_metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Store a code quality analysis report in ChromaDB.
        
        Args:
            app_id: Unique identifier for the application
            app_name: Name of the application
            report_content: The content of the code quality report
            focus_areas: List of focus areas analyzed (logging, availability, error_handling)
            additional_metadata: Any additional metadata to store
            
        Returns:
            The document ID of the stored analysis
        """
        # Create document ID
        doc_id = f"quality-{app_id}-{'-'.join(sorted(focus_areas))}"
        
        # Prepare metadata
        metadata = {
            "app_id": app_id,
            "app_name": app_name,
            "focus_areas": ",".join(focus_areas),
            "analysis_type": "code_quality",
        }
        
        # Add any additional metadata
        if additional_metadata:
            metadata.update(additional_metadata)
            
        # Prepare the document for chunking
        # For large reports, we need to chunk the content to fit embedding model limits
        chunks = self._chunk_text(report_content, max_chars=8000)
        
        # Store the first chunk with all metadata
        self.collection.add(
            ids=[doc_id],
            documents=[chunks[0]],
            metadatas=[metadata]
        )
        
        # Store any additional chunks with reference to the main document
        for i, chunk in enumerate(chunks[1:], 1):
            chunk_id = f"{doc_id}-chunk-{i}"
            chunk_metadata = {
                "parent_id": doc_id,
                "app_id": app_id,
                "app_name": app_name,
                "chunk_index": i,
                "analysis_type": "code_quality_chunk"
            }
            
            self.collection.add(
                ids=[chunk_id],
                documents=[chunk],
                metadatas=[chunk_metadata]
            )
        
        print(f"Stored code quality analysis for {app_name} (ID: {app_id}) in ChromaDB")
        return doc_id
    
    def get_analysis(self, app_id: str, focus_areas: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Retrieve a code quality analysis report from ChromaDB.
        
        Args:
            app_id: Unique identifier for the application
            focus_areas: Optional list of focus areas to filter by
            
        Returns:
            Dictionary containing the analysis data and metadata
        """
        # Prepare query filter
        where_filter = {"app_id": app_id}
        
        # Add focus areas to filter if provided
        if focus_areas:
            focus_areas_str = ",".join(sorted(focus_areas))
            where_filter["focus_areas"] = focus_areas_str
        
        # Query for the main document
        results = self.collection.get(
            where=where_filter,
            limit=1
        )
        
        if not results or len(results["ids"]) == 0:
            return {"error": f"No analysis found for app_id: {app_id}"}
        
        doc_id = results["ids"][0]
        main_content = results["documents"][0]
        metadata = results["metadatas"][0]
        
        # Check for additional chunks
        chunk_results = self.collection.get(
            where={"parent_id": doc_id},
            limit=100
        )
        
        # Combine all chunks
        full_content = main_content
        if chunk_results and len(chunk_results["ids"]) > 0:
            # Sort chunks by index
            sorted_chunks = sorted(
                zip(chunk_results["metadatas"], chunk_results["documents"]),
                key=lambda x: x[0].get("chunk_index", 0)
            )
            
            # Append each chunk
            for _, chunk_content in sorted_chunks:
                full_content += chunk_content
        
        # Return the complete analysis
        return {
            "id": doc_id,
            "content": full_content,
            "metadata": metadata
        }
    
    def query_analyses(
        self, 
        query_text: str, 
        app_id: Optional[str] = None,
        app_name: Optional[str] = None,
        focus_areas: Optional[List[str]] = None,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search for code quality analyses matching the query.
        
        Args:
            query_text: The text to search for
            app_id: Optional app ID to filter by
            app_name: Optional app name to filter by
            focus_areas: Optional list of focus areas to filter by
            limit: Maximum number of results to return
            
        Returns:
            List of matching analyses with metadata
        """
        # Prepare query filter
        where_filter = {}
        
        if app_id:
            where_filter["app_id"] = app_id
            
        if app_name:
            where_filter["app_name"] = app_name
            
        if focus_areas:
            focus_areas_str = ",".join(sorted(focus_areas))
            where_filter["focus_areas"] = focus_areas_str
        
        # Execute the query
        results = self.collection.query(
            query_texts=[query_text],
            where=where_filter if where_filter else None,
            n_results=limit
        )
        
        # Format results
        formatted_results = []
        for i in range(len(results["ids"][0])):
            formatted_results.append({
                "id": results["ids"][0][i],
                "content": results["documents"][0][i],
                "metadata": results["metadatas"][0][i],
                "distance": results["distances"][0][i] if "distances" in results else None
            })
        
        return formatted_results
    
    def get_all_apps(self) -> List[Dict[str, str]]:
        """
        Get a list of all applications that have code quality analyses.
        
        Returns:
            List of dictionaries with app_id and app_name
        """
        # Query for unique app IDs and names
        results = self.collection.get()
        
        apps = {}
        for metadata in results["metadatas"]:
            app_id = metadata.get("app_id")
            app_name = metadata.get("app_name")
            
            if app_id and app_name and app_id not in apps:
                apps[app_id] = app_name
        
        return [{"app_id": app_id, "app_name": name} for app_id, name in apps.items()]
    
    def delete_analysis(self, app_id: str, focus_areas: Optional[List[str]] = None) -> int:
        """
        Delete a code quality analysis from ChromaDB.
        
        Args:
            app_id: Unique identifier for the application
            focus_areas: Optional list of focus areas to filter by
            
        Returns:
            Number of documents deleted
        """
        # Prepare query filter
        where_filter = {"app_id": app_id}
        
        # Add focus areas to filter if provided
        if focus_areas:
            focus_areas_str = ",".join(sorted(focus_areas))
            where_filter["focus_areas"] = focus_areas_str
        
        # Get matching documents
        results = self.collection.get(
            where=where_filter
        )
        
        if not results or len(results["ids"]) == 0:
            return 0
        
        # Also fetch any chunks
        for doc_id in results["ids"]:
            chunk_results = self.collection.get(
                where={"parent_id": doc_id}
            )
            
            # Delete chunks
            if chunk_results and len(chunk_results["ids"]) > 0:
                self.collection.delete(
                    ids=chunk_results["ids"]
                )
        
        # Delete main documents
        self.collection.delete(
            ids=results["ids"]
        )
        
        return len(results["ids"])
    
    def _chunk_text(self, text: str, max_chars: int = 8000) -> List[str]:
        """
        Split text into chunks of appropriate size for embedding.
        
        Args:
            text: The text to split
            max_chars: Maximum characters per chunk
            
        Returns:
            List of text chunks
        """
        if len(text) <= max_chars:
            return [text]
        
        chunks = []
        current_chunk = ""
        
        # Split by paragraphs (double newlines)
        paragraphs = text.split("\n\n")
        
        for paragraph in paragraphs:
            # If adding this paragraph would exceed max_chars, save current chunk and start new one
            if len(current_chunk) + len(paragraph) + 2 > max_chars:
                if current_chunk:
                    chunks.append(current_chunk)
                    current_chunk = ""
                
                # If paragraph itself is too long, split it further by sentences
                if len(paragraph) > max_chars:
                    sentences = paragraph.split(". ")
                    for sentence in sentences:
                        if len(current_chunk) + len(sentence) + 2 > max_chars:
                            if current_chunk:
                                chunks.append(current_chunk)
                                current_chunk = ""
                            
                            # If sentence itself is too long, just add it as a chunk
                            if len(sentence) > max_chars:
                                sub_chunks = [sentence[i:i+max_chars] for i in range(0, len(sentence), max_chars)]
                                chunks.extend(sub_chunks[:-1])
                                current_chunk = sub_chunks[-1]
                            else:
                                current_chunk = sentence
                        else:
                            if current_chunk:
                                current_chunk += ". " + sentence
                            else:
                                current_chunk = sentence
                else:
                    current_chunk = paragraph
            else:
                if current_chunk:
                    current_chunk += "\n\n" + paragraph
                else:
                    current_chunk = paragraph
        
        # Add the last chunk if it's not empty
        if current_chunk:
            chunks.append(current_chunk)
        
        return chunks 