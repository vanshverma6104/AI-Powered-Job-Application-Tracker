from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION = 7  # days

# Security
security = HTTPBearer()

# Create the main app
app = FastAPI()

# Create API router
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ===== MODELS =====

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    password_hash: str
    full_name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class Application(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    company_name: str
    position: str
    job_description: Optional[str] = None
    job_url: Optional[str] = None
    status: str = "applied"  # applied, screening, interview, offer, rejected
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    location: Optional[str] = None
    location_type: Optional[str] = None  # remote, hybrid, onsite
    applied_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    deadline: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ApplicationCreate(BaseModel):
    company_name: str
    position: str
    job_description: Optional[str] = None
    job_url: Optional[str] = None
    status: Optional[str] = "applied"
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    location: Optional[str] = None
    location_type: Optional[str] = None
    applied_date: Optional[datetime] = None
    deadline: Optional[datetime] = None
    notes: Optional[str] = None


class ApplicationUpdate(BaseModel):
    company_name: Optional[str] = None
    position: Optional[str] = None
    job_description: Optional[str] = None
    job_url: Optional[str] = None
    status: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    location: Optional[str] = None
    location_type: Optional[str] = None
    applied_date: Optional[datetime] = None
    deadline: Optional[datetime] = None
    notes: Optional[str] = None


class Interview(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    application_id: str
    interview_date: datetime
    interview_type: str  # phone, video, in-person
    interviewer_name: Optional[str] = None
    interviewer_role: Optional[str] = None
    meeting_link: Optional[str] = None
    notes: Optional[str] = None
    post_interview_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class InterviewCreate(BaseModel):
    application_id: str
    interview_date: datetime
    interview_type: str
    interviewer_name: Optional[str] = None
    interviewer_role: Optional[str] = None
    meeting_link: Optional[str] = None
    notes: Optional[str] = None


class InterviewUpdate(BaseModel):
    interview_date: Optional[datetime] = None
    interview_type: Optional[str] = None
    interviewer_name: Optional[str] = None
    interviewer_role: Optional[str] = None
    meeting_link: Optional[str] = None
    notes: Optional[str] = None
    post_interview_notes: Optional[str] = None


class AIGenerateRequest(BaseModel):
    job_description: str
    user_skills: Optional[str] = None
    company_name: Optional[str] = None
    position: Optional[str] = None


class AIResponse(BaseModel):
    content: str


# ===== AUTHENTICATION HELPERS =====

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def create_token(user_id: str, email: str) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRATION)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    token = credentials.credentials
    payload = decode_token(token)
    return payload


# ===== AI HELPER FUNCTION =====

async def generate_ai_content(prompt: str) -> str:
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        chat = LlmChat(
            api_key=api_key,
            session_id=str(uuid.uuid4()),
            system_message="You are a professional career advisor and resume expert. Provide helpful, actionable advice."
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        return response
    except Exception as e:
        logger.error(f"AI generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")


# ===== ROUTES =====

@api_router.get("/")
async def root():
    return {"message": "AI Job Tracker API"}


# Authentication Routes
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    password_hash = hash_password(user_data.password)
    user = User(
        email=user_data.email,
        password_hash=password_hash,
        full_name=user_data.full_name
    )
    
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # Create token
    token = create_token(user.id, user.email)
    
    user_response = UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        created_at=user.created_at
    )
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=user_response
    )


@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user['id'], user['email'])
    
    user_response = UserResponse(
        id=user['id'],
        email=user['email'],
        full_name=user['full_name'],
        created_at=datetime.fromisoformat(user['created_at']) if isinstance(user['created_at'], str) else user['created_at']
    )
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=user_response
    )


@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: Dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user['user_id']})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=user['id'],
        email=user['email'],
        full_name=user['full_name'],
        created_at=datetime.fromisoformat(user['created_at']) if isinstance(user['created_at'], str) else user['created_at']
    )


# Application Routes
@api_router.post("/applications", response_model=Application)
async def create_application(app_data: ApplicationCreate, current_user: Dict = Depends(get_current_user)):
    application = Application(
        user_id=current_user['user_id'],
        **app_data.model_dump()
    )
    
    app_dict = application.model_dump()
    app_dict['applied_date'] = app_dict['applied_date'].isoformat() if app_dict['applied_date'] else None
    app_dict['deadline'] = app_dict['deadline'].isoformat() if app_dict['deadline'] else None
    app_dict['created_at'] = app_dict['created_at'].isoformat()
    app_dict['updated_at'] = app_dict['updated_at'].isoformat()
    
    await db.applications.insert_one(app_dict)
    return application


@api_router.get("/applications", response_model=List[Application])
async def get_applications(current_user: Dict = Depends(get_current_user)):
    applications = await db.applications.find({"user_id": current_user['user_id']}, {"_id": 0}).to_list(1000)
    
    for app in applications:
        if isinstance(app.get('applied_date'), str):
            app['applied_date'] = datetime.fromisoformat(app['applied_date'])
        if isinstance(app.get('deadline'), str):
            app['deadline'] = datetime.fromisoformat(app['deadline'])
        if isinstance(app.get('created_at'), str):
            app['created_at'] = datetime.fromisoformat(app['created_at'])
        if isinstance(app.get('updated_at'), str):
            app['updated_at'] = datetime.fromisoformat(app['updated_at'])
    
    return applications


@api_router.get("/applications/{application_id}", response_model=Application)
async def get_application(application_id: str, current_user: Dict = Depends(get_current_user)):
    application = await db.applications.find_one({"id": application_id, "user_id": current_user['user_id']}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if isinstance(application.get('applied_date'), str):
        application['applied_date'] = datetime.fromisoformat(application['applied_date'])
    if isinstance(application.get('deadline'), str):
        application['deadline'] = datetime.fromisoformat(application['deadline'])
    if isinstance(application.get('created_at'), str):
        application['created_at'] = datetime.fromisoformat(application['created_at'])
    if isinstance(application.get('updated_at'), str):
        application['updated_at'] = datetime.fromisoformat(application['updated_at'])
    
    return application


@api_router.put("/applications/{application_id}", response_model=Application)
async def update_application(
    application_id: str,
    app_data: ApplicationUpdate,
    current_user: Dict = Depends(get_current_user)
):
    existing_app = await db.applications.find_one({"id": application_id, "user_id": current_user['user_id']})
    if not existing_app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    update_data = {k: v for k, v in app_data.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    if 'applied_date' in update_data and update_data['applied_date']:
        update_data['applied_date'] = update_data['applied_date'].isoformat()
    if 'deadline' in update_data and update_data['deadline']:
        update_data['deadline'] = update_data['deadline'].isoformat()
    
    await db.applications.update_one(
        {"id": application_id},
        {"$set": update_data}
    )
    
    updated_app = await db.applications.find_one({"id": application_id}, {"_id": 0})
    
    if isinstance(updated_app.get('applied_date'), str):
        updated_app['applied_date'] = datetime.fromisoformat(updated_app['applied_date'])
    if isinstance(updated_app.get('deadline'), str):
        updated_app['deadline'] = datetime.fromisoformat(updated_app['deadline'])
    if isinstance(updated_app.get('created_at'), str):
        updated_app['created_at'] = datetime.fromisoformat(updated_app['created_at'])
    if isinstance(updated_app.get('updated_at'), str):
        updated_app['updated_at'] = datetime.fromisoformat(updated_app['updated_at'])
    
    return updated_app


@api_router.delete("/applications/{application_id}")
async def delete_application(application_id: str, current_user: Dict = Depends(get_current_user)):
    result = await db.applications.delete_one({"id": application_id, "user_id": current_user['user_id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"message": "Application deleted successfully"}


# Interview Routes
@api_router.post("/interviews", response_model=Interview)
async def create_interview(interview_data: InterviewCreate, current_user: Dict = Depends(get_current_user)):
    # Verify application belongs to user
    application = await db.applications.find_one({
        "id": interview_data.application_id,
        "user_id": current_user['user_id']
    })
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    interview = Interview(
        user_id=current_user['user_id'],
        **interview_data.model_dump()
    )
    
    interview_dict = interview.model_dump()
    interview_dict['interview_date'] = interview_dict['interview_date'].isoformat()
    interview_dict['created_at'] = interview_dict['created_at'].isoformat()
    
    await db.interviews.insert_one(interview_dict)
    return interview


@api_router.get("/interviews", response_model=List[Interview])
async def get_interviews(current_user: Dict = Depends(get_current_user)):
    interviews = await db.interviews.find({"user_id": current_user['user_id']}, {"_id": 0}).to_list(1000)
    
    for interview in interviews:
        if isinstance(interview.get('interview_date'), str):
            interview['interview_date'] = datetime.fromisoformat(interview['interview_date'])
        if isinstance(interview.get('created_at'), str):
            interview['created_at'] = datetime.fromisoformat(interview['created_at'])
    
    return interviews


@api_router.get("/interviews/application/{application_id}", response_model=List[Interview])
async def get_interviews_by_application(application_id: str, current_user: Dict = Depends(get_current_user)):
    interviews = await db.interviews.find({
        "application_id": application_id,
        "user_id": current_user['user_id']
    }, {"_id": 0}).to_list(1000)
    
    for interview in interviews:
        if isinstance(interview.get('interview_date'), str):
            interview['interview_date'] = datetime.fromisoformat(interview['interview_date'])
        if isinstance(interview.get('created_at'), str):
            interview['created_at'] = datetime.fromisoformat(interview['created_at'])
    
    return interviews


@api_router.put("/interviews/{interview_id}", response_model=Interview)
async def update_interview(
    interview_id: str,
    interview_data: InterviewUpdate,
    current_user: Dict = Depends(get_current_user)
):
    existing_interview = await db.interviews.find_one({"id": interview_id, "user_id": current_user['user_id']})
    if not existing_interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    update_data = {k: v for k, v in interview_data.model_dump().items() if v is not None}
    
    if 'interview_date' in update_data and update_data['interview_date']:
        update_data['interview_date'] = update_data['interview_date'].isoformat()
    
    await db.interviews.update_one(
        {"id": interview_id},
        {"$set": update_data}
    )
    
    updated_interview = await db.interviews.find_one({"id": interview_id}, {"_id": 0})
    
    if isinstance(updated_interview.get('interview_date'), str):
        updated_interview['interview_date'] = datetime.fromisoformat(updated_interview['interview_date'])
    if isinstance(updated_interview.get('created_at'), str):
        updated_interview['created_at'] = datetime.fromisoformat(updated_interview['created_at'])
    
    return updated_interview


@api_router.delete("/interviews/{interview_id}")
async def delete_interview(interview_id: str, current_user: Dict = Depends(get_current_user)):
    result = await db.interviews.delete_one({"id": interview_id, "user_id": current_user['user_id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Interview not found")
    return {"message": "Interview deleted successfully"}


# AI Routes
@api_router.post("/ai/cover-letter", response_model=AIResponse)
async def generate_cover_letter(request: AIGenerateRequest, current_user: Dict = Depends(get_current_user)):
    prompt = f"""Generate a professional cover letter for the following job application:

Company: {request.company_name or 'the company'}
Position: {request.position or 'the position'}
Job Description: {request.job_description}
My Skills: {request.user_skills or 'Please highlight relevant skills based on the job description'}

Create a compelling, professional cover letter that:
1. Shows enthusiasm for the role
2. Highlights relevant skills and experience
3. Explains why I'm a good fit
4. Is concise (about 3-4 paragraphs)
5. Has a professional tone

Please write the cover letter directly without any preamble or metadata."""
    
    content = await generate_ai_content(prompt)
    return AIResponse(content=content)


@api_router.post("/ai/resume-tailor", response_model=AIResponse)
async def tailor_resume(request: AIGenerateRequest, current_user: Dict = Depends(get_current_user)):
    prompt = f"""Analyze this job description and provide resume tailoring suggestions:

Job Description: {request.job_description}

Please provide:
1. Key skills and keywords to include in the resume
2. Specific achievements or experiences to highlight
3. Technical skills that should be emphasized
4. Action verbs to use
5. Any certifications or qualifications mentioned

Format the response as clear, actionable bullet points."""
    
    content = await generate_ai_content(prompt)
    return AIResponse(content=content)


@api_router.post("/ai/interview-prep", response_model=AIResponse)
async def generate_interview_questions(request: AIGenerateRequest, current_user: Dict = Depends(get_current_user)):
    prompt = f"""Generate interview preparation material for this job:

Position: {request.position or 'the position'}
Company: {request.company_name or 'the company'}
Job Description: {request.job_description}

Please provide:
1. 10 potential interview questions specific to this role
2. Brief answer frameworks for each question
3. Key topics to prepare for
4. Company research tips

Make it practical and actionable."""
    
    content = await generate_ai_content(prompt)
    return AIResponse(content=content)


@api_router.get("/ai/insights", response_model=AIResponse)
async def get_application_insights(current_user: Dict = Depends(get_current_user)):
    # Get user's applications
    applications = await db.applications.find({"user_id": current_user['user_id']}, {"_id": 0}).to_list(1000)
    
    if not applications:
        return AIResponse(content="You haven't added any applications yet. Start tracking your job search to get personalized insights!")
    
    # Prepare application summary
    total_apps = len(applications)
    status_counts = {}
    for app in applications:
        status = app.get('status', 'unknown')
        status_counts[status] = status_counts.get(status, 0) + 1
    
    summary = f"""I have tracked {total_apps} job applications with the following breakdown:
"""
    for status, count in status_counts.items():
        summary += f"- {status.capitalize()}: {count}\n"
    
    prompt = f"""{summary}

Based on this job search data, provide:
1. Analysis of my application success rate
2. Suggestions for improving my job search strategy
3. Patterns I should be aware of
4. Actionable tips for increasing response rates
5. Recommendations on how many applications per week I should aim for

Keep the advice practical and encouraging."""
    
    content = await generate_ai_content(prompt)
    return AIResponse(content=content)


# Analytics Routes
@api_router.get("/analytics/stats")
async def get_analytics_stats(current_user: Dict = Depends(get_current_user)):
    applications = await db.applications.find({"user_id": current_user['user_id']}, {"_id": 0}).to_list(1000)
    interviews = await db.interviews.find({"user_id": current_user['user_id']}, {"_id": 0}).to_list(1000)
    
    total_applications = len(applications)
    
    status_counts = {
        "applied": 0,
        "screening": 0,
        "interview": 0,
        "offer": 0,
        "rejected": 0
    }
    
    for app in applications:
        status = app.get('status', 'applied')
        if status in status_counts:
            status_counts[status] += 1
    
    total_interviews = len(interviews)
    
    # Calculate response rate (screening + interview + offer + rejected / total)
    responses = status_counts['screening'] + status_counts['interview'] + status_counts['offer'] + status_counts['rejected']
    response_rate = (responses / total_applications * 100) if total_applications > 0 else 0
    
    # Interview conversion rate (interview + offer / total)
    interview_conversions = status_counts['interview'] + status_counts['offer']
    interview_rate = (interview_conversions / total_applications * 100) if total_applications > 0 else 0
    
    return {
        "total_applications": total_applications,
        "total_interviews": total_interviews,
        "offers": status_counts['offer'],
        "response_rate": round(response_rate, 1),
        "interview_rate": round(interview_rate, 1),
        "status_breakdown": status_counts
    }


# Include router in app
app.include_router(api_router)

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
