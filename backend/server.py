from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, UploadFile, File
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'roommate_platform')]

# Create the main app
app = FastAPI(title="Dubai Roommate Platform API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ===================== PYDANTIC MODELS =====================

# User Types
class UserRole(BaseModel):
    role: str = Field(default="seeker")  # seeker, lister, admin, advertiser

class UserBase(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "seeker"
    phone: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_verified: bool = False
    is_active: bool = True

class UserProfile(BaseModel):
    user_id: str
    profession: Optional[str] = None
    income_range: Optional[str] = None  # "2500-4000", "4000-6000", "6000-8000", "8000+"
    gender: Optional[str] = None
    nationality: Optional[str] = None
    age: Optional[int] = None
    preferred_areas: List[str] = []
    lifestyle_tags: Dict[str, Any] = {}  # working_hours, food_habits, smoking, visitors, cleanliness
    bio: Optional[str] = None
    profile_complete: bool = False
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProfileUpdate(BaseModel):
    profession: Optional[str] = None
    income_range: Optional[str] = None
    gender: Optional[str] = None
    nationality: Optional[str] = None
    age: Optional[int] = None
    preferred_areas: Optional[List[str]] = None
    lifestyle_tags: Optional[Dict[str, Any]] = None
    bio: Optional[str] = None

# Listing Models
class ListingBase(BaseModel):
    listing_id: str = Field(default_factory=lambda: f"listing_{uuid.uuid4().hex[:12]}")
    lister_id: str
    title: str
    description: str
    area: str  # Deira, Bur Dubai, Karama, Al Nahda, International City
    address: Optional[str] = None
    rent: float
    bed_type: str  # single, bunk, partition
    room_type: str  # shared, private
    gender_preference: str  # male, female, any
    max_occupants: int = 1
    current_occupants: int = 0
    amenities: List[str] = []
    house_rules: List[str] = []
    photos: List[str] = []  # Base64 encoded images
    preferred_profession: Optional[List[str]] = None
    preferred_income_range: Optional[str] = None
    preferred_lifestyle: Dict[str, Any] = {}
    is_active: bool = True
    is_approved: bool = False
    status: str = "pending"  # pending, approved, rejected, paused
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ListingCreate(BaseModel):
    title: str
    description: str
    area: str
    address: Optional[str] = None
    rent: float
    bed_type: str
    room_type: str
    gender_preference: str
    max_occupants: int = 1
    current_occupants: int = 0
    amenities: List[str] = []
    house_rules: List[str] = []
    photos: List[str] = []
    preferred_profession: Optional[List[str]] = None
    preferred_income_range: Optional[str] = None
    preferred_lifestyle: Dict[str, Any] = {}

class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    area: Optional[str] = None
    address: Optional[str] = None
    rent: Optional[float] = None
    bed_type: Optional[str] = None
    room_type: Optional[str] = None
    gender_preference: Optional[str] = None
    max_occupants: Optional[int] = None
    current_occupants: Optional[int] = None
    amenities: Optional[List[str]] = None
    house_rules: Optional[List[str]] = None
    photos: Optional[List[str]] = None
    preferred_profession: Optional[List[str]] = None
    preferred_income_range: Optional[str] = None
    preferred_lifestyle: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

# Subscription Models
class SubscriptionPlan(BaseModel):
    plan_id: str
    name: str
    price: float
    duration_days: int
    plan_type: str  # seeker, lister
    features: List[str] = []

class UserSubscription(BaseModel):
    subscription_id: str = Field(default_factory=lambda: f"sub_{uuid.uuid4().hex[:12]}")
    user_id: str
    plan_id: str
    plan_type: str
    status: str = "active"  # active, expired, cancelled
    start_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    end_date: datetime
    payment_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Lister Verification Models
class ListerVerification(BaseModel):
    verification_id: str = Field(default_factory=lambda: f"ver_{uuid.uuid4().hex[:12]}")
    user_id: str
    emirates_id_image: str  # Base64
    selfie_image: str  # Base64
    status: str = "pending"  # pending, approved, rejected
    admin_notes: Optional[str] = None
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None

class VerificationSubmit(BaseModel):
    emirates_id_image: str
    selfie_image: str

# Chat Models
class ChatMessage(BaseModel):
    message_id: str = Field(default_factory=lambda: f"msg_{uuid.uuid4().hex[:12]}")
    conversation_id: str
    sender_id: str
    receiver_id: str
    listing_id: str
    content: str
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatConversation(BaseModel):
    conversation_id: str = Field(default_factory=lambda: f"conv_{uuid.uuid4().hex[:12]}")
    listing_id: str
    seeker_id: str
    lister_id: str
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    seeker_unread: int = 0
    lister_unread: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SendMessage(BaseModel):
    listing_id: str
    receiver_id: str
    content: str

# Report Models
class Report(BaseModel):
    report_id: str = Field(default_factory=lambda: f"rep_{uuid.uuid4().hex[:12]}")
    reporter_id: str
    reported_type: str  # user, listing
    reported_id: str
    reason: str
    description: Optional[str] = None
    status: str = "pending"  # pending, reviewed, resolved, dismissed
    admin_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReportCreate(BaseModel):
    reported_type: str
    reported_id: str
    reason: str
    description: Optional[str] = None

# Advertisement Models
class Advertisement(BaseModel):
    ad_id: str = Field(default_factory=lambda: f"ad_{uuid.uuid4().hex[:12]}")
    advertiser_id: str
    title: str
    category: str  # mess, grocery, laundry, other
    description: str
    banner_image: str  # Base64
    cta_text: str
    cta_link: str
    target_areas: List[str] = []
    plan_type: str  # basic, standard, premium
    price: float
    views: int = 0
    clicks: int = 0
    is_active: bool = True
    status: str = "pending"  # pending, approved, rejected
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdCreate(BaseModel):
    title: str
    category: str
    description: str
    banner_image: str
    cta_text: str
    cta_link: str
    target_areas: List[str] = []
    plan_type: str

# Saved Listings
class SavedListing(BaseModel):
    user_id: str
    listing_id: str
    saved_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Session Models
class SessionData(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SessionDataResponse(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    session_token: str

# ===================== AUTH HELPERS =====================

async def get_session_token(request: Request) -> Optional[str]:
    """Extract session token from cookie or Authorization header"""
    # Try cookie first
    session_token = request.cookies.get("session_token")
    if session_token:
        return session_token
    
    # Try Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[7:]
    
    return None

async def get_current_user(request: Request) -> Optional[UserBase]:
    """Get current user from session token"""
    session_token = await get_session_token(request)
    if not session_token:
        return None
    
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        return None
    
    # Check expiry with timezone awareness
    expires_at = session.get("expires_at")
    if expires_at:
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at <= datetime.now(timezone.utc):
            return None
    
    user_doc = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if user_doc:
        return UserBase(**user_doc)
    return None

async def require_auth(request: Request) -> UserBase:
    """Require authentication - raises 401 if not authenticated"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

async def require_role(request: Request, roles: List[str]) -> UserBase:
    """Require specific role(s)"""
    user = await require_auth(request)
    if user.role not in roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return user

async def require_subscription(request: Request, plan_type: str = "seeker") -> UserBase:
    """Require active subscription"""
    user = await require_auth(request)
    
    subscription = await db.subscriptions.find_one({
        "user_id": user.user_id,
        "plan_type": plan_type,
        "status": "active"
    }, {"_id": 0})
    
    if subscription:
        end_date = subscription.get("end_date")
        if end_date:
            if end_date.tzinfo is None:
                end_date = end_date.replace(tzinfo=timezone.utc)
            if end_date > datetime.now(timezone.utc):
                return user
    
    raise HTTPException(status_code=403, detail="Active subscription required")

# ===================== COMPATIBILITY SCORING =====================

def calculate_compatibility(seeker_profile: dict, listing: dict, lister_profile: dict = None) -> int:
    """Calculate compatibility score between seeker and listing"""
    score = 0
    max_score = 0
    
    # Gender match (30 points)
    max_score += 30
    if listing.get("gender_preference") == "any":
        score += 30
    elif seeker_profile.get("gender") == listing.get("gender_preference"):
        score += 30
    
    # Profession match (20 points)
    max_score += 20
    preferred_professions = listing.get("preferred_profession") or []
    if not preferred_professions or seeker_profile.get("profession") in preferred_professions:
        score += 20
    
    # Income range match (15 points)
    max_score += 15
    seeker_income = seeker_profile.get("income_range", "")
    preferred_income = listing.get("preferred_income_range", "")
    if not preferred_income or seeker_income == preferred_income:
        score += 15
    elif seeker_income and preferred_income:
        # Partial match based on range overlap
        score += 7
    
    # Lifestyle tags match (35 points)
    max_score += 35
    seeker_lifestyle = seeker_profile.get("lifestyle_tags", {})
    preferred_lifestyle = listing.get("preferred_lifestyle", {})
    
    if not preferred_lifestyle:
        score += 35
    else:
        lifestyle_score = 0
        lifestyle_count = 0
        for key, value in preferred_lifestyle.items():
            if key in seeker_lifestyle:
                lifestyle_count += 1
                if seeker_lifestyle[key] == value:
                    lifestyle_score += 1
        if lifestyle_count > 0:
            score += int((lifestyle_score / lifestyle_count) * 35)
        else:
            score += 35
    
    # Calculate percentage
    if max_score > 0:
        return int((score / max_score) * 100)
    return 50  # Default 50% if no criteria

# ===================== AUTH ENDPOINTS =====================

@api_router.get("/auth/me")
async def get_me(request: Request):
    """Get current authenticated user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get user profile
    profile = await db.user_profiles.find_one({"user_id": user.user_id}, {"_id": 0})
    
    # Get subscription status
    subscription = await db.subscriptions.find_one({
        "user_id": user.user_id,
        "status": "active"
    }, {"_id": 0})
    
    has_subscription = False
    if subscription:
        end_date = subscription.get("end_date")
        if end_date:
            if end_date.tzinfo is None:
                end_date = end_date.replace(tzinfo=timezone.utc)
            has_subscription = end_date > datetime.now(timezone.utc)
    
    return {
        "user": user.model_dump(),
        "profile": profile,
        "has_subscription": has_subscription,
        "subscription": subscription if has_subscription else None
    }

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    """Exchange session_id for session_token"""
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Call Emergent Auth API
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id},
                timeout=10.0
            )
            if res.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            user_data = res.json()
        except httpx.RequestError as e:
            logger.error(f"Auth API error: {e}")
            raise HTTPException(status_code=500, detail="Authentication service error")
    
    # Create or get user
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    existing_user = await db.users.find_one({"email": user_data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
    else:
        # Create new user
        new_user = {
            "user_id": user_id,
            "email": user_data["email"],
            "name": user_data["name"],
            "picture": user_data.get("picture"),
            "role": "seeker",
            "is_verified": False,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(new_user)
        
        # Create empty profile
        profile = {
            "user_id": user_id,
            "profile_complete": False,
            "lifestyle_tags": {},
            "preferred_areas": [],
            "updated_at": datetime.now(timezone.utc)
        }
        await db.user_profiles.insert_one(profile)
    
    # Store session with 7-day expiry
    session_token = user_data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    # Get user data
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    profile = await db.user_profiles.find_one({"user_id": user_id}, {"_id": 0})
    
    return {
        "user": user_doc,
        "profile": profile,
        "session_token": session_token
    }

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = await get_session_token(request)
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ===================== USER PROFILE ENDPOINTS =====================

@api_router.get("/profile")
async def get_profile(request: Request):
    """Get current user profile"""
    user = await require_auth(request)
    profile = await db.user_profiles.find_one({"user_id": user.user_id}, {"_id": 0})
    return {"user": user.model_dump(), "profile": profile}

@api_router.put("/profile")
async def update_profile(request: Request, profile_data: ProfileUpdate):
    """Update user profile"""
    user = await require_auth(request)
    
    update_data = {k: v for k, v in profile_data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    # Check if profile is complete
    required_fields = ["profession", "income_range", "gender"]
    profile = await db.user_profiles.find_one({"user_id": user.user_id}, {"_id": 0})
    if profile:
        merged = {**profile, **update_data}
        update_data["profile_complete"] = all(merged.get(f) for f in required_fields)
    
    await db.user_profiles.update_one(
        {"user_id": user.user_id},
        {"$set": update_data},
        upsert=True
    )
    
    updated_profile = await db.user_profiles.find_one({"user_id": user.user_id}, {"_id": 0})
    return {"profile": updated_profile}

@api_router.put("/user/role")
async def update_user_role(request: Request, role_data: UserRole):
    """Update user role"""
    user = await require_auth(request)
    
    if role_data.role not in ["seeker", "lister", "advertiser"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"role": role_data.role}}
    )
    
    return {"message": "Role updated", "role": role_data.role}

# ===================== LISTINGS ENDPOINTS =====================

@api_router.get("/listings")
async def get_listings(
    request: Request,
    area: Optional[str] = None,
    min_rent: Optional[float] = None,
    max_rent: Optional[float] = None,
    gender: Optional[str] = None,
    bed_type: Optional[str] = None,
    room_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 20
):
    """Get all approved listings with filters"""
    query = {"is_active": True, "status": "approved"}
    
    if area:
        query["area"] = area
    if min_rent is not None:
        query["rent"] = {"$gte": min_rent}
    if max_rent is not None:
        query.setdefault("rent", {})["$lte"] = max_rent
    if gender:
        query["gender_preference"] = {"$in": [gender, "any"]}
    if bed_type:
        query["bed_type"] = bed_type
    if room_type:
        query["room_type"] = room_type
    
    listings = await db.listings.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.listings.count_documents(query)
    
    # Add compatibility score if user is authenticated
    user = await get_current_user(request)
    if user:
        profile = await db.user_profiles.find_one({"user_id": user.user_id}, {"_id": 0})
        if profile:
            for listing in listings:
                listing["compatibility_score"] = calculate_compatibility(profile, listing)
    
    return {"listings": listings, "total": total, "skip": skip, "limit": limit}

@api_router.get("/listings/{listing_id}")
async def get_listing(listing_id: str, request: Request):
    """Get single listing details"""
    listing = await db.listings.find_one({"listing_id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Get lister info (anonymized)
    lister = await db.users.find_one({"user_id": listing["lister_id"]}, {"_id": 0})
    lister_info = None
    if lister:
        lister_info = {
            "name": lister.get("name", "").split()[0] if lister.get("name") else "Lister",
            "is_verified": lister.get("is_verified", False)
        }
    
    # Calculate compatibility if authenticated
    compatibility_score = None
    user = await get_current_user(request)
    if user:
        profile = await db.user_profiles.find_one({"user_id": user.user_id}, {"_id": 0})
        if profile:
            compatibility_score = calculate_compatibility(profile, listing)
    
    return {
        "listing": listing,
        "lister": lister_info,
        "compatibility_score": compatibility_score
    }

@api_router.post("/listings")
async def create_listing(request: Request, listing_data: ListingCreate):
    """Create new listing (requires lister role and subscription)"""
    user = await require_auth(request)
    
    if user.role != "lister":
        raise HTTPException(status_code=403, detail="Only listers can create listings")
    
    # Check verification
    verification = await db.verifications.find_one({
        "user_id": user.user_id,
        "status": "approved"
    }, {"_id": 0})
    
    if not verification:
        raise HTTPException(status_code=403, detail="Identity verification required")
    
    # Check subscription
    subscription = await db.subscriptions.find_one({
        "user_id": user.user_id,
        "plan_type": "lister",
        "status": "active"
    }, {"_id": 0})
    
    if not subscription:
        raise HTTPException(status_code=403, detail="Lister subscription required")
    
    listing = ListingBase(
        lister_id=user.user_id,
        **listing_data.model_dump()
    )
    
    await db.listings.insert_one(listing.model_dump())
    return {"listing": listing.model_dump(), "message": "Listing created, pending approval"}

@api_router.put("/listings/{listing_id}")
async def update_listing(listing_id: str, request: Request, listing_data: ListingUpdate):
    """Update listing"""
    user = await require_auth(request)
    
    listing = await db.listings.find_one({"listing_id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if listing["lister_id"] != user.user_id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in listing_data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.listings.update_one(
        {"listing_id": listing_id},
        {"$set": update_data}
    )
    
    updated = await db.listings.find_one({"listing_id": listing_id}, {"_id": 0})
    return {"listing": updated}

@api_router.delete("/listings/{listing_id}")
async def delete_listing(listing_id: str, request: Request):
    """Delete listing"""
    user = await require_auth(request)
    
    listing = await db.listings.find_one({"listing_id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if listing["lister_id"] != user.user_id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.listings.delete_one({"listing_id": listing_id})
    return {"message": "Listing deleted"}

@api_router.get("/my-listings")
async def get_my_listings(request: Request):
    """Get current user's listings"""
    user = await require_auth(request)
    listings = await db.listings.find({"lister_id": user.user_id}, {"_id": 0}).to_list(100)
    return {"listings": listings}

# ===================== SAVED LISTINGS ENDPOINTS =====================

@api_router.post("/saved-listings/{listing_id}")
async def save_listing(listing_id: str, request: Request):
    """Save a listing"""
    user = await require_auth(request)
    
    # Check if listing exists
    listing = await db.listings.find_one({"listing_id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Check if already saved
    existing = await db.saved_listings.find_one({
        "user_id": user.user_id,
        "listing_id": listing_id
    }, {"_id": 0})
    
    if existing:
        raise HTTPException(status_code=400, detail="Already saved")
    
    await db.saved_listings.insert_one({
        "user_id": user.user_id,
        "listing_id": listing_id,
        "saved_at": datetime.now(timezone.utc)
    })
    
    return {"message": "Listing saved"}

@api_router.delete("/saved-listings/{listing_id}")
async def unsave_listing(listing_id: str, request: Request):
    """Remove saved listing"""
    user = await require_auth(request)
    await db.saved_listings.delete_one({
        "user_id": user.user_id,
        "listing_id": listing_id
    })
    return {"message": "Listing unsaved"}

@api_router.get("/saved-listings")
async def get_saved_listings(request: Request):
    """Get user's saved listings"""
    user = await require_auth(request)
    
    saved = await db.saved_listings.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    listing_ids = [s["listing_id"] for s in saved]
    
    listings = await db.listings.find(
        {"listing_id": {"$in": listing_ids}},
        {"_id": 0}
    ).to_list(100)
    
    return {"listings": listings}

# ===================== VERIFICATION ENDPOINTS =====================

@api_router.post("/verification/submit")
async def submit_verification(request: Request, verification_data: VerificationSubmit):
    """Submit identity verification"""
    user = await require_auth(request)
    
    # Check if already verified or pending
    existing = await db.verifications.find_one({
        "user_id": user.user_id,
        "status": {"$in": ["pending", "approved"]}
    }, {"_id": 0})
    
    if existing:
        if existing["status"] == "approved":
            raise HTTPException(status_code=400, detail="Already verified")
        raise HTTPException(status_code=400, detail="Verification pending")
    
    verification = ListerVerification(
        user_id=user.user_id,
        emirates_id_image=verification_data.emirates_id_image,
        selfie_image=verification_data.selfie_image
    )
    
    await db.verifications.insert_one(verification.model_dump())
    return {"message": "Verification submitted", "verification_id": verification.verification_id}

@api_router.get("/verification/status")
async def get_verification_status(request: Request):
    """Get verification status"""
    user = await require_auth(request)
    
    verification = await db.verifications.find_one(
        {"user_id": user.user_id},
        {"_id": 0, "emirates_id_image": 0, "selfie_image": 0}
    )
    
    return {"verification": verification}

# ===================== SUBSCRIPTION ENDPOINTS =====================

# Define subscription plans
SUBSCRIPTION_PLANS = {
    "seeker_monthly": {"plan_id": "seeker_monthly", "name": "Monthly", "price": 29, "duration_days": 30, "plan_type": "seeker", "features": ["Unlimited chat", "View contact details", "Priority support"]},
    "seeker_quarterly": {"plan_id": "seeker_quarterly", "name": "Quarterly", "price": 69, "duration_days": 90, "plan_type": "seeker", "features": ["Unlimited chat", "View contact details", "Priority support", "15% savings"]},
    "seeker_yearly": {"plan_id": "seeker_yearly", "name": "Yearly", "price": 199, "duration_days": 365, "plan_type": "seeker", "features": ["Unlimited chat", "View contact details", "Priority support", "43% savings"]},
    "lister_monthly": {"plan_id": "lister_monthly", "name": "Lister Monthly", "price": 99, "duration_days": 30, "plan_type": "lister", "features": ["1 active listing", "Receive inquiries", "Verified badge"]},
}

@api_router.get("/subscriptions/plans")
async def get_subscription_plans():
    """Get available subscription plans"""
    return {"plans": list(SUBSCRIPTION_PLANS.values())}

@api_router.post("/subscriptions/subscribe")
async def subscribe(request: Request, plan_id: str):
    """Subscribe to a plan (mocked payment)"""
    user = await require_auth(request)
    
    if plan_id not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    plan = SUBSCRIPTION_PLANS[plan_id]
    
    # Mock payment - always succeeds
    payment_id = f"pay_{uuid.uuid4().hex[:12]}"
    
    # Create subscription
    subscription = UserSubscription(
        user_id=user.user_id,
        plan_id=plan_id,
        plan_type=plan["plan_type"],
        end_date=datetime.now(timezone.utc) + timedelta(days=plan["duration_days"]),
        payment_id=payment_id
    )
    
    # Deactivate any existing subscription of same type
    await db.subscriptions.update_many(
        {"user_id": user.user_id, "plan_type": plan["plan_type"], "status": "active"},
        {"$set": {"status": "replaced"}}
    )
    
    await db.subscriptions.insert_one(subscription.model_dump())
    
    return {
        "message": "Subscription activated",
        "subscription": subscription.model_dump(),
        "payment_id": payment_id
    }

@api_router.get("/subscriptions/my")
async def get_my_subscription(request: Request):
    """Get current user's subscriptions"""
    user = await require_auth(request)
    
    subscriptions = await db.subscriptions.find({
        "user_id": user.user_id,
        "status": "active"
    }, {"_id": 0}).to_list(10)
    
    # Filter active ones
    active_subscriptions = []
    for sub in subscriptions:
        end_date = sub.get("end_date")
        if end_date:
            if end_date.tzinfo is None:
                end_date = end_date.replace(tzinfo=timezone.utc)
            if end_date > datetime.now(timezone.utc):
                active_subscriptions.append(sub)
    
    return {"subscriptions": active_subscriptions}

# ===================== CHAT ENDPOINTS =====================

@api_router.post("/chat/send")
async def send_message(request: Request, message_data: SendMessage):
    """Send chat message (requires subscription)"""
    user = await require_auth(request)
    
    # Check subscription for seekers
    if user.role == "seeker":
        subscription = await db.subscriptions.find_one({
            "user_id": user.user_id,
            "plan_type": "seeker",
            "status": "active"
        }, {"_id": 0})
        
        if not subscription:
            raise HTTPException(status_code=403, detail="Subscription required to chat")
        
        end_date = subscription.get("end_date")
        if end_date:
            if end_date.tzinfo is None:
                end_date = end_date.replace(tzinfo=timezone.utc)
            if end_date <= datetime.now(timezone.utc):
                raise HTTPException(status_code=403, detail="Subscription expired")
    
    # Get listing
    listing = await db.listings.find_one({"listing_id": message_data.listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Find or create conversation
    conversation = await db.conversations.find_one({
        "listing_id": message_data.listing_id,
        "$or": [
            {"seeker_id": user.user_id, "lister_id": message_data.receiver_id},
            {"seeker_id": message_data.receiver_id, "lister_id": user.user_id}
        ]
    }, {"_id": 0})
    
    if not conversation:
        # Determine roles
        if user.user_id == listing["lister_id"]:
            seeker_id = message_data.receiver_id
            lister_id = user.user_id
        else:
            seeker_id = user.user_id
            lister_id = listing["lister_id"]
        
        conversation = ChatConversation(
            listing_id=message_data.listing_id,
            seeker_id=seeker_id,
            lister_id=lister_id
        ).model_dump()
        await db.conversations.insert_one(conversation)
    
    # Create message
    message = ChatMessage(
        conversation_id=conversation["conversation_id"],
        sender_id=user.user_id,
        receiver_id=message_data.receiver_id,
        listing_id=message_data.listing_id,
        content=message_data.content
    )
    
    await db.messages.insert_one(message.model_dump())
    
    # Update conversation
    update_field = "lister_unread" if user.user_id == conversation["seeker_id"] else "seeker_unread"
    await db.conversations.update_one(
        {"conversation_id": conversation["conversation_id"]},
        {
            "$set": {
                "last_message": message_data.content,
                "last_message_at": datetime.now(timezone.utc)
            },
            "$inc": {update_field: 1}
        }
    )
    
    return {"message": message.model_dump()}

@api_router.get("/chat/conversations")
async def get_conversations(request: Request):
    """Get user's conversations"""
    user = await require_auth(request)
    
    conversations = await db.conversations.find({
        "$or": [
            {"seeker_id": user.user_id},
            {"lister_id": user.user_id}
        ]
    }, {"_id": 0}).sort("last_message_at", -1).to_list(50)
    
    # Enrich with other user info
    for conv in conversations:
        other_id = conv["lister_id"] if conv["seeker_id"] == user.user_id else conv["seeker_id"]
        other_user = await db.users.find_one({"user_id": other_id}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1})
        conv["other_user"] = other_user
        
        listing = await db.listings.find_one({"listing_id": conv["listing_id"]}, {"_id": 0, "title": 1, "area": 1})
        conv["listing_info"] = listing
    
    return {"conversations": conversations}

@api_router.get("/chat/messages/{conversation_id}")
async def get_messages(conversation_id: str, request: Request):
    """Get messages in a conversation"""
    user = await require_auth(request)
    
    conversation = await db.conversations.find_one({"conversation_id": conversation_id}, {"_id": 0})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if user.user_id not in [conversation["seeker_id"], conversation["lister_id"]]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    messages = await db.messages.find(
        {"conversation_id": conversation_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(200)
    
    # Mark as read
    unread_field = "seeker_unread" if user.user_id == conversation["seeker_id"] else "lister_unread"
    await db.conversations.update_one(
        {"conversation_id": conversation_id},
        {"$set": {unread_field: 0}}
    )
    
    await db.messages.update_many(
        {"conversation_id": conversation_id, "receiver_id": user.user_id, "is_read": False},
        {"$set": {"is_read": True}}
    )
    
    return {"messages": messages, "conversation": conversation}

# ===================== REPORT ENDPOINTS =====================

@api_router.post("/reports")
async def create_report(request: Request, report_data: ReportCreate):
    """Create a report"""
    user = await require_auth(request)
    
    report = Report(
        reporter_id=user.user_id,
        **report_data.model_dump()
    )
    
    await db.reports.insert_one(report.model_dump())
    return {"message": "Report submitted", "report_id": report.report_id}

# ===================== ADVERTISEMENT ENDPOINTS =====================

@api_router.get("/ads")
async def get_ads(area: Optional[str] = None, category: Optional[str] = None):
    """Get active advertisements"""
    query = {"is_active": True, "status": "approved"}
    
    if area:
        query["$or"] = [{"target_areas": area}, {"target_areas": []}]
    if category:
        query["category"] = category
    
    ads = await db.advertisements.find(query, {"_id": 0}).to_list(20)
    return {"ads": ads}

@api_router.post("/ads")
async def create_ad(request: Request, ad_data: AdCreate):
    """Create advertisement"""
    user = await require_auth(request)
    
    if user.role != "advertiser":
        raise HTTPException(status_code=403, detail="Advertiser role required")
    
    # Pricing
    pricing = {"basic": 150, "standard": 300, "premium": 500}
    price = pricing.get(ad_data.plan_type, 150)
    
    ad = Advertisement(
        advertiser_id=user.user_id,
        price=price,
        **ad_data.model_dump()
    )
    
    await db.advertisements.insert_one(ad.model_dump())
    return {"ad": ad.model_dump(), "message": "Ad created, pending approval"}

@api_router.post("/ads/{ad_id}/click")
async def track_ad_click(ad_id: str):
    """Track ad click"""
    await db.advertisements.update_one(
        {"ad_id": ad_id},
        {"$inc": {"clicks": 1}}
    )
    return {"message": "Click tracked"}

@api_router.get("/my-ads")
async def get_my_ads(request: Request):
    """Get advertiser's ads"""
    user = await require_auth(request)
    ads = await db.advertisements.find({"advertiser_id": user.user_id}, {"_id": 0}).to_list(100)
    return {"ads": ads}

# ===================== ADMIN ENDPOINTS =====================

@api_router.get("/admin/users")
async def admin_get_users(request: Request, skip: int = 0, limit: int = 50):
    """Get all users (admin only)"""
    await require_role(request, ["admin"])
    
    users = await db.users.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents({})
    return {"users": users, "total": total}

@api_router.get("/admin/listings")
async def admin_get_listings(request: Request, status: Optional[str] = None, skip: int = 0, limit: int = 50):
    """Get all listings (admin only)"""
    await require_role(request, ["admin"])
    
    query = {}
    if status:
        query["status"] = status
    
    listings = await db.listings.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.listings.count_documents(query)
    return {"listings": listings, "total": total}

@api_router.put("/admin/listings/{listing_id}/approve")
async def admin_approve_listing(listing_id: str, request: Request, approved: bool = True):
    """Approve or reject listing"""
    await require_role(request, ["admin"])
    
    status = "approved" if approved else "rejected"
    await db.listings.update_one(
        {"listing_id": listing_id},
        {"$set": {"status": status, "is_approved": approved}}
    )
    return {"message": f"Listing {status}"}

@api_router.get("/admin/verifications")
async def admin_get_verifications(request: Request, status: Optional[str] = None):
    """Get verification requests (admin only)"""
    await require_role(request, ["admin"])
    
    query = {}
    if status:
        query["status"] = status
    
    verifications = await db.verifications.find(query, {"_id": 0}).to_list(100)
    return {"verifications": verifications}

@api_router.put("/admin/verifications/{verification_id}")
async def admin_review_verification(verification_id: str, request: Request, approved: bool, notes: Optional[str] = None):
    """Review verification request"""
    user = await require_role(request, ["admin"])
    
    status = "approved" if approved else "rejected"
    
    update_data = {
        "status": status,
        "reviewed_at": datetime.now(timezone.utc),
        "reviewed_by": user.user_id
    }
    if notes:
        update_data["admin_notes"] = notes
    
    result = await db.verifications.update_one(
        {"verification_id": verification_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Verification not found")
    
    # Update user verification status
    verification = await db.verifications.find_one({"verification_id": verification_id}, {"_id": 0})
    if verification and approved:
        await db.users.update_one(
            {"user_id": verification["user_id"]},
            {"$set": {"is_verified": True}}
        )
    
    return {"message": f"Verification {status}"}

@api_router.get("/admin/reports")
async def admin_get_reports(request: Request, status: Optional[str] = None):
    """Get reports (admin only)"""
    await require_role(request, ["admin"])
    
    query = {}
    if status:
        query["status"] = status
    
    reports = await db.reports.find(query, {"_id": 0}).to_list(100)
    return {"reports": reports}

@api_router.put("/admin/reports/{report_id}")
async def admin_handle_report(report_id: str, request: Request, status: str, notes: Optional[str] = None):
    """Handle report"""
    await require_role(request, ["admin"])
    
    update_data = {"status": status}
    if notes:
        update_data["admin_notes"] = notes
    
    await db.reports.update_one(
        {"report_id": report_id},
        {"$set": update_data}
    )
    return {"message": "Report updated"}

@api_router.get("/admin/ads")
async def admin_get_ads(request: Request, status: Optional[str] = None):
    """Get advertisements (admin only)"""
    await require_role(request, ["admin"])
    
    query = {}
    if status:
        query["status"] = status
    
    ads = await db.advertisements.find(query, {"_id": 0}).to_list(100)
    return {"ads": ads}

@api_router.put("/admin/ads/{ad_id}/approve")
async def admin_approve_ad(ad_id: str, request: Request, approved: bool):
    """Approve or reject ad"""
    await require_role(request, ["admin"])
    
    status = "approved" if approved else "rejected"
    update_data = {"status": status}
    
    if approved:
        update_data["start_date"] = datetime.now(timezone.utc)
        update_data["end_date"] = datetime.now(timezone.utc) + timedelta(days=30)
    
    await db.advertisements.update_one(
        {"ad_id": ad_id},
        {"$set": update_data}
    )
    return {"message": f"Ad {status}"}

@api_router.get("/admin/stats")
async def admin_get_stats(request: Request):
    """Get platform statistics"""
    await require_role(request, ["admin"])
    
    total_users = await db.users.count_documents({})
    total_listings = await db.listings.count_documents({})
    pending_listings = await db.listings.count_documents({"status": "pending"})
    active_listings = await db.listings.count_documents({"status": "approved", "is_active": True})
    pending_verifications = await db.verifications.count_documents({"status": "pending"})
    pending_reports = await db.reports.count_documents({"status": "pending"})
    active_subscriptions = await db.subscriptions.count_documents({"status": "active"})
    
    # Area breakdown
    areas = ["Deira", "Bur Dubai", "Karama", "Al Nahda", "International City"]
    area_stats = {}
    for area in areas:
        count = await db.listings.count_documents({"area": area, "status": "approved"})
        area_stats[area] = count
    
    return {
        "total_users": total_users,
        "total_listings": total_listings,
        "pending_listings": pending_listings,
        "active_listings": active_listings,
        "pending_verifications": pending_verifications,
        "pending_reports": pending_reports,
        "active_subscriptions": active_subscriptions,
        "area_breakdown": area_stats
    }

@api_router.put("/admin/users/{user_id}/ban")
async def admin_ban_user(user_id: str, request: Request, banned: bool = True):
    """Ban or unban user"""
    await require_role(request, ["admin"])
    
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"is_active": not banned}}
    )
    return {"message": f"User {'banned' if banned else 'unbanned'}"}

# ===================== UTILITY ENDPOINTS =====================

@api_router.get("/areas")
async def get_areas():
    """Get available areas"""
    return {
        "areas": [
            {"id": "deira", "name": "Deira"},
            {"id": "bur_dubai", "name": "Bur Dubai"},
            {"id": "karama", "name": "Karama"},
            {"id": "al_nahda", "name": "Al Nahda"},
            {"id": "international_city", "name": "International City"}
        ]
    }

@api_router.get("/lifestyle-options")
async def get_lifestyle_options():
    """Get lifestyle tag options"""
    return {
        "options": {
            "working_hours": ["Day shift", "Night shift", "Flexible", "Remote"],
            "food_habits": ["Vegetarian", "Non-vegetarian", "Vegan", "Any"],
            "smoking": ["Non-smoker", "Smoker", "Outdoor only"],
            "visitors": ["No visitors", "Occasional", "Frequent"],
            "cleanliness": ["Very clean", "Moderately clean", "Flexible"],
            "noise_level": ["Quiet", "Moderate", "Social"]
        }
    }

@api_router.get("/professions")
async def get_professions():
    """Get profession options"""
    return {
        "professions": [
            "IT Professional", "Healthcare Worker", "Teacher", "Engineer",
            "Sales & Marketing", "Hospitality", "Construction", "Driver",
            "Retail", "Finance", "Student", "Other"
        ]
    }

@api_router.get("/")
async def root():
    return {"message": "Dubai Roommate Platform API", "version": "1.0.0"}

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
