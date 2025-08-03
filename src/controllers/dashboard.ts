import { Request, Response } from 'express';
import { DynamoDBService, HalowDataItem } from '../services/dynamodb';
import { v4 as uuidv4 } from 'uuid';

export class DashboardController {
  constructor(private dynamoDBService: DynamoDBService) {}

  async index(req: Request, res: Response): Promise<void> {
    try {
      const items = await this.dynamoDBService.getAllItems();
      
      // Sort by timestamp (newest first)
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      res.render('dashboard', {
        title: 'Halow Dashboard',
        items,
        environment: process.env.NODE_ENV || 'development',
        tableName: process.env.DYNAMODB_TABLE_NAME || 'halow-data'
      });
    } catch (error) {
      console.error('Error rendering dashboard:', error);
      
      // For AWS credential errors, show dashboard with empty data instead of error page
      if (error instanceof Error && error.message.includes('CredentialsProviderError')) {
        res.render('dashboard', {
          title: 'Halow Dashboard',
          items: [],
          environment: process.env.NODE_ENV || 'development',
          tableName: process.env.DYNAMODB_TABLE_NAME || 'halow-data',
          awsError: 'Could not connect to DynamoDB. Please configure AWS credentials.'
        });
      } else {
        res.status(500).render('error', {
          title: 'Error',
          message: 'Failed to load dashboard data',
          error: error instanceof Error ? error.message : 'Unknown error',
          environment: process.env.NODE_ENV || 'development',
          tableName: process.env.DYNAMODB_TABLE_NAME || 'halow-data'
        });
      }
    }
  }

  async addData(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, metadata } = req.body;
      
      if (!title || !description) {
        res.status(400).json({ error: 'Title and description are required' });
        return;
      }

      const item: HalowDataItem = {
        id: uuidv4(),
        title,
        description,
        timestamp: new Date().toISOString(),
        metadata: metadata ? JSON.parse(metadata) : undefined
      };

      await this.dynamoDBService.putItem(item);
      
      res.redirect('/dashboard');
    } catch (error) {
      console.error('Error adding data:', error);
      res.status(500).json({ 
        error: 'Failed to add data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteData(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({ error: 'ID is required' });
        return;
      }

      await this.dynamoDBService.deleteItem(id);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting data:', error);
      res.status(500).json({ 
        error: 'Failed to delete data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}