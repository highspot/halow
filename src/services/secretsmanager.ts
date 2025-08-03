import { SecretsManagerClient, ListSecretsCommand, DescribeSecretCommand } from '@aws-sdk/client-secrets-manager';

export interface SecretInfo {
  name: string;
  arn: string;
  description?: string;
  tags: Record<string, string>;
  createdDate?: Date;
  lastChangedDate?: Date;
}

export class SecretsManagerService {
  private client: SecretsManagerClient;

  constructor() {
    // Initialize Secrets Manager client
    const clientConfig: any = {
      region: process.env.AWS_REGION || 'us-east-1'
    };

    // Support for local endpoint (for testing)
    if (process.env.AWS_ENDPOINT_URL) {
      clientConfig.endpoint = process.env.AWS_ENDPOINT_URL;
    }

    this.client = new SecretsManagerClient(clientConfig);
  }

  async getAllSecrets(): Promise<SecretInfo[]> {
    try {
      const command = new ListSecretsCommand({
        MaxResults: 100, // Adjust as needed
        IncludePlannedDeletion: false
      });

      const response = await this.client.send(command);
      const secrets: SecretInfo[] = [];

      if (response.SecretList) {
        // Get detailed info for each secret to retrieve tags
        for (const secret of response.SecretList) {
          if (secret.Name) {
            try {
              const detailCommand = new DescribeSecretCommand({
                SecretId: secret.Name
              });
              
              const detailResponse = await this.client.send(detailCommand);
              
              // Convert tags array to object
              const tags: Record<string, string> = {};
              if (detailResponse.Tags) {
                detailResponse.Tags.forEach(tag => {
                  if (tag.Key && tag.Value) {
                    tags[tag.Key] = tag.Value;
                  }
                });
              }

              secrets.push({
                name: secret.Name,
                arn: secret.ARN || '',
                description: secret.Description,
                tags,
                createdDate: secret.CreatedDate,
                lastChangedDate: secret.LastChangedDate
              });
            } catch (error) {
              console.error(`Error getting details for secret ${secret.Name}:`, error);
              // Add basic info even if we can't get tags
              secrets.push({
                name: secret.Name,
                arn: secret.ARN || '',
                description: secret.Description,
                tags: {},
                createdDate: secret.CreatedDate,
                lastChangedDate: secret.LastChangedDate
              });
            }
          }
        }
      }

      return secrets;
    } catch (error) {
      console.error('Error fetching secrets from AWS Secrets Manager:', error);
      throw error;
    }
  }

  async getSecretsByTag(tagKey: string, tagValue?: string): Promise<SecretInfo[]> {
    const allSecrets = await this.getAllSecrets();
    
    return allSecrets.filter(secret => {
      const hasTag = secret.tags.hasOwnProperty(tagKey);
      if (!tagValue) {
        return hasTag;
      }
      return hasTag && secret.tags[tagKey] === tagValue;
    });
  }

  async searchSecrets(query: string): Promise<SecretInfo[]> {
    const allSecrets = await this.getAllSecrets();
    const searchTerm = query.toLowerCase();
    
    return allSecrets.filter(secret => 
      secret.name.toLowerCase().includes(searchTerm) ||
      (secret.description && secret.description.toLowerCase().includes(searchTerm)) ||
      Object.keys(secret.tags).some(key => 
        key.toLowerCase().includes(searchTerm) ||
        secret.tags[key].toLowerCase().includes(searchTerm)
      )
    );
  }
}