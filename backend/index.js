import app from './src/app.js';
import { validateServerEnvironment } from './src/config/env.js';

validateServerEnvironment();

export default app;
