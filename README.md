# Manga Generator App

Frontend application cho Manga Generator - một ứng dụng tạo truyện tranh bằng AI.

## 🚀 Công nghệ sử dụng

- **Framework**: Next.js 14
- **UI Library**: React + Tailwind CSS + Shadcn/ui
- **State Management**: Zustand
- **Authentication**: NextAuth.js
- **Animations**: Framer Motion + GSAP
- **Type Safety**: TypeScript

## 📁 Cấu trúc thư mục

```
app/
├── api/              # API routes
├── auth/             # Authentication pages
├── community/        # Community features
├── profile/          # User profile
├── studio/           # Main manga creation interface
├── landing-v2/       # Landing page
├── globals.css       # Global styles
├── layout.tsx        # Root layout
└── page.tsx         # Home page

src/
├── components/       # Reusable UI components
│   ├── app/         # App-specific components
│   ├── auth/        # Authentication components
│   ├── landing/     # Landing page components
│   ├── studio/      # Studio components
│   └── ui/          # Base UI components (Shadcn)
├── hooks/           # Custom React hooks
└── lib/             # Utilities and configurations
    ├── api/         # API client
    ├── constants/   # Application constants
    ├── services/    # Service layers
    ├── stores/      # Zustand stores
    ├── types/       # TypeScript types
    ├── utils/       # Helper utilities
    └── validations/ # Form validations
```

## 🛠️ Cài đặt

1. Clone repository:
```bash
git clone <repo-url>
cd manga-generator
```

2. Cài đặt dependencies:
```bash
pnpm install
```

3. Setup environment variables:
```bash
cp .env.example .env.local
# Cập nhật các biến môi trường trong file .env.local
```

4. Start development server:
```bash
pnpm dev
```

Ứng dụng sẽ chạy tại http://localhost:3000

## 🔧 Scripts

- `pnpm dev` - Chạy development server
- `pnpm build` - Build production
- `pnpm start` - Chạy production server
- `pnpm lint` - Lint code

## 🎨 Features

### 🏠 Landing Page
- Hero section với animations
- Feature showcase
- Pricing plans
- CTA sections

### 🎭 Studio Interface
- Manga creation workspace
- Panel management
- AI-powered content generation
- Real-time preview
- Export functionality

### 👤 User Management
- Authentication (Login/Register)
- User profiles
- Project management
- Settings dashboard

### 🌐 Community
- User galleries
- Project sharing
- Social features

## 🔑 Environment Variables

Tham khảo file `.env.example` để xem các biến môi trường cần thiết:

- `NEXT_PUBLIC_API_BASE_URL` - Backend API URL
- `NEXT_PUBLIC_APP_URL` - Frontend app URL
- `NEXTAUTH_SECRET` - NextAuth secret
- `NEXT_PUBLIC_GEMINI_API_KEY` - Gemini API key
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` - Cloudinary config

## 📱 Responsive Design

Ứng dụng được thiết kế responsive cho:
- Desktop (1200px+)
- Tablet (768px - 1199px)  
- Mobile (< 768px)

## 🎨 UI Components

Sử dụng Shadcn/ui components với custom theming:
- Dark/Light mode support
- Consistent design system
- Accessible components
- Custom animations

## 🔄 State Management

Sử dụng Zustand cho state management:
- User state
- Studio state
- UI state
- API cache

## 🚀 Deployment

### Vercel (Recommended)
1. Connect repository to Vercel
2. Configure environment variables
3. Deploy automatically

### Manual Deployment
```bash
pnpm build
pnpm start
```

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

## 📄 License

This project is licensed under the MIT License.