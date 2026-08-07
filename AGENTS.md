# AGENTS.md

## Project Overview
This repository is a React + TypeScript frontend for a business/ERP-style application. The UI is organized around authentication, dashboard views, master data management, inventory, purchase/sales workflows, ledger/accounting, reports, and warehouse-related modules.

The app appears to be a multi-module internal portal rather than a simple CRUD demo. Most feature pages are grouped under src/Pages and reusable UI building blocks live under src/components.

## Tech Stack
- React 19
- TypeScript
- Vite
- Material UI (MUI)
- React Router
- Redux Toolkit + React Redux
- Formik + Yup
- Axios
- react-hot-toast
- react-pdf

## Key Project Files
- package.json: scripts and dependency list
- src/main.tsx: application bootstrap; wraps app with BrowserRouter, Redux Provider, and UserProvider
- src/App.tsx: central routing configuration for most pages
- src/Context/UserContext.tsx: shared user/auth context
- src/Common/PrivateRoute.tsx: authenticated route wrapper
- src/Common/ProtectedRoute.tsx: permission-based route wrapper
- src/Redux/: Redux store and related state modules
- src/RTK/: RTK-related modules or slices
- src/Services/: API/service layer helpers
- src/Pages/: page-level feature modules
- src/components/: reusable UI components and feature-specific components

## Main App Structure
- Public/auth flows: Sign in, sign up, reset password, company registration
- Private/dashboard flows: dashboard, company profile, inventory, purchasing, sales, reports, etc.
- Feature pages are often implemented as folders under src/Pages with index.tsx or page-specific files
- Shared UI patterns are reused from src/Common and src/components

## Development Commands
Run these from the repository root:
- npm install
- npm run dev
- npm run build
- npm run lint
- npm run preview

## Architectural Notes
- Routing is centralized in src/App.tsx. If you add or rename a page, update the route definitions here.
- Authentication and access control are handled through PrivateRoute and ProtectedRoute.
- The app uses React Router and likely expects a browser-based SPA experience.
- MUI is the default UI library, so new UI should align with existing Material UI usage.
- Existing feature folders under src/Pages usually follow a component/page pattern; inspect nearby pages before introducing new patterns.

## Important Conventions
- Prefer working with existing page/component structure instead of introducing a brand-new architecture for small changes.
- Keep UI changes consistent with the MUI-based styling already used in the project.
- Respect route-based access boundaries and permission guards when modifying or adding screens.
- If a new feature needs API access, look in src/Services and the Redux/RTK folders first.
- The build script uses TypeScript with noEmitOnError disabled, so TypeScript errors may not block the build completely.

## Suggested Starting Points for Familiarization
1. Read src/main.tsx to understand bootstrapping
2. Read src/App.tsx to understand the route map
3. Review src/Context/UserContext.tsx and the route guard components
4. Inspect one existing page under src/Pages and one shared component under src/components
5. Check package.json for scripts and dependencies before making changes

## Notes for AI Agents
When making changes:
- Prefer minimal, targeted edits
- Preserve the existing component/page organization
- Avoid introducing unrelated dependencies
- Be mindful of route names, permissions, and shared state dependencies
- If a task affects multiple modules (e.g., adding a new page and navigation entry), update the route definitions and any relevant menu/sidebar components
