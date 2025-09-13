import React, { useState } from 'react';
import axios from 'axios';

function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

 // 🔹 API-URL automatisch wählen
  const API_URL = process.env.REACT_APP_API_URL; 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post(`${API_URL}/subscribe`, { email });
      console.log(res.data);
      setMessage("Bitte bestätige Deine Anmeldung in der Bestätigungsmail.");
      setSubmitted(true);
    } catch (err) {
      console.error(err.response?.data);

      if (err.response?.data?.error === "Adresse schon eingetragen") {
        // Prüfen, ob bestätigt
        try {
          const confirmCheck = await axios.get(`${API_URL}/check-confirmation/${email}`);
          if (confirmCheck.data.confirmed) {
            setMessage("Deine E-Mail ist bereits bestätigt.");
          } else {
            setMessage("Du bist bereits eingetragen. Bitte bestätige Deine Adresse.");
          }
          setSubmitted(true);
        } catch {
          setError("Fehler beim Prüfen der Anmeldung.");
        }
      } else {
        setError(err.response?.data?.error || "Fehler beim Senden der Anfrage");
      }
    }
  };

  return (
    <div className="container mt-5">
      {!submitted ? (
        <form onSubmit={handleSubmit} className="p-4 border rounded shadow-sm bg-light">
          <h5>Newsletter Anmeldung</h5>
          <div className="mb-3">
            <input
              type="email"
              placeholder="E-Mail eingeben"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">Anmelden</button>
          {error && <div className="mt-2 text-danger">{error}</div>}
        </form>
      ) : (
        <div className="alert alert-success mt-3">
          {message}
        </div>
      )}
    </div>
  );
}

export default NewsletterForm;
