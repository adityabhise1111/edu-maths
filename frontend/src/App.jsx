import { useState } from 'react'
import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from './pages/Landing/Landing.jsx'
import TeacherLogin from './auth/TeacherAuth/TeacherLogin.jsx';
import TeacherSignup from './auth/TeacherAuth/TeacherSignup.jsx';
import CreateAcademy from './academy/CreateAcademy.jsx';
import AcademyPage from './academy/AcademyStuff/Page.jsx';
import StudentLogin from './auth/StudentAuth/StudentLogin.jsx';
import TeacherDashboard from './dashboard/DashFinal.jsx';
import TeacherExamMonitoring from './dashboard/TeacherExamMonitoring.jsx';
import StudentExamDetails from './dashboard/StudentExamDetails.jsx';
import StudentsList from './dashboard/StudentsList.jsx';
import StudentsPerformance from './dashboard/StudentsPerformance.jsx';
import StudentPerformanceDetails from './dashboard/StudentPerformanceDetails.jsx';
import CreateExam from './dashboard/CreateExam.jsx';
import ExamPage from './exam/ExamPage.jsx';
import NotFound from './common/NotFound/NotFound.jsx';
import Footer from './common/Footer/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {

  return (

    <BrowserRouter>
      {/* <Navbar /> */}

      <Routes>
        {/* Landing */}
        <Route path="/" element={<LandingPage />} />

        {/* Teacher auth */}
        <Route path="/login" element={<TeacherLogin />} />
        <Route path="/login/*" element={<TeacherLogin />} />
        <Route path="/signup" element={<TeacherSignup />} />
        <Route path="/signup/*" element={<TeacherSignup />} />
        
        {/* Academy creation - Protected teacher route */}
        <Route 
          path="/create-academy" 
          element={
            <ProtectedRoute type="teacher">
              <CreateAcademy />
            </ProtectedRoute>
          } 
        />

        {/* Academy public */}
        <Route path="/:academySlug" element={<AcademyPage />} />

        {/* Student login */}
        <Route path="/:academySlug/login" element={<StudentLogin />} />
        
        {/* Teacher dashboard - Protected routes with academy requirement */}
        <Route 
          path="/:academySlug/dashboard" 
          element={
            <ProtectedRoute type="teacher" requireAcademy>
              <TeacherDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/:academySlug/dashboard/create-exam" 
          element={
            <ProtectedRoute type="teacher" requireAcademy>
              <CreateExam />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/:academySlug/dashboard/exams/:examId" 
          element={
            <ProtectedRoute type="teacher" requireAcademy>
              <TeacherExamMonitoring />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/:academySlug/dashboard/exams/:examId/student/:studentId" 
          element={
            <ProtectedRoute type="teacher" requireAcademy>
              <StudentExamDetails />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/:academySlug/students" 
          element={
            <ProtectedRoute type="teacher" requireAcademy>
              <StudentsList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/:academySlug/students/:studentId" 
          element={
            <ProtectedRoute type="teacher" requireAcademy>
              <StudentPerformanceDetails />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/:academySlug/results" 
          element={
            <ProtectedRoute type="teacher" requireAcademy>
              <StudentsPerformance />
            </ProtectedRoute>
          } 
        />
        
        {/* Student exam - Protected student route */}
        <Route 
          path="/:academySlug/exam/:examId" 
          element={
            <ProtectedRoute type="student">
              <ExamPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      <Footer />
    </BrowserRouter>

  );
}

export default App
