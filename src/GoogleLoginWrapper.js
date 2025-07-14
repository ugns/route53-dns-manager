import React, { useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import DnsForm from './DnsForm';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

function GoogleLoginWrapper() {
  const [token, setToken] = useState(null);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div>
        {!token ? (
          <GoogleLogin
            onSuccess={credentialResponse => {
              setToken(credentialResponse.credential);
            }}
            onError={() => {
              alert('Login Failed');
            }}
          />
        ) : (
          <DnsForm token={token} />
        )}
      </div>
    </GoogleOAuthProvider>
  );
}

export default GoogleLoginWrapper;
