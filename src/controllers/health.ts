import { Request, Response } from 'express';

export class HealthController {
  // Startup probe - indicates if the application has started successfully
  startup(req: Request, res: Response): void {
    res.status(200).json({
      status: 'healthy',
      service: 'halow',
      timestamp: new Date().toISOString(),
      probe: 'startup'
    });
  }

  // Liveness probe - indicates if the application is running
  liveness(req: Request, res: Response): void {
    res.status(200).json({
      status: 'healthy',
      service: 'halow',
      timestamp: new Date().toISOString(),
      probe: 'liveness'
    });
  }

  // Readiness probe - indicates if the application is ready to serve traffic
  readiness(req: Request, res: Response): void {
    // In a real application, you might check database connectivity here
    res.status(200).json({
      status: 'ready',
      service: 'halow',
      timestamp: new Date().toISOString(),
      probe: 'readiness'
    });
  }
}