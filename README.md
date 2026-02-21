# Manga Generator

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=for-the-badge&logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**AI-powered manga/comic creation platform with advanced editing tools and community features**

[Demo](#) · [Documentation](#) · [Report Bug](https://github.com/youngclement/manga-clement-ai/issues) · [Request Feature](https://github.com/youngclement/manga-clement-ai/issues)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)

## Overview

Manga Generator is a cutting-edge application that leverages AI to help artists and storytellers create stunning manga and comics. With an intuitive interface and powerful features, users can generate professional-quality manga pages, customize them with our interactive editor, and share their creations with a growing community.

## Features

| Feature | Description |
|---------|-------------|
| **AI-powered Generation** | Create high-quality manga pages from text prompts using Google Gemini API |
| **Canvas Editor** | Fine-tune your creations with an interactive editor |
| **Multiple Art Styles** | Choose from various manga and comic art styles |
| **Project Management** | Organize your work with a comprehensive project system |
| **Community Integration** | Share your creations and discover others' work |
| **Responsive Design** | Create on any device with an adaptive interface |
| **Secure Authentication** | Protect your work with a robust security system |

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **UI Library** | React 19 |
| **Styling** | Tailwind CSS 4 + Shadcn/UI |
| **State Management** | Zustand |
| **Form Handling** | React Hook Form + Zod |
| **Animations** | Framer Motion + GSAP |
| **Database** | MongoDB |
| **Type Safety** | TypeScript 5 |
| **AI Integration** | Google Gemini API |
| **Package Manager** | pnpm |

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **pnpm** >= 8.x

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/youngclement/manga-clement-ai.git
   cd manga-clement-ai
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration (see [Environment Variables](#environment-variables))

4. **Start the development server**

   ```bash
   pnpm dev
   ```

5. **Open your browser**

   Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
manga-generator/
├── app/                    # Next.js App Router
│   ├── api/                # API routes
│   │   ├── dialogues/      # Dialogue API
│   │   ├── generate/       # Image generation API
│   │   ├── grok/           # Grok AI integration
│   │   ├── images/         # Image handling API
│   │   └── projects/       # Project management API
│   ├── auth/               # Authentication pages
│   ├── community/          # Community features
│   ├── profile/            # User profile
│   ├── reader/             # Manga reader
│   └── studio/             # Main creation studio
│       ├── canvas-editor/  # Canvas editing tools
│       ├── dialogue-editor/# Dialogue editing
│       └── preview/        # Preview mode
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── ui/             # Shadcn/UI components
│   │   ├── studio/         # Studio-specific components
│   │   ├── canvas-editor/  # Canvas editor components
│   │   └── landing/        # Landing page components
│   ├── hooks/              # Custom React hooks
│   └── lib/                # Utilities and configurations
│       ├── api/            # API utilities
│       ├── db/             # Database utilities
│       ├── stores/         # Zustand stores
│       ├── types/          # TypeScript types
│       └── utils/          # Helper functions
└── styles/                 # Global styles
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |

## Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# AI API
GEMINI_API_KEY=your_gemini_api_key

# Backend
NEXT_PUBLIC_BACKEND_URL=your_backend_url

# Authentication (optional)
JWT_SECRET=your_jwt_secret
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ❤️ by [Young Clement](https://github.com/youngclement)

</div>