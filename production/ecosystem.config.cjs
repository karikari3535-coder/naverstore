module.exports = {
  apps: [{
    name: 'recommender-next',
    script: 'node_modules/.bin/next',
    args: 'dev -p 3000',
    cwd: '/home/user/webapp/production',
    env: { NODE_ENV: 'development', PORT: 3000 },
    watch: false,
    instances: 1,
    exec_mode: 'fork',
  }],
};
