
'use client';

import React, { useState, useEffect } from 'react';
import { COURSE_AFFILIATE_LINKS, type CourseLink } from '@/lib/affiliateLinks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Edit3, PlusCircle, AlertTriangle, Link2Icon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function AffiliateLinkManager() {
  const [links, setLinks] = useState<CourseLink[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentLink, setCurrentLink] = useState<CourseLink | null>(null);
  const [formState, setFormState] = useState<Omit<CourseLink, 'title'> & { title?: string }>({
    title: '',
    affiliateUrl: '',
    displayText: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    // Initialize with hardcoded links after component mounts to avoid hydration issues
    // if COURSE_AFFILIATE_LINKS were dynamic in a real scenario.
    // For this prototype, it's more about demonstrating client-side state.
    setLinks(JSON.parse(JSON.stringify(COURSE_AFFILIATE_LINKS))); // Deep copy
    setIsMounted(true);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formState.title || !formState.affiliateUrl) {
      toast({ title: 'Error', description: 'Title and Affiliate URL are required.', variant: 'destructive' });
      return;
    }
    const newLink: CourseLink = {
        title: formState.title,
        affiliateUrl: formState.affiliateUrl,
        displayText: formState.displayText || undefined,
    };

    if (currentLink) { // Editing
      setLinks(links.map(link => (link.title === currentLink.title ? newLink : link)));
      toast({ title: 'Success', description: 'Affiliate link updated.' });
    } else { // Adding
      if (links.find(link => link.title.toLowerCase() === newLink.title.toLowerCase())) {
        toast({ title: 'Error', description: 'A link with this title already exists.', variant: 'destructive'});
        return;
      }
      setLinks([...links, newLink]);
      toast({ title: 'Success', description: 'Affiliate link added.' });
    }
    setIsFormOpen(false);
    setCurrentLink(null);
    setFormState({ title: '', affiliateUrl: '', displayText: '' });
  };

  const handleEdit = (link: CourseLink) => {
    setCurrentLink(link);
    setFormState({ title: link.title, affiliateUrl: link.affiliateUrl, displayText: link.displayText || '' });
    setIsFormOpen(true);
  };

  const handleDelete = (title: string) => {
    setLinks(links.filter(link => link.title !== title));
    toast({ title: 'Success', description: 'Affiliate link deleted.' });
  };

  const openAddForm = () => {
    setCurrentLink(null);
    setFormState({ title: '', affiliateUrl: '', displayText: '' });
    setIsFormOpen(true);
  };

  if (!isMounted) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Link2Icon className="mr-2 h-6 w-6 text-primary" />
            Manage Affiliate Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading affiliate links...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold flex items-center">
             <Link2Icon className="mr-2 h-6 w-6 text-primary" />
            Manage Affiliate Links
          </CardTitle>
          <Button onClick={openAddForm}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Link
          </Button>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No affiliate links configured yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Affiliate URL</TableHead>
                  <TableHead>Display Text</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map(link => (
                  <TableRow key={link.title}>
                    <TableCell className="font-medium">{link.title}</TableCell>
                    <TableCell>
                        <a href={link.affiliateUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-xs inline-block">
                            {link.affiliateUrl}
                        </a>
                    </TableCell>
                    <TableCell>{link.displayText || '-'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(link)}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(link.title)}>
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

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{currentLink ? 'Edit' : 'Add New'} Affiliate Link</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title*
              </Label>
              <Input
                id="title"
                name="title"
                value={formState.title}
                onChange={handleInputChange}
                className="col-span-3"
                disabled={!!currentLink} // Disable editing title as it's used as key
              />
            </div>
             {currentLink && <p className="col-span-4 text-xs text-muted-foreground text-center -mt-2">Title cannot be changed after creation. Delete and re-add if needed.</p>}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="affiliateUrl" className="text-right">
                URL*
              </Label>
              <Input
                id="affiliateUrl"
                name="affiliateUrl"
                value={formState.affiliateUrl}
                onChange={handleInputChange}
                className="col-span-3"
                type="url"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="displayText" className="text-right">
                Display Text
              </Label>
              <Input
                id="displayText"
                name="displayText"
                value={formState.displayText}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="(Optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSubmit}>{currentLink ? 'Save Changes' : 'Add Link'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Card className="bg-yellow-50 border-yellow-200 shadow-md">
        <CardHeader>
          <CardTitle className="text-yellow-700 text-sm flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" /> Developer Note
            </CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-600 text-sm">
          Changes made to affiliate links here are **for demonstration purposes only** and are managed in client-side state. 
          They **will not be saved permanently** and will reset on page refresh. 
          To make these changes persistent, you would need to integrate server actions with a database (e.g., Firestore).
        </CardContent>
      </Card>
    </div>
  );
}
