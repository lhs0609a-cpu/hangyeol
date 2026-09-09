import { firstStepById } from '@hangyeol/content';
import { Workbook } from './Workbook';

export const metadata = {
  title: 'First Steps — Your Korean workbook | SAMAT',
  description: '14 illustrated Korean beginner lessons with English support, dialogues, practice questions, and speaking missions. Free to explore without an account.',
};

export default function LearnPage({ searchParams }: { searchParams: { lesson?: string } }) {
  const lesson = typeof searchParams.lesson === 'string' ? firstStepById(searchParams.lesson) : undefined;
  return <Workbook initialLesson={lesson?.id} />;
}
