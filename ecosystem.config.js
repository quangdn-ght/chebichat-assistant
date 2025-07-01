module.exports = {
  apps: [
    {
      name: 'chebi-nextjs',
      script: './start.sh',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
