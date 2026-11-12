import Image from "next/image";

const MESSAGE = "This page has been temporarily disabled by the administrator.";

/* ---------- Separate styling for each part of the navbar ---------- */

// "GTI" – sky blue
const gtiStyle = {
  color: "#38bdf8", // sky blue
  fontSize: "14px",
  fontWeight: 800,
  fontFamily: "Arial, sans-serif",
  letterSpacing: "0.5px",
};

// thin line between GTI and the company name
const dividerStyle = {
  width: "1px",
  height: "22px",
  margin: "0 14px",
  background: "rgba(255, 255, 255, 0.35)",
};

// "GREENTECH INDUSTRIES" – white
const titleStyle = {
  color: "#ffffff",
  fontSize: "17px",
  fontWeight: 700,
  fontFamily: "Trebuchet MS, Arial Rounded MT Bold, Arial, sans-serif",
  letterSpacing: "1px",
};

export default function EsiFormNotFound() {
  return (
    <>
      <style>{`
        @keyframes esi-marquee {
          0%   { transform: translateX(100vw); }   /* starts just outside the right edge */
          100% { transform: translateX(-100%); }   /* ends fully outside the left edge */
        }
        .esi-marquee-text {
          display: inline-block;
          white-space: nowrap;
          animation: esi-marquee 15s linear infinite;
        }
        .esi-marquee-bar:hover .esi-marquee-text {
          animation-play-state: paused;
        }
      `}</style>

      {/* Top navbar */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          background: "#0a1f44", // navy blue
          padding: "12px 24px",
          boxSizing: "border-box",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "Arial, sans-serif",
          zIndex: 1000,
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
        }}
      >
        {/* left side: GTI + divider line */}
        <div
          style={{
            position: "absolute",
            left: "24px",
            top: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
          }}
        >
          <span style={gtiStyle}>GTI</span>
          <span style={dividerStyle} aria-hidden="true" />
        </div>

        {/* center: company name */}
        <span style={titleStyle}>GREENTECH INDUSTRIES</span>
      </nav>

      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeContent: "center",
          justifyItems: "center",
          padding: "90px 24px 80px",
          boxSizing: "border-box",
          background: "#fff",
          color: "#1b2b2a",
          fontFamily: "Arial, sans-serif",
          textAlign: "center",
        }}
      >
        <Image
          src="/images/404error.png"
          alt="Page not found"
          width={600}
          height={500}
          priority
          style={{ maxWidth: "min(100%, 480px)", height: "auto" }}
        />
      </main>

      {/* Bottom scrolling banner */}
      <div
        className="esi-marquee-bar"
        role="alert"
        style={{
          position: "fixed",
          left: 0,
          bottom: 0,
          width: "100%",
          background: "#d32f2f",
          color: "#fff",
          overflow: "hidden",
          padding: "12px 0",
          fontFamily: "Arial, sans-serif",
          fontSize: "16px",
          fontWeight: 600,
          zIndex: 1000,
        }}
      >
        <span className="esi-marquee-text">{MESSAGE}</span>
      </div>
    </>
  );
}