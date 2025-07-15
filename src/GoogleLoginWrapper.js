import React, { useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import DnsForm from './DnsForm';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

function GoogleLoginWrapper() {
  const [token, setToken] = useState(null);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {!token ? (
        <>
          <h2 className="mb-4 text-center">Manage Bluesky Handle DNS</h2>
          <GoogleLogin
            onSuccess={credentialResponse => {
              setToken(credentialResponse.credential);
            }}
            onError={() => {
              alert('Login Failed');
            }}
          />
        </>
      ) : (
        <DnsForm token={token} />
      )}
    </GoogleOAuthProvider>
  );
}

export default GoogleLoginWrapper;
