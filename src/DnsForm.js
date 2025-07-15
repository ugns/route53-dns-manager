import React, { useState, useEffect } from 'react';
import axios from 'axios';

function DnsForm({ token }) {
  const [did, setDid] = useState('');
  const [hostname, setHostname] = useState('');
  const [entries, setEntries] = useState([]);
  const [message, setMessage] = useState('');


  const API_URL = process.env.REACT_APP_DNS_API_URL;

  useEffect(() => {
    if (token && API_URL) {
      axios.get(API_URL, { params: { token } })
        .then(res => setEntries(res.data))
        .catch(() => setEntries([]));
    }
  }, [token, API_URL]);


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
      setMessage(err.response?.data?.error || 'Error');
    }
  };


  const handleRemove = async (h) => {
    setMessage('');
    try {
      await axios.delete(API_URL, { data: { token, hostname: h } });
      setMessage('DNS entry removed!');
      setEntries(entries.filter(e => e.hostname !== h));
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error');
    }
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000); // 3 seconds
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <>
      <h2 className="card-title mb-3 text-center">Manage DNS Entry</h2>
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
              {process.env.REACT_APP_DNS_DOMAIN ? `.${process.env.REACT_APP_DNS_DOMAIN}` : '.yourdomain.com'}
            </span>
          </div>
        </div>
        <button type="submit" className="btn btn-primary w-100">Create/Update</button>
      </form>
      {message && <div className="alert alert-info text-center">{message}</div>}
      <h3 className="mt-4">Your DNS Entries</h3>
      <ul className="list-group">
        {entries.map(e => (
          <li
            key={e.hostname}
            className="list-group-item d-flex justify-content-between align-items-center"
          >
            <span><strong>{e.hostname}</strong>: {e.did}</span>
            <div className="btn-group" role="group">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                aria-label="Edit entry: Click to populate form for editing"
                onClick={() => {
                  setHostname(e.hostname);
                  setDid(e.did);
                }}
              >Edit</button>
              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                aria-label={`Remove entry for ${e.hostname}`}
                onClick={() => handleRemove(e.hostname)}
              >Remove</button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

export default DnsForm;
