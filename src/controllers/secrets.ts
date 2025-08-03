import { Request, Response } from 'express';
import { SecretsManagerService, SecretInfo } from '../services/secretsmanager';

export class SecretsController {
  constructor(private secretsManagerService: SecretsManagerService) {}

  async index(req: Request, res: Response): Promise<void> {
    const commonData = {
      title: 'Secrets Manager',
      environment: process.env.NODE_ENV || 'development',
      tableName: process.env.DYNAMODB_TABLE_NAME || 'halow-data',
      currentTab: 'secrets'
    };

    try {
      const { search, tag } = req.query;
      let secrets: SecretInfo[];

      if (search && typeof search === 'string') {
        secrets = await this.secretsManagerService.searchSecrets(search);
      } else if (tag && typeof tag === 'string') {
        const [tagKey, tagValue] = tag.split('=');
        secrets = await this.secretsManagerService.getSecretsByTag(tagKey, tagValue);
      } else {
        secrets = await this.secretsManagerService.getAllSecrets();
      }

      // Sort by name
      secrets.sort((a, b) => a.name.localeCompare(b.name));

      // Get all unique tags for filtering
      const allTags = new Set<string>();
      secrets.forEach(secret => {
        Object.keys(secret.tags).forEach(tagKey => {
          allTags.add(`${tagKey}=${secret.tags[tagKey]}`);
        });
      });

      res.render('secrets', {
        ...commonData,
        secrets,
        searchQuery: search || '',
        selectedTag: tag || '',
        availableTags: Array.from(allTags).sort(),
        totalSecrets: secrets.length
      });
    } catch (error) {
      console.error('Error rendering secrets page:', error);
      
      // For AWS credential errors, show secrets page with empty data
      if (error instanceof Error && (
        error.message.includes('CredentialsProviderError') ||
        error.message.includes('UnauthorizedOperation') ||
        error.message.includes('AccessDenied')
      )) {
        res.render('secrets', {
          ...commonData,
          secrets: [],
          searchQuery: '',
          selectedTag: '',
          availableTags: [],
          totalSecrets: 0,
          awsError: 'Could not connect to AWS Secrets Manager. Please check AWS credentials and permissions.'
        });
      } else {
        res.status(500).render('error', {
          title: 'Error',
          message: 'Failed to load secrets data',
          error: error instanceof Error ? error.message : 'Unknown error',
          environment: process.env.NODE_ENV || 'development',
          tableName: process.env.DYNAMODB_TABLE_NAME || 'halow-data',
          currentTab: 'secrets'
        });
      }
    }
  }

  async getSecretTags(req: Request, res: Response): Promise<void> {
    try {
      const { secretName } = req.params;
      
      if (!secretName) {
        res.status(400).json({ error: 'Secret name is required' });
        return;
      }

      const allSecrets = await this.secretsManagerService.getAllSecrets();
      const secret = allSecrets.find(s => s.name === secretName);

      if (!secret) {
        res.status(404).json({ error: 'Secret not found' });
        return;
      }

      res.json({
        name: secret.name,
        tags: secret.tags,
        description: secret.description,
        createdDate: secret.createdDate,
        lastChangedDate: secret.lastChangedDate
      });
    } catch (error) {
      console.error('Error getting secret tags:', error);
      res.status(500).json({ 
        error: 'Failed to get secret tags',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}