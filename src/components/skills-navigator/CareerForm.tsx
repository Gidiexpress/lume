
'use client';

import React, { useEffect } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { submitCareerFormAction, type FormState } from '@/app/actions';
import type { PremiumCareerPathOutput } from '@/ai/flows/premium-career-report-generator';
import type { CareerPathInput } from '@/ai/flows/career-path-generator';
import { Loader2, GraduationCap, Target, AlertTriangle, Sparkles, User, Mail, Building, Briefcase, BookOpen, MessageSquarePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CareerFormProps {
  onFormSubmitSuccess: (data: PremiumCareerPathOutput, originalInput: CareerPathInput, reportType: 'premium') => void;
  onFormSubmitError: (message: string) => void;
  onFormSubmitStart?: () => void; // New prop to signal start of submission
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full bg-primary hover:bg-primary/90">
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="mr-2 h-4 w-4" />
      )}
      Get Your Career Report
    </Button>
  );
}

export function CareerForm({ onFormSubmitSuccess, onFormSubmitError, onFormSubmitStart }: CareerFormProps) {
  const initialState: FormState = { message: null, success: false, data: null, reportType: 'premium' };
  const [state, formAction] = useActionState(submitCareerFormAction, initialState);
  const { toast } = useToast();

  const [formDataCache, setFormDataCache] = React.useState<CareerPathInput | null>(null);

  useEffect(() => {
    if (state?.message) {
      if (state.success && state.data && state.reportType === 'premium' && formDataCache) {
        onFormSubmitSuccess(state.data as PremiumCareerPathOutput, formDataCache, state.reportType);
        toast({
          title: 'Success!',
          description: state.message,
        });
      } else if (!state.success) {
        const errorMessage = state.message || 'An unexpected error occurred.';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        onFormSubmitError(errorMessage);
      }
    }
  }, [state, onFormSubmitSuccess, onFormSubmitError, toast, formDataCache]);

  const handleFormAction = (formData: FormData) => {
    const currentInput: CareerPathInput = {
        fullName: formData.get('fullName') as string,
        email: formData.get('email') as string,
        university: formData.get('university') as string,
        fieldOfStudy: formData.get('fieldOfStudy') as string,
        currentSkills: formData.get('currentSkills') as string || undefined,
        desiredCareerPath: formData.get('desiredCareerPath') as string || undefined,
        learningPreference: formData.get('learningPreference') as string,
        additionalContext: formData.get('additionalContext') as string || undefined,
    };
    setFormDataCache(currentInput);
    onFormSubmitStart?.(); // Call the onFormSubmitStart callback
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
          Fill in your details to get your personalized career report.
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

          <div className="space-y-2">
            <Label htmlFor="additionalContext" className="flex items-center text-md">
              <MessageSquarePlus className="mr-2 h-5 w-5 text-primary" />
              Additional Context (Optional)
            </Label>
            <Textarea id="additionalContext" name="additionalContext" placeholder="e.g., Specific questions, concerns, or areas you want the report to focus on." rows={3} className="text-base" />
          </div>

        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-4">
          <SubmitButton />
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
