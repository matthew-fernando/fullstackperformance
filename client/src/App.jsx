import { Routes, Route } from 'react-router-dom';
import ClassDashboardPage from './ClassDashboardPage.jsx';
import OutcomeTreePage from './OutcomeTreePage';
import PIReviewPage from './PIReviewPage';
import AssignmentsPage from './AssignmentsPage.jsx';
import OutcomeRubricPage from './OutcomeRubricPage.jsx';
import OutcomeEvaluationPage from './OutcomeEvaluationPage.jsx';


function App()
{
    return (
        <Routes>
            <Route path="/" element={<ClassDashboardPage />} />
            <Route path="/classes/:classId" element={<OutcomeTreePage />} />
            <Route path="/classes/:classId/pis" element={<PIReviewPage />} />
            <Route path="/classes/:classId/assignments" element={<AssignmentsPage />} />
            <Route path="/classes/:classId/rubric" element={<OutcomeRubricPage />} />
            <Route path="/classes/:classId/evaluation" element={<OutcomeEvaluationPage />} />
        </Routes>
    );
}

export default App;