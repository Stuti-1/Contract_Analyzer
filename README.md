# Contract Clause Checker

A professional AI-powered contract analysis application that identifies risky clauses and provides balanced alternatives to protect your interests.

## Features

- **PDF Contract Upload**: Drag & drop or file selection interface
- **AI-Powered Analysis**: Uses OpenAI GPT-4o to identify problematic clauses
- **Risk Assessment**: Categorizes issues as High, Medium, or Low risk
- **Detailed Explanations**: Plain language explanation of why clauses are risky
- **Alternative Suggestions**: Provides more balanced clause alternatives
- **Dual View Modes**: Table view for quick overview, detailed cards for deep analysis
- **Professional UI**: Clean, corporate design optimized for business use
- **Analysis History**: Track and review previous contract analyses

## Technology Stack

- **Frontend**: React 19 with shadcn/ui components
- **Backend**: FastAPI with Python
- **Database**: MongoDB for analysis storage
- **AI Integration**: OpenAI GPT-4o via Emergent Universal LLM Key
- **PDF Processing**: pdfplumber for text extraction
- **Styling**: Tailwind CSS with professional gradients and animations

## Setup Instructions

### Prerequisites
- Node.js 18+ and yarn
- Python 3.11+ and pip
- MongoDB instance

### Installation

1. **Clone and navigate to the project**:
   ```bash
   cd /app
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Frontend Setup**:
   ```bash
   cd frontend
   yarn install
   ```

4. **Environment Configuration**:
   - Backend `.env` already configured with:
     - `MONGO_URL`: MongoDB connection string
     - `DB_NAME`: Database name
     - `EMERGENT_LLM_KEY`: AI analysis key
   - Frontend `.env` configured with `REACT_APP_BACKEND_URL`

5. **Start Services**:
   ```bash
   sudo supervisorctl restart all
   ```

## API Endpoints

### Health Check
```bash
GET /api/health
# Returns system status and connection health
```

### Upload Contract
```bash
POST /api/upload-contract
# Upload PDF file for analysis
# Returns analysis results with identified risky clauses
```

### Get All Analyses
```bash
GET /api/analyses
# Returns list of all contract analyses
```

### Get Specific Analysis
```bash
GET /api/analysis/{analysis_id}
# Returns detailed analysis for specific contract
```

### Delete Analysis
```bash
DELETE /api/analysis/{analysis_id}
# Removes analysis from database
```

## Usage

1. **Upload Contract**: Visit the application and upload a PDF contract using drag & drop or file selection
2. **Wait for Analysis**: The AI will process the contract and identify risky clauses (typically 30-60 seconds)
3. **Review Results**: View results in either table format for quick overview or detailed cards for comprehensive analysis
4. **Export Results**: Use export buttons to download analysis as PDF or Word document
5. **Access History**: Previous analyses are saved and accessible from the homepage

## Contract Analysis Features

The AI analyzes contracts for:
- **Unilateral termination rights**
- **Overly broad non-compete clauses**
- **Biased dispute resolution terms**
- **Unreasonable liability provisions**
- **Payment terms favoring one party**
- **Intellectual property overreach**
- **Excessive penalty clauses**

Each identified issue includes:
- Original problematic clause text
- Risk level (High/Medium/Low)
- Plain language explanation
- Suggested alternative clause

## Development

### Key Files
- `backend/server.py`: Main FastAPI application with analysis logic
- `frontend/src/App.js`: React application with upload and results UI
- `frontend/src/App.css`: Professional styling and animations

### Testing
Run comprehensive API tests:
```bash
python backend_test.py
```

### Architecture
- **Modular Backend**: Separate functions for PDF processing, LLM analysis, and database operations
- **Responsive Frontend**: Mobile-first design with professional corporate styling  
- **Error Handling**: Comprehensive validation and user-friendly error messages
- **Scalable Design**: Chunked processing for large contracts and efficient database queries

## Production Considerations

- The application uses Emergent Universal LLM Key for seamless AI integration
- Code is structured to easily swap to custom OpenAI API keys if needed
- MongoDB stores analysis history for user reference
- All endpoints include proper error handling and logging
- Professional UI suitable for client presentations and business use

## Supported File Types

- **Current**: PDF files (.pdf)
- **Planned**: Microsoft Word (.docx) and plain text (.txt) support

## Security & Privacy

- File uploads are processed server-side and not permanently stored
- Analysis results are stored securely in MongoDB
- API includes CORS protection and proper request validation
- LLM integration uses secure API key management
