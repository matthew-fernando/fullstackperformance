import { Routes, Route } from 'react-router-dom';
import OutcomeTreePage from './OutcomeTreePage';
import PIReviewPage from './PIReviewPage';
import AssignmentsPage from './AssignmentsPage.jsx';
import OutcomeRubricPage from './OutcomeRubricPage.jsx';

function App()
{
    return (
        <Routes>
            <Route path="/" element={<OutcomeTreePage />} />
            <Route path="/pis" element={<PIReviewPage />} />
            <Route path="/assignments" element={<AssignmentsPage />} />
            <Route path="/rubric" element={<OutcomeRubricPage />} />
        </Routes>
    );
}

export default App;