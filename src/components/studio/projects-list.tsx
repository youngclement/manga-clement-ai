'use client';

import { useEffect } from 'react';
import { useProjectsStore } from '@/lib/stores/projects.store';
import { useGenerationStore } from '@/lib/stores/generation.store';
import { useUIStore } from '@/lib/stores/ui.store';
import { LoadingCard, LoadingGrid } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Download, Share2, Settings, Trash2 } from 'lucide-react';
import { useModal } from '@/components/ui/modal';

export function ProjectsList() {
  const { 
    projects, 
    isLoading, 
    error, 
    pagination,
    filters,
    fetchProjects,
    setFilters,
    deleteProject
  } = useProjectsStore();
  
  const { setLoading } = useUIStore();
  const { showConfirm, showProjectSettings } = useModal();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    setLoading('projects-fetch', isLoading);
  }, [isLoading, setLoading]);

  if (isLoading && projects.length === 0) {
    return <LoadingGrid count={6} className="p-6" />;
  }

  if (error) {
    return (
      <LoadingCard
        title="Error Loading Projects"
        message={error}
        status="error"
        onRetry={() => fetchProjects()}
      />
    );
  }

  const handleDelete = (projectId: string, projectTitle: string) => {
    showConfirm({
      title: 'Delete Project',
      message: `Are you sure you want to delete "${projectTitle}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'destructive',
      onConfirm: () => deleteProject(projectId),
      onClose: () => {}
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Projects</h2>
          <p className="text-muted-foreground">
            {pagination.total} projects
          </p>
        </div>
        
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="group hover:shadow-lg transition-shadow">
            <CardHeader className="p-4">
              <div className="aspect-video bg-muted rounded-lg mb-3 overflow-hidden">
                {project.coverImage ? (
                  <img 
                    src={project.coverImage} 
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No Preview
                  </div>
                )}
              </div>
              
              <CardTitle className="text-lg line-clamp-1">
                {project.title}
              </CardTitle>
              
              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              )}
            </CardHeader>
            
            <CardContent className="p-4 pt-0">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <span>{project.pages.length} pages</span>
                <span>{project.status}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Open
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => showProjectSettings({ 
                    project,
                    onSave: (settings) => {
                      // Handle save
                    },
                    onClose: () => {}
                  })}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                
                <Button variant="ghost" size="sm">
                  <Share2 className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDelete(project.id, project.title)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button 
            variant="outline" 
            disabled={!pagination.hasPrev}
            onClick={() => fetchProjects({ page: pagination.page - 1 })}
          >
            Previous
          </Button>
          
          <span className="px-4 py-2 text-sm">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          
          <Button 
            variant="outline"
            disabled={!pagination.hasNext}
            onClick={() => fetchProjects({ page: pagination.page + 1 })}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}