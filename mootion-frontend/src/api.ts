import { 
  User, ClassInfo, ChapterInfo, AssignmentInfo, 
  DoubtEntry, ClassAnalytics, ChapterAnalytics, StudentAnalytics, StudentTask, Language
} from './types';

const API_BASE = 'http://localhost:8000'; // Default backend location

// Helper to get headers
function getHeaders() {
  const token = localStorage.getItem('mootion_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

// Global API Object
export const api = {
  // --- AUTH ENDPOINTS ---
  async register(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Registration failed');
    const data = await res.json();
    localStorage.setItem('mootion_token', data.access_token);
    localStorage.setItem('mootion_role', data.role);
    return data;
  },

  async login(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Login failed');
    const data = await res.json();
    localStorage.setItem('mootion_token', data.access_token);
    localStorage.setItem('mootion_role', data.role);
    return data;
  },

  async logout(): Promise<void> {
    const token = localStorage.getItem('mootion_token');
    if (token) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ refresh_token: token })
        });
      } catch (e) {
        console.error('Logout request failed', e);
      }
    }
    localStorage.removeItem('mootion_token');
    localStorage.removeItem('mootion_role');
  },

  async getCurrentUser(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  async getGoogleStartUrl(role: 'student' | 'teacher'): Promise<string> {
    const res = await fetch(`${API_BASE}/auth/google/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Failed to initiate Google sign-in');
    const data = await res.json();
    return data.authorization_url;
  },

  async handleGoogleCallback(code: string, state: string): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/google/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Google sign-in callback failed');
    const data = await res.json();
    localStorage.setItem('mootion_token', data.access_token);
    localStorage.setItem('mootion_role', data.role);
    return data;
  },

  // --- TEACHER FLOW ENDPOINTS ---
  async setTeacherPreferences(lang: string): Promise<any> {
    const res = await fetch(`${API_BASE}/teachers/onboarding/preferences`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ preferred_language: lang })
    });
    return res.json();
  },

  async completeTeacherOnboarding(loadNcert: boolean): Promise<any> {
    const res = await fetch(`${API_BASE}/teachers/onboarding/complete`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ load_ncert: loadNcert })
    });
    return res.json();
  },

  async createClass(grade: string, subject: string): Promise<ClassInfo> {
    const res = await fetch(`${API_BASE}/teachers/classes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ grade, subject })
    });
    if (!res.ok) throw new Error('Failed to create class');
    return res.json();
  },

  async getTeacherClasses(): Promise<ClassInfo[]> {
    const res = await fetch(`${API_BASE}/teachers/classes`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to load classes');
    return res.json();
  },

  // --- CURRICULUM & CHAPTERS ---
  async bootstrapCurriculum(classId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/teachers/classes/${classId}/curriculum/bootstrap`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to bootstrap curriculum');
    return res.json();
  },

  async getCurricula(classId: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/teachers/classes/${classId}/curriculum`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to get curricula');
    return res.json();
  },

  async getCurriculumDetails(classId: string, curriculumId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/teachers/classes/${classId}/curriculum/${curriculumId}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch curriculum details');
    return res.json();
  },

  async bootstrapChapters(classId: string, curriculumId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/teachers/classes/${classId}/chapters/bootstrap`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ curriculum_id: curriculumId })
    });
    if (!res.ok) throw new Error('Failed to bootstrap chapters');
    return res.json();
  },

  async getChapters(classId: string): Promise<ChapterInfo[]> {
    const res = await fetch(`${API_BASE}/teachers/classes/${classId}/chapters`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to load chapters');
    return res.json();
  },

  async getChapterDetails(classId: string, chapterId: string): Promise<ChapterInfo> {
    const res = await fetch(`${API_BASE}/teachers/classes/${classId}/chapters/${chapterId}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch chapter details');
    return res.json();
  },

  // --- ASSIGNMENTS ---
  async createAssignment(classId: string, payload: { chapter_id: string, assignment_type: string, title: string, instructions?: string }): Promise<AssignmentInfo> {
    const res = await fetch(`${API_BASE}/teachers/classes/${classId}/assignments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create assignment');
    }
    return res.json();
  },

  async getAssignments(classId: string): Promise<AssignmentInfo[]> {
    const res = await fetch(`${API_BASE}/teachers/classes/${classId}/assignments`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch assignments');
    return res.json();
  },

  async getAssignmentDetails(classId: string, assignmentId: string): Promise<AssignmentInfo> {
    const res = await fetch(`${API_BASE}/teachers/classes/${classId}/assignments/${assignmentId}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch assignment details');
    return res.json();
  },

  // --- STUDENT FLOW ENDPOINTS ---
  async joinClass(classCode: string): Promise<any> {
    const res = await fetch(`${API_BASE}/students/join-class`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ class_code: classCode })
    });
    if (!res.ok) throw new Error('Invalid class code');
    return res.json();
  },

  async getStudentClasses(): Promise<ClassInfo[]> {
    const res = await fetch(`${API_BASE}/students/classes`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch student classes');
    return res.json();
  },

  async setStudentLanguage(lang: string): Promise<any> {
    const res = await fetch(`${API_BASE}/students/language`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ preferred_language: lang })
    });
    return res.json();
  },

  async getStudentAssignments(classId: string): Promise<StudentTask[]> {
    const res = await fetch(`${API_BASE}/students/classes/${classId}/assignments`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch student tasks');
    const data = await res.json();
    return data.map((t: any) => ({
      assignment_id: t.assignment_id,
      class_id: t.class_id,
      chapter_id: t.chapter_id,
      chapter_title: t.title || 'Chapter Topic',
      assignment_type: t.assignment_type,
      title: t.title,
      instructions: t.instructions,
      status: getMockTaskStatus(t.assignment_id),
      deadline: new Date(Date.now() + 86400000 * 2).toLocaleDateString(),
      attempts: getMockAttempts(t.assignment_id)
    }));
  },

  // --- MOCK OR EXTENDED FEATURES (LOCAL STORAGE & BACKEND) ---
  
  // Internal helper for local storage doubts fallback
  getDoubtsLocal(): DoubtEntry[] {
    const doubts = localStorage.getItem('mootion_doubts');
    if (!doubts) {
      const initial: DoubtEntry[] = [
        {
          doubt_id: 'd1',
          student_id: 's1',
          student_name: 'Rahul Kumar',
          topic: 'Electric Current',
          text: 'I do not understand why electron drift velocity is so slow but the bulb glows instantly.',
          video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
          status: 'pending',
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          doubt_id: 'd2',
          student_id: 's2',
          student_name: 'Priya Patel',
          topic: 'Ohm\'s Law',
          text: 'Does temperature affect resistance in non-ohmic conductors? How does it look on a V-I graph?',
          video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
          status: 'pending',
          created_at: new Date(Date.now() - 7200000).toISOString()
        }
      ];
      localStorage.setItem('mootion_doubts', JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(doubts);
  },

  // Doubt Flow
  async getDoubts(): Promise<DoubtEntry[]> {
    let classId = localStorage.getItem('active_class_id');
    if (!classId) {
      const classes = await this.getTeacherClasses();
      if (classes.length > 0) {
        classId = classes[0].class_id;
      }
    }
    if (!classId) {
      return [];
    }
    const res = await fetch(`${API_BASE}/teachers/classes/${classId}/doubts`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch doubts');
    const list = await res.json();
    return list.map((d: any) => ({
      doubt_id: d.doubt_id,
      student_id: d.student_id,
      student_name: d.student_name,
      topic: d.topic,
      text: d.query_text,
      video_url: d.clarification_video_url,
      status: d.status,
      created_at: d.created_at,
      response_text: d.response_text || undefined,
      response_audio_url: d.response_audio_url || undefined
    }));
  },

  async saveDoubt(doubt: any): Promise<any> {
    try {
      let classId = localStorage.getItem('active_class_id');
      if (!classId) {
        const classes = await this.getStudentClasses();
        if (classes.length > 0) classId = classes[0].class_id;
      }
      const res = await fetch(`${API_BASE}/students/doubts`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          class_id: classId || 'unknown-class',
          query_text: doubt.text,
          tried_before: true,
          attempt_text: doubt.text
        })
      });
      if (res.ok) {
        const saved = await res.json();
        // Update local storage so teacher dashboard syncs locally if offline
        const doubts = this.getDoubtsLocal();
        doubts.unshift({
          doubt_id: saved.doubt_id,
          student_id: saved.student_id,
          student_name: saved.student_name,
          topic: saved.topic,
          text: saved.query_text,
          video_url: saved.clarification_video_url,
          status: saved.status,
          created_at: saved.created_at
        });
        localStorage.setItem('mootion_doubts', JSON.stringify(doubts));
        return saved;
      }
    } catch (e) {
      console.warn('Backend saveDoubt failed, using local fallback', e);
    }

    const doubts = this.getDoubtsLocal();
    doubts.unshift(doubt);
    localStorage.setItem('mootion_doubts', JSON.stringify(doubts));
  },

  async respondToDoubt(doubtId: string, responseAudio: string, responseText: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/teachers/doubts/${doubtId}/respond`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          response_text: responseText,
          voice_note_file_url: responseAudio || null
        })
      });
      if (res.ok) {
        const updated = await res.json();
        const doubts = this.getDoubtsLocal();
        const mapped = doubts.map(d => d.doubt_id === doubtId ? {
          ...d,
          status: 'resolved' as const,
          response_audio_url: updated.response_audio_url,
          response_text: updated.response_text
        } : d);
        localStorage.setItem('mootion_doubts', JSON.stringify(mapped));
        return updated;
      }
    } catch (e) {
      console.warn('Backend respondToDoubt failed, using local fallback', e);
    }

    const doubts = this.getDoubtsLocal();
    const updated = doubts.map(d => d.doubt_id === doubtId ? { ...d, status: 'resolved' as const, response_audio_url: responseAudio, response_text: responseText } : d);
    localStorage.setItem('mootion_doubts', JSON.stringify(updated));
  },

  // Teacher Alerts
  getTeacherAlerts(classId: string): { id: string; text: string; actionUrl: string; type: 'warning' | 'info' | 'success' }[] {
    return [
      {
        id: 'a1',
        text: '4 students in Class 8 Physics haven\'t started Electric Current, deadline tomorrow.',
        actionUrl: `/teacher/class/${classId}?tab=chapters`,
        type: 'warning'
      },
      {
        id: 'a2',
        text: 'New misconceptions detected in Class 8 Physics — 6 students.',
        actionUrl: `/teacher/class/${classId}?tab=analytics`,
        type: 'info'
      },
      {
        id: 'a3',
        text: 'Class 8 Physics: 18 of 24 students completed last assignment.',
        actionUrl: `/teacher/class/${classId}?tab=analytics`,
        type: 'success'
      }
    ];
  },

  // Analytics - Class Overview
  async getClassAnalytics(classId: string): Promise<ClassAnalytics> {
    const res = await fetch(`${API_BASE}/teachers/classes/${classId}/analytics/overview`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch class analytics');
    return res.json();
  },

  // Analytics - Chapter Drill
  async getChapterAnalytics(chapterId: string, chapterTitle: string): Promise<ChapterAnalytics> {
    let classId = localStorage.getItem('active_class_id');
    if (!classId) {
      const classes = await this.getTeacherClasses();
      if (classes.length > 0) classId = classes[0].class_id;
    }
    if (!classId) {
      throw new Error('No active class selected');
    }
    const res = await fetch(`${API_BASE}/teachers/classes/${classId}/chapters/${chapterId}/analytics`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch chapter analytics');
    return res.json();
  },

  // Analytics - Student Detail
  async getStudentAnalytics(studentId: string, studentName: string): Promise<StudentAnalytics> {
    const res = await fetch(`${API_BASE}/teachers/students/${studentId}/analytics`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch student analytics');
    return res.json();
  },

  // Student Submissions / Activities Grader Call
  async submitTaskAttempt(assignmentId: string, attempt: any): Promise<any> {
    try {
      let classId = localStorage.getItem('active_class_id');
      if (!classId) {
        const classes = await this.getStudentClasses();
        if (classes.length > 0) classId = classes[0].class_id;
      }
      if (classId) {
        const res = await fetch(`${API_BASE}/students/classes/${classId}/assignments/${assignmentId}/submit`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            transcription_text: attempt.transcription_text || attempt.feedback || '',
            language: localStorage.getItem('mootion_language') || 'english'
          })
        });
        if (res.ok) {
          const data = await res.json();
          // Update local storage status
          localStorage.setItem(`status_${assignmentId}`, 'completed');
          const attempts = getMockAttempts(assignmentId);
          attempts.push({
            attempt_id: data.attempt_id,
            date: new Date().toLocaleDateString(),
            understanding: data.score_understanding,
            reasoning: data.score_reasoning,
            expression: data.score_expression,
            feedback: data.ai_feedback
          });
          localStorage.setItem(`attempts_${assignmentId}`, JSON.stringify(attempts));
          return data;
        }
      }
    } catch (e) {
      console.warn('Backend submitTaskAttempt failed, using local mock fallback', e);
    }

    const attempts = getMockAttempts(assignmentId);
    attempts.push(attempt);
    localStorage.setItem(`attempts_${assignmentId}`, JSON.stringify(attempts));
    localStorage.setItem(`status_${assignmentId}`, 'completed');
  },

  // Quota Management
  async getDoubtQuotas(): Promise<{ used: number, max: number }> {
    try {
      const res = await fetch(`${API_BASE}/students/quotas`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        return { used: data.doubt_videos_used_today, max: data.doubt_videos_max };
      }
    } catch (e) {
      console.warn('Backend quotas failed, using local storage', e);
    }
    const used = Number(localStorage.getItem('quota_doubt_used') || '2');
    return { used, max: 5 };
  },

  useDoubtQuota() {
    const used = Number(localStorage.getItem('quota_doubt_used') || '2');
    localStorage.setItem('quota_doubt_used', String(Math.min(5, used + 1)));
  },

  async getPlaygroundQuotas(): Promise<{ used: number, max: number }> {
    try {
      const res = await fetch(`${API_BASE}/students/quotas`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        return { used: data.playground_items_used_week, max: data.playground_items_max };
      }
    } catch (e) {
      console.warn('Backend quotas failed, using local storage', e);
    }
    const used = Number(localStorage.getItem('quota_playground_used') || '4');
    return { used, max: 10 };
  },

  usePlaygroundQuota() {
    const used = Number(localStorage.getItem('quota_playground_used') || '4');
    localStorage.setItem('quota_playground_used', String(Math.min(10, used + 1)));
  },

  async generatePlayground(topic: string, assetType: string): Promise<any> {
    const res = await fetch(`${API_BASE}/students/playground/generate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        topic,
        asset_type: assetType
      })
    });
    if (!res.ok) throw new Error('Failed to generate playground item');
    return res.json();
  }

};

// Internal Mock Storage Helpers
function getMockChapters(classId: string) {
  const data = localStorage.getItem(`chapters_${classId}`);
  return data ? JSON.parse(data) : [];
}

function saveMockChapters(classId: string, chapters: any[]) {
  localStorage.setItem(`chapters_${classId}`, JSON.stringify(chapters));
}

function getMockTaskStatus(assignmentId: string): 'not_started' | 'in_progress' | 'completed' {
  return (localStorage.getItem(`status_${assignmentId}`) as any) || 'not_started';
}

function getMockAttempts(assignmentId: string) {
  const data = localStorage.getItem(`attempts_${assignmentId}`);
  return data ? JSON.parse(data) : [];
}

function getFallbackTasks(classId: string): StudentTask[] {
  return [
    {
      assignment_id: 'task-1',
      class_id: classId,
      chapter_id: 'c1',
      chapter_title: 'Electric Current',
      assignment_type: 'explain_it',
      title: 'Explain Electric Current',
      instructions: 'Explain the difference between conventional current and electron flow.',
      status: getMockTaskStatus('task-1'),
      deadline: new Date(Date.now() + 86400000).toLocaleDateString(),
      attempts: getMockAttempts('task-1')
    },
    {
      assignment_id: 'task-2',
      class_id: classId,
      chapter_id: 'c1',
      chapter_title: 'Electric Current',
      assignment_type: 'predict_it',
      title: 'Predict bulb brightness',
      instructions: 'Predict what happens to brightness when adding resistors in parallel.',
      status: getMockTaskStatus('task-2'),
      deadline: new Date(Date.now() + 86400000 * 3).toLocaleDateString(),
      attempts: getMockAttempts('task-2')
    }
  ];
}
