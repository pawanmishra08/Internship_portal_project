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
