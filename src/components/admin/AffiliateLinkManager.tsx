
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

const initialFormValues: Omit<CourseLink, 'id' | 'created_at'> & { id?: string; title?: string } = {
    title: '',
    affiliateUrl: '',
    displayText: '',
};

export function AffiliateLinkManager() {
  const [links, setLinks] = useState<CourseLink[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentLink, setCurrentLink] = useState<CourseLink | null>(null);
  const [formValues, setFormValues] = useState<Omit<CourseLink, 'id' | 'created_at'> & { id?: string; title?: string }>(initialFormValues);
  const [dbTableMissingError, setDbTableMissingError] = useState<string | null>(null);
  
  const { toast } = useToast();

  const fetchLinks = async () => {
    setIsLoading(true);
    setDbTableMissingError(null); 
    const result = await getAffiliateLinks();
    console.log("Client: getAffiliateLinks result:", result);

    if (result.success && Array.isArray(result.data)) {
      setLinks(result.data);
    } else {
      const errorMessage = result.message || 'Could not fetch affiliate links.';
      console.error("Client: Error message from fetchLinks:", errorMessage);

      if (errorMessage.includes("relation") && errorMessage.includes("does not exist") && errorMessage.includes("affiliateLinks")) {
        const specificError = `Critical Setup Error: The 'affiliateLinks' table was not found in your Supabase database (public schema).\n\nOriginal error: ${errorMessage}\n\nPlease carefully follow the SQL setup instructions provided in the 'Important Supabase Setup' card below. Ensure the table name is exactly 'affiliateLinks' (lowercase).`;
        toast({ 
          title: 'Database Table Missing', 
          description: specificError, 
          variant: 'destructive',
          duration: 30000 
        });
        setDbTableMissingError(specificError);
      } else {
        toast({ title: 'Error Fetching Links', description: errorMessage, variant: 'destructive' });
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
  
  const initialActionState: AdminActionState = { success: false, message: null, issues: [] };
  const [addActionState, addFormAction, isAddPending] = useActionState(addAffiliateLink, initialActionState);
  const [updateActionState, updateFormAction, isUpdatePending] = useActionState(updateAffiliateLink, initialActionState);


  useEffect(() => {
    if (!isAddPending && addActionState?.message) {
      toast({ title: addActionState.success ? 'Success' : 'Error Adding Link', description: addActionState.message, variant: addActionState.success ? 'default' : 'destructive' });
      if (addActionState.success) {
        fetchLinks(); 
        setIsFormOpen(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addActionState, isAddPending]);

  useEffect(() => {
    if (!isUpdatePending && updateActionState?.message) {
      toast({ title: updateActionState.success ? 'Success' : 'Error Updating Link', description: updateActionState.message, variant: updateActionState.success ? 'default' : 'destructive'});
      if (updateActionState.success) {
        fetchLinks(); 
        setIsFormOpen(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateActionState, isUpdatePending]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = () => {
    const formData = new FormData();
    if (currentLink?.id) formData.append('id', currentLink.id);
    formData.append('title', formValues.title || (currentLink?.title || '')); 
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
          {isLoading && links.length === 0 && !dbTableMissingError ? ( 
            <div className="flex items-center justify-center py-4">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading links...
            </div>
          ) : dbTableMissingError ? (
            <div className="p-4 my-4 bg-destructive/10 text-destructive border border-destructive/30 rounded-md">
              <div className="flex items-start">
                <AlertTriangle className="h-6 w-6 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-lg mb-1">Database Table Missing or Inaccessible</p>
                  <p className="text-sm whitespace-pre-wrap">{dbTableMissingError.split('\n\n')[0]}</p>
                  {dbTableMissingError.includes("Original error:") &&
                    <p className="text-xs font-mono p-1.5 my-1.5 bg-destructive/20 rounded whitespace-pre-wrap"><strong>Supabase Error:</strong> {dbTableMissingError.substring(dbTableMissingError.indexOf("Original error:") + "Original error:".length).trim()}</p>
                  }
                  <p className="text-sm whitespace-pre-wrap mt-1">{dbTableMissingError.split('\n\n')[2] || (dbTableMissingError.includes("Original error:") ? "" : dbTableMissingError.split('\n\n')[1])}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="mt-3 border-destructive/50 hover:bg-destructive/20" onClick={fetchLinks} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Retry Fetching Links
              </Button>
            </div>
          ) : links.length === 0 ? (
             <p className="text-muted-foreground text-center py-4">No affiliate links configured yet. Add your first link or ensure the 'affiliateLinks' table exists in your Supabase database (see setup guide below) and has data.</p>
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
              <div className="space-y-1">
                <Label htmlFor="title">Title (Course title to match)*</Label>
                <Input 
                  id="title" 
                  name="title" 
                  value={formValues.title || ''} 
                  onChange={handleInputChange} 
                  placeholder="e.g., Introduction to Python" 
                  required 
                  disabled={isActionPending || !!currentLink} 
                />
                {currentLink && <p className="text-xs text-muted-foreground mt-1">Title (matching key) cannot be changed after creation to maintain data integrity. To change a title, please delete and re-add the link.</p>}
                 {(addActionState?.issues && addActionState.issues.some(issue => issue.toLowerCase().includes('title'))) && (
                  <p className="text-xs text-destructive mt-1 flex items-center">
                    <AlertTriangle size={14} className="mr-1" />
                    {addActionState.issues.find(issue => issue.toLowerCase().includes('title'))}
                  </p>
                )}
              </div>
              
              <div className="space-y-1">
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
                />
                 {(addActionState?.issues && addActionState.issues.some(issue => issue.toLowerCase().includes('url'))) && (
                   <p className="text-xs text-destructive mt-1 flex items-center">
                    <AlertTriangle size={14} className="mr-1" />
                    {addActionState.issues.find(issue => issue.toLowerCase().includes('url'))}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="displayText">Display Text (Optional)</Label>
                <Input 
                  id="displayText" 
                  name="displayText" 
                  value={formValues.displayText || ''} 
                  onChange={handleInputChange} 
                  placeholder="e.g., Special Course Offer" 
                  disabled={isActionPending}
                />
              </div>
              
              { addActionState?.message && !addActionState.success && !isAddPending && (
                <div className="mt-2">
                    <p className="text-sm text-destructive flex items-center p-2 bg-destructive/10 rounded-md border border-destructive/30">
                      <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" /> {addActionState.message}
                    </p>
                </div>
              )}

              { updateActionState?.message && !updateActionState.success && !isUpdatePending && (
                 <div className="mt-2">
                    <p className="text-sm text-destructive flex items-center p-2 bg-destructive/10 rounded-md border border-destructive/30">
                      <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" /> {updateActionState.message}
                    </p>
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
            <Info className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" /> Important Supabase Setup for Affiliate Links
            </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-600 dark:text-blue-300/90 text-sm space-y-2">
          <p>If you see errors like "Database Table Missing" or "relation 'public.affiliateLinks' does not exist", ensure the following in your Supabase project:</p>
          <ul className="list-disc list-inside pl-4 space-y-2">
            <li>
              <strong>Table Creation:</strong> You **must create the `affiliateLinks` table** in your Supabase project's `public` schema.
              Ensure the table name is exactly <strong>`affiliateLinks`</strong> (all lowercase).
              <p className="mt-1">SQL to create table (run in Supabase SQL Editor):</p>
              <pre className="mt-1 mb-1 p-2 bg-blue-100 dark:bg-blue-800/50 rounded text-xs overflow-x-auto">{
`-- 1. Create the affiliateLinks table
CREATE TABLE public.affiliateLinks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL UNIQUE,
  "affiliateUrl" TEXT NOT NULL, -- Note: Quoted, so case-sensitive
  "displayText" TEXT,          -- Note: Quoted, so case-sensitive
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.affiliateLinks IS 'Stores affiliate links for courses and resources.';

-- 2. Enable Row Level Security (RLS) on the table
ALTER TABLE public.affiliateLinks ENABLE ROW LEVEL SECURITY;`
              }</pre>
            </li>
            <li>Ensure your Supabase project URL and Anon Key are correctly set in your environment variables (e.g., <code>.env.local</code> as <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>) and accessible.</li>
            <li>
              <strong>Row Level Security (RLS) Policies:</strong> You need RLS policies to allow access.
              <p className="mt-1">Example RLS policies (run in Supabase SQL Editor after table creation and enabling RLS):</p>
              <pre className="mt-1 mb-1 p-2 bg-blue-100 dark:bg-blue-800/50 rounded text-xs overflow-x-auto">{
`-- Policy: Allow admins to manage all aspects of affiliate links
-- (Assumes you have a 'profiles' table with 'id' linking to auth.users.id and a 'role' column,
-- and 'role' is 'admin' for admin users. Ensure 'profiles' table and its RLS are also correctly set up.)
CREATE POLICY "Admins can manage affiliate links"
ON public.affiliateLinks
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
)
WITH CHECK ( -- Ensures new/updated rows also satisfy the condition
  EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Policy: Allow public read access to affiliate links
-- This is needed for the reports to fetch and display these links (e.g., in CareerPathDisplay).
CREATE POLICY "Allow public read access to affiliate links"
ON public.affiliateLinks
FOR SELECT
TO public -- Or 'authenticated' if you only want logged-in users to see them
USING (true);`
              }</pre>
              <p className="text-xs mt-1"><strong>Checklist for RLS:</strong> 1. Table `profiles` exists. 2. `profiles.id` links to `auth.users.id`. 3. `profiles.role` column exists. 4. Admin user has a row in `profiles` with `role = 'admin'`. 5. RLS is enabled on `profiles` and allows admins to read their own role.</p>
            </li>
            <li><strong>Column Naming Consistency:</strong> The provided SQL uses quoted, camelCase names like <code>"affiliateUrl"</code> and <code>"displayText"</code>. This makes them case-sensitive in the database. The application code (server actions) queries them this way. If you created these columns without quotes (e.g., <code>affiliateurl</code>), your table schema would differ, and queries might fail. It's best to use the provided SQL for table creation.</li>
            <li><strong>Check Schema and Table Name:</strong> Ensure the table is in the `public` schema and the name is precisely `affiliateLinks` (all lowercase). Double-check for typos.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
