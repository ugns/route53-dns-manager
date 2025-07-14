import express from 'express';
import cors from 'cors';
import { OAuth2Client } from 'google-auth-library';
import AWS from 'aws-sdk';

const app = express();
app.use(cors());
app.use(express.json());

// Use environment variables for deployment
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const oauthClient = new OAuth2Client(GOOGLE_CLIENT_ID);

AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });
const route53 = new AWS.Route53();
const HOSTED_ZONE_ID = process.env.HOSTED_ZONE_ID;
const DOMAIN = process.env.DNS_DOMAIN;


// Helper to get TXT record value for a given name
async function getTxtRecord(name) {
  const params = {
    HostedZoneId: HOSTED_ZONE_ID,
    StartRecordName: name,
    StartRecordType: 'TXT',
    MaxItems: '1',
  };
  const data = await route53.listResourceRecordSets(params).promise();
  const record = data.ResourceRecordSets.find(r => r.Name.replace(/\.$/, '') === name && r.Type === 'TXT');
  if (record && record.ResourceRecords.length > 0) {
    // Remove surrounding quotes from TXT value
    return record.ResourceRecords[0].Value.replace(/^"|"$/g, '');
  }
  return null;
}

async function verifyGoogleToken(token) {
  const ticket = await oauthClient.verifyIdToken({ idToken: token, audience: GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  return payload;
}



import axios from 'axios';

function isValidDidFormat(did) {
  // did:plc: + 24 alphanumeric chars
  return /^did:plc:[a-z0-9]{24}$/.test(did);
}

async function isValidDidPlc(did) {
  try {
    const resp = await axios.get(`https://plc.directory/${did}`);
    return resp.status === 200 && resp.data && resp.data.id === did;
  } catch {
    return false;
  }
}

app.post('/api/dns', async (req, res) => {
  const { token, did, hostname } = req.body;
  if (!token || !did || !hostname) return res.status(400).json({ error: 'Missing fields' });
  if (!isValidDidFormat(did)) {
    return res.status(400).json({ error: 'Invalid DID format' });
  }
  if (!(await isValidDidPlc(did))) {
    return res.status(400).json({ error: 'DID not found in PLC directory' });
  }
  try {
    const user = await verifyGoogleToken(token);
    const fqdn = `${hostname}.${DOMAIN}`;
    const atprotoFqdn = `_atproto.${hostname}.${DOMAIN}`;

    // Check ownership by reading TXT record at fqdn
    const ownerTxt = await getTxtRecord(fqdn);
    if (ownerTxt && ownerTxt !== user.sub) {
      return res.status(403).json({ error: 'Not authorized to update this entry' });
    }

    // Create or update TXT record for DID at _atproto.fqdn
    const changes = [
      {
        Action: 'UPSERT',
        ResourceRecordSet: {
          Name: atprotoFqdn,
          Type: 'TXT',
          TTL: 300,
          ResourceRecords: [{ Value: `"did=${did}"` }],
        },
      },
      {
        Action: 'UPSERT',
        ResourceRecordSet: {
          Name: fqdn,
          Type: 'TXT',
          TTL: 300,
          ResourceRecords: [{ Value: `"${user.sub}"` }],
        },
      },
    ];
    const params = {
      HostedZoneId: HOSTED_ZONE_ID,
      ChangeBatch: { Changes: changes },
    };
    await route53.changeResourceRecordSets(params).promise();
    res.json({ success: true });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token or AWS error', details: err.message });
  }
});


app.delete('/api/dns', async (req, res) => {
  const { token, hostname } = req.body;
  if (!token || !hostname) return res.status(400).json({ error: 'Missing fields' });
  try {
    const user = await verifyGoogleToken(token);
    const fqdn = `${hostname}.${DOMAIN}`;
    const atprotoFqdn = `_atproto.${hostname}.${DOMAIN}`;

    // Check ownership by reading TXT record at fqdn
    const ownerTxt = await getTxtRecord(fqdn);
    if (!ownerTxt || ownerTxt !== user.sub) {
      return res.status(403).json({ error: 'Not authorized or entry does not exist' });
    }

    // Delete both TXT records
    const changes = [
      {
        Action: 'DELETE',
        ResourceRecordSet: {
          Name: atprotoFqdn,
          Type: 'TXT',
          TTL: 300,
          ResourceRecords: [{ Value: `""` }], // Empty value for deletion
        },
      },
      {
        Action: 'DELETE',
        ResourceRecordSet: {
          Name: fqdn,
          Type: 'TXT',
          TTL: 300,
          ResourceRecords: [{ Value: `"${user.sub}"` }],
        },
      },
    ];
    const params = {
      HostedZoneId: HOSTED_ZONE_ID,
      ChangeBatch: { Changes: changes },
    };
    await route53.changeResourceRecordSets(params).promise();
    res.json({ success: true });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token or AWS error', details: err.message });
  }
});


app.get('/api/dns', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Missing token' });
  try {
    const user = await verifyGoogleToken(token);
    // List all records in the hosted zone and filter by TXT value == user.sub
    const params = {
      HostedZoneId: HOSTED_ZONE_ID,
      MaxItems: '100',
    };
    const data = await route53.listResourceRecordSets(params).promise();
    const userEntries = data.ResourceRecordSets
      .filter(r => r.Type === 'TXT' && r.ResourceRecords.some(rec => rec.Value.replace(/^"|"$/g, '') === user.sub))
      .map(r => {
        const hostname = r.Name.replace(`.${DOMAIN}.`, '').replace(/\.$/, '');
        // Try to get DID from _atproto TXT record
        return {
          hostname,
          did: null // Could fetch _atproto TXT if needed
        };
      });
    res.json(userEntries);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token', details: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
