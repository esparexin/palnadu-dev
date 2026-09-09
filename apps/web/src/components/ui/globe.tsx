import React from "react";

const Globe: React.FC = () => {
  return (
    <>
      <style>
        {`
          @keyframes earthRotate {
            0% { background-position: 0 0; }
            100% { background-position: 400px 0; }
          }
          @keyframes twinkling { 0%,100% { opacity:0.1; } 50% { opacity:0.9; } }
          @keyframes twinkling-slow { 0%,100% { opacity:0.1; } 50% { opacity:0.8; } }
        `}
      </style>
      <div className="flex items-center justify-center">
        <div
          className="relative w-[220px] h-[220px] sm:w-[250px] sm:h-[250px] rounded-full overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.2),-5px_0_8px_#c3f4ff_inset,15px_2px_25px_#000_inset,-24px_-2px_34px_#c3f4ff99_inset,250px_0_44px_#00000066_inset,150px_0_38px_#000000aa_inset] will-change-transform"
          style={{
            backgroundImage: "url('/assets/earth-texture.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "left",
            animation: "earthRotate 30s linear infinite",
          }}
        >
          {/* Subtle Ambient Twinkling Highlights */}
          <div
            className="absolute left-[-20px] w-1 h-1 bg-white rounded-full pointer-events-none"
            style={{ animation: "twinkling 3s infinite" }}
          />
          <div
            className="absolute left-[-40px] top-[30px] w-1 h-1 bg-white rounded-full pointer-events-none"
            style={{ animation: "twinkling-slow 2s infinite" }}
          />
          <div
            className="absolute left-[200px] top-[200px] w-1 h-1 bg-white rounded-full pointer-events-none"
            style={{ animation: "twinkling 3s infinite" }}
          />
        </div>
      </div>
    </>
  );
};

export default Globe;
