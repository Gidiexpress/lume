
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

const initialFormValues: Omit<CourseLink, 'id'> & { id?: string; title?: string } = {
    title: '',
    affiliateUrl: '',
    displayText: '',
};

export function AffiliateLinkManager() {
  const [links, setLinks] = useState<CourseLink[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // General loading for fetch/delete
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentLink, setCurrentLink] = useState<CourseLink | null>(null); // For editing
  const [formValues, setFormValues] = useState<Omit<CourseLink, 'id'> & { id?: string; title?: string }>(initialFormValues);
  
  const { toast } = useToast();

  const fetchLinks = async () => {
    setIsLoading(true);
    const result = await getAffiliateLinks();
    if (result.success && Array.isArray(result.data)) {
      setLinks(result.data);
    } else {
      if (result.message && (result.message.includes("relation") && result.message.includes("does not exist"))) {
        toast({ 
          title: 'Database Table Missing', 
          description: `The 'affiliateLinks' table was not found in your Supabase database. Please create it using the SQL schema provided in the 'Important Supabase Setup' card below and ensure RLS policies are set.`, 
          variant: 'destructive',
          duration: 15000 
        });
      } else {
        toast({ title: 'Error Fetching Links', description: result.message || 'Could not fetch affiliate links.', variant: 'destructive' });
      }
      setLinks([]); 
    }
    setIsLoading(false);
  };

  useEffect(() => {
    setIsMounted(true);
    fetchLinks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const [addActionState, addFormAction, isAddPending] = useActionState(addAffiliateLink, {success: false, message: null, issues: []});
  const [updateActionState, updateFormAction, isUpdatePending] = useActionState(updateAffiliateLink, {success: false, message: null, issues: []});


  useEffect(() => {
    if (!isAddPending && addActionState?.message) {
      toast({ title: addActionState.success ? 'Success' : 'Error Adding Link', description: addActionState.message, variant: addActionState.success ? 'default' : 'destructive' });
      if (addActionState.success) {
        fetchLinks(); 
        setIsFormOpen(false);
      }
    }
  }, [addActionState, isAddPending, toast]);

  useEffect(() => {
    if (!isUpdatePending && updateActionState?.message) {
      toast({ title: updateActionState.success ? 'Success' : 'Error Updating Link', description: updateActionState.message, variant: updateActionState.success ? 'default' : 'destructive'});
      if (updateActionState.success) {
        fetchLinks(); 
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
    // Title is only appended if it's a new link or if it's being edited (though editing title is disabled in form)
    if (!currentLink || formValues.title) {
      formData.append('title', formValues.title || ''); 
    }
    formData.append('affiliateUrl', formValues.affiliateUrl);
    if (formValues.displayText) formData.append('displayText', formValues.displayText);

    startTransition(() => {
        if (currentLink) { 
            updateFormAction(formData);
        } else { 
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
    setIsLoading(true); 
    const result = await deleteAffiliateLink(linkId);
    toast({ title: result.success ? 'Success' : 'Error', description: result.message, variant: result.success ? 'default' : 'destructive' });
    if (result.success) {
      fetchLinks(); 
    }
    setIsLoading(false);
  };

  const openAddForm = () => {
    setCurrentLink(null);
    setFormValues(initialFormValues);
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
            <CardDescription>Manage partner course links stored in Supabase.</CardDescription>
          </div>
          <Button onClick={openAddForm} disabled={isActionPending || isLoading}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Link
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && links.length === 0 ? ( 
            <div className="flex items-center justify-center py-4">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading links...
            </div>
          ) : links.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No affiliate links configured yet. If you see a 'Database Table Missing' error toast, please ensure the 'affiliateLinks' table is created in Supabase as per the setup instructions below.</p>
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{currentLink ? 'Edit' : 'Add New'} Affiliate Link</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="title">Title (Course title to match)*</Label>
                <Input 
                  id="title" 
                  name="title" 
                  value={formValues.title || ''} 
                  onChange={handleInputChange} 
                  placeholder="e.g., Introduction to Python" 
                  required 
                  disabled={isActionPending || !!currentLink} 
                  className="mt-1"
                />
                {currentLink && <p className="text-xs text-muted-foreground mt-1">Title (matching key) cannot be changed after creation to maintain data integrity. To change a title, please delete and re-add the link.</p>}
              </div>
              
              <div>
                <Label htmlFor="affiliateUrl">Affiliate URL*</Label>
                <Input 
                  id="affiliateUrl" 
                  name="affiliateUrl" 
                  value={formValues.affiliateUrl} 
                  onChange={handleInputChange} 
                  type="url" 
                  placeholder="https://partner.com/course?ref=lume" 
                  required 
                  disabled={isActionPending}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="displayText">Display Text (Optional)</Label>
                <Input 
                  id="displayText" 
                  name="displayText" 
                  value={formValues.displayText || ''} 
                  onChange={handleInputChange} 
                  placeholder="e.g., Special Course Offer" 
                  disabled={isActionPending}
                  className="mt-1"
                />
              </div>
              
              {/* Error Display for Add Action */}
              { addActionState?.issues && addActionState.issues.length > 0 && !isAddPending && (
                <div className="space-y-2 mt-2">
                  {addActionState.issues.map((issue, index) => (
                    <p key={`add-err-${index}`} className="text-sm text-destructive flex items-center p-2 bg-destructive/10 rounded-md border border-destructive/30">
                      <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" /> {issue}
                    </p>
                  ))}
                </div>
              )}

              {/* Error Display for Update Action */}
              { updateActionState?.issues && updateActionState.issues.length > 0 && !isUpdatePending && (
                 <div className="space-y-2 mt-2">
                  {updateActionState.issues.map((issue, index) => (
                    <p key={`upd-err-${index}`} className="text-sm text-destructive flex items-center p-2 bg-destructive/10 rounded-md border border-destructive/30">
                      <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" /> {issue}
                    </p>
                  ))}
                </div>
              )}
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
            <Info className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" /> Important Supabase Setup
            </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-600 dark:text-blue-300/90 text-sm space-y-2">
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li><strong>Table Creation:</strong> If you see a 'Database Table Missing' error toast (or a message like "relation 'public.affiliateLinks' does not exist"), you **must create the `affiliateLinks` table** in your Supabase project's `public` schema.
              SQL to create table:
              <pre className="mt-1 mb-1 p-2 bg-blue-100 dark:bg-blue-800/50 rounded text-xs overflow-x-auto">{
`CREATE TABLE public.affiliateLinks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL UNIQUE,
  "affiliateUrl" TEXT NOT NULL,
  "displayText" TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.affiliateLinks IS 'Stores affiliate links for courses and resources.';
ALTER TABLE public.affiliateLinks ENABLE ROW LEVEL SECURITY;`
              }</pre>
            </li>
            <li>Ensure your Supabase project URL and Anon Key are correctly set in <code>.env.local</code> (e.g., <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>) and accessible in <code>src/lib/supabase/client.ts</code>.</li>
            <li>Set up Supabase Row Level Security (RLS) rules. For admin actions (add/edit/delete), you'll need policies that allow these operations only for authenticated users with an admin role (e.g., checking a `role` column in a `profiles` table). For example:
              <pre className="mt-1 mb-1 p-2 bg-blue-100 dark:bg-blue-800/50 rounded text-xs overflow-x-auto">{
`-- Example RLS: Allow admins to manage affiliate links
CREATE POLICY "Admins can manage affiliate links"
ON public.affiliateLinks
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Allow public read access if links are fetched client-side for display in reports
CREATE POLICY "Allow public read access to affiliate links"
ON public.affiliateLinks
FOR SELECT
TO public -- or 'authenticated'
USING (true);`
              }</pre>
            </li>
            <li>Client-side read access for `fetchAndCacheAffiliateLinks` (used in report display) requires the "Allow public read access" RLS policy.</li>
            <li>Current implementation uses the 'title' as a unique key for matching. Editing the title of existing links is disabled in the form to simplify this prototype.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
