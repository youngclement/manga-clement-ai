# Manga Generator

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js 14" />
  <img src="https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/Tailwind-3-38bdf8?style=for-the-badge&logo=tailwindcss" alt="Tailwind 3" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="MIT License" />
</div>

<p align="center">
  <b>AI-powered manga/comic creation platform with advanced editing tools and community features</b>
</p>

## 📋 Overview

Manga Generator is a cutting-edge application that leverages AI to help artists and storytellers create stunning manga and comics. With an intuitive interface and powerful features, users can generate professional-quality manga pages, customize them with our interactive editor, and share their creations with a growing community.

## ✨ Features

- **🤖 AI-powered Generation** - Create high-quality manga pages from text prompts
- **🖌️ Advanced Canvas Editor** - Fine-tune your creations with our interactive editor
- **🎨 Multiple Art Styles** - Choose from various manga and comic art styles
- **📚 Project Management** - Organize your work with our comprehensive project system
- **🌐 Community Integration** - Share your creations and discover others' work
- **📱 Responsive Design** - Create on any device with our adaptive interface
- **🔒 Secure Authentication** - Protect your work with our robust security system

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm 8+

### Installation

```bash
# Clone the repository
git clone https://github.com/youngclement/manga-clement-ai.git

# Navigate to the project directory
cd manga-clement-ai

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

Visit `http://localhost:3000` to see the application running.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18 with Tailwind CSS and Shadcn/UI
- **State Management**: Zustand for global state
- **Authentication**: Custom auth with JWT
- **Animations**: Framer Motion + GSAP
- **Database**: MongoDB
- **Type Safety**: TypeScript
- **API Integration**: Google Gemini API

## 🔧 Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_BACKEND_URL=your_backend_url
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

<p align="center">
  Made with ❤️ by Young Clement
</p>