import { Routes, Route } from 'react-router-dom';
import OutcomeTreePage from './OutcomeTreePage';
import PIReviewPage from './PIReviewPage';
import AssignmentsPage from './AssignmentsPage.jsx';

function App()
{
    return (
        <Routes>
            <Route path="/" element={<OutcomeTreePage />} />
            <Route path="/pis" element={<PIReviewPage />} />
            <Route path="/assignments" element={<AssignmentsPage />} />
        </Routes>
    );
}

export default App;