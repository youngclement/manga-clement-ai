'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { generateService } from '@/lib/api/generate';
import { toast } from 'sonner';
import { 
  Sparkles, 
  Loader2,
  Image as ImageIcon,
  ArrowRight,
  Wand2,
  Palette,
  Layout,
} from 'lucide-react';
import Link from 'next/link';

export default function GenerateCleanPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  
  // Config options
  const [style, setStyle] = useState<'anime' | 'realistic' | 'manga' | 'webcomic'>('manga');
  const [colorScheme, setColorScheme] = useState<'color' | 'blackwhite'>('color');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '4:3' | '1:1'>('4:3');
  
  const generateCleanPanels = async () => {
    setIsLoading(true);
    try {
      const response = await generateService.generateClean({
        prompt: prompt || undefined,
        config: {
          style,
          genre: 'general',
          colorScheme,
          resolution: 'high',
          aspectRatio,
        },
        totalPages,
      });
      
      if (response.success && response.data) {
        const images = response.data.pages.map((p: any) => 
          p.panels?.[0]?.imageUrl || p.imageUrl || p.url
        ).filter(Boolean);
        
        setGeneratedImages(images);
        toast.success(`Generated ${images.length} clean panel(s)!`);
      }
    } catch (error) {
      toast.error('Failed to generate panels');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const goToDialogueEditor = (imageUrl: string) => {
    // Store image in sessionStorage for dialogue editor
    sessionStorage.setItem('dialogueEditorImage', imageUrl);
    router.push('/studio/dialogue-editor');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ImageIcon className="w-8 h-8 text-amber-400" />
            Generate Clean Panels
          </h1>
          <p className="text-zinc-400 mt-2">
            Create manga panels without text/dialogue bubbles. Add dialogue freely in the editor.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left - Settings */}
          <div className="col-span-4 space-y-4">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-amber-400" />
                  Scene Description
                </CardTitle>
                <CardDescription>
                  Describe the scene (no dialogue needed)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="A warrior standing on a cliff overlooking the ocean at sunset, dramatic lighting, wind blowing through their hair..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 min-h-32"
                  rows={5}
                />
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-blue-400" />
                  Style Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm mb-2 block">Art Style</Label>
                  <Select value={style} onValueChange={(v: any) => setStyle(v)}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manga">Manga</SelectItem>
                      <SelectItem value="anime">Anime</SelectItem>
                      <SelectItem value="realistic">Realistic</SelectItem>
                      <SelectItem value="webcomic">Webcomic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm mb-2 block">Color Scheme</Label>
                  <Select value={colorScheme} onValueChange={(v: any) => setColorScheme(v)}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="color">Full Color</SelectItem>
                      <SelectItem value="blackwhite">Black & White</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm mb-2 block">Aspect Ratio</Label>
                  <Select value={aspectRatio} onValueChange={(v: any) => setAspectRatio(v)}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4:3">4:3 (Portrait)</SelectItem>
                      <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                      <SelectItem value="1:1">1:1 (Square)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="w-5 h-5 text-green-400" />
                  Generation Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm mb-2 block">
                    Number of Panels: {totalPages}
                  </Label>
                  <Slider
                    value={[totalPages]}
                    onValueChange={(v) => setTotalPages(v[0])}
                    min={1}
                    max={5}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={generateCleanPanels}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Clean Panels
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-amber-500/10 border-amber-500/20">
              <CardContent className="pt-4">
                <p className="text-sm text-amber-200">
                  💡 <strong>Tip:</strong> Clean panels have no text or dialogue bubbles. 
                  After generating, click on any panel to open the Dialogue Editor 
                  where you can add speech bubbles anywhere you want!
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right - Generated Images */}
          <div className="col-span-8">
            <Card className="bg-zinc-900 border-zinc-800 h-full">
              <CardHeader>
                <CardTitle>Generated Panels</CardTitle>
                <CardDescription>
                  Click on any panel to edit dialogue
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedImages.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {generatedImages.map((imageUrl, idx) => (
                      <div
                        key={idx}
                        className="relative group cursor-pointer rounded-lg overflow-hidden border border-zinc-700 hover:border-amber-500 transition-all"
                        onClick={() => goToDialogueEditor(imageUrl)}
                      >
                        <img
                          src={imageUrl}
                          alt={`Generated panel ${idx + 1}`}
                          className="w-full aspect-[3/4] object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button variant="secondary" className="gap-2">
                            Add Dialogue
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-xs">
                          Panel {idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-96 flex flex-col items-center justify-center text-zinc-500">
                    <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg mb-2">No panels generated yet</p>
                    <p className="text-sm text-center max-w-md">
                      Describe your scene and click &quot;Generate Clean Panels&quot; to create 
                      manga panels without dialogue bubbles.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/studio/dialogue-editor">
            <Button variant="outline" className="gap-2">
              <Wand2 className="w-4 h-4" />
              Open Dialogue Editor
            </Button>
          </Link>
          <Link href="/studio">
            <Button variant="outline" className="gap-2">
              <Layout className="w-4 h-4" />
              Back to Studio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
