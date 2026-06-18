import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { StudentLoginPage } from './pages/StudentLoginPage';
import { StudentSignupPage } from './pages/StudentSignupPage';
import { StudentHomePage } from './pages/StudentHomePage';
import { StudentTasksPage } from './pages/StudentTasksPage';
import { StudentTaskActivityPage } from './pages/StudentTaskActivityPage';
import { StudentExplorePage } from './pages/StudentExplorePage';
import { StudentPlaygroundPage } from './pages/StudentPlaygroundPage';

// Teacher Imports
import { TeacherLoginPage } from './pages/TeacherLoginPage';
import { TeacherOnboardingPage } from './pages/TeacherOnboardingPage';
import { TeacherDashboardPage } from './pages/TeacherDashboardPage';
import { TeacherClassViewPage } from './pages/TeacherClassViewPage';
import { TeacherChapterSetupPage } from './pages/TeacherChapterSetupPage';
import { TeacherBroadcastPage } from './pages/TeacherBroadcastPage';
import { TeacherAnalyticsPage } from './pages/TeacherAnalyticsPage';
import { TeacherDoubtsPage } from './pages/TeacherDoubtsPage';
import { TeacherTopicSetupPage } from './pages/TeacherTopicSetupPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/login/student" element={<StudentLoginPage />} />
        <Route path="/signup/student" element={<StudentSignupPage />} />
        <Route path="/student/home" element={<StudentHomePage />} />
        <Route path="/student/tasks" element={<StudentTasksPage />} />
        <Route path="/student/task/:taskId" element={<StudentTaskActivityPage />} />
        <Route path="/student/explore" element={<StudentExplorePage />} />
        <Route path="/student/explore/:subjectCode/:chapterId" element={<StudentExplorePage />} />
        <Route path="/student/playground" element={<StudentPlaygroundPage />} />

        {/* Teacher Routes */}
        <Route path="/teacher/login" element={<TeacherLoginPage />} />
        <Route path="/teacher/onboarding" element={<TeacherOnboardingPage />} />
        <Route path="/teacher/home" element={<TeacherDashboardPage />} />
        <Route path="/teacher/class/:id" element={<TeacherClassViewPage />} />
        <Route path="/teacher/chapter-setup/:classId/:chapterId" element={<TeacherChapterSetupPage />} />
        <Route path="/teacher/topic-setup/:classId/:chapterId/:topicId" element={<TeacherTopicSetupPage />} />
        <Route path="/teacher/broadcast" element={<TeacherBroadcastPage />} />
        <Route path="/teacher/analytics" element={<TeacherAnalyticsPage />} />
        <Route path="/teacher/doubts" element={<TeacherDoubtsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
