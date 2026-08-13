module.exports = function handler(req, res) {
  const client_id = process.env.GITHUB_CLIENT_ID;
  const redirect_uri = process.env.REDIRECT_URI || `https://${req.headers.host}/api/callback`;
  const url = `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&scope=repo,user`;
  
  res.writeHead(302, { Location: url });
  res.end();
};
