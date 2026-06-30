const express = require('express');
const cors = require('cors');
const outcomeRoutes = require('./routes/outcomeRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) =>
{
    res.json({ status: 'ok' });
});

app.use('/api/outcomes', outcomeRoutes);

module.exports = app;