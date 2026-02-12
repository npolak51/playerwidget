import { Calendar, GraduationCap, Instagram, MapPin, Twitter, Users } from "lucide-react";
import TikTokIcon from "../../assets/Icons/TikTok.svg";

import PGLogo from "../../assets/Icons/PG_Logo.svg";
import PBRLogo from "../../assets/Icons/PBR_Logo.svg";
import BBNWLogo from "../../assets/Icons/BBNW_Logo.svg";

function buildTikTokUrl(tiktok) {
  const v = String(tiktok ?? "").trim();
  if (!v) return "";
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return `https://www.tiktok.com/@${v.replace(/^@/, "").replace(/\/$/, "")}`;
}

function iconForScoutingProfile(name) {
  const n = String(name ?? "").trim().toLowerCase();
  if (!n) return "";
  if (n.includes("perfect")) return PGLogo;
  if (n === "pbr" || n.includes("prep baseball")) return PBRLogo;
  if (n.includes("baseball northwest") || n.includes("bbnw")) return BBNWLogo;
  return "";
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      {Icon ? (
        <Icon className="w-6 h-6 text-[#1d4281] flex-shrink-0 mt-0.5" />
      ) : null}
      <div>
        <div className="text-slate-600 text-base leading-tight">{label}</div>
        <div className="font-semibold text-lg leading-snug">{value}</div>
      </div>
    </div>
  );
}

export default function PersonalInfoSection({ player, social }) {
  const born = player?.birthdate
    ? `${player.birthdate}${player?.age ? ` (Age ${player.age})` : ""}`
    : "";

  const twitter = String(social?.twitter ?? "").trim();
  const instagram = String(social?.instagram ?? "").trim();
  const tiktokUrl = buildTikTokUrl(social?.tiktok);
  const hasSocial = Boolean(twitter || instagram || tiktokUrl);

  return (
    <div className="bg-white rounded-xl shadow-lg p-7">
      <h2 className="text-2xl font-bold text-[#1d4281] mb-4 flex items-center gap-2">
        <Users className="w-6 h-6" />
        Personal Information
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-5">
          <InfoRow icon={Calendar} label="Born" value={born} />
          <InfoRow icon={MapPin} label="Hometown" value={player?.hometown} />
          <InfoRow icon={GraduationCap} label="Graduating Class" value={player?.classYear} />

          <div className="flex items-start gap-3">
            <Users className="w-6 h-6 text-[#1d4281] flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-slate-600 text-base leading-tight">Social Media</div>
              {hasSocial ? (
                <div className="mt-2 flex gap-2">
                  {twitter ? (
                    <a
                      href={`https://twitter.com/${twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Twitter"
                      className="p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                    >
                      <Twitter size={40} className="text-blue-600" />
                    </a>
                  ) : null}
                  {instagram ? (
                    <a
                      href={`https://instagram.com/${instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                      className="p-4 bg-pink-50 rounded-xl hover:bg-pink-100 transition-colors"
                    >
                      <Instagram size={40} className="text-pink-600" />
                    </a>
                  ) : null}
                  {tiktokUrl ? (
                    <a
                      href={tiktokUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="TikTok"
                      className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <img src={TikTokIcon} alt="TikTok" className="w-10 h-10" />
                    </a>
                  ) : null}
                </div>
              ) : (
                <div className="font-semibold text-lg leading-snug text-slate-400 mt-1">—</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {player?.heightWeight ? (
            <div>
              <div className="text-slate-600 text-base mb-1 leading-tight">Physical</div>
              <div className="font-semibold text-lg leading-snug">{player.heightWeight}</div>
            </div>
          ) : null}

          {player?.favoriteTeam ? (
            <div>
              <div className="text-slate-600 text-base mb-1 leading-tight">Favorite Team</div>
              <div className="font-semibold text-lg leading-snug">{player.favoriteTeam}</div>
            </div>
          ) : null}

          {player?.favoriteMeal ? (
            <div>
              <div className="text-slate-600 text-base mb-1 leading-tight">Favorite Meal</div>
              <div className="font-semibold text-lg leading-snug">{player.favoriteMeal}</div>
            </div>
          ) : null}

          {(player?.scoutingProfiles || []).length ? (
            <div>
              <div className="text-slate-600 text-base mb-2 leading-tight">Scouting Profiles</div>
              <div className="flex flex-nowrap items-center gap-3 overflow-x-auto pb-1">
                {player.scoutingProfiles
                  .filter((p) => p?.url && p.url !== "#")
                  .map((profile) => {
                    const icon = iconForScoutingProfile(profile.name);
                    return (
                      <a
                        key={`${profile.name}-${profile.url}`}
                        href={profile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={profile.name}
                        aria-label={profile.name}
                        className="group inline-flex items-center justify-center w-24 h-24 rounded-full bg-white border border-gray-200 shadow-sm hover:border-[#ffc525] hover:bg-[#ffc525]/5 transition-all duration-200 flex-shrink-0"
                      >
                        {icon ? (
                          <img
                            src={icon}
                            alt={`${profile.name} logo`}
                            className="w-14 h-14 object-contain group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <span className="text-base font-bold text-slate-700">
                            {String(profile.name || "?").slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </a>
                    );
                  })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

