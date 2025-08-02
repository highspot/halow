import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  ScanCommand, 
  PutCommand, 
  DeleteCommand,
  GetCommand 
} from '@aws-sdk/lib-dynamodb';

export interface HalowDataItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export class DynamoDBService {
  private client: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    // Initialize DynamoDB client
    // The AWS SDK will automatically use IAM roles when running in EKS
    const dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.tableName = process.env.DYNAMODB_TABLE_NAME || 'halow-data';
  }

  async getAllItems(): Promise<HalowDataItem[]> {
    try {
      const command = new ScanCommand({
        TableName: this.tableName
      });
      
      const result = await this.client.send(command);
      return (result.Items as HalowDataItem[]) || [];
    } catch (error) {
      console.error('Error fetching items from DynamoDB:', error);
      throw error;
    }
  }

  async getItem(id: string): Promise<HalowDataItem | null> {
    try {
      const command = new GetCommand({
        TableName: this.tableName,
        Key: { id }
      });
      
      const result = await this.client.send(command);
      return (result.Item as HalowDataItem) || null;
    } catch (error) {
      console.error('Error fetching item from DynamoDB:', error);
      throw error;
    }
  }

  async putItem(item: HalowDataItem): Promise<void> {
    try {
      const command = new PutCommand({
        TableName: this.tableName,
        Item: {
          ...item,
          timestamp: new Date().toISOString()
        }
      });
      
      await this.client.send(command);
    } catch (error) {
      console.error('Error putting item to DynamoDB:', error);
      throw error;
    }
  }

  async deleteItem(id: string): Promise<void> {
    try {
      const command = new DeleteCommand({
        TableName: this.tableName,
        Key: { id }
      });
      
      await this.client.send(command);
    } catch (error) {
      console.error('Error deleting item from DynamoDB:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Simple health check - try to scan the table (limit 1 item)
      const command = new ScanCommand({
        TableName: this.tableName,
        Limit: 1
      });
      
      await this.client.send(command);
      return true;
    } catch (error) {
      console.error('DynamoDB health check failed:', error);
      return false;
    }
  }
}