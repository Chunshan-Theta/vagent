module.exports = {
  apps: [
    {
      name: "aicoach",
      // path to `next` from `node_modules` (the lack of `./` at the start of the path is on purpose)
      script: "node_modules/next/dist/bin/next",
      args: "start --port 9272",
      env_production: {
        NODE_ENV: "production",
      },
      // ...other config
    },
  ],
};
