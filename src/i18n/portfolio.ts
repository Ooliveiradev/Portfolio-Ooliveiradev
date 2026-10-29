import {
  BADGES_DATA,
  EDUCATION_DATA,
  EXPERIENCE_DATA,
  INITIAL_LEADERBOARD,
  INITIAL_RACE_LEADERBOARD,
  ISLANDS_CONFIG,
  PERSONAL_INFO,
  PROJECTS_DATA,
  SKILLS_DATA,
} from '../data/portfolioData';
import type { Badge, EducationItem, ExperienceItem, IslandConfig, ProjectItem, SkillCategory } from '../types';
import type { Locale } from './locale';

const englishIslands: Record<IslandConfig['id'], Pick<IslandConfig, 'name' | 'tagline' | 'challengeTitle'>> = {
  projects: { name: 'Projects Island', tagline: 'Projects That Become Real Solutions', challengeTitle: 'Cosmic Deployment Terminal' },
  experience: { name: 'Career Island', tagline: 'Professional Journey, Technical Work & Real Solutions', challengeTitle: 'Operational Milestone Activation' },
  skills: { name: 'Technology Island', tagline: 'Technology Stack, Modern Ecosystem & Web Architecture', challengeTitle: 'Tech Frequency Tuning' },
  education: { name: 'Academic Island', tagline: 'Systems Analysis at PUC Minas, Engineering at CEFET-MG & Certifications', challengeTitle: 'Quick Algorithm Challenge' },
  about: { name: 'Developer Portal', tagline: 'Professional Profile, Journey & Direct Contact Channels', challengeTitle: 'Secure Frequency Connection' },
  analytics: { name: 'Analytics Island', tagline: 'Anonymous Telemetry & Real-Time Flows', challengeTitle: 'Data Observatory' },
};
const projectTranslations: Record<string, Partial<ProjectItem>> = {
  'quantia-mvp': {
    title: 'QuantIA (Prototype)', category: 'Applied AI & Civil Engineering', statusBadge: 'Prototype · Discontinued',
    shortDesc: 'Intelligent material quantity takeoff from PDF floor plans using Google Gemini.',
    description: 'A discontinued prototype, kept here only as a portfolio piece: development has ended and it will not receive new versions. A web platform that extracts rooms, areas and finish types from PDF floor plans with Google Gemini. It combines an auditable deterministic calculation engine for flooring, mortar and grout with an autonomous AI auditor and robust Vitest and Playwright coverage.',
    metrics: 'Cuts area and construction quantity extraction from hours to seconds',
    stats: [
      { label: 'Time Savings', value: '94% faster', icon: 'timer' }, { label: 'Math Engine', value: '100% deterministic', icon: 'calculate' },
      { label: 'Test Coverage', value: 'Vitest + Playwright', icon: 'verified' }, { label: 'Vision Model', value: 'Gemini 2.0 Multimodal', icon: 'auto_awesome' },
    ],
    highlights: [
      'Automated visual extraction of dimensions, rooms and legends from PDF floor plans.',
      'Certified analytical calculation of mortar and grout consumption per square meter.',
      'Autonomous AI auditor cross-checks measurements and area discrepancies.',
      'Secure Supabase PostgreSQL architecture with authentication and drawing storage.',
      'End-to-end strict typing with Zod schemas for reliable LLM output.',
    ],
    architecture: {
      overview: 'A Next.js 16 App Router pipeline connects Google Gemini computer vision to strict Zod schemas and a pure, auditable calculation engine.',
      flow: ['Secure PDF upload', 'High-fidelity rendering and Gemini processing', 'Structured extraction of rooms, areas and finishes', 'Strict Zod validation', 'Deterministic material calculation', 'Autonomous consistency audit', 'Detailed report generation'],
      database: 'Supabase PostgreSQL with Row Level Security and a protected drawing-storage bucket.',
      security: ['Runtime validation with Zod', 'Gemini API keys remain server-side', 'Per-user multi-tenant isolation with RLS'],
    },
    readme: `# QuantIA (Prototype) — AI Quantity Takeoff\n\n> **Status: discontinued prototype.** Kept only as a portfolio project; it will not receive new versions.\n\n> Predictive construction estimating with Google Gemini Multimodal and deterministic calculations.\n\n## Overview\n\nQuantIA turns PDF floor plans into auditable room, area and material estimates. Gemini provides visual extraction while a deterministic engine calculates flooring, mortar, grout and waste. An autonomous auditor checks inconsistencies before results are shown.\n\n## Core features\n\n- Multimodal PDF floor-plan reading\n- Automated room and dimension detection\n- Deterministic material calculation\n- Autonomous AI audit\n- Auditable calculation reports\n\n## Stack\n\nNext.js 16, React 19, TypeScript, Gemini 2.0, Zod, Supabase, Vitest and Playwright.\n\n## Run locally\n\n\`\`\`bash\ngit clone https://github.com/Ooliveiradev/QuantIA-MVP.git\ncd QuantIA-MVP\npnpm install\npnpm dev\n\`\`\`\n\n---\nBuilt by **Danilo Ribeiro**.`,
  },
  ecofinance: {
    category: 'Fintech & Personal Finance', statusBadge: 'Web Live · Mobile App in Validation',
    shortDesc: 'A personal finance manager to plan the month: what I spent, what is already committed and what is left.',
    description: 'A responsive Next.js web app on Cloud Firestore, deployed on Vercel. It covers accounts, cards and statements, monthly planning with recurring bills and category budgets, reports, and reviewed statement imports (OFX, CSV, XLSX, PDF and photos with local OCR). It needs no paid Open Finance and no mandatory external AI. The Expo app (Android/iOS) exists and builds in CI, but is still being validated.',
    metrics: 'Web in production, covered by domain, integration and E2E tests; Expo app in validation',
    stats: [{ label: 'Platforms', value: 'Web live · Expo in validation', icon: 'devices' }, { label: 'Database', value: 'Cloud Firestore', icon: 'database' }, { label: 'Import', value: 'OFX, CSV, XLSX, PDF and OCR', icon: 'upload_file' }, { label: 'Tests', value: 'Vitest + Playwright', icon: 'verified' }],
    highlights: ['My month: projected availability with the formula shown on screen, separating accrual from cash.', 'Cards, statements and installments: paying a statement is not counted as spending twice.', 'Reviewed imports: balances do not change until you confirm, and undo is protected.', 'Digital/scanned PDFs and photos with local OCR, without sending documents to external services.', 'Email and password login with revocable sessions and per-user data isolation.'],
    architecture: { overview: 'A monorepo with a Next.js web app, a shared domain and data package, and an Expo app. The web app runs on Vercel (São Paulo region) and reaches Firestore without a static key, through OIDC identity federation.', flow: ['Sign in with email and password (no public sign-up: the operator creates accesses)', 'Entries, accounts, cards and recurring bills are stored in exact cents', 'Planning generates forecasts without duplicating bills', 'Imported statements stay in review until confirmed', 'The same calculations feed the dashboard, tables, API and CSV export'], database: 'Cloud Firestore with per-user security rules and emulator integration tests.', security: ['Per-user isolation and revocable sessions', 'No service key: temporary credentials through Vercel OIDC', 'Automated secret checks on source and bundle'] },
    readme: `# EcoFinance — Personal Financial Planning\n\n> What I spent, what is already committed and what is left this month.\n\n## Status\n\n- **Web:** live, covered by domain, Firestore integration and E2E tests.\n- **Expo app (Android/iOS):** native screens and cache; builds in CI, device journeys still pending.\n- **Removed:** Open Finance (Pluggy), GPS capture, map and AI chat.\n\n## Features\n\n- My month, entries, accounts, cards, statements and installments\n- Planning with recurring bills and category budgets\n- OFX/CSV/XLSX/PDF import with review and local OCR\n- Reports, charts and CSV export\n- Backup, restore with preview and data deletion\n\n## Stack\n\nTypeScript, Next.js, Cloud Firestore, Expo, Vitest, Playwright and Vercel.\n\n---\nBuilt by **Danilo Ribeiro**.`,
  },
  'portfolio-3d': {
    title: '3D Cosmic Portfolio', category: 'Creative 3D & WebGL', statusBadge: 'In Production · 60–120 FPS',
    shortDesc: 'A gamified 3D portfolio with Rapier inertial physics, studio lighting and five orbital islands.',
    description: 'A high-impact 3D web experience built with Three.js and React Three Fiber. It features inertial spacecraft physics, drift and suspension, cinematic lighting, synchronized celestial orbits, five planetary islands, docking, checkpoint racing and interactive technical challenges.',
    metrics: 'Stable 60–120 FPS with PCF shadows and cinematic studio lighting',
    stats: [{ label: 'Renderer', value: 'Three.js + R3F', icon: 'view_in_ar' }, { label: 'Physics', value: 'Rapier 3D Rigidbody', icon: 'speed' }, { label: 'Performance', value: 'Fluid 60–120 FPS', icon: 'monitor_heart' }, { label: 'Procedural Audio', value: 'Web Audio API Synth', icon: 'graphic_eq' }],
    highlights: ['Inertial spacecraft controls with vector acceleration, friction, drift and elastic suspension.', 'Calibrated key, fill, rim and ambient studio lighting.', 'Five floating orbital islands with automatic docking and adaptive camera.', 'Checkpoint time trial with countdown and Hall of Fame.', 'Real-time Web Audio synthesis with no external audio files.'],
    architecture: { overview: 'An optimized React Three Fiber scene graph is coupled to Rapier 3D WASM physics for stable 60 Hz simulation.', flow: ['Vite starts an adaptive-DPR WebGL canvas', 'Rapier creates the physics world and spacecraft rigid body', 'useFrame synchronizes orbits and thrust', 'A damped third-person camera follows the ship', 'Collision systems detect rings, crystals and docking zones', 'The React HUD updates independently from the 3D canvas'], database: 'Versioned LocalStorage persistence for XP, badges and race ranking.', security: ['100% client-side execution', 'Strict sampling limits for Web Audio'] },
    readme: `# 3D Cosmic Portfolio — Gamified Universe\n\nAn immersive portfolio combining spacecraft navigation, real-time physics, studio lighting and gamification.\n\n## Highlights\n\n- Rapier 3D inertial physics\n- Cinematic three-point lighting\n- Five interactive orbital islands\n- Checkpoint time trial\n- Procedural Web Audio synthesis\n\n## Stack\n\nThree.js, React Three Fiber, Rapier 3D, TypeScript, Tailwind CSS and Motion.\n\n## Run locally\n\n\`\`\`bash\ngit clone https://github.com/Ooliveiradev/Portfolio-Ooliveiradev.git\ncd Portfolio-Ooliveiradev\nnpm install\nnpm run dev\n\`\`\`\n\n---\nBuilt by **Danilo Ribeiro**.`,
  },
  nutrilife: {
    category: 'Health & Nutrition', statusBadge: 'In Development · BMI Available',
    shortDesc: 'A nutrition site with a BMI calculator, a blog and, under construction, a calorie calculator, recipe bank and food diary.',
    description: 'A web platform built with plain HTML, CSS and JavaScript, using Firebase for authentication and content. The BMI calculator works, with validation, classification and recommendations. The calorie calculator, recipe bank and food diary are still in development.',
    metrics: 'Working BMI calculator; other tools under construction',
    stats: [{ label: 'Stack', value: 'HTML + CSS + JS', icon: 'code' }, { label: 'Backend', value: 'Firebase', icon: 'cloud' }, { label: 'Available', value: 'BMI calculator', icon: 'calculate' }, { label: 'Under construction', value: 'Calories, recipes, diary', icon: 'construction' }],
    highlights: ['BMI calculator with input validation, classification and recommendations.', 'Home page with a blog filterable by category, search and sorting.', 'Responsive layout with navigation between tools.', 'Authentication and content with Firebase (Authentication and Firestore).'],
    architecture: { overview: 'A multi-page site in HTML, CSS and JavaScript (ES6+) with no framework, using Firebase for authentication and blog data.', flow: ['The visitor picks a tool from the menu', 'The form validates weight and height before calculating', 'BMI is calculated and classified instantly', 'The interface shows the result and guidance'], database: 'Cloud Firestore for blog content, with security rules in the repository.', security: ['Versioned Firestore rules', 'BMI is computed in the browser; no health data is sent'] },
    readme: `# NutriLife — Your Journey to a Healthy Life\n\n> A site with nutrition tools: BMI, a blog and, under construction, calories, recipes and a food diary.\n\n## Status\n\n- **Available:** home page with blog and BMI calculator.\n- **In development:** calorie calculator, recipe bank and food diary.\n\n## Stack\n\nHTML5, CSS3, JavaScript (ES6+) and Firebase.\n\n---\nBuilt by **Danilo Ribeiro**.`,
  },
};

const englishExperience: Record<string, Partial<ExperienceItem>> = {
  'exp-betim-tech': { role: 'Front-end Development Intern', period: '07/2026 – Present', location: 'Betim, MG, Brazil', highlights: ['Develop and maintain responsive, accessible interfaces with React and Next.js.', 'Implement product features focused on UX and performance.', 'Integrate front-end components with REST APIs and real-time data.'] },
  'exp-nemak': { role: 'Apprentice / Foundry Assistant', location: 'Betim, MG, Brazil', highlights: ['Supported industrial operations and monitored production indicators.', 'Applied quality-control, workflow and industrial-safety routines.'], techStack: ['Quality Control', 'Industrial Processes', 'Operations Management', 'Safety'] },
  'exp-futurese': { role: 'Innovation Assistant', location: 'Betim, MG, Brazil', highlights: ['Supported innovation events, startup accelerators and technology hackathons.', 'Managed CRM, entrepreneur support, digital marketing and audiovisual content.'], techStack: ['Startup Management', 'Hackathons', 'CRM', 'Digital Marketing', 'Audiovisual Editing'] },
  'exp-freelancer': { role: 'Independent & Freelance Experience', company: 'Self-employed', location: 'Betim, MG, Brazil', highlights: ['Customer service and operations at major events under pressure.', 'Managed costs, dynamic pricing and direct sales negotiation.'], techStack: ['Clear Communication', 'Negotiation', 'Cost Management', 'Problem Solving'] },
};

const englishEducation: Record<string, Partial<EducationItem>> = {
  'edu-puc-ads': { degree: 'BSc in Systems Analysis and Development', period: '07/2026 – Expected 12/2028', description: 'Modern software engineering, scalable architecture, relational and distributed databases, full-stack development and application security.', skillsAcquired: ['Software Engineering', 'Distributed Systems', 'Data Modeling', 'Clean Architecture'], badgeName: 'PUC-MG Systems Student' },
  'edu-cefet-eng': { degree: 'BEng in Transportation Engineering', period: 'Started 03/2026', description: 'Rigorous analytical education in exact sciences, advanced mathematical logic, flow modeling, quantitative analysis and infrastructure.', skillsAcquired: ['Mathematical Modeling', 'Flow Optimization', 'Advanced Calculus', 'Quantitative Analysis'], badgeName: 'CEFET-MG Engineering' },
  'edu-certificacoes': { degree: 'Technical Qualifications & Extension Courses', description: 'Web Development (150h), Python Fundamentals (30h), Digital Marketing (50h) and Intermediate/Advanced English.', skillsAcquired: ['Modern Python', 'Full-Stack Web', 'Product Marketing', 'Technical English'], badgeName: 'Tech Certifications' },
};

const englishBadges: Record<string, Pick<Badge, 'title' | 'description'> & { unlockedAt?: string }> = {
  'badge-ignition': { title: 'First Contact', description: 'Started navigating the portfolio’s 3D universe.', unlockedAt: 'At Launch' },
  'badge-explorer': { title: 'Cosmic Navigator', description: 'Visited all six orbital islands.' },
  'badge-coder': { title: 'Challenge Master', description: 'Completed at least two technical island challenges.' },
  'badge-crystal-novice': { title: 'Star Miner', description: 'Collected at least three cosmic crystals.' },
  'badge-crystal': { title: 'Cosmic Collector', description: 'Collected every energy crystal in space.' },
  'badge-inspector': { title: 'Software Architect', description: 'Inspected complete project details and source code.' },
  'badge-contact': { title: 'Connection Established', description: 'Opened a contact channel or professional profile.' },
  'badge-speedster': { title: 'Elite Pilot', description: 'Crossed all six time-trial checkpoints.' },
  'badge-supersonic': { title: 'Speed of Light', description: 'Finished the time trial in under 28 seconds.' },
  'badge-boost-master': { title: 'Hyperdrive Online', description: 'Used the plasma boost at high speed.' },
  'badge-orbit-drifter': { title: 'Solar Drifter', description: 'Performed a gravity-assist maneuver near the Sun.' },
  'badge-easter-asteroid': { title: 'Cosmic Geologist', description: 'Explored the outer asteroid belt.' },
  'badge-secret-voyager': { title: 'Void Explorer', description: 'Ventured beyond the known solar system.' },
  'badge-event-horizon': { title: 'Beyond the Event Horizon', description: 'Tried to escape the observable universe and survived.' },
  'badge-scholar': { title: 'Brilliant Mind', description: 'Explored Education Island and its academic elements.' },
  'badge-technologist': { title: 'Full-Stack Engineer', description: 'Explored Technology Island and investigated the stack.' },
  'badge-perfectionist': { title: 'Legend of the Galaxy', description: 'Unlocked ten or more achievements.' },
};

export const getPortfolioContent = (locale: Locale) => {
  if (locale === 'pt') return {
    personalInfo: PERSONAL_INFO, islands: ISLANDS_CONFIG, projects: PROJECTS_DATA,
    experience: EXPERIENCE_DATA, education: EDUCATION_DATA, skills: SKILLS_DATA,
    badges: BADGES_DATA, leaderboard: INITIAL_LEADERBOARD, raceLeaderboard: INITIAL_RACE_LEADERBOARD,
  };

  const skills: SkillCategory[] = SKILLS_DATA.map((category) => ({
    ...category,
    title: category.title === 'Backend & Bancos de Dados' ? 'Backend & Databases' : category.title === 'IA, Mobile, Testes & Ferramentas' ? 'AI, Mobile, Testing & Tools' : category.title,
    skills: category.skills.map((skill) => ({ ...skill, name: skill.name.replace('Design (Canva, Affinity, Premiere)', 'Design (Canva, Affinity, Premiere)') })),
  }));

  return {
    personalInfo: { ...PERSONAL_INFO, subtitle: 'Specialist in modern TypeScript, React, Next.js, Python, Kotlin and applied AI solutions.', bio: 'Systems Analysis and Development student and developer focused on combining high-impact interfaces with intelligent AI workflows. My background spans modern React and Next.js front ends, backends and PostgreSQL/PostGIS, turning complex business needs into functional, scalable products.', location: 'Betim, MG, Brazil', availability: 'Available for internships and technology roles (weekdays until 6 PM)', resumeLabel: 'Download résumé' },
    islands: ISLANDS_CONFIG.map((island) => ({ ...island, ...englishIslands[island.id] })),
    projects: PROJECTS_DATA.map((project) => ({ ...project, ...projectTranslations[project.id] })),
    experience: EXPERIENCE_DATA.map((item) => ({ ...item, ...englishExperience[item.id] })),
    education: EDUCATION_DATA.map((item) => ({ ...item, ...englishEducation[item.id] })),
    skills,
    badges: BADGES_DATA.map((badge) => ({ ...badge, ...englishBadges[badge.id] })),
    leaderboard: INITIAL_LEADERBOARD.map((entry) => ({ ...entry, title: 'Developer & Creator', date: 'Official' })),
    raceLeaderboard: INITIAL_RACE_LEADERBOARD.map((entry) => ({ ...entry, date: 'Creator Record' })),
  };
};
