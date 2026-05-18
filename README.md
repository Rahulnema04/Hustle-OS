# Hustle OS 🚀

**Intelligent Task Management & Project Planning Platform**

🌐 **Live Demo:** [https://hustle-os-ten.vercel.app](https://hustle-os-ten.vercel.app)

---

## 📋 Table of Contents

- [About Hustle OS](#about-hustle-os)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Usage](#usage)
- [Core Components](#core-components)
- [Contributing](#contributing)
- [License](#license)

---

## 📖 About Hustle OS

**Hustle OS** is an intelligent task management and project planning platform designed to streamline workflows and boost productivity. It combines modern web technologies with AI-powered task intelligence to help teams organize, prioritize, and execute projects efficiently.

The platform provides:
- **Intelligent Task Scoring** using semantic analysis
- **Multi-dimensional Complexity Analysis** across 7 key dimensions
- **Dynamic Points Assignment** based on task characteristics
- **Human-readable Explanations** for scoring decisions
- **Phase-specific Task Management** (Frontend, Backend, AI, DevOps, Integration)
- **Real-time Collaboration** capabilities

### Problem Statement

Traditional task management systems use static complexity labels (High/Medium/Low) which lack nuance and fail to capture the true complexity of diverse tasks. Hustle OS solves this by providing intelligent, multi-dimensional task analysis.

### Solution

Hustle OS features an advanced **Task Intelligence Engine** that:
1. Analyzes task titles and descriptions semantically
2. Extracts relevant keywords and patterns
3. Scores tasks across 7 complexity dimensions
4. Applies phase-specific weightings
5. Generates human-readable explanations
6. Assigns dynamic point values

---

## ✨ Key Features

### 🎯 Intelligent Task Scoring
- **7-Dimension Analysis**: Technical Depth, Effort Estimation, Ambiguity, Dependencies, Blast Radius, Skill Level, Cross-Domain
- **Semantic Understanding**: Goes beyond hardcoded rules
- **Dynamic Points**: Nuanced scoring system from 5 to 50 points
- **Contextual Weighting**: Different scoring weights for different project phases

### 📊 Project Management
- Create and organize tasks by project phases
- Track task progress and completion status
- Assign tasks to team members
- Monitor project timelines and dependencies
- Generate insights and analytics

### 🤖 AI Functionalities
- Task complexity prediction
- Intelligent recommendations
- Automated task categorization
- Performance analytics
- Historical pattern analysis

### 👥 Team Collaboration
- Real-time task updates
- Team member assignments
- Comment and discussion threads
- Activity tracking and notifications
- Shared project views

### 🔧 DevOps & Integration
- Easy deployment with Vercel
- RESTful API for integrations
- FastAPI-based backend services
- Seamless database connectivity
- Environment-based configuration

---

## 🛠️ Tech Stack

### Frontend (88%)
- **React.js** - UI framework
- **Next.js** - Server-side rendering and routing
- **Tailwind CSS** - Styling
- **JavaScript/TypeScript** - Programming language
- **Vercel** - Hosting and deployment

### Backend
- **Node.js / Express.js** - Server runtime and framework
- **Python** (11.5%) - Task intelligence engine
- **FastAPI** - High-performance Python API framework
- **RESTful APIs** - Client-server communication

### Database
- **MongoDB** - Document-based database
- **PostgreSQL** (optional) - Relational database option

### AI & ML
- **Semantic Analysis** - Natural language processing
- **Pattern Recognition** - Task complexity detection
- **Machine Learning Models** - Predictive analytics

### DevOps & Tools
- **Git & GitHub** - Version control
- **Docker** - Containerization
- **Vercel** - Continuous deployment
- **npm/pip** - Package management

---

## 📁 Project Structure

```
Hustle-OS/
├── frontend/                      # React/Next.js frontend application
│   ├── pages/                    # Page components
│   ├── components/               # Reusable UI components
│   ├── styles/                   # Tailwind CSS styles
│   ├── public/                   # Static assets
│   └── package.json              # Frontend dependencies
│
├── backend/                      # Node.js/Express backend
│   ├── routes/                   # API route handlers
│   ├── controllers/              # Business logic
│   ├── models/                   # Database schemas
│   ├── middleware/               # Custom middleware
│   └── server.js                 # Main server file
│
├── Auto-LLM/                     # AI Intelligence Engine
│   └── task_intelligence/        # Task complexity scoring
│       ├── semantic_analyzer.py  # Keyword extraction & analysis
│       ├── dimension_calculators.py  # 7-dimension scoring
│       ├── scoring_engine.py     # Weighted formula calculation
│       ├── explanation_generator.py  # Human-readable outputs
│       ├── config.py             # Configuration & weights
│       └── README.md             # Detailed documentation
│
├── .agent/                       # Agent configuration files
├── .gitignore                    # Git ignore rules
├── package.json                  # Root package configuration
├── package-lock.json             # Dependency lock file
└── README.md                     # This file
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Python 3.8+ (for Task Intelligence Engine)
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Rahulnema04/Hustle-OS.git
   cd Hustle-OS
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend
   npm install
   cd ..
   
   # Install backend dependencies
   cd backend
   npm install
   cd ..
   
   # Install Python dependencies for Task Intelligence
   cd Auto-LLM/task_intelligence
   pip install -r requirements_intelligence.txt
   cd ../../..
   ```

3. **Set up environment variables**
   - Create `.env.local` in the frontend directory
   - Create `.env` in the backend directory
   - Configure database connection strings, API keys, etc.

4. **Start the application**
   ```bash
   # Terminal 1: Start the backend
   cd backend
   npm start
   
   # Terminal 2: Start the Task Intelligence API (optional)
   cd Auto-LLM
   python task_intelligence_api.py
   
   # Terminal 3: Start the frontend
   cd frontend
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Task Intelligence API: http://localhost:8000

---

## 📦 Installation

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Backend Setup
```bash
cd backend
npm install
npm start
```

### Task Intelligence Engine
```bash
cd Auto-LLM/task_intelligence
pip install -r requirements_intelligence.txt
python task_intelligence_api.py
```

---

## 💡 Usage

### Creating a Task
1. Navigate to "Create Task" in the dashboard
2. Enter task title and description
3. Select the project phase
4. Add dependencies if applicable
5. Submit to get intelligent scoring

### Example Task Analysis
```json
{
  "title": "Build RAG Pipeline",
  "description": "Implement retrieval-augmented generation with vector embeddings",
  "phase": "AI Functionalities",
  "dependencies": ["database-setup"]
}
```

**Result:**
- Points: 50 (Expert level)
- Technical Depth: 9/10
- Skill Level: 8/10
- Blast Radius: 7/10
- Explanation: "This is a complex AI task requiring advanced ML knowledge..."

### API Usage
```bash
curl -X POST http://localhost:8000/api/score-task \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement Authentication",
    "description": "Build JWT-based auth with login and register",
    "phase": "Backend Development",
    "dependencies": ["database"]
  }'
```

---

## 🧠 Core Components

### 1. Task Intelligence Engine
Multi-dimensional task complexity scoring system that analyzes tasks semantically and assigns dynamic complexity scores with human-readable explanations.

**Dimensions Analyzed:**
- Technical Depth
- Effort Estimation
- Ambiguity
- Dependencies
- Blast Radius
- Skill Level
- Cross-Domain

**Score to Points Mapping:**
- 0-20 → 5 points (Simple)
- 21-35 → 10 points (Easy)
- 36-50 → 15 points (Medium)
- 51-65 → 20 points (Complex)
- 66-80 → 30 points (Hard)
- 81-100 → 50 points (Expert)

### 2. Frontend Application
Modern React/Next.js interface for task management, project visualization, and team collaboration.

### 3. Backend API
RESTful API built with Node.js/Express providing:
- Task CRUD operations
- User authentication
- Team management
- Project tracking
- Analytics generation

### 4. Database
Persistent storage for:
- User accounts and profiles
- Projects and tasks
- Team information
- Historical data
- Analytics

---

## 🌟 Features Highlight

✅ **Semantic Task Analysis** - Understand true task complexity  
✅ **Multi-Dimensional Scoring** - 7 different complexity factors  
✅ **Phase-Specific Intelligence** - Context-aware analysis  
✅ **Human-Readable Explanations** - Know why tasks are scored as they are  
✅ **Dynamic Point Assignment** - Nuanced 5-50 point scale  
✅ **Real-time Collaboration** - Work with your team seamlessly  
✅ **REST API** - Easy integration with other tools  
✅ **Scalable Architecture** - Handles teams of any size  
✅ **Modern Tech Stack** - Built with latest technologies  
✅ **Production Ready** - Deployed on Vercel  

---

## 🔗 Links

- **Live Application**: [https://hustle-os-ten.vercel.app](https://hustle-os-ten.vercel.app)
- **GitHub Repository**: [https://github.com/Rahulnema04/Hustle-OS](https://github.com/Rahulnema04/Hustle-OS)
- **Task Intelligence Docs**: See `Auto-LLM/task_intelligence/README.md`

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Keep commits focused and descriptive

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 📞 Support & Feedback

For support, questions, or feedback:
- Open an issue on GitHub
- Contact the maintainers
- Check existing documentation

---

## 🎉 Acknowledgments

- Built with modern web technologies
- Inspired by productivity and project management best practices
- Created to solve real-world task complexity challenges

---

**Last Updated:** May 2026  
**Version:** 1.0.0  
**Status:** Active Development

---

<div align="center">

**⭐ If you find Hustle OS helpful, please star the repository!**

Made with ❤️ by [Rahul Nema](https://github.com/Rahulnema04)

</div>
