"use client";
import { useEffect, useState } from "react";
import { Spin } from "antd";

const HubSpotForm = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const scriptId = "hubspot-embed-script";

    const showForm = () => {
      setTimeout(() => setIsLoading(false), 1000); // Slight delay to hide spinner
    };

    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.src = "https://js-na2.hsforms.net/forms/embed/242830579.js";
      script.defer = true;
      script.id = scriptId;
      script.onload = showForm;
      document.body.appendChild(script);
    } else {
      showForm(); // Script already exists
    }
  }, []);

  return (
    <div style={{ position: "relative", maxHeight: "100vh", overflow: "hidden" }}>
      {isLoading && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "450px",
          }}
        >
          <Spin size="large" />
        </div>
      )}

      <div
        className="hs-form-frame"
        data-region="na2"
        data-form-id="79a40e9e-7c27-4326-9fe1-574026b43b13"
        data-portal-id="242830579"
        style={{
          opacity: isLoading ? 0 : 1,
          transition: "opacity 0.3s ease-in-out",
          overflow: "hidden",
        }}
      ></div>
    </div>
  );
};

export default HubSpotForm;
