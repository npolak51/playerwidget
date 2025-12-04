import { Twitter, Instagram } from "lucide-react";

export default function PlayerPage() {
  const params = new URLSearchParams(window.location.search);

  const name = params.get("name") || "Player Name";
  const number = params.get("number") || "00";
  const positions = params.get("positions") || "Position(s)";
  const playerImg = params.get("playerImg") || "https://via.placeholder.com/400x500";
  const logoImg = params.get("logoImg") || "";
  const schoolName = params.get("school") || "";
  const playerClass = params.get("class") || "";
  const heightWeight = params.get("heightWeight") || "";
  const batThrow = params.get("batThrow") || "";
  const favoriteTeam = params.get("favoriteTeam") || "";
  const postGameMeal = params.get("postGameMeal") || "";
  const twitter = params.get("twitter");
  const instagram = params.get("instagram");

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden max-w-4xl mx-auto mb-8">
      <div className="relative h-40 sm:h-64 bg-gradient-to-r from-blue-900 to-blue-700">
        <div className="absolute inset-0 bg-black/20"></div>
      </div>
      <div className="relative px-6 sm:px-8 pb-8">
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 -mt-24 sm:-mt-32">
          <div className="relative z-10 mx-auto sm:mx-0">
            <div className="w-40 h-56 sm:w-64 sm:h-80 rounded-lg overflow-hidden shadow-2xl border-4 border-white bg-white">
              <img src={playerImg} alt={name} className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="flex-1 pt-4 sm:pt-8">
            <div className="flex items-start justify-between mb-6 flex-col sm:flex-row sm:items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">#{number}</span>
                  <h1 className="text-3xl sm:text-4xl font-bold">{name}</h1>
                </div>
                <p className="text-lg sm:text-xl text-gray-600">{positions}</p>
                {schoolName && <p className="text-md text-gray-500 mt-1">{schoolName}</p>}
              </div>
              {logoImg && <img src={logoImg} alt="Team Logo" className="w-20 h-20 sm:w-24 sm:h-24 object-contain mt-4 sm:mt-0" />}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-6 text-sm sm:text-base">
              {playerClass && <Info label="Class" value={playerClass} />}
              {heightWeight && <Info label="Height/Weight" value={heightWeight} />}
              {batThrow && <Info label="Bat/Throw" value={batThrow} />}
              {favoriteTeam && <Info label="Favorite Team" value={favoriteTeam} />}
              {postGameMeal && <Info label="Post-Game Meal" value={postGameMeal} />}
              {(twitter || instagram) && (
                <div>
                  <div className="text-gray-500 mb-1">Social Media</div>
                  <div className="flex gap-2">
                    {twitter && <a href={`https://twitter.com/${twitter}`} target="_blank" className="p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"><Twitter size={18} className="text-blue-600" /></a>}
                    {instagram && <a href={`https://instagram.com/${instagram}`} target="_blank" className="p-2 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors"><Instagram size={18} className="text-pink-600" /></a>}
                  </div>
                </div>
              )}
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
      <div className="text-gray-500 mb-1">{label}</div>
      <div className="text-lg">{value}</div>
    </div>
  );
}
