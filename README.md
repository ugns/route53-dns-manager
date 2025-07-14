
# Route53 DNS Manager

This is a full-stack web application for managing DNS records in AWS Route53, with Google OAuth authentication and Bluesky DID verification.

## Features

- **Google OAuth**: Users authenticate via Google to manage their DNS records.
- **Bluesky DID Verification**: Validates DIDs against the PLC directory before allowing DNS record creation.
- **DNS Management**: Create, update, and delete TXT records in Route53 for custom hostnames under your domain.
- **Ownership Enforcement**: Only the creator (Google user) can update or remove their own DNS records.
- **Stateless Ownership**: Ownership is stored as a TXT record in Route53, no database required.

## Project Structure

- `src/`: React frontend (Google login, DNS form, record listing)
- `server/`: Express backend (Google token verification, Route53 integration)
- `terraform/`: Infrastructure as code for AWS Amplify, Route53, and domain setup
- `amplify.yml`: Amplify build configuration for frontend and backend

## Environment Variables

Set these in your Amplify environment or `.env` files:

- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `HOSTED_ZONE_ID`: Route53 hosted zone ID
- `DNS_DOMAIN`: Your domain name
- `AWS_REGION`: AWS region (default: us-east-1)

## Deployment

Deployment is automated via AWS Amplify and Terraform:

1. **Terraform** provisions Amplify, Route53, and domain resources, and sets environment variables.
2. **Amplify** builds and deploys both frontend and backend, passing environment variables to each.

## Usage

1. Login with Google.
2. Enter your Bluesky DID and desired hostname.
3. Submit to create or update a DNS TXT record for `_atproto.<hostname>.<domain>` (DID) and `<hostname>.<domain>` (ownership).
4. Only the creator can update or remove their records.
5. Records are validated for DID format and existence in the PLC directory.

## Development

### Frontend

```bash
npm install
npm start
```

### Backend

```bash
cd server
npm install
npm start
```

## License

MIT
