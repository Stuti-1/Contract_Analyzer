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
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
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
                <Button onClick={uploadContract} className="w-full">
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
              <label htmlFor="file-upload">
                <Button variant="outline" className="cursor-pointer">
                  Choose File
                </Button>
              </label>
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

const AnalysisResults = ({ analysis }) => {
  if (!analysis) return null;

  const riskCounts = analysis.analysis_results.reduce((acc, clause) => {
    const level = clause.risk_level.toLowerCase();
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});

  const totalIssues = analysis.analysis_results.length;

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
                            <Button variant="ghost" size="sm">
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
    </div>
  );
};

const Home = () => {
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [loading, setLoading] = useState(true);

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
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Word
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