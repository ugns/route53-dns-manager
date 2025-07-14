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

  return (
    <div>
      <h2>Manage DNS Entry</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Bluesky DID"
          value={did}
          onChange={e => setDid(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Desired Hostname"
          value={hostname}
          onChange={e => setHostname(e.target.value)}
          required
        />
        <button type="submit">Create/Update</button>
      </form>
      {message && <p>{message}</p>}
      <h3>Your DNS Entries</h3>
      <ul>
        {entries.map(e => (
          <li key={e.hostname}>
            {e.hostname}: {e.did}
            <button onClick={() => handleRemove(e.hostname)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DnsForm;
