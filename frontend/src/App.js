import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table";
import { Badge } from "./components/ui/badge";
import { Alert, AlertDescription } from "./components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./components/ui/collapsible";
import { Separator } from "./components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Progress } from "./components/ui/progress";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";
import { 
  Upload, 
  FileText, 
  AlertTriangle, 
  Shield, 
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  Trash2,
  Eye,
  Clock,
  AlertCircle,
  ShieldAlert
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ContractUpload = ({ onAnalysisComplete }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      toast.error("Please select a PDF file");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
    } else {
      toast.error("Please drop a PDF file");
    }
  };

  // Fixed: Add function to trigger file input
  const triggerFileInput = () => {
    document.getElementById('file-upload').click();
  };

  const uploadContract = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await axios.post(`${API}/upload-contract`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success("Contract analyzed successfully!");
      onAnalysisComplete(response.data);
      setFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || "Analysis failed. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Contract
        </CardTitle>
        <CardDescription>
          Upload a PDF contract for automated clause analysis and risk assessment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={triggerFileInput}
        >
          {file ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <FileText className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              {!isUploading && (
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    uploadContract();
                  }} 
                  className="w-full"
                >
                  Analyze Contract
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-medium">Drop your PDF contract here</p>
                <p className="text-gray-500">or click to browse</p>
              </div>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <Button 
                variant="outline" 
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerFileInput();
                }}
              >
                Choose File
              </Button>
            </div>
          )}
        </div>

        {isUploading && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Analyzing contract...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const RiskBadge = ({ level }) => {
  const getBadgeProps = (level) => {
    switch (level.toLowerCase()) {
      case 'high':
        return { variant: 'destructive', icon: ShieldAlert };
      case 'medium':
        return { variant: 'default', icon: AlertTriangle };
      case 'low':
        return { variant: 'secondary', icon: AlertCircle };
      default:
        return { variant: 'outline', icon: Shield };
    }
  };

  const { variant, icon: Icon } = getBadgeProps(level);

  return (
    <Badge variant={variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {level}
    </Badge>
  );
};

const ClauseCard = ({ clause, index }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="mb-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <span className="font-medium">Clause {index + 1}</span>
                </div>
                <RiskBadge level={clause.risk_level} />
              </div>
              <div className="text-right">
                <CardTitle className="text-sm font-medium">{clause.issue_detected}</CardTitle>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Original Clause</h4>
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm">{clause.clause_text}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Risk Explanation</h4>
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                  <p className="text-sm">{clause.explanation}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Suggested Alternative</h4>
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <p className="text-sm">{clause.suggested_alternative}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

// Fixed: Add modal component for clause details in table view
const ClauseModal = ({ clause, index, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">Clause {index + 1}</h2>
              <RiskBadge level={clause.risk_level} />
            </div>
            <Button variant="ghost" onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </Button>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Issue Detected</h3>
              <p className="text-sm font-medium text-red-600">{clause.issue_detected}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Original Clause</h3>
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm">{clause.clause_text}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Risk Explanation</h3>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <p className="text-sm">{clause.explanation}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Suggested Alternative</h3>
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm">{clause.suggested_alternative}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AnalysisResults = ({ analysis }) => {
  // Fixed: Add state for modal
  const [selectedClause, setSelectedClause] = useState(null);
  const [modalIndex, setModalIndex] = useState(null);

  if (!analysis) return null;

  const riskCounts = analysis.analysis_results.reduce((acc, clause) => {
    const level = clause.risk_level.toLowerCase();
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});

  const totalIssues = analysis.analysis_results.length;

  // Fixed: Add function to handle eye icon click
  const handleViewClause = (clause, index) => {
    setSelectedClause(clause);
    setModalIndex(index);
  };

  const closeModal = () => {
    setSelectedClause(null);
    setModalIndex(null);
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{totalIssues}</p>
                <p className="text-xs text-gray-500">Issues Found</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{riskCounts.high || 0}</p>
                <p className="text-xs text-gray-500">High Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{riskCounts.medium || 0}</p>
                <p className="text-xs text-gray-500">Medium Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{riskCounts.low || 0}</p>
                <p className="text-xs text-gray-500">Low Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Analysis Results for {analysis.filename}
          </CardTitle>
          <CardDescription>
            Processed on {new Date(analysis.processed_at).toLocaleDateString()} at{' '}
            {new Date(analysis.processed_at).toLocaleTimeString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalIssues === 0 ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Great news! No problematic clauses were detected in this contract. The terms appear to be balanced and fair.
              </AlertDescription>
            </Alert>
          ) : (
            <Tabs defaultValue="cards" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="cards">Detailed View</TabsTrigger>
                <TabsTrigger value="table">Table View</TabsTrigger>
              </TabsList>

              <TabsContent value="cards" className="mt-6">
                <div className="space-y-4">
                  {analysis.analysis_results.map((clause, index) => (
                    <ClauseCard key={index} clause={clause} index={index} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="table" className="mt-6">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Issue</TableHead>
                        <TableHead>Risk Level</TableHead>
                        <TableHead>Clause Preview</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysis.analysis_results.map((clause, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{clause.issue_detected}</TableCell>
                          <TableCell>
                            <RiskBadge level={clause.risk_level} />
                          </TableCell>
                          <TableCell className="max-w-sm">
                            <p className="truncate text-sm">{clause.clause_text}</p>
                          </TableCell>
                          <TableCell>
                            {/* Fixed: Add click handler to eye icon */}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewClause(clause, index)}
                              className="hover:bg-gray-100"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Fixed: Add modal for clause details */}
      <ClauseModal 
        clause={selectedClause}
        index={modalIndex}
        isOpen={selectedClause !== null}
        onClose={closeModal}
      />
    </div>
  );
};

const Home = () => {
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchAnalysisHistory();
  }, []);

  const fetchAnalysisHistory = async () => {
    try {
      const response = await axios.get(`${API}/analyses`);
      setAnalysisHistory(response.data);
    } catch (error) {
      console.error('Error fetching analysis history:', error);
      toast.error("Failed to load analysis history");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalysisComplete = (analysis) => {
    setCurrentAnalysis(analysis);
    setAnalysisHistory(prev => [analysis, ...prev]);
  };

  const handleStartNew = () => {
    setCurrentAnalysis(null);
  };

  // Export to PDF functionality
  const exportToPDF = async () => {
    if (!currentAnalysis) return;
    
    setIsExporting(true);
    try {
      // Create HTML content for PDF
      const htmlContent = generateReportHTML(currentAnalysis);
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load then print
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
      
      toast.success("PDF export initiated - check your browser's print dialog");
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  // Export to Word functionality
  const exportToWord = () => {
    if (!currentAnalysis) return;
    
    setIsExporting(true);
    try {
      const wordContent = generateWordContent(currentAnalysis);
      
      // Create blob and download
      const blob = new Blob([wordContent], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract-analysis-${currentAnalysis.filename.replace('.pdf', '')}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Word document downloaded successfully");
    } catch (error) {
      console.error('Word export error:', error);
      toast.error("Failed to export Word document");
    } finally {
      setIsExporting(false);
    }
  };

  // Generate HTML content for PDF export
  const generateReportHTML = (analysis) => {
    const riskCounts = analysis.analysis_results.reduce((acc, clause) => {
      const level = clause.risk_level.toLowerCase();
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Contract Analysis Report - ${analysis.filename}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
            .header h1 { color: #1f2937; margin-bottom: 10px; }
            .header p { color: #6b7280; }
            .summary { display: flex; justify-content: space-around; margin: 30px 0; }
            .summary-item { text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px; margin: 0 10px; }
            .summary-item h3 { margin: 0; font-size: 24px; }
            .summary-item p { margin: 5px 0 0 0; color: #6b7280; font-size: 14px; }
            .high-risk { color: #dc2626; }
            .medium-risk { color: #d97706; }
            .low-risk { color: #2563eb; }
            .clause { margin: 30px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; page-break-inside: avoid; }
            .clause-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
            .clause-title { font-weight: bold; font-size: 18px; }
            .risk-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .risk-high { background: #fef2f2; color: #dc2626; }
            .risk-medium { background: #fef3c7; color: #d97706; }
            .risk-low { background: #eff6ff; color: #2563eb; }
            .clause-section { margin: 15px 0; }
            .clause-section h4 { margin-bottom: 8px; font-size: 14px; color: #374151; }
            .original-clause { background: #fef2f2; border: 1px solid #fecaca; padding: 12px; border-radius: 6px; }
            .explanation { background: #fef3c7; border: 1px solid #fde68a; padding: 12px; border-radius: 6px; }
            .suggestion { background: #f0f9ff; border: 1px solid #bae6fd; padding: 12px; border-radius: 6px; }
            .footer { margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
            @media print {
              body { margin: 20px; }
              .clause { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Contract Analysis Report</h1>
            <p><strong>File:</strong> ${analysis.filename}</p>
            <p><strong>Processed:</strong> ${new Date(analysis.processed_at).toLocaleDateString()} at ${new Date(analysis.processed_at).toLocaleTimeString()}</p>
          </div>

          <div class="summary">
            <div class="summary-item">
              <h3>${analysis.analysis_results.length}</h3>
              <p>Total Issues</p>
            </div>
            <div class="summary-item">
              <h3 class="high-risk">${riskCounts.high || 0}</h3>
              <p>High Risk</p>
            </div>
            <div class="summary-item">
              <h3 class="medium-risk">${riskCounts.medium || 0}</h3>
              <p>Medium Risk</p>
            </div>
            <div class="summary-item">
              <h3 class="low-risk">${riskCounts.low || 0}</h3>
              <p>Low Risk</p>
            </div>
          </div>

          <h2>Detailed Analysis</h2>
          ${analysis.analysis_results.map((clause, index) => `
            <div class="clause">
              <div class="clause-header">
                <div class="clause-title">Clause ${index + 1}: ${clause.issue_detected}</div>
                <span class="risk-badge risk-${clause.risk_level.toLowerCase()}">${clause.risk_level.toUpperCase()} RISK</span>
              </div>
              
              <div class="clause-section">
                <h4>Original Clause:</h4>
                <div class="original-clause">${clause.clause_text}</div>
              </div>
              
              <div class="clause-section">
                <h4>Risk Explanation:</h4>
                <div class="explanation">${clause.explanation}</div>
              </div>
              
              <div class="clause-section">
                <h4>Suggested Alternative:</h4>
                <div class="suggestion">${clause.suggested_alternative}</div>
              </div>
            </div>
          `).join('')}

          <div class="footer">
            <p>Generated by Contract Clause Checker | ${new Date().toLocaleDateString()}</p>
          </div>
        </body>
      </html>
    `;
  };

  // Generate Word document content
  const generateWordContent = (analysis) => {
    const riskCounts = analysis.analysis_results.reduce((acc, clause) => {
      const level = clause.risk_level.toLowerCase();
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});

    return `
      <html xmlns:v="urn:schemas-microsoft-com:vml"
            xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:w="urn:schemas-microsoft-com:office:word"
            xmlns:m="http://schemas.microsoft.com/office/2004/12/omml"
            xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <title>Contract Analysis Report</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>90</w:Zoom>
              <w:DoNotPromptForConvert/>
              <w:DoNotShowInsertionsAndDeletions/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; }
            h1 { font-size: 18pt; font-weight: bold; text-align: center; color: #1f2937; }
            h2 { font-size: 16pt; font-weight: bold; color: #1f2937; margin-top: 24pt; }
            h3 { font-size: 14pt; font-weight: bold; color: #374151; }
            h4 { font-size: 12pt; font-weight: bold; color: #4b5563; }
            .header { text-align: center; margin-bottom: 24pt; }
            .summary { margin: 18pt 0; }
            .clause { margin: 18pt 0; padding: 12pt; border: 1pt solid #e5e7eb; }
            .risk-high { color: #dc2626; font-weight: bold; }
            .risk-medium { color: #d97706; font-weight: bold; }
            .risk-low { color: #2563eb; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>CONTRACT ANALYSIS REPORT</h1>
            <p><strong>File:</strong> ${analysis.filename}</p>
            <p><strong>Processed:</strong> ${new Date(analysis.processed_at).toLocaleDateString()} at ${new Date(analysis.processed_at).toLocaleTimeString()}</p>
          </div>

          <div class="summary">
            <h2>Executive Summary</h2>
            <p><strong>Total Issues Found:</strong> ${analysis.analysis_results.length}</p>
            <p><strong>High Risk Issues:</strong> ${riskCounts.high || 0}</p>
            <p><strong>Medium Risk Issues:</strong> ${riskCounts.medium || 0}</p>
            <p><strong>Low Risk Issues:</strong> ${riskCounts.low || 0}</p>
          </div>

          <h2>Detailed Analysis</h2>
          ${analysis.analysis_results.map((clause, index) => `
            <div class="clause">
              <h3>Clause ${index + 1}: ${clause.issue_detected}</h3>
              <p><strong>Risk Level:</strong> <span class="risk-${clause.risk_level.toLowerCase()}">${clause.risk_level.toUpperCase()}</span></p>
              
              <h4>Original Clause:</h4>
              <p>${clause.clause_text}</p>
              
              <h4>Risk Explanation:</h4>
              <p>${clause.explanation}</p>
              
              <h4>Suggested Alternative:</h4>
              <p>${clause.suggested_alternative}</p>
            </div>
          `).join('')}

          <div style="margin-top: 36pt; text-align: center; font-size: 10pt; color: #6b7280;">
            <p>Generated by Contract Clause Checker on ${new Date().toLocaleDateString()}</p>
          </div>
        </body>
      </html>
    `;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Contract Clause Checker</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            AI-powered contract analysis to identify risky clauses and protect your interests
          </p>
        </div>

        {/* Main Content */}
        {!currentAnalysis ? (
          <div className="space-y-8">
            <ContractUpload onAnalysisComplete={handleAnalysisComplete} />
            
            {/* Recent Analysis History */}
            {analysisHistory.length > 0 && (
              <Card className="max-w-4xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Analyses
                  </CardTitle>
                  <CardDescription>Your recent contract analysis history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysisHistory.slice(0, 5).map((analysis) => (
                      <div
                        key={analysis.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => setCurrentAnalysis(analysis)}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="font-medium">{analysis.filename}</p>
                            <p className="text-sm text-gray-500">
                              {analysis.analysis_results.length} issues found
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(analysis.processed_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={handleStartNew}>
                ← Analyze New Contract
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={exportToPDF}
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? "Exporting..." : "Export PDF"}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={exportToWord}
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? "Exporting..." : "Export Word"}
                </Button>
              </div>
            </div>
            <AnalysisResults analysis={currentAnalysis} />
          </div>
        )}
      </div>
      <Toaster />
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;