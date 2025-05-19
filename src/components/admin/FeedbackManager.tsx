
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MessageSquare, Star, CalendarDays, Smile, Meh, Frown, AlertTriangle, ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Sentiment = 'Positive' | 'Neutral' | 'Negative';

interface FeedbackItem {
  id: string;
  date: string;
  userEmail: string;
  rating?: number; // 1-5 stars
  comment: string;
  sentiment: Sentiment; // Positive, Neutral, Negative
  reportType?: 'Free' | 'Premium';
  status: 'New' | 'Reviewed' | 'Actioned';
}

const mockFeedbackData: FeedbackItem[] = [
  { id: 'fb_001', date: '2024-05-18', userEmail: 'happyuser@example.com', rating: 5, comment: 'This premium report is amazing! So detailed.', sentiment: 'Positive', reportType: 'Premium', status: 'Reviewed' },
  { id: 'fb_002', date: '2024-05-17', userEmail: 'studentA@example.com', comment: 'The free report was helpful to get started.', sentiment: 'Positive', reportType: 'Free', status: 'New' },
  { id: 'fb_003', date: '2024-05-16', userEmail: 'learnerB@example.com', rating: 3, comment: 'Could use more examples for my specific field in the premium.', sentiment: 'Neutral', reportType: 'Premium', status: 'Actioned' },
  { id: 'fb_004', date: '2024-05-15', userEmail: 'critic@example.com', rating: 2, comment: 'The UI was a bit confusing on mobile for the free report.', sentiment: 'Negative', reportType: 'Free', status: 'New' },
  { id: 'fb_005', date: '2024-05-19', userEmail: 'another@example.com', comment: 'Loved the roadmap section!', sentiment: 'Positive', reportType: 'Premium', status: 'New' },
];

const SentimentIcon: React.FC<{ sentiment: Sentiment }> = ({ sentiment }) => {
  if (sentiment === 'Positive') return <Smile className="h-5 w-5 text-green-500" />;
  if (sentiment === 'Neutral') return <Meh className="h-5 w-5 text-yellow-500" />;
  if (sentiment === 'Negative') return <Frown className="h-5 w-5 text-red-500" />;
  return null;
};

export function FeedbackManager() {
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>(mockFeedbackData);
  const [sortConfig, setSortConfig] = useState<{ key: keyof FeedbackItem | null; direction: 'ascending' | 'descending' }>({ key: 'date', direction: 'descending' });
  const [filterSentiment, setFilterSentiment] = useState<string>('all');

  useEffect(() => {
    let sortedItems = [...mockFeedbackData];
    if (sortConfig.key) {
      sortedItems.sort((a, b) => {
        if (a[sortConfig.key!] < b[sortConfig.key!]) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (a[sortConfig.key!] > b[sortConfig.key!]) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    if (filterSentiment !== 'all') {
      sortedItems = sortedItems.filter(item => item.sentiment.toLowerCase() === filterSentiment);
    }
    setFeedbackItems(sortedItems);
  }, [sortConfig, filterSentiment]);

  const requestSort = (key: keyof FeedbackItem) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIndicator = (key: keyof FeedbackItem) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? '▲' : '▼';
    }
    return <ArrowUpDown className="h-3 w-3 opacity-50 group-hover:opacity-100" />;
  };


  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold flex items-center">
        <MessageSquare className="mr-3 h-7 w-7 text-primary" />
        User Feedback & Support Tickets
      </h2>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Submitted Feedback</CardTitle>
          <CardDescription>Review and manage user feedback. (Mock Data)</CardDescription>
           <div className="mt-4">
            <Select value={filterSentiment} onValueChange={setFilterSentiment}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by sentiment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sentiments</SelectItem>
                <SelectItem value="Positive">Positive</SelectItem>
                <SelectItem value="Neutral">Neutral</SelectItem>
                <SelectItem value="Negative">Negative</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {feedbackItems.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer group" onClick={() => requestSort('date')}>Date {getSortIndicator('date')}</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="cursor-pointer group" onClick={() => requestSort('rating')}>Rating {getSortIndicator('rating')}</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead className="cursor-pointer group" onClick={() => requestSort('sentiment')}>Sentiment {getSortIndicator('sentiment')}</TableHead>
                  <TableHead>Report Type</TableHead>
                  <TableHead className="cursor-pointer group" onClick={() => requestSort('status')}>Status {getSortIndicator('status')}</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbackItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs">{new Date(item.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-xs">{item.userEmail}</TableCell>
                    <TableCell>
                      {item.rating ? (
                        <div className="flex items-center">
                          {Array(item.rating).fill(0).map((_, i) => <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />)}
                          {Array(5 - item.rating).fill(0).map((_, i) => <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />)}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate" title={item.comment}>{item.comment}</TableCell>
                    <TableCell><SentimentIcon sentiment={item.sentiment} /></TableCell>
                    <TableCell><Badge variant="outline">{item.reportType || 'N/A'}</Badge></TableCell>
                    <TableCell>
                        <Badge variant={item.status === 'New' ? 'destructive' : item.status === 'Reviewed' ? 'secondary' : 'default'}>
                            {item.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">View</Button> 
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">No feedback matching current filters.</p>
          )}
        </CardContent>
      </Card>

       <Card className="bg-yellow-50 border-yellow-200 shadow-md dark:bg-yellow-900/30 dark:border-yellow-700">
        <CardHeader className="flex flex-row items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600 dark:text-yellow-400" />
            <CardTitle className="text-yellow-700 dark:text-yellow-300 text-base">Developer Note</CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-600 dark:text-yellow-300/90 text-sm">
            Feedback data is mocked. A real system would require a form for users to submit feedback and a backend (e.g., Firebase Firestore) to store and manage these submissions.
            Features like sentiment analysis could be integrated using cloud AI services or libraries.
            A proper ticketing system would be a more advanced feature.
        </CardContent>
      </Card>
    </div>
  );
}
