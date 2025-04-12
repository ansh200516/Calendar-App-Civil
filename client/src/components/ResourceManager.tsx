import { useState, useEffect } from 'react';
import { useAuth } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Resource } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, FileUp, FileDown, Trash2 } from 'lucide-react';

interface ResourceManagerProps {
  eventId: number;
}

export default function ResourceManager({ eventId }: ResourceManagerProps) {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/resources`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch resources');
      }
      
      const data = await response.json();
      setResources(data);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast({
        title: 'Error',
        description: 'Failed to load resources. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (eventId) {
      fetchResources();
    }
  }, [eventId]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Please select a file to upload',
        variant: 'destructive'
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await fetch(`/api/events/${eventId}/resources`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload file');
      }
      
      await response.json();
      
      toast({
        title: 'Success',
        description: 'File uploaded successfully',
      });
      
      // Reset file input
      setSelectedFile(null);
      
      // Refresh resources list
      fetchResources();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload file. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDownload = (resourceId: number) => {
    window.open(`/api/resources/${resourceId}/download`, '_blank');
  };
  
  const handleDelete = async (resourceId: number) => {
    try {
      const result = await apiRequest('DELETE', `/api/resources/${resourceId}`);
      
      if (result.ok) {
        toast({
          title: 'Success',
          description: 'Resource deleted successfully',
        });
        
        // Remove the deleted resource from the state
        setResources(resources.filter(r => r.id !== resourceId));
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete resource. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const formatDate = (dateString: Date): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resources</CardTitle>
          <CardDescription>You need to be logged in to view and manage resources.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Event Resources</CardTitle>
        <CardDescription>Files and materials for this event</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No resources available for this event
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell className="font-medium">{resource.originalName}</TableCell>
                    <TableCell>{resource.fileType}</TableCell>
                    <TableCell>{formatFileSize(resource.fileSize)}</TableCell>
                    <TableCell>{formatDate(resource.uploadedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(resource.id)}
                        title="Download"
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>
                      
                      {user?.isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(resource.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      
      {user?.isAdmin && (
        <CardFooter className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
            className="flex-1"
          />
          <Button 
            onClick={handleUpload} 
            disabled={!selectedFile || isUploading}
            className="w-full sm:w-auto"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <FileUp className="mr-2 h-4 w-4" />
                Upload Resource
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}