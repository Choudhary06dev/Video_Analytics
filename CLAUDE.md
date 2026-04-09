# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` or `npm start` - Runs Vite dev server with HMR
- **Production build**: `npm run build` - Creates optimized production build
- **Preview build**: `npm run preview` - Locally preview production build
- **Linting**: `npm run lint` - Runs ESLint on all files
- **Run single test**: Not configured - This project doesn't have a testing framework set up

## Project Structure

```
src/
├── main.jsx              # Entry point
├── App.jsx               # Router configuration
├── layouts/              # Layout components
│   └── AppLayout.jsx     # Main layout wrapper
├── pages/                # Page components
│   ├── Dashboard.jsx     # Home/dashboard page
│   ├── NeuralStream.jsx  # Neural streaming interface
│   ├── AIScenarios.jsx   # AI scenarios management
│   ├── StaffRoster.jsx   # Staff roster page
│   ├── ActivityVault.jsx # Activity log/vault
│   ├── SystemHealth.jsx  # System health monitoring
│   ├── AITraining.jsx    # AI training interface
│   ├── Alerts.jsx        # Alerts management
│   └── Settings.jsx      # Application settings
├── components/           # Reusable components
│   ├── dashboard/        # Dashboard-specific components
│   │   ├── KPICards.jsx
│   │   ├── AnalyticsChart.jsx
│   │   ├── ConfidencePanel.jsx
│   │   ├── EnhancedStatsRow.jsx
│   │   ├── RecentAlerts.jsx
│   │   ├── FacilityHeatmap.jsx
│   │   ├── PerformanceMetrics.jsx
│   │   ├── CameraGrid.jsx
│   │   ├── AIScenarioGrid.jsx
│   │   ├── ActivityVault.jsx
│   │   └── NeuralStream.jsx
│   └── layout/           # Layout components
│       ├── Header.jsx
│       ├── Sidebar.jsx
│       └── Footer.jsx
├── assets/               # Static assets
│   ├── frontend.css
│   ├── hero.png
│   ├── react.svg
│   └── vite.svg
└── index.css             # Global CSS
```

## Architecture Overview

This is a single-page React application built with Vite. Key architectural decisions:

1. **Routing**: Uses react-router-dom v7 with AppLayout wrapper for consistent UI across pages
2. **Styling**: Tailwind CSS v4 via @tailwindcss/vite plugin for utility-first styling
3. **State Management**: Appears to use React's built-in state management (useState/useEffect) - no external state library observed
4. **Data Visualization**: Uses recharts library for charts and graphs
5. **Icons**: lucide-react for consistent icon set
6. **AI Integration**: OpenAI API integrated for AI features (visible in AITraining and NeuralStream pages)
7. **Build Tool**: Vite for fast development builds and optimized production builds

## Common Development Patterns

- Pages are organized in `src/pages/` and imported in App.jsx routes
- Reusable components live in `src/components/` with feature-specific subfolders
- Layout components (Header, Sidebar, Footer) are in `src/components/layout/`
- Dashboard-specific components are in `src/components/dashboard/`
- CSS imports are handled through Vite's CSS handling (index.css and asset imports)
- Follows standard React functional component patterns with hooks

## Important Files

- `vite.config.js` - Vite configuration including Tailwind and React plugins
- `eslint.config.js` - ESLint configuration with React-specific rules
- `package.json` - Dependencies and scripts (dev, build, lint, preview)
- `src/App.jsx` - Main routing configuration
- `src/main.jsx` - Application entry point

## Dependencies of Note

- **react@^19.2.4** - Latest React 18
- **react-router-dom@^7.14.0** - Latest React Router v7
- **tailwindcss@^4.2.2** & **@tailwindcss/vite@^4.2.2** - Tailwind CSS v4 with Vite integration
- **recharts@^3.8.1** - Charting library for data visualization
- **lucide-react@^1.7.0** - Icon library
- **openai@^6.33.0** - OpenAI API client
- **eslint@^9.39.4** with react plugins - Modern ESLint setup