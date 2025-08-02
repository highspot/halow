import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import expressLayouts from 'express-ejs-layouts';
import { DynamoDBService } from './services/dynamodb';
import { HealthController } from './controllers/health';
import { DashboardController } from './controllers/dashboard';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3400;

// Configure view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize services
const dynamoDBService = new DynamoDBService();

// Initialize controllers
const healthController = new HealthController();
const dashboardController = new DashboardController(dynamoDBService);

// Routes
app.get('/', dashboardController.index.bind(dashboardController));
app.get('/dashboard', dashboardController.index.bind(dashboardController));
app.post('/data', dashboardController.addData.bind(dashboardController));
app.delete('/data/:id', dashboardController.deleteData.bind(dashboardController));

// Health check routes (required for Kubernetes)
app.get('/probe/startup', healthController.startup.bind(healthController));
app.get('/probe/liveness', healthController.liveness.bind(healthController));
app.get('/probe/readiness', healthController.readiness.bind(healthController));

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Halow service listening on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`DynamoDB Table: ${process.env.DYNAMODB_TABLE_NAME || 'halow-data'}`);
});

export default app;