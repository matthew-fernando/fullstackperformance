import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.jsx';
import CourseLayout from './layouts/CourseLayout.jsx';
import CoursesPage from './CoursesPage.jsx';
import OutcomesPage from './OutcomesPage.jsx';
import OutcomeTreePage from './OutcomeTreePage';
import PerformanceIndicatorsPage from './PerformanceIndicatorsPage.jsx';
import AssignmentsPage from './AssignmentsPage.jsx';
import OutcomeRubricPage from './OutcomeRubricPage.jsx';
import OutcomeEvaluationPage from './OutcomeEvaluationPage.jsx';
import StudentsPage from './StudentsPage.jsx';
import CourseInfoPage from './CourseInfoPage.jsx';


function App()
{
    return (
        <Routes>
            <Route element={<MainLayout />}>
                <Route path="/" element={<CoursesPage />} />
                <Route path="/outcomes" element={<OutcomesPage />} />
            </Route>

            <Route path="/classes/:classId" element={<CourseLayout />}>
                <Route index element={<Navigate to="evaluation" replace />} />
                <Route path="evaluation" element={<OutcomeEvaluationPage />} />
                <Route path="rubrics" element={<OutcomeRubricPage />} />
                <Route path="pis" element={<PerformanceIndicatorsPage />} />
                <Route path="trees" element={<OutcomeTreePage />} />
                <Route path="assignments" element={<AssignmentsPage />} />
                <Route path="students" element={<StudentsPage />} />
                <Route path="course-info" element={<CourseInfoPage />} />
            </Route>
        </Routes>
    );
}

export default App;