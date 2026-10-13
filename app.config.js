// Extends app.json. The only dynamic value is the web base path: GitHub
// Pages serves a project site under /<repo>/, so the Pages workflow sets
// EXPO_WEB_BASE_URL and every asset and route URL is prefixed with it.
// Native builds and plain hosts leave it unset.
module.exports = ({ config }) => {
  const baseUrl = (process.env.EXPO_WEB_BASE_URL || '').replace(/\/+$/, '');
  if (!baseUrl) return config;
  return { ...config, experiments: { ...config.experiments, baseUrl } };
};
