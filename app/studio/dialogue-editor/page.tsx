'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { generateService, DialogueBubble, DialogueSuggestion } from '@/lib/api/generate';
import { toast } from 'sonner';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  Download, 
  Upload,
  MessageCircle,
  CloudLightning,
  MessageSquare,
  Quote,
  BookOpen,
  Move,
  Loader2,
  Wand2,
} from 'lucide-react';

interface DialogueBubbleWithDrag extends DialogueBubble {
  isDragging?: boolean;
}

export default function DialogueEditorPage() {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [dialogues, setDialogues] = useState<DialogueBubbleWithDrag[]>([]);
  const [selectedDialogueId, setSelectedDialogueId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<DialogueSuggestion[]>([]);
  const [resultImageUrl, setResultImageUrl] = useState<string>('');
  const [storyContext, setStoryContext] = useState('');
  const [language, setLanguage] = useState('English');
  const [fontStyle, setFontStyle] = useState<'manga' | 'comic' | 'handwritten' | 'clean'>('manga');
  
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; bubbleX: number; bubbleY: number } | null>(null);

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Add new dialogue bubble
  const addDialogueBubble = (x: number = 50, y: number = 50, suggestion?: DialogueSuggestion) => {
    const newBubble: DialogueBubbleWithDrag = {
      id: generateId(),
      x,
      y,
      text: suggestion?.text || '',
      style: suggestion?.style || 'speech',
      tailDirection: 'left',
      characterName: suggestion?.characterName || '',
    };
    setDialogues(prev => [...prev, newBubble]);
    setSelectedDialogueId(newBubble.id!);
  };

  // Update dialogue bubble
  const updateDialogue = (id: string, updates: Partial<DialogueBubble>) => {
    setDialogues(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  // Delete dialogue bubble
  const deleteDialogue = (id: string) => {
    setDialogues(prev => prev.filter(d => d.id !== id));
    if (selectedDialogueId === id) {
      setSelectedDialogueId(null);
    }
  };

  // Handle image click to add bubble
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    addDialogueBubble(x, y);
  };

  // Handle bubble drag start
  const handleDragStart = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const bubble = dialogues.find(d => d.id === id);
    if (!bubble || !imageContainerRef.current) return;
    
    const rect = imageContainerRef.current.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      bubbleX: bubble.x,
      bubbleY: bubble.y,
    };
    
    setDialogues(prev => prev.map(d => d.id === id ? { ...d, isDragging: true } : d));
    setSelectedDialogueId(id);
  };

  // Handle bubble drag
  const handleDrag = useCallback((e: MouseEvent) => {
    if (!dragRef.current || !imageContainerRef.current) return;
    
    const rect = imageContainerRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragRef.current.startX) / rect.width) * 100;
    const deltaY = ((e.clientY - dragRef.current.startY) / rect.height) * 100;
    
    const newX = Math.max(0, Math.min(100, dragRef.current.bubbleX + deltaX));
    const newY = Math.max(0, Math.min(100, dragRef.current.bubbleY + deltaY));
    
    setDialogues(prev => prev.map(d => 
      d.isDragging ? { ...d, x: newX, y: newY } : d
    ));
  }, []);

  // Handle bubble drag end
  const handleDragEnd = useCallback(() => {
    dragRef.current = null;
    setDialogues(prev => prev.map(d => ({ ...d, isDragging: false })));
  }, []);

  // Set up drag listeners
  useEffect(() => {
    const hasDragging = dialogues.some(d => d.isDragging);
    if (hasDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [dialogues, handleDrag, handleDragEnd]);

  // Get AI suggestions
  const getSuggestions = async () => {
    if (!imageUrl) {
      toast.error('Please upload an image first');
      return;
    }
    
    setIsSuggesting(true);
    try {
      const response = await generateService.suggestDialogue({
        imageUrl,
        context: storyContext,
        previousDialogues: dialogues.map(d => d.text).filter(Boolean),
        numberOfSuggestions: 5,
      });
      
      if (response.success && response.data) {
        setSuggestions(response.data.suggestions);
        toast.success(`Generated ${response.data.suggestions.length} dialogue suggestions`);
      }
    } catch (error) {
      toast.error('Failed to get dialogue suggestions');
      console.error(error);
    } finally {
      setIsSuggesting(false);
    }
  };

  // Apply dialogue to image
  const applyDialogue = async () => {
    if (!imageUrl || dialogues.length === 0) {
      toast.error('Please add at least one dialogue bubble');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await generateService.addDialogue({
        imageUrl,
        dialogues: dialogues.map(d => ({
          id: d.id,
          x: d.x,
          y: d.y,
          text: d.text,
          style: d.style,
          tailDirection: d.tailDirection,
          characterName: d.characterName,
        })),
        language,
        fontStyle,
      });
      
      if (response.success && response.data) {
        setResultImageUrl(response.data.imageUrl);
        toast.success('Dialogue applied successfully!');
      }
    } catch (error) {
      toast.error('Failed to apply dialogue');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageUrl(event.target?.result as string);
        setResultImageUrl('');
        setSuggestions([]);
      };
      reader.readAsDataURL(file);
    }
  };

  // Get bubble style icon
  const getBubbleIcon = (style: string) => {
    switch (style) {
      case 'speech': return <MessageCircle className="w-4 h-4" />;
      case 'thought': return <CloudLightning className="w-4 h-4" />;
      case 'shout': return <MessageSquare className="w-4 h-4" />;
      case 'whisper': return <Quote className="w-4 h-4" />;
      case 'narrator': return <BookOpen className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const selectedDialogue = dialogues.find(d => d.id === selectedDialogueId);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Dialogue Editor</h1>
            <p className="text-zinc-400 mt-1">
              Add and position dialogue bubbles on your manga panels
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={getSuggestions}
              disabled={!imageUrl || isSuggesting}
            >
              {isSuggesting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4 mr-2" />
              )}
              AI Suggest
            </Button>
            <Button
              onClick={applyDialogue}
              disabled={!imageUrl || dialogues.length === 0 || isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Apply Dialogue
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel - Image and Bubble Placement */}
          <div className="col-span-8">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Panel Preview</span>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Image
                      </span>
                    </Button>
                  </label>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {imageUrl ? (
                  <div
                    ref={imageContainerRef}
                    className="relative w-full aspect-[3/4] bg-zinc-800 rounded-lg overflow-hidden cursor-crosshair"
                    onClick={handleImageClick}
                  >
                    <img
                      src={resultImageUrl || imageUrl}
                      alt="Manga panel"
                      className="w-full h-full object-contain"
                    />
                    
                    {/* Dialogue bubble markers */}
                    {!resultImageUrl && dialogues.map((bubble) => (
                      <div
                        key={bubble.id}
                        className={`absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center cursor-move transition-all ${
                          selectedDialogueId === bubble.id
                            ? 'bg-amber-500 ring-2 ring-white'
                            : 'bg-blue-500 hover:bg-blue-400'
                        }`}
                        style={{
                          left: `${bubble.x}%`,
                          top: `${bubble.y}%`,
                        }}
                        onMouseDown={(e) => handleDragStart(e, bubble.id!)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDialogueId(bubble.id!);
                        }}
                      >
                        {getBubbleIcon(bubble.style || 'speech')}
                      </div>
                    ))}
                    
                    {/* Click hint */}
                    {dialogues.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/50 px-4 py-2 rounded-lg">
                          <p className="text-sm text-zinc-300">Click anywhere to add a dialogue bubble</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full aspect-[3/4] bg-zinc-800 rounded-lg flex flex-col items-center justify-center">
                    <Upload className="w-12 h-12 text-zinc-600 mb-4" />
                    <p className="text-zinc-400 text-center mb-2">
                      Upload a manga panel to start editing
                    </p>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <Button variant="secondary">
                        Choose File
                      </Button>
                    </label>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Dialogue Controls */}
          <div className="col-span-4 space-y-4">
            {/* Story Context */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-sm">Story Context (for AI)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Describe the scene context for better AI suggestions..."
                  value={storyContext}
                  onChange={(e) => setStoryContext(e.target.value)}
                  className="bg-zinc-800 border-zinc-700"
                  rows={3}
                />
              </CardContent>
            </Card>

            {/* AI Suggestions */}
            {suggestions.length > 0 && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <Wand2 className="w-4 h-4 mr-2 text-amber-400" />
                    AI Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {suggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-700 transition-colors"
                      onClick={() => addDialogueBubble(suggestion.suggestedX, suggestion.suggestedY, suggestion)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {getBubbleIcon(suggestion.style)}
                        <span className="text-xs text-zinc-400">{suggestion.characterName || 'Unknown'}</span>
                      </div>
                      <p className="text-sm">&quot;{suggestion.text}&quot;</p>
                      <p className="text-xs text-zinc-500 mt-1">{suggestion.reasoning}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Dialogue List */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Dialogues ({dialogues.length})</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addDialogueBubble()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-48 overflow-y-auto">
                {dialogues.map((bubble, idx) => (
                  <div
                    key={bubble.id}
                    className={`p-2 rounded-lg cursor-pointer flex items-center justify-between ${
                      selectedDialogueId === bubble.id
                        ? 'bg-amber-500/20 border border-amber-500/50'
                        : 'bg-zinc-800 hover:bg-zinc-700'
                    }`}
                    onClick={() => setSelectedDialogueId(bubble.id!)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getBubbleIcon(bubble.style || 'speech')}
                      <span className="text-sm truncate">
                        {bubble.text || `Bubble ${idx + 1}`}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDialogue(bubble.id!);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                ))}
                {dialogues.length === 0 && (
                  <p className="text-sm text-zinc-500 text-center py-4">
                    No dialogues yet. Click on the image to add.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Selected Dialogue Editor */}
            {selectedDialogue && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-sm">Edit Dialogue</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs">Character Name</Label>
                    <Input
                      placeholder="Character name"
                      value={selectedDialogue.characterName || ''}
                      onChange={(e) => updateDialogue(selectedDialogue.id!, { characterName: e.target.value })}
                      className="bg-zinc-800 border-zinc-700 mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Dialogue Text</Label>
                    <Textarea
                      placeholder="Enter dialogue..."
                      value={selectedDialogue.text}
                      onChange={(e) => updateDialogue(selectedDialogue.id!, { text: e.target.value })}
                      className="bg-zinc-800 border-zinc-700 mt-1"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Style</Label>
                      <Select
                        value={selectedDialogue.style || 'speech'}
                        onValueChange={(v) => updateDialogue(selectedDialogue.id!, { style: v as any })}
                      >
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="speech">Speech</SelectItem>
                          <SelectItem value="thought">Thought</SelectItem>
                          <SelectItem value="shout">Shout</SelectItem>
                          <SelectItem value="whisper">Whisper</SelectItem>
                          <SelectItem value="narrator">Narrator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-xs">Tail Direction</Label>
                      <Select
                        value={selectedDialogue.tailDirection || 'left'}
                        onValueChange={(v) => updateDialogue(selectedDialogue.id!, { tailDirection: v as any })}
                      >
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                          <SelectItem value="top">Top</SelectItem>
                          <SelectItem value="bottom">Bottom</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">X Position (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={Math.round(selectedDialogue.x)}
                        onChange={(e) => updateDialogue(selectedDialogue.id!, { x: Number(e.target.value) })}
                        className="bg-zinc-800 border-zinc-700 mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Y Position (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={Math.round(selectedDialogue.y)}
                        onChange={(e) => updateDialogue(selectedDialogue.id!, { y: Number(e.target.value) })}
                        className="bg-zinc-800 border-zinc-700 mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Output Settings */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-sm">Output Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Japanese">Japanese</SelectItem>
                      <SelectItem value="Vietnamese">Vietnamese</SelectItem>
                      <SelectItem value="Korean">Korean</SelectItem>
                      <SelectItem value="Chinese">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-xs">Font Style</Label>
                  <Select value={fontStyle} onValueChange={(v: any) => setFontStyle(v)}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manga">Manga</SelectItem>
                      <SelectItem value="comic">Comic</SelectItem>
                      <SelectItem value="handwritten">Handwritten</SelectItem>
                      <SelectItem value="clean">Clean</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Download Result */}
            {resultImageUrl && (
              <Button className="w-full" asChild>
                <a href={resultImageUrl} download="manga-with-dialogue.png">
                  <Download className="w-4 h-4 mr-2" />
                  Download Result
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
