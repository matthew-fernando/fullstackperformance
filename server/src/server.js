import 'dotenv/config';
import app from './app.js';
import connectDB from './db.js';

const PORT = process.env.PORT || 5001;

async function start()
{
    await connectDB();
    app.listen(PORT, () =>
    {
        console.log(`Server running on port ${PORT}`);
    });
}

start();
