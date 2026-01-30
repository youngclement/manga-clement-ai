'use client';

import { useState } from 'react';
import { useGenerationStore } from '@/lib/stores/generation.store';
import { useUIStore } from '@/lib/stores/ui.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingCard, LoadingSpinner } from '@/components/ui/loading';
import { Progress } from '@/components/ui/progress';
import { Wand2, X, Download, RefreshCw } from 'lucide-react';

export function GenerationPanel() {
  const {
    isGenerating,
    isBatchGenerating,
    generationProgress,
    currentGeneration,
    error,
    generateSingle,
    cancelGeneration,
    clearError
  } = useGenerationStore();

  const { showSuccessNotification, showErrorNotification } = useUIStore();

  const [prompt, setPrompt] = useState('');
  const [config, setConfig] = useState<{
    style: 'manga' | 'anime' | 'realistic' | 'cartoon' | 'webcomic';
    genre: 'action' | 'romance' | 'fantasy' | 'horror' | 'slice-of-life';
    colorScheme: 'color' | 'blackwhite' | 'sepia';
    resolution: 'low' | 'medium' | 'high';
    aspectRatio: '16:9' | '4:3' | '1:1' | 'custom';
  }>({
    style: 'manga',
    genre: 'action',
    colorScheme: 'blackwhite',
    resolution: 'high',
    aspectRatio: '16:9'
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showErrorNotification('Error', 'Please enter a prompt');
      return;
    }

    try {
      clearError();
      await generateSingle({ prompt, config });
      showSuccessNotification('Success', 'Panel generated successfully!');
      setPrompt(''); // Clear prompt on success
    } catch (error) {
      showErrorNotification('Generation Failed', (error as Error).message);
    }
  };

  const handleCancel = () => {
    if (currentGeneration) {
      cancelGeneration(currentGeneration.id);
    }
  };

  const isLoading = isGenerating || isBatchGenerating;

  return (
    <div className="space-y-6">
      {/* Generation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wand2 className="h-5 w-5 mr-2" />
            Generate Manga Panel
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Prompt Input */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Describe your panel
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A young warrior stands on a cliff overlooking a vast battlefield..."
              className="min-h-25"
              disabled={isLoading}
            />
          </div>

          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Style</label>
              <Select 
                value={config.style} 
                onValueChange={(value) => setConfig(prev => ({ ...prev, style: value as typeof prev.style }))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manga">Manga</SelectItem>
                  <SelectItem value="anime">Anime</SelectItem>
                  <SelectItem value="realistic">Realistic</SelectItem>
                  <SelectItem value="cartoon">Cartoon</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Genre</label>
              <Select 
                value={config.genre} 
                onValueChange={(value) => setConfig(prev => ({ ...prev, genre: value as typeof prev.genre }))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="action">Action</SelectItem>
                  <SelectItem value="romance">Romance</SelectItem>
                  <SelectItem value="fantasy">Fantasy</SelectItem>
                  <SelectItem value="horror">Horror</SelectItem>
                  <SelectItem value="slice-of-life">Slice of Life</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Color</label>
              <Select 
                value={config.colorScheme} 
                onValueChange={(value) => setConfig(prev => ({ ...prev, colorScheme: value as typeof prev.colorScheme }))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="color">Color</SelectItem>
                  <SelectItem value="blackwhite">Black & White</SelectItem>
                  <SelectItem value="sepia">Sepia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <Button 
              onClick={handleGenerate}
              disabled={!prompt.trim() || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Panel
                </>
              )}
            </Button>

            {isLoading && (
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress Tracking */}
      {isLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {generationProgress.status === 'starting' && 'Preparing generation...'}
                  {generationProgress.status === 'processing' && 'Generating panel...'}
                  {generationProgress.status === 'completed' && 'Generation complete!'}
                  {generationProgress.status === 'failed' && 'Generation failed'}
                </span>
                <span className="text-sm text-muted-foreground">
                  {generationProgress.percentage}%
                </span>
              </div>
              
              <Progress value={generationProgress.percentage} />
              
              {generationProgress.estimatedTimeRemaining && (
                <p className="text-xs text-muted-foreground">
                  Estimated time remaining: {Math.round(generationProgress.estimatedTimeRemaining / 1000)}s
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-red-600">Generation Error</h4>
                <p className="text-sm text-red-500">{error}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={clearError}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result Display */}
      {currentGeneration && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Panel</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <img 
                src={currentGeneration.imageUrl} 
                alt="Generated panel"
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              
              <Button variant="outline" className="flex-1">
                Add to Project
              </Button>
              
              <Button variant="outline">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}