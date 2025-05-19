
'use client';

import React, { useState, useEffect } from 'react';
import { COURSE_AFFILIATE_LINKS, type CourseLink } from '@/lib/affiliateLinks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trash2, Edit3, PlusCircle, AlertTriangle, Link2Icon, Info } from 'lucide-react';
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

    if (currentLink) { 
      setLinks(links.map(link => (link.title === currentLink.title ? newLink : link)));
      toast({ title: 'Success', description: 'Affiliate link updated (client-side).' });
    } else { 
      if (links.find(link => link.title.toLowerCase() === newLink.title.toLowerCase())) {
        toast({ title: 'Error', description: 'A link with this title already exists.', variant: 'destructive'});
        return;
      }
      setLinks([...links, newLink]);
      toast({ title: 'Success', description: 'Affiliate link added (client-side).' });
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
    toast({ title: 'Success', description: 'Affiliate link deleted (client-side).' });
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
            Manage Affiliate Links & Resources
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
          <div>
            <CardTitle className="text-xl font-semibold flex items-center">
              <Link2Icon className="mr-2 h-6 w-6 text-primary" />
              Affiliate Links & Resources
            </CardTitle>
            <CardDescription>Manage partner course links. Changes are client-side only for this prototype.</CardDescription>
          </div>
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
                  <TableHead>Title (Matching Key)</TableHead>
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
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(link)} aria-label="Edit link">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(link.title)} aria-label="Delete link">
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
                value={formState.title || ''}
                onChange={handleInputChange}
                className="col-span-3"
                disabled={!!currentLink} 
                placeholder="Course title to match"
              />
            </div>
             {currentLink && <p className="col-span-4 text-xs text-muted-foreground text-center -mt-2">Title (matching key) cannot be changed after creation.</p>}
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
                placeholder="https://partner.com/course?ref=lume"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="displayText" className="text-right">
                Display Text
              </Label>
              <Input
                id="displayText"
                name="displayText"
                value={formState.displayText || ''}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="e.g., Special Course Offer (Optional)"
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
      
      <Card className="bg-blue-50 border-blue-200 shadow-md dark:bg-blue-900/30 dark:border-blue-700">
        <CardHeader>
          <CardTitle className="text-blue-700 dark:text-blue-300 text-sm flex items-center">
            <Info className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" /> Future Enhancements
            </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-600 dark:text-blue-300/90 text-sm space-y-1">
          <p>To make this module fully functional, the following would be needed:</p>
          <ul className="list-disc list-inside pl-4">
            <li>Backend integration (e.g., Firebase Firestore) to persistently save link data.</li>
            <li>Filtering capabilities (by career path, category).</li>
            <li>Tracking and display of performance statistics (clicks, conversions) - requires analytics setup.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
