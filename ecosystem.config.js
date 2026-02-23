module.exports = {
  apps: [
    {
      name: 'svmontaj-backend',
      cwd: '/var/www/svmontaj/backend',
      script: 'dist/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      error_file: '/var/www/svmontaj/logs/backend-error.log',
      out_file: '/var/www/svmontaj/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'svmontaj-frontend',
      cwd: '/var/www/svmontaj/frontend',
      script: 'node_modules/.bin/next',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/www/svmontaj/logs/frontend-error.log',
      out_file: '/var/www/svmontaj/logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};

