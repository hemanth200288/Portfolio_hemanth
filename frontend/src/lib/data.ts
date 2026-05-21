// ─── Portfolio Data ───────────────────────────────────────────────────────────
// All content data centralized here for easy editing by AI or human.

export const PERSONAL = {
  name: "Hemanth Kumar Chittiprolu",
  firstName: "Hemanth",
  lastName: "Kumar",
  title: "AI/ML Engineer",
  tagline: "Building production AI systems that ship.",
  location: "Hyderabad, India",
  email: "hemanth200288@gmail.com",
  phone: "+91 7330659894",
  linkedin: "https://linkedin.com/in/hemanth-kumar-chittiprolu-52a762210",
  availability: "Immediately available",
  currentCTC: "₹2,70,000 / annum",
  bio: `I'm an AI/ML Engineer based in Hyderabad with a B.Tech in AI & ML from Anurag University. I currently work at Knackhook where I build and deploy production AI systems — covering everything from NLP pipelines and RAG systems to computer vision and large-scale web scraping. I enjoy working on real-world problems where off-the-shelf AI falls short.`,
};

export const STATS = [
  { label: "Years Experience", value: 3, suffix: "+" },
  { label: "Projects Shipped", value: 6, suffix: "+" },
  { label: "Hackathon Wins", value: 4, suffix: "" },
  { label: "Production Systems", value: 3, suffix: "+" },
];

export const SKILL_CATEGORIES = [
  {
    name: "ML / Deep Learning",
    icon: "Brain",
    skills: [
      "Scikit-learn",
      "TensorFlow",
      "Keras",
      "PyTorch",
      "LightGBM",
      "XGBoost",
      "CNNs",
      "RNNs",
      "LSTMs",
      "GANs",
    ],
  },
  {
    name: "NLP",
    icon: "MessageSquare",
    skills: [
      "Hugging Face",
      "BERT",
      "GPT",
      "SpaCy",
      "NLTK",
      "Text Classification",
      "Sentiment Analysis",
      "Summarization",
    ],
  },
  {
    name: "Generative AI / LLMs",
    icon: "Sparkles",
    skills: [
      "LangChain",
      "LlamaIndex",
      "RAG",
      "PEFT",
      "LoRA",
      "Prompt Engineering",
    ],
  },
  {
    name: "Computer Vision",
    icon: "Eye",
    skills: [
      "OpenCV",
      "YOLO",
      "Image Classification",
      "Object Detection",
      "Segmentation",
    ],
  },
  {
    name: "Cloud & MLOps",
    icon: "Cloud",
    skills: [
      "AWS S3",
      "AWS Athena",
      "AWS EC2",
      "Azure Databricks",
      "Azure ML",
      "Docker",
      "MLflow",
      "FastAPI",
      "Kubernetes",
      "CI/CD",
    ],
  },
  {
    name: "Web & Tools",
    icon: "Code",
    skills: [
      "Python",
      "C++",
      "SQL",
      "JavaScript",
      "React.js",
      "Node.js",
      "Git",
      "Power BI",
      "Apify",
      "Linux",
    ],
  },
];

export const PROJECTS = [
  {
    title: "Ticket Price Prediction",
    description:
      "End-to-end ML pipeline for predicting ticket prices using LightGBM and Gradient Boosting. Deployed on AWS S3 + Athena with Bayesian statistical analysis for real-time price forecasting at production scale.",
    tags: ["LightGBM", "AWS S3", "Athena", "Bayesian Stats"],
    category: "ML",
  },
  {
    title: "Anti-Bot Scraper (Ticketmaster)",
    description:
      "Production-grade web scraper bypassing Akamai's enterprise bot detection. Built with Playwright and Camoufox, featuring fingerprint spoofing, rotating proxies, and deployed on Apify at scale.",
    tags: ["Playwright", "Camoufox", "Apify", "Anti-Bot"],
    category: "Scraping",
  },
  {
    title: "RAG Academic Research Assistant",
    description:
      "Retrieval-Augmented Generation system for academic research with vector database, semantic chunking, and LLM with citation grounding. Enables researchers to query papers with source-verified answers.",
    tags: ["RAG", "Vector DB", "LangChain", "Qdrant"],
    category: "GenAI",
  },
  {
    title: "LLM Evaluation Framework",
    description:
      "Comprehensive benchmarking framework for LLMs measuring hallucination rate, accuracy, and task performance with batch evaluation. Built on Hugging Face for scalable model assessment.",
    tags: ["LLM", "Hugging Face", "Evaluation", "BERT"],
    category: "GenAI",
  },
  {
    title: "LLM-Powered Android Security Tester",
    description:
      "Static analysis tool combined with LLM reasoning to identify security vulnerabilities in Android applications. Merges traditional code analysis with AI-driven threat assessment.",
    tags: ["Android", "LLM", "Static Analysis", "Security"],
    category: "Security",
  },
  {
    title: "IoT Smart Agriculture System",
    description:
      "Real-time crop monitoring system using IoT sensor data and ML models for predictive insights. Integrated sensor data pipelines with machine learning for agricultural optimization.",
    tags: ["IoT", "ML", "Sensors", "Real-Time"],
    category: "ML",
  },
];

export const ACHIEVEMENTS = [
  {
    title: "1st Place — IIT Hyderabad Inspira Hackathon",
    icon: "Trophy",
  },
  {
    title: "Special Mention — UN Reboot the Earth Hackathon at Salesforce",
    icon: "Globe",
  },
  {
    title: "4th Place — Google Hackathon at ISB Hyderabad",
    icon: "Award",
  },
  {
    title: "Winner — Ideathon at Osmania University",
    icon: "Star",
  },
];

export const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Projects", href: "#projects" },
  { label: "AI Chat", href: "#ai-chat" },
  { label: "Contact", href: "#contact" },
];

export const EXPERIENCE = {
  company: "Knackhook",
  role: "AI/ML Engineer",
  period: "June 2025 – Present",
  highlights: [
    "Production AI systems: NLP pipelines, computer vision, Azure cloud deployments",
    "End-to-end ML data pipeline for ticket price prediction (AWS S3 + Athena)",
    "Semantic code search system using Nomic embeddings + Qdrant vector DB",
    "Akamai anti-bot bypass scraper deployed on Apify at production scale",
    "Hallucination detection research using BERT-based stochastic checkers",
    "Contributed to KnackCampaigner, KnackHire, and KnackOutreach products",
  ],
};

export const EDUCATION = {
  degree: "B.Tech in Artificial Intelligence & Machine Learning",
  university: "Anurag University, Hyderabad",
  period: "2020–2024",
};
