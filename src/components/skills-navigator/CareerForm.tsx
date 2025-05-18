
'use client';

import React, { useEffect } from 'react';
import { useActionState } from 'react'; // Updated import
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { submitCareerFormAction, type FormState } from '@/app/actions';
import type { CareerPathOutput } from '@/ai/flows/career-path-generator';
import { Loader2, GraduationCap, Target, AlertTriangle, Sparkles, User, Mail, Building, Briefcase, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CareerFormProps {
  onFormSubmitSuccess: (data: CareerPathOutput, reportType: 'free' | 'premium') => void;
  setIsLoading: (loading: boolean) => void;
}

function SubmitButtons() {
  const { pending } = useFormStatus();
  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full">
      <Button type="submit" name="reportType" value="free" disabled={pending} className="w-full flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground">
        {pending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        Get Free Report
      </Button>
      <Button type="submit" name="reportType" value="premium" disabled={pending} className="w-full flex-1 bg-primary hover:bg-primary/90">
        {pending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        Get Premium Report (₦1000)
      </Button>
    </div>
  );
}

export function CareerForm({ onFormSubmitSuccess, setIsLoading }: CareerFormProps) {
  const initialState: FormState = { message: null, success: false, data: null, reportType: 'free' };
  const [state, formAction] = useActionState(submitCareerFormAction, initialState);
  const { toast } = useToast();
  // const { pending } = useFormStatus(); // This hook only works if the component is a direct child of form. SubmitButtons has it.

  useEffect(() => {
    // The `pending` state needs to be derived from the action's state or passed down if SubmitButtons is separate.
    // For now, we'll rely on `state` updates to eventually reflect loading changes.
    // A more robust way might involve a local loading state tied to form submission initiation and `state` resolution.
    setIsLoading(false); // Reset loading when state changes, actual loading is handled by formStatus in SubmitButtons
                        // Or, more accurately, setIsLoading should be true when formAction is called and false when state updates.

    if (state?.message) {
        if (state.success && state.data) {
            onFormSubmitSuccess(state.data, state.reportType || 'free');
            toast({
                title: "Success!",
                description: state.message,
            });
        } else if (!state.success) {
            toast({
                title: "Error",
                description: state.message || "An unexpected error occurred.",
                variant: "destructive",
            });
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, onFormSubmitSuccess, toast]); // Removed setIsLoading from deps as it's handled differently now

  const handleFormAction = (formData: FormData) => {
    setIsLoading(true);
    formAction(formData);
  };


  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center flex items-center justify-center">
          <Sparkles className="mr-2 h-6 w-6 text-primary" />
          Discover Your Career Path with Lume
        </CardTitle>
        <CardDescription className="text-center">
          Fill in your details to get personalized career guidance. Choose between a free summary or a comprehensive premium report.
        </CardDescription>
      </CardHeader>
      <form action={handleFormAction}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="flex items-center text-md">
                <User className="mr-2 h-5 w-5 text-primary" />
                Full Name
              </Label>
              <Input id="fullName" name="fullName" placeholder="e.g., Adaobi Ekwueme" required className="text-base" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center text-md">
                <Mail className="mr-2 h-5 w-5 text-primary" />
                Email Address
              </Label>
              <Input id="email" name="email" type="email" placeholder="e.g., ada.ekwueme@example.com" required className="text-base" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="university" className="flex items-center text-md">
                <Building className="mr-2 h-5 w-5 text-primary" />
                University/Institution
              </Label>
              <Input id="university" name="university" placeholder="e.g., University of Lagos" required className="text-base" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fieldOfStudy" className="flex items-center text-md">
                <GraduationCap className="mr-2 h-5 w-5 text-primary" />
                Field of Study
              </Label>
              <Input id="fieldOfStudy" name="fieldOfStudy" placeholder="e.g., Computer Science, Economics" required className="text-base" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="currentSkills" className="flex items-center text-md">
              <Briefcase className="mr-2 h-5 w-5 text-primary" />
              Current Skills (Optional)
            </Label>
            <Textarea id="currentSkills" name="currentSkills" placeholder="e.g., Python, Public Speaking, Graphic Design" rows={3} className="text-base" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="desiredCareerPath" className="flex items-center text-md">
                <Target className="mr-2 h-5 w-5 text-primary" />
                Desired Career Path (Optional)
              </Label>
              <Input id="desiredCareerPath" name="desiredCareerPath" placeholder="e.g., Software Engineer, Digital Marketer" className="text-base" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="learningPreference" className="flex items-center text-md">
                <BookOpen className="mr-2 h-5 w-5 text-primary" />
                Learning Preference
              </Label>
              <Input id="learningPreference" name="learningPreference" placeholder="e.g., Online, In-person, Hybrid" required className="text-base" />
            </div>
          </div>

        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-4">
          <SubmitButtons />
          {state?.message && !state.success && (
            <p className="text-sm text-destructive flex items-center mt-4 p-3 bg-destructive/10 rounded-md border border-destructive/30">
                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                {state.message}
            </p>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}

    