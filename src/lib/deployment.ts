// Deployment Configuration and Environment Setup
export interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  database: DatabaseConfig;
  api: APIConfig;
  storage: StorageConfig;
  security: SecurityConfig;
  monitoring: MonitoringConfig;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  pool_size: number;
  connection_timeout: number;
}

export interface APIConfig {
  base_url: string;
  rate_limit: number;
  cors_origins: string[];
  jwt_secret: string;
  jwt_expiry: string;
  api_version: string;
}

export interface StorageConfig {
  providers: {
    fanz_cloud: {
      endpoint: string;
      access_key: string;
      secret_key: string;
      bucket: string;
    };
    aws_s3: {
      region: string;
      access_key: string;
      secret_key: string;
      bucket: string;
    };
    google_cloud: {
      project_id: string;
      key_file: string;
      bucket: string;
    };
  };
  cdn_url: string;
  max_file_size: number;
}

export interface SecurityConfig {
  encryption_key: string;
  forensic_signature_key: string;
  dmca_api_key: string;
  webhook_secrets: Record<string, string>;
  admin_whitelist: string[];
}

export interface MonitoringConfig {
  sentry_dsn?: string;
  analytics_key?: string;
  log_level: 'debug' | 'info' | 'warn' | 'error';
  metrics_endpoint?: string;
}

export class DeploymentManager {
  private config: DeploymentConfig;

  constructor(environment: 'development' | 'staging' | 'production' = 'production') {
    this.config = this.getConfig(environment);
  }

  private getConfig(environment: string): DeploymentConfig {
    const baseConfig = {
      environment: environment as 'development' | 'staging' | 'production',
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'fanz_app',
        username: process.env.DB_USER || 'fanz_user',
        password: process.env.DB_PASSWORD || 'secure_password',
        ssl: environment === 'production',
        pool_size: 20,
        connection_timeout: 30000
      },
      api: {
        base_url: process.env.API_BASE_URL || 'https://api.fanz.app',
        rate_limit: 1000,
        cors_origins: [
          'https://fanz.app',
          'https://app.fanz.com',
          'https://admin.fanz.com'
        ],
        jwt_secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
        jwt_expiry: '7d',
        api_version: 'v1'
      },
      storage: {
        providers: {
          fanz_cloud: {
            endpoint: process.env.FANZ_CLOUD_ENDPOINT || 'https://storage.fanz.app',
            access_key: process.env.FANZ_CLOUD_ACCESS_KEY || '',
            secret_key: process.env.FANZ_CLOUD_SECRET_KEY || '',
            bucket: 'fanz-content'
          },
          aws_s3: {
            region: process.env.AWS_REGION || 'us-east-1',
            access_key: process.env.AWS_ACCESS_KEY_ID || '',
            secret_key: process.env.AWS_SECRET_ACCESS_KEY || '',
            bucket: 'fanz-backup-storage'
          },
          google_cloud: {
            project_id: process.env.GCP_PROJECT_ID || '',
            key_file: process.env.GCP_KEY_FILE || '',
            bucket: 'fanz-analytics-data'
          }
        },
        cdn_url: process.env.CDN_URL || 'https://cdn.fanz.app',
        max_file_size: 5 * 1024 * 1024 * 1024
      },
      security: {
        encryption_key: process.env.ENCRYPTION_KEY || 'your-encryption-key-32-chars-long',
        forensic_signature_key: process.env.FORENSIC_KEY || 'forensic-signature-key',
        dmca_api_key: process.env.DMCA_API_KEY || '',
        webhook_secrets: {
          boyfanz: process.env.BOYFANZ_WEBHOOK_SECRET || '',
          girlfanz: process.env.GIRLFANZ_WEBHOOK_SECRET || '',
          pupfanz: process.env.PUPFANZ_WEBHOOK_SECRET || '',
          stripe: process.env.STRIPE_WEBHOOK_SECRET || '',
          dmca_monitor: process.env.DMCA_WEBHOOK_SECRET || ''
        },
        admin_whitelist: [
          'admin@fanz.com',
          'security@fanz.com',
          'ops@fanz.com'
        ]
      },
      monitoring: {
        sentry_dsn: process.env.SENTRY_DSN,
        analytics_key: process.env.ANALYTICS_KEY,
        log_level: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
        metrics_endpoint: process.env.METRICS_ENDPOINT
      }
    };

    if (environment === 'development') {
      baseConfig.database.ssl = false;
      baseConfig.api.cors_origins.push('http://localhost:3000', 'http://localhost:5173');
      baseConfig.monitoring.log_level = 'debug';
    }

    if (environment === 'staging') {
      baseConfig.api.base_url = 'https://staging-api.fanz.app';
      baseConfig.storage.cdn_url = 'https://staging-cdn.fanz.app';
    }

    return baseConfig;
  }

  getConfig(): DeploymentConfig {
    return this.config;
  }
}

export const deploymentManager = new DeploymentManager();