# Privacy Policy

_Last updated: July 15, 2025_

## Introduction

We are committed to protecting your privacy and complying with the General Data Protection Regulation (GDPR). This Privacy Policy explains how we collect, use, and store your personal data when you use our DNS management application.

## Data Controller

The data controller responsible for your personal data is the operator of this application. For any privacy-related inquiries, please contact us at the email address provided in the application's support section.

## What Data We Collect

When you use our application, we authenticate you using Google Sign-In (GSI) with the `openid` scope. During authentication, we receive the following public Google profile information:

- Name
- Email address
- Profile photo

**However, we do not store your name, email, or photo.**

The only information we store is your Google account's unique identifier (`sub`), which is a numerical ID provided by Google. This ID is used solely to link your DNS records (Route53 entries) with your account.

## How We Use Your Data

- **Authentication:** We use Google GSI to verify your identity and allow you to access the application.
- **Record Ownership:** We store your Google `sub` ID to associate Route53 DNS records you create or manage with your account.

## Data Sharing and Transfers

- We do not share your personal data with third parties, except as required by law or to operate the application (e.g., AWS Route53 for DNS management).
- Your data is not transferred outside the European Economic Area (EEA) unless necessary for application operation and in compliance with GDPR safeguards.

## Data Retention

- We retain your Google `sub` ID only as long as you have DNS records managed through our application.
- If you delete all your records or request account deletion, your `sub` ID will be removed from our system.

## Your Rights

Under GDPR, you have the right to:
- Access your personal data
- Request correction or deletion of your data
- Object to or restrict processing
- Lodge a complaint with a supervisory authority

To exercise your rights, please contact us via the application's support email.

## Security

We implement appropriate technical and organizational measures to protect your data against unauthorized access, loss, or misuse.

## Changes to This Policy

We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated revision date.

## Contact

If you have any questions or concerns about this Privacy Policy or your data, please contact us using the support information provided in the application.
