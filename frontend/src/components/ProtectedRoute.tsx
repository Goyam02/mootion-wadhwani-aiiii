import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: 'student' | 'teacher';
}

export function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem('mootion_access_token');
  const role = localStorage.getItem('mootion_role');

  useEffect(() => {
    if (!token) {
      if (location.pathname.startsWith('/teacher')) {
        navigate('/teacher/login', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
      return;
    }

    if (role === 'student' && location.pathname.startsWith('/teacher')) {
      navigate('/login', { replace: true });
      return;
    }

    if (role === 'teacher' && location.pathname.startsWith('/student')) {
      navigate('/teacher/home', { replace: true });
      return;
    }
  }, [token, role, location.pathname, navigate]);

  const isAuthorized = () => {
    if (!token) return false;
    if (role === 'student' && location.pathname.startsWith('/teacher')) return false;
    if (role === 'teacher' && location.pathname.startsWith('/student')) return false;
    return role === allowedRole;
  };

  return isAuthorized() ? <>{children}</> : null;
}

export function LoginRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('mootion_access_token');
  const role = localStorage.getItem('mootion_role');

  useEffect(() => {
    if (token && role) {
      if (role === 'teacher') {
        navigate('/teacher/home', { replace: true });
      } else if (role === 'student') {
        navigate('/student/home', { replace: true });
      }
    }
  }, [token, role, navigate]);

  if (token && role) return null;
  return <>{children}</>;
}
