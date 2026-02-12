import {
  Download,
  GraduationCap,
  Share2,
  Trophy,
  Users,
} from "lucide-react";

export default function ProfileHeaderSection({
  player,
  images,
  quickStats,
  committed,
  committedDivision,
}) {
  const headerImg = images?.headerImg || "";
  const playerImg = images?.playerImg || "";
  const committedText = String(committed ?? "").trim();
  const committedDivisionText = String(committedDivision ?? "").trim();

  return (
    <div className="bg-gradient-to-r from-[#1d4281] to-[#2a5ba8] text-white overflow-hidden rounded-2xl shadow-lg">
      <div
        className="relative"
        style={
          headerImg
            ? {
                backgroundImage: `linear-gradient(to right, rgba(29, 66, 129, 0.88), rgba(42, 91, 168, 0.88)), url(${headerImg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
            {/* Profile Image */}
            <div className="relative">
              <div className="w-40 h-40 rounded-full bg-white/10 backdrop-blur-sm border-4 border-[#ffc525] overflow-hidden">
                {playerImg ? (
                  <img
                    src={playerImg}
                    alt={player?.name || "Player"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
                    <Users className="w-16 h-16 text-white/40" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-[#ffc525] text-[#1d4281] rounded-full p-3 shadow-md">
                <Trophy className="w-6 h-6" />
              </div>
            </div>

            {/* Player Info */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl lg:text-5xl font-bold mb-2">
                {player?.name || "Player Name"}
              </h1>
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 text-lg mb-4">
                <span className="bg-white/20 px-4 py-1 rounded-full">
                  #{player?.number || "--"}
                </span>
                <span className="bg-white/20 px-4 py-1 rounded-full">
                  {player?.position || "Position"}
                </span>
                <span className="bg-white/20 px-4 py-1 rounded-full">
                  {player?.batsThrows || "R/R"}
                </span>
              </div>

              {committedText ? (
                <div className="mb-4">
                  <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-5 py-4">
                    <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                      {/* College logo goes here later */}
                      <GraduationCap className="w-9 h-9 text-[#1d4281]" />
                    </div>
                    <div className="text-left">
                      <div className="text-white/80 text-sm">Committed to</div>
                      <div className="text-2xl font-bold leading-tight">{committedText}</div>
                      {committedDivisionText ? (
                        <div className="text-[#ffc525] text-lg">{committedDivisionText}</div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 mt-4">
                <button
                  type="button"
                  className="flex items-center gap-2 bg-[#ffc525] text-[#1d4281] px-4 py-2 rounded-lg hover:bg-[#ffd650] transition"
                  onClick={() => {
                    // Placeholder: implement later (download/print card).
                  }}
                >
                  <Download className="w-4 h-4" />
                  Download Card
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg hover:bg-white/20 transition"
                  onClick={() => {
                    // Placeholder: implement later (share/copy link).
                  }}
                >
                  <Share2 className="w-4 h-4" />
                  Share Profile
                </button>
              </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              {(quickStats || []).slice(0, 4).map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-4 min-w-[120px]"
                >
                  <div className="text-sm text-white/80 mb-1">{stat.label}</div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

