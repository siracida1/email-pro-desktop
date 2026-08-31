// Entry point for Vercel's Node runtime: a single serverless function
// handling every /api/* route (see vercel.json). Static files and the SPA
// fallback for everything else are served by Vercel's platform directly.
module.exports = require('../server/app');
