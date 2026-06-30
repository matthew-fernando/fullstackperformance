import { Routes, Route } from 'react-router-dom';
import OutcomeTreePage from './OutcomeTreePage';
import PIReviewPage from './PIReviewPage';

function App()
{
    return (
        <Routes>
            <Route path="/" element={<OutcomeTreePage />} />
            <Route path="/pis" element={<PIReviewPage />} />
        </Routes>
    );
}

export default App;