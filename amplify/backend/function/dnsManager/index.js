const AWS = require('aws-sdk');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const HOSTED_ZONE_ID = process.env.HOSTED_ZONE_ID;
const DOMAIN = process.env.DNS_DOMAIN;
const oauthClient = new OAuth2Client(GOOGLE_CLIENT_ID);
const route53 = new AWS.Route53();

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
    return record.ResourceRecords[0].Value.replace(/^"|"$/g, '');
  }
  return null;
}

function isValidDidFormat(did) {
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,DELETE'
};

exports.handler = async (event) => {
  const method = event.httpMethod;
  let body = {};
  if (event.body) {
    try { body = JSON.parse(event.body); } catch {}
  }
  const query = event.queryStringParameters || {};

  if (method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  if (method === 'POST') {
    const { token, did, hostname } = body;
    if (!token || !did || !hostname) return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Missing fields' }) };
    if (!isValidDidFormat(did)) return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid DID format' }) };
    if (!(await isValidDidPlc(did))) return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'DID not found in PLC directory' }) };
    try {
      const ticket = await oauthClient.verifyIdToken({ idToken: token, audience: GOOGLE_CLIENT_ID });
      const user = ticket.getPayload();
      const fqdn = `${hostname}.${DOMAIN}`;
      const atprotoFqdn = `_atproto.${hostname}.${DOMAIN}`;
      const ownerTxt = await getTxtRecord(fqdn);
      if (ownerTxt && ownerTxt !== user.sub) {
        return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: 'Not authorized to update this entry' }) };
      }
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
      const params = { HostedZoneId: HOSTED_ZONE_ID, ChangeBatch: { Changes: changes } };
      await route53.changeResourceRecordSets(params).promise();
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true }) };
    } catch (err) {
      return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid token or AWS error', details: err.message }) };
    }
  }

  if (method === 'DELETE') {
    const { token, hostname } = body;
    if (!token || !hostname) return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Missing fields' }) };
    try {
      const ticket = await oauthClient.verifyIdToken({ idToken: token, audience: GOOGLE_CLIENT_ID });
      const user = ticket.getPayload();
      const fqdn = `${hostname}.${DOMAIN}`;
      const atprotoFqdn = `_atproto.${hostname}.${DOMAIN}`;
      const ownerTxt = await getTxtRecord(fqdn);
      if (!ownerTxt || ownerTxt !== user.sub) {
        return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: 'Not authorized or entry does not exist' }) };
      }
      const changes = [
        {
          Action: 'DELETE',
          ResourceRecordSet: {
            Name: atprotoFqdn,
            Type: 'TXT',
            TTL: 300,
            ResourceRecords: [{ Value: `""` }],
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
      const params = { HostedZoneId: HOSTED_ZONE_ID, ChangeBatch: { Changes: changes } };
      await route53.changeResourceRecordSets(params).promise();
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true }) };
    } catch (err) {
      return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid token or AWS error', details: err.message }) };
    }
  }

  if (method === 'GET') {
    const { token } = query;
    if (!token) return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Missing token' }) };
    try {
      const ticket = await oauthClient.verifyIdToken({ idToken: token, audience: GOOGLE_CLIENT_ID });
      const user = ticket.getPayload();
      const params = { HostedZoneId: HOSTED_ZONE_ID, MaxItems: '100' };
      const data = await route53.listResourceRecordSets(params).promise();
      const userEntries = data.ResourceRecordSets
        .filter(r => r.Type === 'TXT' && r.ResourceRecords.some(rec => rec.Value.replace(/^"|"$/g, '') === user.sub))
        .map(r => {
          const hostname = r.Name.replace(`.${DOMAIN}.`, '').replace(/\.$/, '');
          return { hostname, did: null };
        });
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(userEntries) };
    } catch (err) {
      return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid token', details: err.message }) };
    }
  }

  return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method Not Allowed' }) };
};
