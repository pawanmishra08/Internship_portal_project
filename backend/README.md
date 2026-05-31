# Internship Portal Project

A full-stack internship portal built with a Django REST backend and a React + TypeScript frontend.

## What is done so far

- Django backend with custom `User` model
- JWT authentication with login, register, refresh, logout, and profile endpoints
- PostgreSQL database configuration driven by environment variables
- Django admin enabled with the `User` model registered
- React frontend scaffolded with auth flow and protected routes
- Basic pages for Dashboard, Internships, Applications, and Companies
- Minimal hand-coded UI styling
- Project-level `.gitignore` files added for root and backend

## Tech Stack

### Backend
- Django 6
- Django REST Framework
- djangorestframework-simplejwt
- PostgreSQL
- python-dotenv

### Frontend
- React 19
- TypeScript
- Vite
- React Router

## Project Structure

```text

        internship-portal/
        │
        ├── backend/                                    # Django Backend
        │   ├── internship_portal/                    # Main project folder
        │   │   ├── __init__.py
        │   │   ├── settings.py                        # Project settings
        │   │   ├── urls.py                              # Main URL configuration
        │   │   ├── wsgi.py
        │   │   └── asgi.py
        │   │
        │   ├── core/                                      # Core app (Days 1-2: Auth)
        │   │   ├── migrations/
        │   │   ├── __init__.py
        │   │   ├── models.py                          # Custom User model
        │   │   ├── serializers.py                     # Auth serializers
        │   │   ├── views.py                            # Auth views
        │   │   ├── urls.py                               # Auth endpoints
        │   │   └── permissions.py                  # Custom permissions
        │   │
        │   ├── students/                               # Student module (Days 3-4)
        │   │   ├── migrations/
        │   │   ├── __init__.py
        │   │   ├── models.py                          # StudentProfile, Skill models
        │   │   ├── serializers.py                     # Student serializers
        │   │   ├── views.py                           # Student CRUD views
        │   │   ├── urls.py                            # Student endpoints
        │   │   └── management/
        │   │       └── commands/
        │   │           └── seed_skills.py             # Populate initial skills
        │   │
        │   ├── companies/                              # Company module (Days 5-7)
        │   │   ├── migrations/
        │   │   ├── __init__.py
        │   │   ├── models.py                          # CompanyProfile, Job models
        │   │   ├── serializers.py                     # Company & Job serializers
        │   │   ├── views.py                           # Company & Job views
        │   │   ├── urls.py                            # Company endpoints
        │   │   └── permissions.py                     # Company-specific permissions
        │   │
        │   ├── applications/                           # Application system (Days 8-9)
        │   │   ├── migrations/
        │   │   ├── __init__.py
        │   │   ├── models.py                          # Application model
        │   │   ├── serializers.py                     # Application serializers
        │   │   ├── views.py                           # Application CRUD & status update
        │   │   └── urls.py                            # Application endpoints
        │   │
        │   ├── recommendations/                        # Recommendation engine (Days 10-11)
        │   │   ├── __init__.py
        │   │   ├── algorithm.py                       # Core matching logic
        │   │   ├── serializers.py                     # Recommendation serializers
        │   │   ├── views.py                           # Recommendation endpoint
        │   │   └── urls.py
        │   │
        │   ├── admin_panel/                            # Super Admin (Days 12-13)
        │   │   ├── migrations/
        │   │   ├── __init__.py
        │   │   ├── views.py                           # Admin stats, user mgmt, verification
        │   │   ├── serializers.py
        │   │   ├── urls.py
        │   │   └── permissions.py                     # IsAdminUser permission
        │   │
        │   ├── media/                                  # User-uploaded files
        │   │   ├── resumes/                           # Student resume PDFs
        │   │   └── logos/                             # Company logos
        │   │
        │   ├── static/                                 # Static files (CSS, JS, images)
        │   │
        │   ├── staticfiles/                            # Collected static files (deployment)
        │   │
        │   ├── .env                                    # Environment variables (not in git)
        │   ├── .env.example                           # Template for environment variables
        │   ├── .gitignore
        │   ├── manage.py
        │   ├── requirements.txt                        # Python dependencies
        │   └── README.md
        │
        ├── frontend/                                   # React Frontend
        │   ├── public/
        │   │   ├── index.html
        │   │   ├── favicon.ico
        │   │   └── robots.txt
        │   │
        │   ├── src/
        │   │   ├── api/                               # API configuration (Day 2)
        │   │   │   ├── axios.js                       # Axios instance with interceptors
        │   │   │   ├── auth.js                        # Auth API calls
        │   │   │   ├── student.js                     # Student API calls
        │   │   │   ├── company.js                     # Company API calls
        │   │   │   ├── jobs.js                        # Job API calls
        │   │   │   ├── applications.js                # Application API calls
        │   │   │   ├── recommendations.js             # Recommendation API calls
        │   │   │   └── admin.js                       # Admin API calls
        │   │   │
        │   │   ├── components/                         # Reusable components
        │   │   │   ├── common/                        # Shared components
        │   │   │   │   ├── Button.jsx
        │   │   │   │   ├── Input.jsx
        │   │   │   │   ├── Card.jsx
        │   │   │   │   ├── Modal.jsx
        │   │   │   │   ├── Navbar.jsx
        │   │   │   │   ├── Sidebar.jsx
        │   │   │   │   ├── LoadingSpinner.jsx         # Day 14: Polish
        │   │   │   │   ├── StatusBadge.jsx            # Day 9: Application status
        │   │   │   │   └── ErrorMessage.jsx           # Day 14: Polish
        │   │   │   │
        │   │   │   ├── auth/                          # Auth components (Day 2)
        │   │   │   │   ├── LoginForm.jsx
        │   │   │   │   ├── RegisterForm.jsx
        │   │   │   │   └── ProtectedRoute.jsx
        │   │   │   │
        │   │   │   ├── student/                       # Student components (Day 4)
        │   │   │   │   ├── ProfileForm.jsx
        │   │   │   │   ├── ProfileView.jsx
        │   │   │   │   ├── SkillsMultiSelect.jsx
        │   │   │   │   └── ApplicationsTable.jsx      # Day 9
        │   │   │   │
        │   │   │   ├── company/                       # Company components (Day 7)
        │   │   │   │   ├── JobForm.jsx
        │   │   │   │   ├── JobsTable.jsx
        │   │   │   │   └── ApplicantsTable.jsx        # Day 9
        │   │   │   │
        │   │   │   ├── jobs/                          # Job browsing (Day 7)
        │   │   │   │   ├── JobCard.jsx
        │   │   │   │   ├── JobsList.jsx
        │   │   │   │   ├── JobFilters.jsx
        │   │   │   │   └── JobSearchBar.jsx
        │   │   │   │
        │   │   │   ├── recommendations/               # Recommendations (Day 11)
        │   │   │   │   ├── RecommendationCard.jsx
        │   │   │   │   ├── MatchPercentage.jsx
        │   │   │   │   └── SkillBadges.jsx
        │   │   │   │
        │   │   │   └── admin/                         # Admin components (Day 13)
        │   │   │       ├── StatsCard.jsx
        │   │   │       ├── CompanyVerificationTable.jsx
        │   │   │       └── UsersTable.jsx
        │   │   │
        │   │   ├── context/                           # Global state (Day 2)
        │   │   │   └── AuthContext.jsx                # Auth state management
        │   │   │
        │   │   ├── pages/                             # Page-level components
        │   │   │   ├── auth/                          # Auth pages (Day 2)
        │   │   │   │   ├── Login.jsx
        │   │   │   │   └── Register.jsx
        │   │   │   │
        │   │   │   ├── student/                       # Student pages (Days 4, 9, 11)
        │   │   │   │   ├── StudentDashboard.jsx       # Main dashboard layout
        │   │   │   │   ├── StudentHome.jsx            # Dashboard home with top 3 recs
        │   │   │   │   ├── Profile.jsx                # Student profile page
        │   │   │   │   ├── BrowseJobs.jsx             # Job browsing
        │   │   │   │   ├── JobDetail.jsx              # Job detail with apply
        │   │   │   │   ├── MyApplications.jsx         # Applications list
        │   │   │   │   └── RecommendedJobs.jsx        # Full recommendations page
        │   │   │   │
        │   │   │   ├── company/                       # Company pages (Days 7, 9)
        │   │   │   │   ├── CompanyDashboard.jsx       # Company dashboard layout
        │   │   │   │   ├── CompanyProfile.jsx         # Company profile page
        │   │   │   │   ├── MyJobs.jsx                 # Posted jobs management
        │   │   │   │   ├── CreateJob.jsx              # Job creation form page
        │   │   │   │   ├── EditJob.jsx                # Job edit page
        │   │   │   │   └── JobApplicants.jsx          # Applicants for a job
        │   │   │   │
        │   │   │   └── admin/                         # Admin pages (Day 13)
        │   │   │       ├── AdminDashboard.jsx         # Admin dashboard layout
        │   │   │       ├── AdminHome.jsx              # Stats overview
        │   │   │       ├── CompanyApprovals.jsx       # Company verification
        │   │   │       ├── ManageUsers.jsx            # User management
        │   │   │       └── ManageJobs.jsx             # All jobs moderation
        │   │   │
        │   │   ├── utils/                             # Helper functions
        │   │   │   ├── validation.js                  # Form validation helpers
        │   │   │   ├── dateFormat.js                  # Date formatting
        │   │   │   └── constants.js                   # App constants
        │   │   │
        │   │   ├── styles/                            # Global styles
        │   │   │   └── index.css                      # Tailwind imports & global CSS
        │   │   │
        │   │   ├── App.jsx                            # Main app component with routing
        │   │   ├── index.js                           # React entry point
        │   │   └── setupTests.js
        │   │
        │   ├── .env                                    # Environment variables (not in git)
        │   ├── .env.example
        │   ├── .env.production                         # Production API URL (Day 14)
        │   ├── .gitignore
        │   ├── package.json
        │   ├── package-lock.json
        │   ├── tailwind.config.js                      # Tailwind configuration
        │   ├── postcss.config.js
        │   └── README.md
        │
        ├── docs/                                       # Project documentation
        │   ├── API_DOCUMENTATION.md                    # API endpoint reference
        │   ├── DATABASE_SCHEMA.md                      # ER diagrams and schema
        │   ├── DEPLOYMENT_GUIDE.md                     # Deployment instructions
        │   └── USER_GUIDE.md                           # End-user manual
        │
        ├── .git/                                       # Git repository
        ├── .gitignore                                  # Root gitignore
        └── README.md                                   # Project overview and setup
        
        
        Internship-Portal-Project/
        ├── backend/
        │   ├── .gitignore
        │   └── internship_portal/
        │       ├── manage.py
        │       ├── core/
        │       └── internship_portal/
        ├── frontend/
        │   ├── .gitignore
        │   ├── README.md
        │   └── src/
        └── .gitignore
```

## Backend Setup

1. Go to the backend project:

```bash
cd "backend/internship_portal"
```

2. Create and activate a virtual environment if needed.

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Create a `.env` file in `backend/internship_portal/` using these values:

```env
DB_NAME=internship_portal_db
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_HOST=127.0.0.1
DB_PORT=5432
```

5. Run migrations:

```bash
python manage.py migrate
```

6. Create a superuser:

```bash
python manage.py createsuperuser
```

7. Start the backend server:

```bash
python manage.py runserver
```

The Django admin is available at:

```text
http://127.0.0.1:8000/admin/
```

## Demo Data Seeding

Use the robust demo seeder to create students, companies, jobs, applications, and a demo admin account.

```bash
python manage.py seed_demo_data --reset --export-file demo_credentials.json
```

Useful options:

```bash
python manage.py seed_demo_data --students 10 --companies 5 --jobs-per-company 4 --applications-per-student 3
python manage.py seed_demo_data --password DemoPass123! --export-file demo_credentials.csv
python manage.py seed_demo_data --no-export
```

By default, credentials are exported to `demo_credentials.json` in the current backend directory.

## Frontend Setup

1. Go to the frontend project:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Optional: create a `.env` file if your backend URL is different:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/auth
```

4. Start the frontend dev server:

```bash
npm run dev
```

The app usually runs at:

```text
http://127.0.0.1:5173/
```

## API Endpoints

Auth routes:

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/logout/`
- `POST /api/auth/token/refresh/`
- `GET /api/auth/me/`

## Notes

- Backend and frontend builds were verified successfully during development.
- Frontend pages are intentionally simple and minimal.
- The project is ready for adding real internships, applications, and companies models/endpoints next.
