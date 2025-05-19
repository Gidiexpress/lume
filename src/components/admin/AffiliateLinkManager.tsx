
'use client';

import React, { useState, useEffect, useActionState, startTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trash2, Edit3, PlusCircle, Link2Icon, Info, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CourseLink } from '@/lib/affiliateLinks';
import { getAffiliateLinks, addAffiliateLink, updateAffiliateLink, deleteAffiliateLink, type AdminActionState } from '@/app/admin-actions';

const initialFormState: Omit<CourseLink, 'title' | 'id'> & { id?: string, title?: string } = {
    title: '',
    affiliateUrl: '',
    displayText: '',
};

export function AffiliateLinkManager() {
  const [links, setLinks] = useState<CourseLink[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentLink, setCurrentLink] = useState<CourseLink | null>(null); // For editing
  const [formValues, setFormValues] = useState<Omit<CourseLink, 'id'> & { id?: string }>(initialFormState);
  
  const { toast } = useToast();

  const fetchLinks = async () => {
    setIsLoading(true);
    const result = await getAffiliateLinks();
    if (result.success && result.data) {
      setLinks(result.data as CourseLink[]);
    } else {
      toast({ title: 'Error', description: result.message || 'Could not fetch links.', variant: 'destructive' });
      setLinks([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    setIsMounted(true);
    fetchLinks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const [addActionState, addFormAction, isAddPending] = useActionState(addAffiliateLink, {success: false, message: null});
  const [updateActionState, updateFormAction, isUpdatePending] = useActionState(updateAffiliateLink, {success: false, message: null});


  useEffect(() => {
    if (!isAddPending && addActionState?.message) {
      toast({ title: addActionState.success ? 'Success' : 'Error', description: addActionState.message, variant: addActionState.success ? 'default' : 'destructive' });
      if (addActionState.success) {
        fetchLinks(); // Re-fetch links to show the new one
        setIsFormOpen(false);
      }
    }
  }, [addActionState, isAddPending, toast]);

  useEffect(() => {
    if (!isUpdatePending && updateActionState?.message) {
      toast({ title: updateActionState.success ? 'Success' : 'Error', description: updateActionState.message, variant: updateActionState.success ? 'default' : 'destructive'});
      if (updateActionState.success) {
        fetchLinks(); // Re-fetch links to show changes
        setIsFormOpen(false);
      }
    }
  }, [updateActionState, isUpdatePending, toast]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = () => {
    const formData = new FormData();
    if (currentLink?.id) formData.append('id', currentLink.id);
    formData.append('title', formValues.title || '');
    formData.append('affiliateUrl', formValues.affiliateUrl);
    if (formValues.displayText) formData.append('displayText', formValues.displayText);

    startTransition(() => {
        if (currentLink) { // Editing
            updateFormAction(formData);
        } else { // Adding
            addFormAction(formData);
        }
    });
  };

  const handleEdit = (link: CourseLink) => {
    setCurrentLink(link);
    setFormValues({ id: link.id, title: link.title, affiliateUrl: link.affiliateUrl, displayText: link.displayText || '' });
    setIsFormOpen(true);
  };

  const handleDelete = async (linkId: string) => {
    if (!confirm('Are you sure you want to delete this link?')) return;
    setIsLoading(true); // Use general loading for delete operation for now
    const result = await deleteAffiliateLink(linkId);
    toast({ title: result.success ? 'Success' : 'Error', description: result.message, variant: result.success ? 'default' : 'destructive' });
    if (result.success) {
      fetchLinks(); // Re-fetch links
    }
    setIsLoading(false);
  };

  const openAddForm = () => {
    setCurrentLink(null);
    setFormValues(initialFormState);
    setIsFormOpen(true);
  };

  if (!isMounted) {
    return (
      <Card className="shadow-lg">
        <CardHeader><CardTitle>Manage Affiliate Links & Resources</CardTitle></CardHeader>
        <CardContent><p>Initializing...</p></CardContent>
      </Card>
    );
  }

  const isActionPending = isAddPending || isUpdatePending;

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold flex items-center">
              <Link2Icon className="mr-2 h-6 w-6 text-primary" />
              Affiliate Links & Resources
            </CardTitle>
            <CardDescription>Manage partner course links stored in Firestore.</CardDescription>
          </div>
          <Button onClick={openAddForm} disabled={isActionPending}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Link
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && !links.length ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading links...
            </div>
          ) : links.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No affiliate links configured yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title (Matching Key)</TableHead>
                  <TableHead>Affiliate URL</TableHead>
                  <TableHead>Display Text</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map(link => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">{link.title}</TableCell>
                    <TableCell>
                        <a href={link.affiliateUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-xs inline-block">
                            {link.affiliateUrl}
                        </a>
                    </TableCell>
                    <TableCell>{link.displayText || '-'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(link)} aria-label="Edit link" disabled={isActionPending || isLoading}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(link.id!)} aria-label="Delete link" disabled={isActionPending || isLoading}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isActionPending) setIsFormOpen(isOpen); }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{currentLink ? 'Edit' : 'Add New'} Affiliate Link</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title*</Label>
                <Input id="title" name="title" value={formValues.title || ''} onChange={handleInputChange} className="col-span-3" placeholder="Course title to match" required disabled={isActionPending || !!currentLink} />
              </div>
              {currentLink && <p className="col-span-4 text-xs text-muted-foreground text-center -mt-2">Title (matching key) is unique and cannot be changed after creation to maintain data integrity. To change a title, delete and re-add.</p>}
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="affiliateUrl" className="text-right">URL*</Label>
                <Input id="affiliateUrl" name="affiliateUrl" value={formValues.affiliateUrl} onChange={handleInputChange} className="col-span-3" type="url" placeholder="https://partner.com/course?ref=lume" required disabled={isActionPending} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="displayText" className="text-right">Display Text</Label>
                <Input id="displayText" name="displayText" value={formValues.displayText || ''} onChange={handleInputChange} className="col-span-3" placeholder="e.g., Special Course Offer (Optional)" disabled={isActionPending} />
              </div>
               { (addActionState && !addActionState.success && !isAddPending) &&
                <p className="col-span-4 text-sm text-destructive flex items-center p-2 bg-destructive/10 rounded-md border border-destructive/30">
                    <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" /> {addActionState.message}
                </p>
              }
              { (updateActionState && !updateActionState.success && !isUpdatePending) &&
                <p className="col-span-4 text-sm text-destructive flex items-center p-2 bg-destructive/10 rounded-md border border-destructive/30">
                    <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" /> {updateActionState.message}
                </p>
              }
            </div>
            <DialogFooter>
              <DialogClose asChild>
                  <Button variant="outline" type="button" disabled={isActionPending}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isActionPending}>
                {isActionPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {currentLink ? 'Save Changes' : 'Add Link'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <Card className="bg-blue-50 border-blue-200 shadow-md dark:bg-blue-900/30 dark:border-blue-700">
        <CardHeader>
          <CardTitle className="text-blue-700 dark:text-blue-300 text-sm flex items-center">
            <Info className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" /> Important Considerations
            </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-600 dark:text-blue-300/90 text-sm space-y-1">
          <ul className="list-disc list-inside pl-4">
            <li>Ensure your Firebase project is correctly configured in <code>src/lib/firebase/config.ts</code>.</li>
            <li>Set up Firebase Firestore security rules to restrict write access to this 'affiliateLinks' collection to authenticated admin users only. This is crucial for production.</li>
            <li>Current implementation uses the 'title' as a unique key for matching. Editing the title of existing links is disabled to simplify this prototype.</li>
            <li>Performance stats (clicks/conversions) require further analytics setup and backend integration.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
