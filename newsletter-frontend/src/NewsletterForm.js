// src/NewsletterForm.js
import React, { useState } from 'react';
import axios from 'axios';

function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

    const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
        const res = await axios.post('http://localhost:4000/subscribe', { email });
        console.log(res.data);

        // Formular ausblenden, egal ob Erfolg oder "Adresse schon eingetragen"
        setSubmitted(true);
    } catch (err) {
        console.error(err.response?.data);

        // Falls die Mail schon eingetragen ist, trotzdem Formular ausblenden
        if (err.response?.data?.error === "Adresse schon eingetragen") {
        setSubmitted(true);
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
          Bitte bestätige Deine Anmeldung in der Bestätigungsmail.
        </div>
      )}
    </div>
  );
}

export default NewsletterForm;
