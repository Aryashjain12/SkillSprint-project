🚀 SkillSprint

AI-Powered Developer Collaboration Platform

SkillSprint is an AI-powered platform that helps developers and students discover exciting projects, find compatible teammates, and collaborate efficiently—all in one place.

🌐 Live Demo: https://skill-sprint-project.vercel.app/


✨ Features

🔐 GitHub Authentication

- Secure GitHub OAuth using Supabase
- Automatically imports GitHub profile
- Fetches avatar, bio, username, and repository count

🚀 Post Project

- Create new projects
- Add required skills
- Define team size, timeline, and difficulty
- AI-powered suggestions

🤖 AI Features

- AI suggestions
- AI-recommended projects
- AI teammate matching
- Semantic matching using cosine similarity

🔍 Discover Projects

- Browse community projects
- AI Recommended section
- Explore More projects
- Search by project title or skills
- Request to join projects
- Track request status

📩 Invitations & Join Requests

- Send join requests
- Receive project invitations
- Accept or decline invitations

📁 My Projects

- View created and joined projects
- Access Project Rooms
- Manage ongoing collaborations

📋 Project Room

Each project has its own collaborative workspace featuring:

- Github repo
- Team Chat
- Member List
- Task Management
- Progress Tracking

✅ Kanban Board

Organize project tasks using a Trello-style workflow.

- To Do
- In Progress
- Done

🏆 Contribution Score

Contributors earn reputation based on approved work completed within projects, encouraging meaningful collaboration rather than just activity.

---

🤖 AI Workflow

1. Login with GitHub.
2. Import profile information and repositories.
3. Create or discover projects.
4. AI suggests relevant skills.
5. AI recommends projects and teammates based on semantic similarity.
6. Collaborate using Project Rooms, Team Chat, and the Kanban Board.

---

🛠 Tech Stack

Frontend

- React.js
- Vite
- Tailwind CSS
- React Router DOM
- Lucide React

Backend

- Supabase
- PostgreSQL
- Supabase Authentication
- Supabase Edge Functions

Artificial Intelligence

- Google Gemini API
- Semantic Matching
- Cosine Similarity

Deployment

- Vercel

📂 Project Structure

src/
├── components/
├── context/
├── lib/
├── pages/
├── App.jsx
├── main.jsx
└── index.css

---

⚙️ Installation

Clone the repository

git clone https://github.com/your-username/skillsprint.git

Move into the project directory

cd skillsprint

Install dependencies

npm install

Run the development server

npm run dev

---

🔑 Environment Variables

Create a ".env" file and add:

VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

Configure the following secret for Supabase Edge Functions:

GEMINI_API_KEY=your_gemini_api_key

---

📄 Pages

- Login
- Profile
- Dashboard
- Post Project
- Discover Projects
- Project Details
- AI Matching
- My Projects
- Project Room

---

🚀 Future Scope

- Real-time notifications
- Calendar integration
- AI sprint planning
- Team analytics dashboard
- GitHub contribution insights
- Open-source collaboration support

📜 License

This project was developed for educational, portfolio, and hackathon purposes.