
import 'dotenv/config';
import app from './app.js';
import { initDatabase } from './config/db.js';

const PORT = process.env.PORT || 5000;

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log('Placement Portal Express Server running on port ' + PORT);
      console.log(`Base URL: http://localhost:${PORT}/api`);
      console.log(`Health Check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exitCode = 1;
  });
