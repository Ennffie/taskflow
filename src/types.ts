export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'member';
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export interface LogEntry {
  id: string;
  taskId: string;
  date: string;
  event: string;
  fileName?: string;
  category?: 'design' | 'research' | 'meeting' | 'review' | 'other';
  timeSpent?: string;
  createdBy: User;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignees: User[];
  dueDate?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  updatedBy: User;
  logCount: number;
}



export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  todo: { label: 'To Do', color: 'text-gray-600', bg: 'bg-gray-100' },
  in_progress: { label: 'In Progress', color: 'text-blue-600', bg: 'bg-blue-100' },
  review: { label: 'Review', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  done: { label: 'Done', color: 'text-green-600', bg: 'bg-green-100' },
};

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; dot: string }> = {
  low: { label: 'Low', color: 'text-gray-500', dot: 'bg-gray-400' },
  medium: { label: 'Medium', color: 'text-yellow-600', dot: 'bg-yellow-400' },
  high: { label: 'High', color: 'text-orange-600', dot: 'bg-orange-400' },
  urgent: { label: 'Urgent', color: 'text-red-600', dot: 'bg-red-500' },
};

// Mock data
const mockUsers: User[] = [
  { id: '1', name: 'Enfield Law', email: 'enfield@example.com', role: 'admin' },
  { id: '2', name: 'Claire Wong', email: 'claire@example.com', role: 'member' },
  { id: '3', name: 'Pamela Chau', email: 'pamela@example.com', role: 'member' },
  { id: '4', name: 'Silvie Yeung', email: 'silvie@example.com', role: 'member' },
  { id: '5', name: 'Alice Choi', email: 'alice@example.com', role: 'member' },
  { id: '6', name: 'Shani Law', email: 'shani@example.com', role: 'member' },
];

export const CURRENT_USER = mockUsers[0];

export const mockTasks: Task[] = [
  {
    id: 't1',
    title: 'CRCE Mobile App - Login Flow',
    description: 'Design the login and registration flow for CRCE mobile app',
    status: 'in_progress',
    priority: 'high',
    assignees: [mockUsers[1], mockUsers[2]],
    dueDate: '2026-04-15',
    tags: ['Design', 'Mobile'],
    createdAt: '2026-04-08',
    updatedAt: '2026-04-11',
    updatedBy: mockUsers[1],
    logCount: 5,
  },
  {
    id: 't2',
    title: 'CRM Dashboard Redesign',
    description: 'Redesign the main dashboard with new data visualization',
    status: 'todo',
    priority: 'medium',
    assignees: [mockUsers[2]],
    dueDate: '2026-04-18',
    tags: ['Design', 'Dashboard'],
    createdAt: '2026-04-09',
    updatedAt: '2026-04-10',
    updatedBy: mockUsers[2],
    logCount: 2,
  },
  {
    id: 't3',
    title: 'PCCW Portal - User Research',
    description: 'Conduct user interviews for the new portal design',
    status: 'review',
    priority: 'high',
    assignees: [mockUsers[3]],
    dueDate: '2026-04-12',
    tags: ['Research'],
    createdAt: '2026-04-05',
    updatedAt: '2026-04-11',
    updatedBy: mockUsers[3],
    logCount: 8,
  },
  {
    id: 't4',
    title: 'Design System Components Update',
    description: 'Update button, input, and card components to v2 spec',
    status: 'in_progress',
    priority: 'medium',
    assignees: [mockUsers[4], mockUsers[5]],
    tags: ['Design System'],
    createdAt: '2026-04-07',
    updatedAt: '2026-04-11',
    updatedBy: mockUsers[4],
    logCount: 3,
  },
  {
    id: 't5',
    title: 'Annual Report Infographics',
    description: 'Create infographics for the annual report',
    status: 'done',
    priority: 'low',
    assignees: [mockUsers[5]],
    dueDate: '2026-04-10',
    tags: ['Infographic'],
    createdAt: '2026-04-01',
    updatedAt: '2026-04-10',
    updatedBy: mockUsers[5],
    logCount: 6,
  },
  {
    id: 't6',
    title: 'Onboarding Flow Prototype',
    description: 'High-fidelity prototype for new user onboarding',
    status: 'todo',
    priority: 'urgent',
    assignees: [mockUsers[1]],
    dueDate: '2026-04-13',
    tags: ['Prototype', 'Mobile'],
    createdAt: '2026-04-10',
    updatedAt: '2026-04-10',
    updatedBy: mockUsers[1],
    logCount: 0,
  },
  {
    id: 't7',
    title: 'Accessibility Audit - Web Platform',
    description: 'WCAG 2.1 AA compliance audit for main web platform',
    status: 'todo',
    priority: 'medium',
    assignees: [mockUsers[3]],
    dueDate: '2026-04-20',
    tags: ['Audit', 'A11y'],
    createdAt: '2026-04-11',
    updatedAt: '2026-04-11',
    updatedBy: mockUsers[3],
    logCount: 0,
  },
];

export const mockLogEntries: Record<string, LogEntry[]> = {
  t1: [
    {
      id: 'l1',
      taskId: 't1',
      date: '2026-04-11',
      event: 'Completed wireframes for login screen. Updated flow to include biometric auth option.',
      category: 'design',
      timeSpent: '03:30',
      createdBy: mockUsers[1],
      createdAt: '2026-04-11T10:30:00',
    },
    {
      id: 'l2',
      taskId: 't1',
      date: '2026-04-11',
      event: 'Reviewed with team, got feedback on password reset flow. Need to simplify from 3 steps to 2.',
      fileName: 'login-wireframe-v2.fig',
      category: 'review',
      timeSpent: '01:00',
      createdBy: mockUsers[1],
      createdAt: '2026-04-11T14:00:00',
    },
    {
      id: 'l3',
      taskId: 't1',
      date: '2026-04-10',
      event: 'Started initial wireframes for login, signup, and forgot password screens.',
      category: 'design',
      timeSpent: '04:00',
      createdBy: mockUsers[1],
      createdAt: '2026-04-10T09:00:00',
    },
    {
      id: 'l4',
      taskId: 't1',
      date: '2026-04-09',
      event: 'Competitor analysis: reviewed 5 similar apps for login UX patterns.',
      fileName: 'competitor-analysis.pdf',
      category: 'research',
      timeSpent: '02:00',
      createdBy: mockUsers[1],
      createdAt: '2026-04-09T10:00:00',
    },
    {
      id: 'l5',
      taskId: 't1',
      date: '2026-04-08',
      event: 'Kickoff meeting with PM. Defined scope and timeline for login flow design.',
      category: 'meeting',
      timeSpent: '01:00',
      createdBy: mockUsers[1],
      createdAt: '2026-04-08T11:00:00',
    },
  ],
  t3: [
    {
      id: 'l6',
      taskId: 't3',
      date: '2026-04-11',
      event: 'Completed analysis of 12 user interviews. Key findings documented.',
      fileName: 'interview-findings.xlsx',
      category: 'research',
      timeSpent: '05:00',
      createdBy: mockUsers[3],
      createdAt: '2026-04-11T16:00:00',
    },
    {
      id: 'l7',
      taskId: 't3',
      date: '2026-04-10',
      event: 'Conducted 4 user interviews. Audio recordings saved.',
      category: 'research',
      timeSpent: '03:00',
      createdBy: mockUsers[3],
      createdAt: '2026-04-10T14:00:00',
    },
  ],
};
