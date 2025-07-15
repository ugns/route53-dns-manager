import React, { useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import DnsForm from './DnsForm';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

function GoogleLoginWrapper() {
  const [token, setToken] = useState(null);

  React.useEffect(() => {
    const storedToken = localStorage.getItem('googleToken');
    if (storedToken) setToken(storedToken);
  }, []);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {!token ? (
        <>
          <h2 className="mb-4 text-center">Manage Bluesky Handle DNS</h2>
          <div className="d-flex justify-content-center">
            <GoogleLogin
              onSuccess={credentialResponse => {
                setToken(credentialResponse.credential);
                localStorage.setItem('googleToken', credentialResponse.credential);
              }}
              onError={() => {
                alert('Login Failed');
              }}
              theme='filled_blue'
              context='signin'
              ux_mode='popup'
              itp_support={true}
              use_fedcm_for_button={true}
              use_fedcm_for_prompt={true}
            />
          </div>
        </>
      ) : (
        <>
          <div className="d-flex justify-content-end mb-3">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => {
                setToken(null);
                localStorage.removeItem('googleToken');
              }}
              aria-label="Log out of Google session"
            >Log Out</button>
          </div>
          <DnsForm token={token} />
        </>
      )}
    </GoogleOAuthProvider>
  );
}

export default GoogleLoginWrapper;
