// FanzMobile PM2 Ecosystem Configuration
// Cloud Drive for Media Processing, Compliance & AI Automation

module.exports = {
  apps: [{
    name: 'fanzmobile',
    script: 'dist/index.js',
    cwd: '/opt/fanzmobile',
    instances: 1,
    exec_mode: 'fork',

    // Environment Variables
    env: {
      NODE_ENV: 'production',
      PORT: 3102,  // Unique port to avoid conflict with FANZForge (3100) and fallback (3101)
    },

    // Restart configuration
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M',

    // Logging
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: '/var/log/pm2/fanzmobile-error.log',
    out_file: '/var/log/pm2/fanzmobile-out.log',
    merge_logs: true,

    // Health monitoring
    exp_backoff_restart_delay: 100,

    // Graceful shutdown
    kill_timeout: 10000,
    wait_ready: true,
    listen_timeout: 30000,

    // Watch (disabled in production)
    watch: false,
    ignore_watch: ['node_modules', 'logs', '.git'],

    // Cluster autoscaling (optional)
    // instances: 'max',  // Uncomment for multi-core
    // exec_mode: 'cluster',
  }],

  // Deployment configuration
  deploy: {
    production: {
      user: 'root',
      host: 'server.fanzgroupholdings.com',
      ref: 'origin/main',
      repo: 'git@github.com:FanzCEO/FanzMobile.git',
      path: '/opt/fanzmobile',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
