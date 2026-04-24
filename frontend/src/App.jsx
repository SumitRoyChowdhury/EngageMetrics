import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import StudentProfile from './pages/StudentProfile';
import ClassroomView from './pages/ClassroomView';
import Reports from './pages/Reports';
import StudentPortal from './pages/StudentPortal';
import WorkspaceView from './pages/WorkspaceView';
import ParticipationEntry from './pages/ParticipationEntry';
import SheetsSync from './pages/SheetsSync';

const App = () => {
  const isAuthenticated = !!localStorage.getItem('user');

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/portal" element={<StudentPortal />} />
        
        <Route 
          path="/*" 
          element={
            isAuthenticated ? (
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/workspaces/:id" element={<WorkspaceView />} />
                  <Route path="/classrooms/:id" element={<ClassroomView />} />
                  <Route path="/students" element={<Students />} />
                  <Route path="/students/:id" element={<StudentProfile />} />
                  <Route path="/participation" element={<ParticipationEntry />} />
                  <Route path="/sheets-sync" element={<SheetsSync />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
      </Routes>
    </Router>
  );
};

export default App;
