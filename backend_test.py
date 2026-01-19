#!/usr/bin/env python3
"""
Dubai Roommate Platform Backend API Testing
Tests all backend APIs systematically
"""

import requests
import json
import sys
from datetime import datetime
import subprocess
import os

# Base URL from frontend .env
BASE_URL = "https://sharespot-17.preview.emergentagent.com/api"

class APITester:
    def __init__(self):
        self.session_token = None
        self.user_id = None
        self.test_results = []
        
    def log_result(self, test_name, success, details="", response_data=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        if response_data:
            result["response"] = response_data
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success and response_data:
            print(f"   Response: {response_data}")
        print()

    def test_utility_apis(self):
        """Test utility APIs that don't require auth"""
        print("=== Testing Utility APIs ===")
        
        # Test areas endpoint
        try:
            response = requests.get(f"{BASE_URL}/areas", timeout=10)
            if response.status_code == 200:
                data = response.json()
                areas = data.get("areas", [])
                if len(areas) >= 5:
                    self.log_result("GET /api/areas", True, f"Returned {len(areas)} areas")
                else:
                    self.log_result("GET /api/areas", False, f"Expected 5+ areas, got {len(areas)}", data)
            else:
                self.log_result("GET /api/areas", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("GET /api/areas", False, f"Exception: {str(e)}")

        # Test lifestyle options endpoint
        try:
            response = requests.get(f"{BASE_URL}/lifestyle-options", timeout=10)
            if response.status_code == 200:
                data = response.json()
                options = data.get("options", {})
                if len(options) >= 5:
                    self.log_result("GET /api/lifestyle-options", True, f"Returned {len(options)} lifestyle categories")
                else:
                    self.log_result("GET /api/lifestyle-options", False, f"Expected 5+ categories, got {len(options)}", data)
            else:
                self.log_result("GET /api/lifestyle-options", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("GET /api/lifestyle-options", False, f"Exception: {str(e)}")

        # Test professions endpoint
        try:
            response = requests.get(f"{BASE_URL}/professions", timeout=10)
            if response.status_code == 200:
                data = response.json()
                professions = data.get("professions", [])
                if len(professions) >= 10:
                    self.log_result("GET /api/professions", True, f"Returned {len(professions)} professions")
                else:
                    self.log_result("GET /api/professions", False, f"Expected 10+ professions, got {len(professions)}", data)
            else:
                self.log_result("GET /api/professions", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("GET /api/professions", False, f"Exception: {str(e)}")

    def test_subscription_plans(self):
        """Test subscription plans API"""
        print("=== Testing Subscription Plans API ===")
        
        try:
            response = requests.get(f"{BASE_URL}/subscriptions/plans", timeout=10)
            if response.status_code == 200:
                data = response.json()
                plans = data.get("plans", [])
                
                # Check for expected plans
                seeker_plans = [p for p in plans if p.get("plan_type") == "seeker"]
                lister_plans = [p for p in plans if p.get("plan_type") == "lister"]
                
                if len(seeker_plans) >= 3 and len(lister_plans) >= 1:
                    self.log_result("GET /api/subscriptions/plans", True, 
                                  f"Found {len(seeker_plans)} seeker plans, {len(lister_plans)} lister plans")
                else:
                    self.log_result("GET /api/subscriptions/plans", False, 
                                  f"Expected 3+ seeker, 1+ lister plans. Got {len(seeker_plans)} seeker, {len(lister_plans)} lister", data)
            else:
                self.log_result("GET /api/subscriptions/plans", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("GET /api/subscriptions/plans", False, f"Exception: {str(e)}")

    def test_listings_api_no_auth(self):
        """Test listings API without authentication"""
        print("=== Testing Listings API (No Auth) ===")
        
        # Test basic listings endpoint
        try:
            response = requests.get(f"{BASE_URL}/listings", timeout=10)
            if response.status_code == 200:
                data = response.json()
                listings = data.get("listings", [])
                total = data.get("total", 0)
                
                if len(listings) >= 0:  # Could be empty if no approved listings
                    self.log_result("GET /api/listings", True, f"Returned {len(listings)} listings, total: {total}")
                else:
                    self.log_result("GET /api/listings", False, "Invalid response structure", data)
            else:
                self.log_result("GET /api/listings", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("GET /api/listings", False, f"Exception: {str(e)}")

        # Test area filter
        try:
            response = requests.get(f"{BASE_URL}/listings?area=Karama", timeout=10)
            if response.status_code == 200:
                data = response.json()
                listings = data.get("listings", [])
                self.log_result("GET /api/listings?area=Karama", True, f"Area filter returned {len(listings)} listings")
            else:
                self.log_result("GET /api/listings?area=Karama", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("GET /api/listings?area=Karama", False, f"Exception: {str(e)}")

        # Test bed_type filter
        try:
            response = requests.get(f"{BASE_URL}/listings?bed_type=single", timeout=10)
            if response.status_code == 200:
                data = response.json()
                listings = data.get("listings", [])
                self.log_result("GET /api/listings?bed_type=single", True, f"Bed type filter returned {len(listings)} listings")
            else:
                self.log_result("GET /api/listings?bed_type=single", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("GET /api/listings?bed_type=single", False, f"Exception: {str(e)}")

    def create_test_user_and_session(self):
        """Create test user and session using MongoDB directly"""
        print("=== Creating Test User and Session ===")
        
        try:
            # Create test user using mongosh
            mongo_script = '''
            use('test_database');
            var userId = 'user_test_' + Date.now();
            var sessionToken = 'test_session_' + Date.now();
            
            // Insert user
            db.users.insertOne({
              user_id: userId,
              email: 'test@example.com',
              name: 'Test User',
              role: 'seeker',
              is_verified: false,
              is_active: true,
              created_at: new Date()
            });
            
            // Insert profile
            db.user_profiles.insertOne({
              user_id: userId,
              profession: 'IT Professional',
              income_range: '4000-6000',
              gender: 'male',
              lifestyle_tags: { 
                working_hours: 'Day shift', 
                smoking: 'Non-smoker',
                food_habits: 'Non-vegetarian',
                visitors: 'Occasional',
                cleanliness: 'Very clean'
              },
              preferred_areas: ['Karama', 'Bur Dubai'],
              profile_complete: true,
              updated_at: new Date()
            });
            
            // Insert session
            db.user_sessions.insertOne({
              user_id: userId,
              session_token: sessionToken,
              expires_at: new Date(Date.now() + 7*24*60*60*1000),
              created_at: new Date()
            });
            
            print('SESSION_TOKEN:' + sessionToken);
            print('USER_ID:' + userId);
            '''
            
            result = subprocess.run(['mongosh', '--eval', mongo_script], 
                                  capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                output = result.stdout
                # Extract session token and user ID
                for line in output.split('\n'):
                    if line.startswith('SESSION_TOKEN:'):
                        self.session_token = line.split(':', 1)[1]
                    elif line.startswith('USER_ID:'):
                        self.user_id = line.split(':', 1)[1]
                
                if self.session_token and self.user_id:
                    self.log_result("Create test user and session", True, 
                                  f"Created user {self.user_id} with session token")
                    return True
                else:
                    self.log_result("Create test user and session", False, 
                                  "Failed to extract session token or user ID", output)
                    return False
            else:
                self.log_result("Create test user and session", False, 
                              f"MongoDB command failed: {result.stderr}")
                return False
                
        except Exception as e:
            self.log_result("Create test user and session", False, f"Exception: {str(e)}")
            return False

    def test_auth_protected_apis(self):
        """Test APIs that require authentication"""
        if not self.session_token:
            print("=== Skipping Auth Tests (No Session Token) ===")
            return
            
        print("=== Testing Auth-Protected APIs ===")
        
        headers = {"Authorization": f"Bearer {self.session_token}"}
        
        # Test /auth/me
        try:
            response = requests.get(f"{BASE_URL}/auth/me", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                user_data = data.get("user", {})
                profile_data = data.get("profile", {})
                
                if user_data.get("user_id") and profile_data.get("profession"):
                    self.log_result("GET /api/auth/me", True, 
                                  f"Returned user data for {user_data.get('name', 'Unknown')}")
                else:
                    self.log_result("GET /api/auth/me", False, "Missing user or profile data", data)
            else:
                self.log_result("GET /api/auth/me", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("GET /api/auth/me", False, f"Exception: {str(e)}")

        # Test /profile
        try:
            response = requests.get(f"{BASE_URL}/profile", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                profile = data.get("profile", {})
                
                if profile.get("lifestyle_tags") and profile.get("profession"):
                    self.log_result("GET /api/profile", True, 
                                  f"Profile complete: {profile.get('profile_complete', False)}")
                else:
                    self.log_result("GET /api/profile", False, "Missing profile data", data)
            else:
                self.log_result("GET /api/profile", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("GET /api/profile", False, f"Exception: {str(e)}")

    def test_listings_with_auth(self):
        """Test listings API with authentication (should include compatibility scores)"""
        if not self.session_token:
            print("=== Skipping Auth Listings Tests (No Session Token) ===")
            return
            
        print("=== Testing Listings API (With Auth) ===")
        
        headers = {"Authorization": f"Bearer {self.session_token}"}
        
        try:
            response = requests.get(f"{BASE_URL}/listings", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                listings = data.get("listings", [])
                
                # Check if compatibility scores are included
                has_compatibility = any("compatibility_score" in listing for listing in listings)
                
                if has_compatibility:
                    self.log_result("GET /api/listings (with auth)", True, 
                                  f"Returned {len(listings)} listings with compatibility scores")
                else:
                    self.log_result("GET /api/listings (with auth)", True, 
                                  f"Returned {len(listings)} listings (no compatibility scores - may be no approved listings)")
            else:
                self.log_result("GET /api/listings (with auth)", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("GET /api/listings (with auth)", False, f"Exception: {str(e)}")

    def test_saved_listings(self):
        """Test saved listings functionality"""
        if not self.session_token:
            print("=== Skipping Saved Listings Tests (No Session Token) ===")
            return
            
        print("=== Testing Saved Listings ===")
        
        headers = {"Authorization": f"Bearer {self.session_token}"}
        
        # First get a listing to save
        try:
            response = requests.get(f"{BASE_URL}/listings", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                listings = data.get("listings", [])
                
                if listings:
                    listing_id = listings[0]["listing_id"]
                    
                    # Try to save the listing
                    save_response = requests.post(f"{BASE_URL}/saved-listings/{listing_id}", 
                                                headers=headers, timeout=10)
                    
                    if save_response.status_code == 200:
                        self.log_result("POST /api/saved-listings/{id}", True, "Successfully saved listing")
                        
                        # Test get saved listings
                        get_response = requests.get(f"{BASE_URL}/saved-listings", 
                                                  headers=headers, timeout=10)
                        
                        if get_response.status_code == 200:
                            saved_data = get_response.json()
                            saved_listings = saved_data.get("listings", [])
                            
                            if any(l["listing_id"] == listing_id for l in saved_listings):
                                self.log_result("GET /api/saved-listings", True, 
                                              f"Found {len(saved_listings)} saved listings")
                            else:
                                self.log_result("GET /api/saved-listings", False, 
                                              "Saved listing not found in results", saved_data)
                        else:
                            self.log_result("GET /api/saved-listings", False, 
                                          f"Status: {get_response.status_code}", get_response.text)
                    else:
                        self.log_result("POST /api/saved-listings/{id}", False, 
                                      f"Status: {save_response.status_code}", save_response.text)
                else:
                    self.log_result("Saved listings test", False, "No listings available to save")
            else:
                self.log_result("Saved listings test", False, f"Failed to get listings: {response.status_code}")
        except Exception as e:
            self.log_result("Saved listings test", False, f"Exception: {str(e)}")

    def test_subscription_flow(self):
        """Test subscription flow"""
        if not self.session_token:
            print("=== Skipping Subscription Tests (No Session Token) ===")
            return
            
        print("=== Testing Subscription Flow ===")
        
        headers = {"Authorization": f"Bearer {self.session_token}"}
        
        # Test subscribe to seeker monthly plan
        try:
            response = requests.post(f"{BASE_URL}/subscriptions/subscribe?plan_id=seeker_monthly", 
                                   headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                subscription = data.get("subscription", {})
                
                if subscription.get("plan_id") == "seeker_monthly":
                    self.log_result("POST /api/subscriptions/subscribe", True, 
                                  f"Created subscription: {subscription.get('subscription_id')}")
                    
                    # Test get my subscriptions
                    get_response = requests.get(f"{BASE_URL}/subscriptions/my", 
                                              headers=headers, timeout=10)
                    
                    if get_response.status_code == 200:
                        my_subs = get_response.json()
                        subscriptions = my_subs.get("subscriptions", [])
                        
                        if subscriptions:
                            self.log_result("GET /api/subscriptions/my", True, 
                                          f"Found {len(subscriptions)} active subscriptions")
                        else:
                            self.log_result("GET /api/subscriptions/my", False, 
                                          "No active subscriptions found", my_subs)
                    else:
                        self.log_result("GET /api/subscriptions/my", False, 
                                      f"Status: {get_response.status_code}", get_response.text)
                else:
                    self.log_result("POST /api/subscriptions/subscribe", False, 
                                  "Invalid subscription data", data)
            else:
                self.log_result("POST /api/subscriptions/subscribe", False, 
                              f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Subscription flow test", False, f"Exception: {str(e)}")

    def test_single_listing_detail(self):
        """Test single listing detail endpoint"""
        print("=== Testing Single Listing Detail ===")
        
        # First get a listing ID
        try:
            response = requests.get(f"{BASE_URL}/listings", timeout=10)
            if response.status_code == 200:
                data = response.json()
                listings = data.get("listings", [])
                
                if listings:
                    listing_id = listings[0]["listing_id"]
                    
                    # Test single listing endpoint
                    detail_response = requests.get(f"{BASE_URL}/listings/{listing_id}", timeout=10)
                    
                    if detail_response.status_code == 200:
                        detail_data = detail_response.json()
                        listing = detail_data.get("listing", {})
                        lister = detail_data.get("lister")
                        
                        if listing.get("listing_id") == listing_id:
                            self.log_result("GET /api/listings/{id}", True, 
                                          f"Retrieved listing details, lister info: {lister is not None}")
                        else:
                            self.log_result("GET /api/listings/{id}", False, 
                                          "Invalid listing data", detail_data)
                    else:
                        self.log_result("GET /api/listings/{id}", False, 
                                      f"Status: {detail_response.status_code}", detail_response.text)
                else:
                    self.log_result("GET /api/listings/{id}", False, "No listings available to test")
            else:
                self.log_result("GET /api/listings/{id}", False, f"Failed to get listings: {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/listings/{id}", False, f"Exception: {str(e)}")

    def check_backend_service(self):
        """Check if backend service is running"""
        print("=== Checking Backend Service ===")
        
        try:
            response = requests.get(f"{BASE_URL}/", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "Dubai Roommate Platform API" in data.get("message", ""):
                    self.log_result("Backend service health", True, "Backend API is running")
                    return True
                else:
                    self.log_result("Backend service health", False, "Unexpected response", data)
                    return False
            else:
                self.log_result("Backend service health", False, f"Status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Backend service health", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all tests"""
        print(f"Starting Dubai Roommate Platform API Tests")
        print(f"Base URL: {BASE_URL}")
        print("=" * 60)
        
        # Check if backend is running
        if not self.check_backend_service():
            print("❌ Backend service is not accessible. Stopping tests.")
            return False
        
        # Run tests in order
        self.test_utility_apis()
        self.test_subscription_plans()
        self.test_listings_api_no_auth()
        self.test_single_listing_detail()
        
        # Create test user for auth tests
        if self.create_test_user_and_session():
            self.test_auth_protected_apis()
            self.test_listings_with_auth()
            self.test_saved_listings()
            self.test_subscription_flow()
        
        # Print summary
        print("=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for r in self.test_results if r["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        # Show failed tests
        failed_tests = [r for r in self.test_results if not r["success"]]
        if failed_tests:
            print("\nFAILED TESTS:")
            for test in failed_tests:
                print(f"❌ {test['test']}: {test['details']}")
        
        return passed == total

if __name__ == "__main__":
    tester = APITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)