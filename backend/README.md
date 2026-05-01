# Setup
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
cp .env.example .env
# Add your API keys to .env

# Run backend
uvicorn main:app --reload --port 8000

# Run frontend (separate terminal)
cd ..
npm run dev

API docs auto-available at: http://localhost:8000/docs
