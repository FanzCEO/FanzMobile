# Project Summary
The FANZ AI Media Cloud project is a cutting-edge media ingestion and distribution platform tailored for creator communities like BoyFanz, GirlFanz, and PupFanz. It automates content creation, enhances media management, generates promotional materials, ensures legal compliance, and streamlines social media distribution. The platform is equipped with a comprehensive database, advanced media processing capabilities, and a professional admin panel, rendering it production-ready with the latest technologies.

# Project Module Description
The project consists of the following functional modules:
- **Creator Dashboard**: Central hub for creators to manage content and track performance.
- **Mobile Dashboard**: Optimized interface for mobile access to stats and uploads.
- **Media Upload Interface**: Facilitates media file uploads with metadata.
- **Smart Upload Workflow**: Automates media capturing and uploading processes.
- **Compliance Management**: Ensures adherence to legal standards.
- **AI Processing Pipeline**: Handles media enhancement and compliance tasks.
- **Content Scheduler**: Schedules posts with AI-generated recommendations.
- **Admin Review Panel**: Supports content moderation and compliance checks.
- **Social Media Scheduler**: Manages cross-platform content posting.
- **CRM and Marketing Automation**: Organizes contacts and automates outreach.
- **Analytics Reporting**: Provides insights into performance and audience data.
- **Cloud Storage Management**: Oversees secure media storage solutions.

# Directory Tree
```
shadcn-ui/
├── README.md                # Project documentation
├── components.json          # UI component structure
├── eslint.config.js         # ESLint configuration
├── index.html               # Main HTML file
├── package.json             # Project dependencies and scripts
├── postcss.config.js        # PostCSS configuration
├── public/                  # Public assets
│   ├── favicon.svg          # Application favicon
│   └── robots.txt           # SEO robots.txt file
├── src/                     # Source code directory
│   ├── App.css              # Global styles
│   ├── App.tsx              # Main application component
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utility functions and mock data
│   ├── pages/               # Page components
│   ├── components/          # Reusable UI components
│   └── main.tsx             # Application entry point
├── tailwind.config.ts       # Tailwind CSS configuration
├── template_config.json     # UI template configuration
├── todo.md                  # Project task list
├── tsconfig.app.json        # TypeScript configuration for app
├── tsconfig.json            # Base TypeScript configuration
├── tsconfig.node.json       # TypeScript configuration for Node
└── vite.config.ts           # Vite configuration for building
```

# File Description Inventory
- **README.md**: Overview and setup instructions for the project.
- **package.json**: Lists project dependencies and scripts for running and building.
- **src/pages/**: Contains main application pages like Dashboard, Upload, Compliance, etc.
- **src/components/**: Reusable UI components such as MediaCard and Navigation.
- **src/lib/**: Utility functions and mock data for the project.
- **src/hooks/**: Custom hooks for managing component state and side effects.
- **src/lib/platformConnections.ts**: Manages platform profiles and connections.
- **src/lib/database.ts**: Handles database schema and connection management.
- **src/lib/api.ts**: API routes and handlers for various functionalities.
- **src/lib/webhooks.ts**: Manages webhook integrations for real-time updates.
- **src/lib/deployment.ts**: Configuration and environment setup for deployment.

# Technology Stack
- **Frontend**: React 18.3+, TypeScript 5.2+, Tailwind CSS 3.4+, Vite 5.4+
- **Backend**: Node.js (NestJS), Express
- **Database**: Supabase (PostgreSQL 15)
- **AI Processing**: OpenAI API for enhancements
- **Media Processing**: FFmpeg for transcoding and manipulation

# Usage
To install dependencies and run the project:
1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Lint the project:
   ```bash
   pnpm run lint
   ```
3. Build the project:
   ```bash
   pnpm run build
   ```
4. Deploy the project:
   ```bash
   pnpm run deploy
   ```
