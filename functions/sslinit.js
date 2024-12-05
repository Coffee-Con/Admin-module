require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// Load filenames from .env
const SSL_KEY = process.env.SSL_Key || 'key.pem';
const SSL_CERT = process.env.SSL_Cert || 'cert.pem';

// Determine whether the path is an absolute path
const isAbsolutePath = (filePath) => path.isAbsolute(filePath);

// Concatenate complete paths according to path type
const KEY_PATH = isAbsolutePath(SSL_KEY) ? SSL_KEY : path.resolve(__dirname, '../', SSL_KEY);
const CERT_PATH = isAbsolutePath(SSL_CERT) ? SSL_CERT : path.resolve(__dirname, '../', SSL_CERT);

// Check if the certificate and private key exist
function ensureSSLCertificate() {
  if (!fs.existsSync(CERT_PATH) || !fs.existsSync(KEY_PATH)) {
    console.log('SSL certificate or key not found. Generating new self-signed certificate...');
    try {
      // Use execFileSync to pass command parameters to prevent errors caused by spaces in the path
      execFileSync('openssl', [
        'req', '-x509', '-newkey', 'rsa:4096',
        '-keyout', KEY_PATH,
        '-out', CERT_PATH,
        '-days', '365', '-nodes',
        '-subj', '/CN=localhost',
      ]);
      console.log('Self-signed SSL certificate generated successfully.');
    } catch (error) {
      console.error('Failed to generate SSL certificate. Make sure OpenSSL is installed.');
      console.error(error.message);
      process.exit(1);
    }
  } else {
    console.log('SSL certificate and key found.');
  }
}

// run
ensureSSLCertificate();