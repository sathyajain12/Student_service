// Google API functions using OAuth 2.0 with Refresh Token
// For sending emails from coeoffice@sssihl.edu.in

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

export async function createMonthlyBackupSheet(env, data) {
  const accessToken = await getGoogleAuth(env);
  const date = new Date();
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const title = `Examination services backup data ${date.getUTCDate()} ${monthNames[date.getUTCMonth()]} ${date.getUTCFullYear()}`;

  const tableNames = Object.keys(data);

  // Create spreadsheet with one sheet per table
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      properties: { title },
      sheets: tableNames.map(name => ({ properties: { title: name } }))
    })
  });
  const spreadsheet = await createRes.json();
  if (!createRes.ok) throw new Error(`Sheets create failed: ${JSON.stringify(spreadsheet)}`);

  const spreadsheetId = spreadsheet.spreadsheetId;

  // Write data to each sheet
  const valueData = tableNames.map(tableName => {
    const rows = data[tableName];
    if (!rows || rows.length === 0) return { range: `${tableName}!A1`, values: [['(no data)']] };
    const headers = Object.keys(rows[0]);
    const values = [headers, ...rows.map(row => headers.map(h => {
      const val = row[h];
      return val === null || val === undefined ? '' : String(val);
    }))];
    return { range: `${tableName}!A1`, values };
  });

  const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ valueInputOption: 'RAW', data: valueData })
  });
  if (!updateRes.ok) {
    const err = await updateRes.json();
    throw new Error(`Sheets write failed: ${JSON.stringify(err)}`);
  }

  // Move spreadsheet into the backup folder
  if (env.GOOGLE_DRIVE_BACKUP_FOLDER_ID) {
    const moveRes = await fetch(`https://www.googleapis.com/drive/v3/files/${spreadsheetId}?addParents=${env.GOOGLE_DRIVE_BACKUP_FOLDER_ID}&removeParents=root&fields=id,parents`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const moveData = await moveRes.json();
    if (!moveRes.ok) {
      console.error('Drive move failed:', JSON.stringify(moveData));
      throw new Error(`Drive move failed: ${JSON.stringify(moveData)}`);
    }
    console.log('Drive move result:', JSON.stringify(moveData));
  }

  console.log(`Monthly backup created: ${title} (${spreadsheetId})`);
  return spreadsheetId;
}

export async function uploadFileToDrive(env, { appId, fieldName, fileName, fileType, base64Data }) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REFRESH_TOKEN || !env.GOOGLE_DRIVE_DOCS_FOLDER_ID) {
    console.log('Drive upload skipped: missing credentials or docs folder ID');
    return;
  }

  const accessToken = await getGoogleAuth(env);

  // Decode base64 to binary bytes
  const binaryStr = atob(base64Data);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  const boundary = '----DriveUpload' + Math.random().toString(36).substr(2, 8);
  const metadata = JSON.stringify({
    name: `${appId} — ${fieldName} — ${fileName}`,
    parents: [env.GOOGLE_DRIVE_DOCS_FOLDER_ID]
  });

  const enc = new TextEncoder();
  const metaPart    = enc.encode(`--${boundary}\r\nContent-Type: application/json\r\n\r\n${metadata}\r\n`);
  const mediaHeader = enc.encode(`--${boundary}\r\nContent-Type: ${fileType || 'application/octet-stream'}\r\n\r\n`);
  const ending      = enc.encode(`\r\n--${boundary}--`);

  const body = new Uint8Array(metaPart.length + mediaHeader.length + bytes.length + ending.length);
  body.set(metaPart, 0);
  body.set(mediaHeader, metaPart.length);
  body.set(bytes, metaPart.length + mediaHeader.length);
  body.set(ending, metaPart.length + mediaHeader.length + bytes.length);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Drive upload failed: ${JSON.stringify(err)}`);
  }

  const result = await res.json();
  console.log(`File uploaded to Drive: ${result.id} (${fileName}) for app ${appId}`);
  return result.id;
}

export async function sendEmail(accessToken, { to, subject, htmlBody, attachments = [] }) {
  console.log('Sending email, subject:', subject);
  console.log('Attachments:', attachments.length);

  let message;

  if (attachments.length === 0) {
    // Simple HTML email (no attachments)
    message = [
      'Content-Type: text/html; charset="UTF-8"',
      'MIME-Version: 1.0',
      `To: ${to}`,
      `Subject: ${subject}`,
      '',
      htmlBody
    ].join('\r\n');
  } else {
    // Multipart email with attachments
    const boundary = '----=_Part_' + Math.random().toString(36).substr(2, 9);

    const parts = [];

    // Header
    parts.push('MIME-Version: 1.0');
    parts.push(`To: ${to}`);
    parts.push(`Subject: ${subject}`);
    parts.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    parts.push('');

    // HTML body part
    parts.push(`--${boundary}`);
    parts.push('Content-Type: text/html; charset="UTF-8"');
    parts.push('Content-Transfer-Encoding: 7bit');
    parts.push('');
    parts.push(htmlBody);
    parts.push('');

    // Attachment parts
    for (const attachment of attachments) {
      parts.push(`--${boundary}`);
      parts.push(`Content-Type: ${attachment.mimeType}; name="${attachment.filename}"`);
      parts.push('Content-Transfer-Encoding: base64');
      parts.push(`Content-Disposition: attachment; filename="${attachment.filename}"`);
      parts.push('');
      parts.push(attachment.data); // Already base64
      parts.push('');
    }

    // End boundary
    parts.push(`--${boundary}--`);

    message = parts.join('\r\n');
  }

  // Encode message for Gmail API
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

  console.log(`Email sent successfully (${attachments.length} attachments), message ID:`, result.id);
  return result;
}
