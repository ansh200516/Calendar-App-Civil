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
  eventId: string;
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
        if (response.status === 404) {
           console.warn(`Event with ID ${eventId} not found when fetching resources.`);
           setResources([]); 
        } else {
           throw new Error(`Failed to fetch resources: ${response.statusText}`);
        }
      } else {
        const data = await response.json();
        setResources(data);
      }

    } catch (error) {
      console.error('Error fetching resources:', error);
      if (!(error instanceof Error && error.message.includes('404'))) {
          toast({
              title: 'Error',
              description: 'Failed to load resources. Please try again later.',
              variant: 'destructive'
          });
      }
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
    } else {
      setSelectedFile(null); 
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please choose a file to upload.',
        variant: 'destructive' 
      });
      return;
    }

    if (!isAuthenticated || !user?.isAdmin) {
        toast({
            title: 'Unauthorized',
            description: 'You do not have permission to upload files.',
            variant: 'destructive'
        });
        return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`/api/events/${eventId}/resources`, {
        method: 'POST',
        credentials: 'include', 
        body: formData
      });

      if (!response.ok) {
         const errorData = await response.json().catch(() => ({ message: 'Failed to upload file' }));
         throw new Error(errorData.message || `Failed to upload file: ${response.statusText}`);
      }

      toast({
        title: 'Success',
        description: `File "${selectedFile.name}" uploaded successfully.`,
      });

      setSelectedFile(null);
      const fileInput = document.getElementById('resource-file-input') as HTMLInputElement | null;
      if (fileInput) {
         fileInput.value = ''; 
      }


      fetchResources();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Upload Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred during upload.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = (resourceId: number | string) => { 
    window.open(`/api/resources/${resourceId}/download`, '_blank');
  };

  const handleDelete = async (resourceId: number | string) => {
    if (!isAuthenticated || !user?.isAdmin) {
        toast({
            title: 'Unauthorized',
            description: 'You do not have permission to delete files.',
            variant: 'destructive'
        });
        return;
    }

    try {
      const result = await apiRequest('DELETE', `/api/resources/${resourceId}`);

      if (result.ok) {
        toast({
          title: 'Success',
          description: 'Resource deleted successfully',
        });

        setResources(resources.filter(r => r.id !== resourceId));
      } else {
         const errorData = await result.json().catch(() => ({ message: 'Failed to delete resource' }));
         throw new Error(errorData.message || `Failed to delete resource: ${result.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({
        title: 'Deletion Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred during deletion.',
        variant: 'destructive'
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 0) return 'Invalid size'; 
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']; 
    const i = bytes > 0 ? Math.floor(Math.log(bytes) / Math.log(k)) : 0;
    const sizeIndex = Math.min(i, sizes.length - 1);
    return parseFloat((bytes / Math.pow(k, sizeIndex)).toFixed(2)) + ' ' + sizes[sizeIndex];
  };

  const formatDate = (dateInput: Date | string | number | undefined): string => {
    if (!dateInput) return 'N/A'; 
    try {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }
        return date.toLocaleString(undefined, {
             year: 'numeric', month: 'short', day: 'numeric',
             hour: 'numeric', minute: '2-digit' 
        });
    } catch (e) {
        console.error("Error formatting date:", dateInput, e);
        return 'Invalid Date';
    }
  };

  return (
    <Card className="w-full mt-4 mb-4"> 
      <CardHeader>
        <CardTitle>Event Resources</CardTitle>
        <CardDescription>Downloadable files and materials for this event.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8 min-h-[100px]"> 
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading resources...</span>
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground min-h-[100px]"> 
            No resources have been uploaded for this event yet.
            {isAuthenticated && user?.isAdmin && (
                 <p className="text-sm mt-2">You can upload resources using the section below.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead> 
                  <TableHead className="hidden md:table-cell">Size</TableHead> 
                  <TableHead className="hidden lg:table-cell">Uploaded</TableHead> 
                  <TableHead className="text-right w-[100px]">Actions</TableHead> 
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell className="font-medium break-all">{resource.originalName}</TableCell> 
                    <TableCell className="hidden sm:table-cell">{resource.fileType}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatFileSize(resource.fileSize)}</TableCell>
                    <TableCell className="hidden lg:table-cell">{formatDate(resource.uploadedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(resource.id)}
                        title={`Download ${resource.originalName}`}
                        aria-label={`Download ${resource.originalName}`}
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>

                      {isAuthenticated && user?.isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(resource.id)}
                          title={`Delete ${resource.originalName}`}
                          aria-label={`Delete ${resource.originalName}`}
                          className="text-destructive hover:text-destructive/80" // Explicit destructive color
                        >
                          <Trash2 className="h-4 w-4" />
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

      {isAuthenticated && user?.isAdmin && (
        <CardFooter className="flex flex-col items-start gap-4 sm:flex-row sm:items-center border-t pt-4"> 
          <Input
            id="resource-file-input" 
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar,.7z,.jpg,.jpeg,.png,.gif,.csv"
            className="flex-1"
            aria-label="Select file to upload"
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