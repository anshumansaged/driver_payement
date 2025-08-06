<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Fleet Owner Trip Report Dashboard - Copilot Instructions

## Project Overview
This is a React + Vite frontend application for managing fleet driver trips and payments. The system tracks daily trip earnings, driver salaries, and cash flow without requiring a backend.

## Key Features
- Trip entry with platform-wise earnings (Uber, InDrive, Yatri, Rapido, Offline)
- Automatic salary calculations (65% driver, 35% owner)
- Driver salary tracking and payment status
- Cash flow management with cashier integration
- WhatsApp-shareable trip summaries
- Responsive design for mobile and desktop

## Technology Stack
- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS with custom components
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Data Storage**: SheetDB API with localStorage fallback
- **State Management**: React useState/useEffect hooks

## Code Style Guidelines
- Use functional components with hooks
- Follow Tailwind CSS utility-first approach
- Implement responsive design with mobile-first approach
- Use semantic HTML and accessibility best practices
- Keep components small and focused on single responsibility
- Use TypeScript-style JSDoc comments for complex functions

## Component Structure
- `/components`: Reusable UI components
- `/pages`: Route-level page components  
- `/services`: API and data service layers
- `/utils`: Helper functions and calculations
- `/data`: Static data and constants

## Key Calculations
- Total Earnings = Platform Earnings - Commissions - Other Expenses
- Driver Salary = 65% of Total Earnings
- Owner Share = 35% of Total Earnings
- Cash in Hand = (Cash Collected + Online Payments) - Fuel - (Driver Salary if taken)

## Data Integration
- Primary: SheetDB API for persistent storage
- Fallback: localStorage for offline functionality
- Data structure optimized for WhatsApp sharing format

When working on this project:
1. Prioritize mobile responsiveness
2. Ensure calculations are accurate and clearly displayed
3. Maintain the professional admin dashboard aesthetic
4. Keep the WhatsApp sharing format consistent
5. Handle errors gracefully with user-friendly messages
