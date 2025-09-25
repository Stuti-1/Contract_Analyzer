from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
import json
from datetime import datetime, timezone
import pdfplumber
from emergentintegrations.llm.chat import LlmChat, UserMessage

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Pydantic Models
class ContractAnalysisResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    analysis_results: List[dict]
    processed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
class ContractAnalysisCreate(BaseModel):
    filename: str
    analysis_results: List[dict]

class ClauseAnalysis(BaseModel):
    clause_text: str
    issue_detected: str
    explanation: str
    suggested_alternative: str
    risk_level: str

# Initialize LLM Chat
def get_llm_chat():
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM API key not configured")
    
    chat = LlmChat(
        api_key=api_key,
        session_id=str(uuid.uuid4()),
        system_message="""You are a legal contract analysis expert. Your task is to identify risky, unfavorable, or problematic clauses in contracts.

For each risky clause you find, provide:
1. clause_text: The exact problematic text from the contract
2. issue_detected: Brief title of the issue (e.g., "Unilateral Termination Clause", "Broad Non-Compete")
3. explanation: Plain language explanation of why this clause is risky or unfavorable
4. suggested_alternative: A more balanced or standard alternative clause
5. risk_level: "High", "Medium", or "Low"

Return your analysis as a JSON array of objects with these exact fields. Only include clauses that have genuine legal concerns. Focus on:
- Unilateral termination rights
- Overly broad non-compete or non-disclosure clauses
- Biased dispute resolution terms
- Unreasonable liability or indemnification clauses
- Payment terms heavily favoring one party
- Intellectual property overreach
- Excessive penalty clauses

If no problematic clauses are found, return an empty array."""
    ).with_model("openai", "gpt-4o")
    
    return chat

def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF using pdfplumber"""
    try:
        import io
        pdf_file = io.BytesIO(file_content)
        
        text = ""
        with pdfplumber.open(pdf_file) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting PDF text: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error processing PDF: {str(e)}")

async def analyze_contract_with_llm(contract_text: str) -> List[dict]:
    """Analyze contract text using LLM"""
    try:
        chat = get_llm_chat()
        
        # Split text into chunks if too long (LLM context limit consideration)
        max_chunk_size = 15000  # Conservative limit
        chunks = []
        
        if len(contract_text) > max_chunk_size:
            # Split into chunks
            words = contract_text.split()
            current_chunk = []
            current_length = 0
            
            for word in words:
                if current_length + len(word) > max_chunk_size and current_chunk:
                    chunks.append(" ".join(current_chunk))
                    current_chunk = [word]
                    current_length = len(word)
                else:
                    current_chunk.append(word)
                    current_length += len(word) + 1  # +1 for space
            
            if current_chunk:
                chunks.append(" ".join(current_chunk))
        else:
            chunks = [contract_text]
        
        all_analyses = []
        
        for i, chunk in enumerate(chunks):
            prompt = f"""Analyze the following contract text for risky or unfavorable clauses:

{chunk}

Return your analysis as a valid JSON array. Each risky clause should be an object with exactly these fields:
- clause_text: The exact problematic text
- issue_detected: Brief issue title
- explanation: Why it's risky in plain language
- suggested_alternative: Better alternative clause
- risk_level: "High", "Medium", or "Low"

If this is chunk {i+1} of {len(chunks)}, focus on complete clauses only."""

            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            try:
                # Parse the LLM response as JSON
                chunk_analysis = json.loads(response.strip())
                if isinstance(chunk_analysis, list):
                    all_analyses.extend(chunk_analysis)
                else:
                    logger.warning(f"Unexpected response format from LLM: {response}")
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse LLM response as JSON: {e}")
                logger.error(f"Response was: {response}")
                # Try to extract JSON from response if it's wrapped in text
                try:
                    import re
                    json_match = re.search(r'\[.*\]', response, re.DOTALL)
                    if json_match:
                        chunk_analysis = json.loads(json_match.group())
                        if isinstance(chunk_analysis, list):
                            all_analyses.extend(chunk_analysis)
                except:
                    continue
        
        return all_analyses
        
    except Exception as e:
        logger.error(f"Error in LLM analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Contract Clause Checker API"}

@api_router.post("/upload-contract", response_model=ContractAnalysisResult)
async def upload_contract(file: UploadFile = File(...)):
    """Upload and analyze a contract file"""
    
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are currently supported")
    
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    try:
        # Read file content
        file_content = await file.read()
        
        if len(file_content) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        # Extract text from PDF
        contract_text = extract_text_from_pdf(file_content)
        
        if not contract_text.strip():
            raise HTTPException(status_code=400, detail="No text could be extracted from the PDF")
        
        # Analyze with LLM
        analysis_results = await analyze_contract_with_llm(contract_text)
        
        # Store in database
        analysis_data = {
            "filename": file.filename,
            "analysis_results": analysis_results,
            "processed_at": datetime.now(timezone.utc).isoformat(),
            "id": str(uuid.uuid4())
        }
        
        await db.contract_analyses.insert_one(analysis_data)
        
        return ContractAnalysisResult(**analysis_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing contract: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@api_router.get("/analyses", response_model=List[ContractAnalysisResult])
async def get_analyses():
    """Get all contract analyses"""
    try:
        analyses = await db.contract_analyses.find().sort("processed_at", -1).to_list(100)
        return [ContractAnalysisResult(**analysis) for analysis in analyses]
    except Exception as e:
        logger.error(f"Error fetching analyses: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch analyses")

@api_router.get("/analysis/{analysis_id}", response_model=ContractAnalysisResult)
async def get_analysis(analysis_id: str):
    """Get a specific contract analysis"""
    try:
        analysis = await db.contract_analyses.find_one({"id": analysis_id})
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        return ContractAnalysisResult(**analysis)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching analysis: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch analysis")

@api_router.delete("/analysis/{analysis_id}")
async def delete_analysis(analysis_id: str):
    """Delete a contract analysis"""
    try:
        result = await db.contract_analyses.delete_one({"id": analysis_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Analysis not found")
        return {"message": "Analysis deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting analysis: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete analysis")

# Health check endpoint
@api_router.get("/health")
async def health_check():
    try:
        # Test database connection
        await db.command("ping")
        
        # Test LLM connection
        chat = get_llm_chat()
        test_message = UserMessage(text="Hello, this is a connection test.")
        await chat.send_message(test_message)
        
        return {
            "status": "healthy",
            "database": "connected",
            "llm": "connected",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        )

# Include the router in the main app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()