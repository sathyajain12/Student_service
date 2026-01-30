import { google } from 'googleapis';

export async function getGoogleAuth(env) {
  const auth = new google.auth.JWT(
    env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/gmail.send'
    ]
  );
  return auth;
}

export async function uploadToDrive(auth, fileBlob, fileName, folderId) {
  const drive = google.drive({ version: 'v3', auth });
  
  const fileMetadata = {
    name: fileName,
    parents: [folderId]
  };
  
  const media = {
    mimeType: fileBlob.type,
    body: fileBlob.stream()
  };
  
  const file = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id, webViewLink'
  });
  
  return file.data;
}

export async function sendEmail(auth, { to, subject, htmlBody }) {
  const gmail = google.gmail({ version: 'v1', auth });
  
  const message = [
    'Content-Type: text/html; charset="UTF-8"\n',
    'MIME-Version: 1.0\n',
    'Content-Transfer-Encoding: 7bit\n',
    `to: ${to}\n`,
    `subject: ${subject}\n\n`,
    htmlBody
  ].join('');
  
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
    
  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage
    }
  });
}
