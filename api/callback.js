module.exports = async function handler(req, res) {
  const { code } = req.query;
  const client_id = process.env.GITHUB_CLIENT_ID;
  const client_secret = process.env.GITHUB_CLIENT_SECRET;
  const redirect_uri = process.env.REDIRECT_URI || `https://${req.headers.host}/api/callback`;

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id,
        client_secret,
        code,
        redirect_uri
      })
    });

    const data = await response.json();
    const token = data.access_token;
    
    if (!token) {
      throw new Error('Access token not found in response');
    }

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Authorization Successful</title></head>
      <body>
        <script>
          (function() {
            function receiveMessage(e) {
              console.log("receiveMessage %o", e);
              window.opener.postMessage(
                'authorization:github:success:' + JSON.stringify({ token: "${token}", provider: 'github' }),
                e.origin
              );
              window.removeEventListener("message", receiveMessage, false);
              setTimeout(() => window.close(), 100);
            }
            window.addEventListener("message", receiveMessage, false);
            console.log("Sending message: authorizing:github");
            window.opener.postMessage("authorizing:github", "*");
            
            // Fallback: If no handshake response is received within 1 second, force send and close
            setTimeout(() => {
              window.opener.postMessage(
                'authorization:github:success:' + JSON.stringify({ token: "${token}", provider: 'github' }),
                "*"
              );
              window.opener.postMessage(
                { type: 'authorization', payload: { token: "${token}", provider: 'github' } },
                "*"
              );
              window.close();
            }, 1000);
          })();
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send(`Authentication error: ${error.message}`);
  }
};
