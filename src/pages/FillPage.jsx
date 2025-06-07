import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

function getTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token");
}

const FillPage = () => {
  const [token] = useState(getTokenFromUrl());
  const [expired, setExpired] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [decoded, setDecoded] = useState(null);

  useEffect(() => {
    if (!token) return;
    axios
      .get(`http://localhost:3000/magic-link/verify`, {
        params: { token },
      })
      .then(res => {
        if (res.data.status === "expired") setExpired(true);
        else setExpired(false);
      })
      .catch((err) => setFetchError("Network error. Please try again."));
  }, [token]);

  useEffect(() => {
    if (!token || expired) return;
    try {
      setDecoded(jwtDecode(token));
    } catch (err) {
      setFetchError("Invalid or malformed token.");
    }
  }, [token, expired]);

  if (!token) return <div>Invalid or missing magic link.</div>;
  if (fetchError) return <div style={{ color: "red" }}>{fetchError}</div>;
  if (expired)
    return (
      <div>
        Link expired.{" "}
        <button onClick={() => window.location.reload()}>Regenerate link</button>
      </div>
    );

  return (
    <div style={{ maxWidth: 500, margin: "3rem auto", textAlign: "center" }}>
      <h2>Contract Fill Page</h2>
      {decoded ? (
        <pre>{JSON.stringify(decoded, null, 2)}</pre>
      ) : (
        <div>Loading token data...</div>
      )}
      {/* Add form fields here */}
    </div>
  );
};

export default FillPage;
