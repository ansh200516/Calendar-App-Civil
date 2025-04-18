import { useState, useEffect } from 'react';
import { useAuth } from '@/store/auth'; // Assuming this correctly provides isAuthenticated and user info
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Resource } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient'; // Used for DELETE
import { Loader2, FileUp, FileDown, Trash2 } from 'lucide-react';

interface ResourceManagerProps {
  eventId: string;
}

export default function ResourceManager({ eventId }: ResourceManagerProps) {
  // We still need auth state to conditionally show admin controls
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchResources = async () => {
    setIsLoading(true);
    try {
      // Fetch resources - this endpoint should be public or allow unauthenticated access
      // The 'credentials: include' might send cookies if logged in, but shouldn't prevent fetch if public
      const response = await fetch(`/api/events/${eventId}/resources`, {
        credentials: 'include' // Or 'omit' if strictly no credentials needed
      });

      if (!response.ok) {
        // Handle case where eventId is invalid or server error occurs
        if (response.status === 404) {
           console.warn(`Event with ID ${eventId} not found when fetching resources.`);
           setResources([]); // Set resources to empty if event not found
        } else {
           throw new Error(`Failed to fetch resources: ${response.statusText}`);
        }
      } else {
        const data = await response.json();
        setResources(data);
      }

    } catch (error) {
      console.error('Error fetching resources:', error);
      // Avoid showing toast if it was just a 404 for the event
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]); // fetchResources and toast are stable, no need to include

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null); // Explicitly clear if no file selected
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please choose a file to upload.',
        variant: 'destructive' // Use warning instead of destructive
      });
      return;
    }

    // Double-check auth state before attempting upload (UI should prevent this, but belt-and-suspenders)
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
      // Upload requires authentication and admin rights (handled by backend route middleware)
      const response = await fetch(`/api/events/${eventId}/resources`, {
        method: 'POST',
        credentials: 'include', // Necessary for session cookie
        body: formData
      });

      if (!response.ok) {
         const errorData = await response.json().catch(() => ({ message: 'Failed to upload file' }));
         throw new Error(errorData.message || `Failed to upload file: ${response.statusText}`);
      }

      // Don't necessarily need the response data unless using it
      // await response.json();

      toast({
        title: 'Success',
        description: `File "${selectedFile.name}" uploaded successfully.`,
      });

      // Reset file input visually (clearing state) and clear the actual input element if possible
      setSelectedFile(null);
      const fileInput = document.getElementById('resource-file-input') as HTMLInputElement | null;
      if (fileInput) {
         fileInput.value = ''; // Clear the file input
      }


      // Refresh resources list
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

  // Download is intended to be public, opens in new tab
  const handleDownload = (resourceId: number | string) => { // Allow string ID just in case
    // The backend route /api/resources/:id/download handles the actual file sending
    window.open(`/api/resources/${resourceId}/download`, '_blank');
  };

  // Delete requires authentication and admin rights
  const handleDelete = async (resourceId: number | string) => {
    // Double-check auth state
    if (!isAuthenticated || !user?.isAdmin) {
        toast({
            title: 'Unauthorized',
            description: 'You do not have permission to delete files.',
            variant: 'destructive'
        });
        return;
    }

    // Optional: Add a confirmation dialog here
    // if (!window.confirm("Are you sure you want to delete this resource?")) {
    //   return;
    // }

    try {
      // apiRequest likely includes credentials automatically if needed by queryClient setup
      const result = await apiRequest('DELETE', `/api/resources/${resourceId}`);

      // apiRequest probably throws on non-ok status, but check just in case
      if (result.ok) {
        toast({
          title: 'Success',
          description: 'Resource deleted successfully',
        });

        // Remove the deleted resource from the state optimistically or after confirmation
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

  // --- Helper Functions ---
  const formatFileSize = (bytes: number): string => {
    if (bytes < 0) return 'Invalid size'; // Handle potential negative values
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']; // Added TB
    // Handle potential Math.log(0) or negative values
    const i = bytes > 0 ? Math.floor(Math.log(bytes) / Math.log(k)) : 0;
    // Ensure index is within bounds
    const sizeIndex = Math.min(i, sizes.length - 1);
    return parseFloat((bytes / Math.pow(k, sizeIndex)).toFixed(2)) + ' ' + sizes[sizeIndex];
  };

  const formatDate = (dateInput: Date | string | number | undefined): string => {
    if (!dateInput) return 'N/A'; // Handle null/undefined dates
    try {
        const date = new Date(dateInput);
        // Check if date is valid after parsing
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }
        // Use locale formatting for better readability
        return date.toLocaleString(undefined, {
             year: 'numeric', month: 'short', day: 'numeric',
             hour: 'numeric', minute: '2-digit' // Example format
        });
    } catch (e) {
        console.error("Error formatting date:", dateInput, e);
        return 'Invalid Date';
    }
  };

  // --- Component Return ---

  // REMOVED: The top-level `if (!isAuthenticated)` check.

  return (
    <Card className="w-full mt-4 mb-4"> {/* Added margin for spacing */}
      <CardHeader>
        <CardTitle>Event Resources</CardTitle>
        <CardDescription>Downloadable files and materials for this event.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8 min-h-[100px]"> {/* Added min-height */}
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading resources...</span>
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground min-h-[100px]"> {/* Added min-height */}
            No resources have been uploaded for this event yet.
            {/* Optionally suggest uploading if admin */}
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
                  <TableHead className="hidden sm:table-cell">Type</TableHead> {/* Hide on small screens */}
                  <TableHead className="hidden md:table-cell">Size</TableHead> {/* Hide on medium screens */}
                  <TableHead className="hidden lg:table-cell">Uploaded</TableHead> {/* Hide on large screens */}
                  <TableHead className="text-right w-[100px]">Actions</TableHead> {/* Fixed width for actions */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell className="font-medium break-all">{resource.originalName}</TableCell> {/* Allow name wrapping */}
                    <TableCell className="hidden sm:table-cell">{resource.fileType}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatFileSize(resource.fileSize)}</TableCell>
                    <TableCell className="hidden lg:table-cell">{formatDate(resource.uploadedAt)}</TableCell>
                    <TableCell className="text-right">
                      {/* Download Button: Always visible */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(resource.id)}
                        title={`Download ${resource.originalName}`}
                        aria-label={`Download ${resource.originalName}`}
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>

                      {/* Delete Button: Conditionally visible based on auth and admin status */}
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

      {/* Upload Section: Conditionally visible based on auth and admin status */}
      {isAuthenticated && user?.isAdmin && (
        <CardFooter className="flex flex-col items-start gap-4 sm:flex-row sm:items-center border-t pt-4"> {/* Added border top */}
          <Input
            id="resource-file-input" // Added ID for resetting
            type="file"
            onChange={handleFileChange}
            // Consider adding more specific file types if needed
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar,.7z,.jpg,.jpeg,.png,.gif,.csv"
            className="flex-1"
            aria-label="Select file to upload"
          />
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading} // Disable if no file or during upload
            className="w-full sm:w-auto" // Full width on small screens
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