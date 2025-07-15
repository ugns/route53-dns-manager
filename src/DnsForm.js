import React, { useState, useEffect } from 'react';
import axios from 'axios';

function DnsForm({ token, onAuthError }) {
  const [did, setDid] = useState('');
  const [hostname, setHostname] = useState('');
  const [entries, setEntries] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_DNS_API_URL;
  const DNS_DOMAIN = process.env.REACT_APP_DNS_DOMAIN || 'yourdomain.com';

  useEffect(() => {
    if (token && API_URL) {
      setLoading(true);
      axios.get(API_URL, { params: { token } })
        .then(res => setEntries(res.data))
        .catch(err => {
          if (err.response && err.response.status === 401 && onAuthError) {
            onAuthError();
          } else {
            setEntries([]);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [token, API_URL, onAuthError]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    // Check if the values match an existing entry
    const existing = entries.find(e => e.hostname === hostname);
    if (existing && existing.did === did) {
      setMessage('No changes detected. DNS entry not updated.');
      return;
    }
    try {
      await axios.post(API_URL, { token, did, hostname });
      setMessage('DNS entry created/updated!');
      setDid('');
      setHostname('');
      // Refresh entries
      const res = await axios.get(API_URL, { params: { token } });
      setEntries(res.data);
    } catch (err) {
      if (err.response && err.response.status === 401 && onAuthError) {
        onAuthError();
      } else {
        setMessage(err.response?.data?.error || 'Error');
      }
    }
  };


  const handleRemove = async (h) => {
    setMessage('');
    try {
      await axios.delete(API_URL, { data: { token, hostname: h } });
      setMessage('DNS entry removed!');
      setEntries(entries.filter(e => e.hostname !== h));
    } catch (err) {
      if (err.response && err.response.status === 401 && onAuthError) {
        onAuthError();
      } else {
        setMessage(err.response?.data?.error || 'Error');
      }
    }
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <>
      <div className="card-title mb-3 h2 text-center">Manage Handle</div>
      <form onSubmit={handleSubmit} className="mb-3">
        <div className="mb-3">
          <label htmlFor="did-input" className="form-label">Bluesky DID</label>
          <input
            type="text"
            id="did-input"
            className="form-control"
            aria-label="Enter your Bluesky DID value"
            placeholder="e.g. did:plc:123456789012345678901234"
            value={did}
            onChange={e => setDid(e.target.value)}
            required
            onInvalid={e => e.target.setCustomValidity('Please enter your Bluesky DID (e.g. did:plc:...)')}
            onInput={e => e.target.setCustomValidity('')}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="handle-input" className="form-label">Desired Handle</label>
          <div className="input-group">
            <span className="input-group-text border-end-0 fw-semibold" id="handle-addon">
              {/* Bootstrap @ icon */}
              <i className="bi bi-at"></i>
            </span>
            <input
              type="text"
              id="handle-input"
              className="form-control border-top border-bottom border-0"
              aria-label="Enter the desired handle"
              placeholder="e.g. alice"
              value={hostname}
              onChange={e => setHostname(e.target.value)}
              required
              aria-describedby="handle-addon domain-addon"
              onInvalid={e => e.target.setCustomValidity('Please enter your desired handle (e.g. alice)')}
              onInput={e => e.target.setCustomValidity('')}
            />
            <span className="input-group-text border-start-0 fw-semibold" id="domain-addon">
              .{DNS_DOMAIN}
            </span>
          </div>
        </div>
        <div className="row g-2">
          <div className="col-9">
            <button type="submit" className="btn btn-primary w-100">Create/Update</button>
          </div>
          <div className="col-3">
            <button
              type="button"
              className="btn btn-outline-secondary w-100"
              onClick={() => {
                setDid('');
                setHostname('');
              }}
            >Reset</button>
          </div>
        </div>
      </form>
      <div
        className={`toast align-items-center text-bg-info border-0 position-fixed top-0 start-50 translate-middle-x mt-3${message ? ' show' : ''}`}
        role="alert"
        aria-live="polite"
        aria-atomic="true"
        style={{ zIndex: 1055, minWidth: '250px' }}
      >
        <div className="d-flex">
          <div className="toast-body w-100 text-center">
            {message}
          </div>
        </div>
      </div>
      <div className="card shadow-sm">
        <div className="card-header mb-3 h4 text-center">Your Handles</div>
        <div className="card-body p-0">
          {loading ? (
            <div className="d-flex justify-content-center py-4">
              <div className="spinner-border text-primary" role="status" aria-label="Loading entries">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="row g-3">
              {entries.map(e => (
                <div className="col-12 mb-1" key={e.hostname}>
                  <div className="card h-100 border-primary mx-2">
                    <div className="card-body d-flex align-items-center justify-content-between">
                      <span className="fs-6">@<strong>{e.hostname}</strong>.{DNS_DOMAIN}</span>
                    </div>
                    <div className="card-footer bg-transparent border-0 d-flex justify-content-end gap-2">
                      <button
                        className="btn btn-outline-primary btn-sm"
                        aria-label={`Edit entry for ${e.hostname}`}
                        onClick={() => {
                          setHostname(e.hostname);
                          setDid(e.did);
                        }}
                      >Edit</button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        aria-label={`Remove entry for ${e.hostname}`}
                        onClick={() => handleRemove(e.hostname)}
                      >Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default DnsForm;
