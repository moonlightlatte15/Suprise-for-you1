import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import QRCode from "qrcode.react";

export default function BestieSurprise() {
  // Letter content
  const [letter, setLetter] = useState({
    headline: "💙 For My Bestie, Ayaz 💙",
    intro:
      "Ayaz… honestly idk how to even start but I’ll just say this straight—thank you for being you. For staying, for caring, for annoying me and making me laugh, for every little effort you put without even realizing how much it means.",
    memories:
      "😂 That time we argued over the dumbest thing\n💙 When you stayed up just to make sure I was fine\n🍫 You buying me pastry + Kinder Joy\n🙈 The way you call me dumb monkey\n🌙 Late night talks that never end",
    closing: "Made with 💙 by your bestie (aka me 😭😂)",
  });

  // Collage state
  const [images, setImages] = useState(() => {
    try {
      const raw = localStorage.getItem("fs_images");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Playlist
  const [playlistUrl, setPlaylistUrl] = useState(
    () =>
      localStorage.getItem("fs_playlist") ||
      "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M"
  );
  const [autoplay, setAutoplay] = useState(false);
  const audioRef = useRef(null);

  // UI
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    localStorage.setItem("fs_letter", JSON.stringify(letter));
  }, [letter]);

  useEffect(() => {
    localStorage.setItem("fs_images", JSON.stringify(images));
  }, [images]);

  useEffect(() => {
    localStorage.setItem("fs_playlist", playlistUrl);
  }, [playlistUrl]);

  // Load saved letter
  useEffect(() => {
    const raw = localStorage.getItem("fs_letter");
    if (raw) setLetter(JSON.parse(raw));
  }, []);

  // Add image via url
  function addImageUrl(url, caption = "") {
    if (!url) return;
    setImages((prev) => [{ id: Date.now(), url, caption }, ...prev]);
  }

  // File upload
  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => addImageUrl(ev.target.result, file.name);
    reader.readAsDataURL(file);
  }

  return (
    <div
      style={{
        fontFamily: "Poppins, sans-serif",
        background:
          "linear-gradient(135deg, #a2d2ff, #bde0fe, #cdb4db)",
        color: "#1d3557",
        minHeight: "100vh",
      }}
      className="p-4"
    >
      {/* Header */}
      <header
        style={{
          textAlign: "center",
          padding: "2rem",
          background: "rgba(255, 255, 255, 0.3)",
          backdropFilter: "blur(6px)",
          borderBottom: "3px solid #1d3557",
        }}
      >
        <h1 style={{ fontSize: "2.5rem", margin: 0 }}>{letter.headline}</h1>
        <p style={{ marginTop: ".5rem", fontSize: "1.2rem" }}>
          A little surprise website... just for you.
        </p>
        <button
          onClick={() => setEditing(!editing)}
          className="mt-3 px-3 py-2 rounded bg-white text-sm"
        >
          {editing ? "Done Editing" : "Edit Letter"}
        </button>
      </header>

      {/* Letter */}
      <section
        style={{
          maxWidth: "800px",
          margin: "2rem auto",
          padding: "2rem",
          background: "rgba(255, 255, 255, 0.7)",
          borderRadius: "20px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            color: "#0077b6",
            marginBottom: "1rem",
          }}
        >
          My Letter To You
        </h2>

        {editing ? (
          <>
            <textarea
              value={letter.intro}
              onChange={(e) => setLetter({ ...letter, intro: e.target.value })}
              className="w-full p-2 rounded border mb-3"
              rows={5}
            />
            <textarea
              value={letter.memories}
              onChange={(e) =>
                setLetter({ ...letter, memories: e.target.value })
              }
              className="w-full p-2 rounded border mb-3"
              rows={4}
            />
          </>
        ) : (
          <>
            <p style={{ lineHeight: "1.7", marginBottom: "1rem" }}>
              {letter.intro}
            </p>
            {letter.memories.split("\n").map((m, i) => (
              <div
                key={i}
                style={{
                  background: "#e0f7fa",
                  padding: "1rem",
                  borderRadius: "15px",
                  marginBottom: "1rem",
                  textAlign: "center",
                }}
              >
                {m}
              </div>
            ))}
          </>
        )}
      </section>

      {/* Playlist */}
      <section
        style={{
          maxWidth: "800px",
          margin: "2rem auto",
          padding: "2rem",
          background: "rgba(255, 255, 255, 0.7)",
          borderRadius: "20px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
          textAlign: "center",
        }}
      >
        <h2 style={{ color: "#0077b6" }}>Our Playlist 🎶</h2>
        <input
          value={playlistUrl}
          onChange={(e) => setPlaylistUrl(e.target.value)}
          className="w-full p-2 rounded border my-3"
        />
        <QRCode value={playlistUrl} size={150} />
        <p className="mt-2">
          (or just click{" "}
          <a href={playlistUrl} target="_blank" rel="noreferrer">
            here
          </a>
          )
        </p>
        <button
          onClick={() => setAutoplay(!autoplay)}
          className="mt-2 px-3 py-1 rounded bg-sky-100 text-sky-700 text-sm"
        >
          {autoplay ? "Stop Music" : "Play in Background"}
        </button>
        {autoplay && (
          <audio
            ref={audioRef}
            src={playlistUrl}
            autoPlay
            controls
            style={{ display: "none" }}
          />
        )}
      </section>

      {/* Collage */}
      <section
        style={{
          maxWidth: "800px",
          margin: "2rem auto",
          padding: "2rem",
          background: "rgba(255, 255, 255, 0.7)",
          borderRadius: "20px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ textAlign: "center", color: "#0077b6" }}>
          Add Our Photos 📸
        </h2>
        <div className="flex gap-2 mb-3">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="text-sm"
          />
          <input
            placeholder="image url"
            id="imgurl"
            className="p-2 rounded border text-sm flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                addImageUrl(e.target.value);
                e.target.value = "";
              }
            }}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {images.length === 0 && (
            <div className="col-span-full text-sm text-gray-400">
              No memories yet — add photos or drop URLs above.
            </div>
          )}
          {images.map((img) => (
            <div
              key={img.id}
              className="rounded overflow-hidden border bg-white"
            >
              <img
                src={img.url}
                alt="memory"
                className="w-full h-40 object-cover"
              />
              <div className="p-2 text-sm">{img.caption || "memory"}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: "center", padding: "1rem", fontSize: ".9rem" }}>
        {letter.closing}
      </footer>
    </div>
  );
}
