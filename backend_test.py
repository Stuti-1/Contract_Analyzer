import requests
import sys
import json
import io
from datetime import datetime
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

class ContractCheckerAPITester:
    def __init__(self, base_url="https://contract-checker-4.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.analysis_id = None

    def create_test_pdf(self):
        """Create a simple test PDF with contract-like content"""
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        
        # Add some contract-like text that might trigger analysis
        contract_text = """
        SERVICE AGREEMENT
        
        1. TERMINATION CLAUSE
        The Company may terminate this agreement at any time, for any reason, 
        with or without cause, and without prior notice to the Contractor.
        
        2. NON-COMPETE CLAUSE  
        The Contractor agrees not to engage in any business activities that 
        compete with the Company for a period of 5 years after termination,
        anywhere in the world.
        
        3. INTELLECTUAL PROPERTY
        All work product, ideas, concepts, and inventions created by Contractor,
        whether during work hours or not, shall belong exclusively to the Company.
        
        4. LIABILITY CLAUSE
        The Contractor shall indemnify and hold harmless the Company from any
        and all claims, damages, losses, and expenses of any kind whatsoever.
        
        5. PAYMENT TERMS
        Payment shall be made within 90 days of invoice submission, subject to
        Company's sole discretion and approval process.
        """
        
        # Write text to PDF
        y_position = 750
        for line in contract_text.strip().split('\n'):
            if line.strip():
                p.drawString(50, y_position, line.strip())
                y_position -= 20
                if y_position < 50:
                    p.showPage()
                    y_position = 750
        
        p.save()
        buffer.seek(0)
        return buffer.getvalue()

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}" if endpoint else self.base_url
        headers = {}
        
        if not files:
            headers['Content-Type'] = 'application/json'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, timeout=60)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=60)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 500:
                        print(f"   Response: {response_data}")
                    elif isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                    else:
                        print(f"   Response: Large data object")
                except:
                    print(f"   Response: Non-JSON response")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text[:200]}")

            return success, response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timed out")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test the health check endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "health",
            200
        )
        return success

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        success, response = self.run_test(
            "Root Endpoint",
            "GET",
            "",
            200
        )
        return success

    def test_upload_contract(self):
        """Test contract upload and analysis"""
        pdf_content = self.create_test_pdf()
        
        files = {
            'file': ('test_contract.pdf', pdf_content, 'application/pdf')
        }
        
        success, response = self.run_test(
            "Upload Contract",
            "POST",
            "upload-contract",
            200,
            files=files
        )
        
        if success and isinstance(response, dict) and 'id' in response:
            self.analysis_id = response['id']
            print(f"   Analysis ID: {self.analysis_id}")
            print(f"   Issues found: {len(response.get('analysis_results', []))}")
        
        return success

    def test_upload_invalid_file(self):
        """Test upload with invalid file type"""
        files = {
            'file': ('test.txt', b'This is not a PDF', 'text/plain')
        }
        
        success, response = self.run_test(
            "Upload Invalid File",
            "POST",
            "upload-contract",
            400,
            files=files
        )
        return success

    def test_upload_empty_file(self):
        """Test upload with empty file"""
        files = {
            'file': ('empty.pdf', b'', 'application/pdf')
        }
        
        success, response = self.run_test(
            "Upload Empty File",
            "POST",
            "upload-contract",
            400,
            files=files
        )
        return success

    def test_get_analyses(self):
        """Test getting all analyses"""
        success, response = self.run_test(
            "Get All Analyses",
            "GET",
            "analyses",
            200
        )
        return success

    def test_get_specific_analysis(self):
        """Test getting a specific analysis"""
        if not self.analysis_id:
            print("⚠️  Skipping - No analysis ID available")
            return True
            
        success, response = self.run_test(
            "Get Specific Analysis",
            "GET",
            f"analysis/{self.analysis_id}",
            200
        )
        return success

    def test_get_nonexistent_analysis(self):
        """Test getting a non-existent analysis"""
        fake_id = "nonexistent-id-12345"
        success, response = self.run_test(
            "Get Non-existent Analysis",
            "GET",
            f"analysis/{fake_id}",
            404
        )
        return success

    def test_delete_analysis(self):
        """Test deleting an analysis"""
        if not self.analysis_id:
            print("⚠️  Skipping - No analysis ID available")
            return True
            
        success, response = self.run_test(
            "Delete Analysis",
            "DELETE",
            f"analysis/{self.analysis_id}",
            200
        )
        return success

def main():
    print("🚀 Starting Contract Clause Checker API Tests")
    print("=" * 60)
    
    tester = ContractCheckerAPITester()
    
    # Run all tests in sequence
    tests = [
        tester.test_health_check,
        tester.test_root_endpoint,
        tester.test_upload_invalid_file,
        tester.test_upload_empty_file,
        tester.test_upload_contract,  # This should create an analysis
        tester.test_get_analyses,
        tester.test_get_specific_analysis,
        tester.test_get_nonexistent_analysis,
        tester.test_delete_analysis,
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test {test.__name__} failed with exception: {str(e)}")
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 FINAL RESULTS")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())