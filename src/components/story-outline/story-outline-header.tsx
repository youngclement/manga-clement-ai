'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  ArrowRight,
  BookOpen,
  Save,
  Eye,
  LogOut,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authStore } from '@/lib/services/auth-client';
import { StoryOutline } from './types';

interface StoryOutlineHeaderProps {
  outline: StoryOutline;
  onNew: () => void;
  onSave: () => void;
  onPreview: () => void;
  onExport: () => void;
}

export default function StoryOutlineHeader({
  outline,
  onNew,
  onSave,
  onPreview,
  onExport,
}: StoryOutlineHeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    authStore.clear();
    router.push('/auth/login');
  };

  return (
    <header className="h-14 bg-zinc-900/50 border-b border-zinc-800 flex items-center justify-between px-4 sticky top-0 z-50 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <Link href="/studio" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft size={18} />
          <span className="text-sm hidden sm:inline">Back to Studio</span>
        </Link>
        <div className="h-5 w-px bg-zinc-700 hidden sm:block" />
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-500" />
          <h1 className="text-lg font-bold text-white">Story Outline AI</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onNew}
          className="text-zinc-400 hover:text-white gap-2"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onSave}
          className="text-zinc-400 hover:text-white gap-2"
        >
          <Save size={16} />
          <span className="hidden sm:inline">Save</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onPreview}
          className="text-zinc-400 hover:text-white gap-2"
        >
          <Eye size={16} />
          <span className="hidden sm:inline">Preview</span>
        </Button>
        <Button
          size="sm"
          onClick={onExport}
          disabled={outline.panels.length === 0}
          className="bg-amber-500 hover:bg-amber-600 text-black gap-2"
        >
          <ArrowRight size={16} />
          <span className="hidden sm:inline">Export to Studio</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="text-zinc-400 hover:text-red-400"
        >
          <LogOut size={18} />
        </Button>
      </div>
    </header>
  );
}
