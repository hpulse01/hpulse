# Codebase Analysis Report

## Application Overview
The application is a comprehensive Chinese metaphysics platform built with **React**, **Vite**, **TypeScript**, and **Tailwind CSS**, utilizing **Supabase** for backend services. It features:

1.  **Iron Plate Divine Number (铁板神数)**:
    -   **Core Engine (`src/utils/tiebanAlgorithm.ts`)**: Implements the "Tai Xuan" number system to calculate base destiny numbers from birth data.
    -   **Six Relations Verification (`src/components/SixRelationsVerification.tsx`)**: A critical step that calibrates predictions by matching user-provided family details against database clauses using fuzzy logic and scoring algorithms.
    -   **Destiny Projection**: Generates detailed life reports including marriage, career, wealth, and health based on the calibrated base number.

2.  **BaZi Deep Analysis (八字深度分析)**:
    -   **Engine (`src/utils/baziDeepAnalysis.ts`)**: Provides in-depth analysis of the Four Pillars, including Ten Gods, Hidden Stems, Na Yin, and Element Balance.
    -   **Features**: Detailed strength analysis of the Day Master, favorable/unfavorable elements, and pattern identification.

3.  **Zi Wei Dou Shu (紫微斗数)**:
    -   **Engine (`src/utils/ziweiAlgorithm.ts`)**: Generates astrology charts, calculating star positions, palaces, and major/minor stars based on lunar dates.

4.  **Liu Yao Hexagram (六爻)**:
    -   **Engine (`src/utils/liuYaoAlgorithm.ts`)**: Implements time-based hexagram divination.

## Architecture & Key Components
-   **Frontend**: Modular structure with `src/pages` (Index, Admin), `src/components` (Verification, Dashboard), and `src/utils` (Algorithms).
-   **Backend**: Supabase handles clause data storage, search (including fuzzy search for verification), and user management.
-   **Admin Tools**:
    -   `AdminImport.tsx`: Interface for bulk importing clauses.
    -   **User Management**: `AdminUsers.tsx` provides role-based access control (Admin/Super Admin) and user status management.

## Observations
-   The codebase is well-structured, with clear separation between UI, logic (`utils`), and data access (`services`).
-   The algorithms (`TiebanEngine`) appear to be implemented with high fidelity to traditional texts, referencing specific pages and methods.
-   The application is production-ready with robust error handling and admin capabilities.

## Data Flow
1.  **Input**: User enters birth data in `Index.tsx`.
2.  **Calculation**: `TiebanEngine` computes the base number using Tai Xuan logic.
3.  **Verification**: `SixRelationsVerification` presents potential clauses based on "Kao Ke" logic. User selects the best match.
4.  **Calibration**: System calculates "System Offset" (difference between theoretical and actual clause ID).
5.  **Projection**: Using the offset, the system generates detailed reports for various life aspects (Marriage, Career, etc.).
