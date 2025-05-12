import React, { useState } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [transcript, setTranscript] = useState('');
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(false);

  const availableLanguages = ['HI', 'ES', 'FR', 'DE'];

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleCheckboxChange = (lang) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang)
        ? prev.filter((l) => l !== lang)
        : [...prev, lang]
    );
  };

  const handleSubmit = async () => {
    if (!file || selectedLanguages.length === 0) return;

    setLoading(true);
    setTranscript('');
    setTranslations({});

    const formData = new FormData();
  formData.append('audio', file); // key must match what Flask expects
  selectedLanguages.forEach(lang => formData.append('languages', lang));


    try {
      const response = await fetch('http://127.0.0.1:5000/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setTranscript(data.transcript || '');
      setTranslations(data.translations || {});
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Audio Transcriber & Translator</h1>

      <input
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        className="file-input"
      />
      {file && <p>{file.name}</p>}

      <div className="language-options">
        <p>Select Target Languages:</p>
        {availableLanguages.map((lang) => (
          <label key={lang}>
            <input
              type="checkbox"
              checked={selectedLanguages.includes(lang)}
              onChange={() => handleCheckboxChange(lang)}
            />
            <span>{lang}</span>
          </label>
        ))}
      </div>

      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Processing...' : 'Transcribe & Translate'}
      </button>

      <div className="output">
        {transcript && (
          <>
            <h2>Transcript</h2>
            <p>{transcript}</p>
          </>
        )}

        {Object.keys(translations).length > 0 && (
          <>
            <h2>Translations</h2>
            {Object.entries(translations).map(([lang, text]) => (
              <div key={lang} className="translation-block">
                <h3>{lang.toUpperCase()}:</h3>
                <p>{text}</p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
