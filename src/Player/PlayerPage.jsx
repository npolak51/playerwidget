import { useEffect } from "react";
import { Twitter, Instagram } from "lucide-react";
import TikTokIcon from "../assets/Icons/TikTok.svg";
import playersData from "../data/players.json";

export default function PlayerPage() {
  const params = new URLSearchParams(window.location.search);
  const playerId = params.get("player");

  // Get player data from JSON, or use defaults if not found
  const player = playerId && playersData.players[playerId] 
    ? playersData.players[playerId]
    : {
        name: "Player Name",
        number: "00",
        positions: "Position(s)",
        playerImg: "https://via.placeholder.com/400x500",
        headerImg: "",
        logoImg: "",
        school: "",
        class: "",
        heightWeight: "",
        batThrow: "",
        favoriteTeam: "",
        postGameMeal: "",
        twitter: "",
        instagram: "",
        tiktok: "",
      };

  const {
    name,
    number,
    positions,
    playerImg,
    headerImg,
    logoImg,
    school: schoolName,
    class: playerClass,
    heightWeight,
    batThrow,
    favoriteTeam,
    postGameMeal,
    twitter,
    instagram,
    tiktok,
  } = player;

  const tiktokUrl =
    tiktok && tiktok.startsWith("http")
      ? tiktok
      : tiktok
        ? `https://www.tiktok.com/@${String(tiktok).replace(/^@/, "").replace(/\/$/, "")}`
        : "";

  // If embedded in an iframe (e.g. Squarespace), auto-resize the parent iframe
  // by posting our current document height to the parent page.
  useEffect(() => {
    // When embedded, make the page background transparent (so the parent page shows through).
    if (window.parent && window.parent !== window) {
      document.documentElement.classList.add("embed");
    }

    const postHeight = () => {
      // Prefer the largest of these to avoid edge cases with absolutely positioned content.
      const body = document.body;
      const html = document.documentElement;
      const height = Math.max(
        body?.scrollHeight ?? 0,
        body?.offsetHeight ?? 0,
        html?.clientHeight ?? 0,
        html?.scrollHeight ?? 0,
        html?.offsetHeight ?? 0
      );

      // Post to any parent; the parent page should validate origin before trusting.
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: "playerwidget:height", height }, "*");
      }
    };

    // Run immediately and after layout settles.
    postHeight();
    const raf = window.requestAnimationFrame(postHeight);
    const t = window.setTimeout(postHeight, 250);

    // Update on resizes and when the DOM changes size (e.g., images load).
    window.addEventListener("resize", postHeight);

    let ro;
    if ("ResizeObserver" in window) {
      ro = new ResizeObserver(() => postHeight());
      if (document.body) ro.observe(document.body);
    }

    // Fallback: image load events can change height without a resize.
    window.addEventListener("load", postHeight);

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(t);
      window.removeEventListener("resize", postHeight);
      window.removeEventListener("load", postHeight);
      if (ro) ro.disconnect();
    };
  }, [playerId]);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-0 w-full max-w-6xl mx-auto">
      <div 
        className="relative h-72 sm:h-80 bg-gradient-to-r from-blue-900 to-blue-700"
        style={headerImg ? {
          backgroundImage: `linear-gradient(to right, rgba(30, 58, 138, 0.8), rgba(29, 78, 216, 0.8)), url(${headerImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : {}}
      >
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      <div className="relative px-4 sm:px-8 pb-6 sm:pb-8">
        <div className="flex flex-col md:flex-row gap-6 sm:gap-8 -mt-32">
          {/* Player Image */}
          <div className="relative z-10">
            <div className="w-44 h-60 sm:w-56 sm:h-72 md:w-64 md:h-80 rounded-lg overflow-hidden shadow-2xl border-4 border-white bg-white mx-auto md:mx-0">
              <img src={playerImg} alt={name} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Player Info */}
          <div className="flex-1 pt-6 sm:pt-8">
            <div className="flex items-start justify-between mb-6">
              <div className="-mt-[6px] sm:-mt-[10px]">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="text-gray-900 sm:text-white font-bold text-4xl sm:text-5xl md:text-6xl leading-none">{number}</span>
                  <h1 className="text-gray-900 sm:text-white text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">{name}</h1>
                </div>
                <p className="text-gray-700 sm:text-white text-xl sm:text-2xl">{positions}</p>
                {schoolName && <p className="text-gray-600 sm:text-white/80 text-base sm:text-lg mt-1">{schoolName}</p>}
              </div>
              
              {logoImg && (
                <img 
                  src={logoImg} 
                  alt="Team Logo"
                  className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
                />
              )}
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
              <Info label="Graduating Class" value={playerClass || ""} />
              <Info label="Height/Weight" value={heightWeight || ""} />
              <Info label="Bat/Throw" value={batThrow || ""} />
              <Info label="Favorite Team" value={favoriteTeam || ""} />
              <Info label="Post-Game Meal" value={postGameMeal || ""} />
              <div>
                <div className="text-lg text-gray-500 mb-1">Social Media</div>
                <div className="flex gap-2">
                  {twitter ? (
                    <a 
                      href={`https://twitter.com/${twitter}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Twitter size={20} className="text-blue-600" />
                    </a>
                  ) : null}
                  {instagram ? (
                    <a 
                      href={`https://instagram.com/${instagram}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors"
                    >
                      <Instagram size={20} className="text-pink-600" />
                    </a>
                  ) : null}
                  {tiktokUrl ? (
                    <a
                      href={tiktokUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="TikTok"
                      className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <img src={TikTokIcon} alt="TikTok" className="w-5 h-5" />
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-base sm:text-lg text-gray-500 mb-1">{label}</div>
      <div className="text-lg sm:text-xl">{value}</div>
    </div>
  );
}
