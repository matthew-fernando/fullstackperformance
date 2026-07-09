import express from 'express';
import cors from 'cors';
import outcomeRoutes from './routes/outcomeRoutes.js';
import leafMappingRoutes from './routes/leafMappingRoutes.js';
import performanceIndicatorRoutes from './routes/performanceIndicatorRoutes.js';


const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) =>
{
    res.json({ status: 'ok' });
});

app.use('/api/outcomes', outcomeRoutes);
app.use('/api', leafMappingRoutes);
app.use('/api/performance-indicators', performanceIndicatorRoutes);

export default app;
