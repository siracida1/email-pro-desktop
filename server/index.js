const app = require('./app');

// MASSMAIL_API_PORT takes priority over PORT: in local dev, PORT (and other
// generically-named port variables) may be claimed by the Vite dev server
// (npm run dev:web) or injected by tooling, so the API needs an unambiguous
// variable of its own to avoid colliding with it. In production (no Vite
// process), PORT alone is used, matching what most Node hosts inject.
const PORT = process.env.MASSMAIL_API_PORT || process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`MassMail Pro server listening on port ${PORT}`);
});
