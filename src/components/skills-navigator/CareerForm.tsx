'use client';

import React, { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { submitCareerFormAction, type FormState } from '@/app/actions';
import type { CareerPathOutput } from '@/ai/flows/career-path-generator';
import { Loader2, GraduationCap, Target, AlertTriangle, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CareerFormProps {
  onFormSubmitSuccess: (data: CareerPathOutput) => void;
  setIsLoading: (loading: boolean) => void;
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
      Generate Career Path
    </Button>
  );
}

export function CareerForm({ onFormSubmitSuccess, setIsLoading }: CareerFormProps) {
  const initialState: FormState = { message: null, success: false, data: null };
  const [state, formAction] = useFormState(submitCareerFormAction, initialState);
  const { toast } = useToast();
  const { pending } = useFormStatus(); // Direct usage to reflect button's pending state

  useEffect(() => {
    setIsLoading(pending); // Update loading state based on form submission status
  }, [pending, setIsLoading]);

  useEffect(() => {
    if (state?.message) {
        if (state.success && state.data) {
            onFormSubmitSuccess(state.data);
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
  }, [state, onFormSubmitSuccess, toast]);


  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center flex items-center justify-center">
          <Sparkles className="mr-2 h-6 w-6 text-primary" />
          Discover Your Career Path
        </CardTitle>
        <CardDescription className="text-center">
          Enter your field of study and interests to get personalized career guidance.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fieldOfStudy" className="flex items-center text-md">
              <GraduationCap className="mr-2 h-5 w-5 text-primary" />
              Field of Study
            </Label>
            <Input
              id="fieldOfStudy"
              name="fieldOfStudy"
              placeholder="e.g., Computer Science, Graphic Design"
              required
              className="text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="careerInterests" className="flex items-center text-md">
              <Target className="mr-2 h-5 w-5 text-primary" />
              Career Interests (Optional)
            </Label>
            <Textarea
              id="careerInterests"
              name="careerInterests"
              placeholder="e.g., AI development, UI/UX, Data Analysis"
              rows={3}
              className="text-base"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          <SubmitButton />
          {state?.message && !state.success && (
            <p className="text-sm text-destructive flex items-center mt-4 p-2 bg-destructive/10 rounded-md">
                <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                {state.message}
            </p>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
