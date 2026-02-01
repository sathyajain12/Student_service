// Google API functions using OAuth 2.0 with Refresh Token
// For sending emails from sathyajain9@gmail.com

export async function getGoogleAuth(env) {
  console.log('Getting Google Auth with OAuth...');
  console.log('Client ID present:', !!env.GOOGLE_CLIENT_ID);
  console.log('Client Secret present:', !!env.GOOGLE_CLIENT_SECRET);
  console.log('Refresh Token present:', !!env.GOOGLE_REFRESH_TOKEN);

  // Use refresh token to get a new access token
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: env.GOOGLE_REFRESH_TOKEN,
      grant_type: 'refresh_token'
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('OAuth error response:', JSON.stringify(data));
    throw new Error(`OAuth failed: ${data.error_description || data.error}`);
  }

  console.log('OAuth successful, got access token');
  return data.access_token;
}

export async function sendEmail(accessToken, { to, subject, htmlBody }) {
  console.log('Sending email to:', to);
  console.log('Subject:', subject);

  const message = [
    'Content-Type: text/html; charset="UTF-8"',
    'MIME-Version: 1.0',
    `To: ${to}`,
    `Subject: ${subject}`,
    '',
    htmlBody
  ].join('\r\n');

  const encodedMessage = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw: encodedMessage })
  });

  const result = await response.json();

  if (!response.ok) {
    console.error('Email send error:', JSON.stringify(result));
    throw new Error(`Email send failed: ${JSON.stringify(result)}`);
  }

  console.log(`Email sent successfully to ${to}, message ID:`, result.id);
  return result;
}
