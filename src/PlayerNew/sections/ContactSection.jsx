import { Mail, Phone } from "lucide-react";

export default function ContactSection({ player }) {
  const email = player?.email || "";
  const phone = player?.phone || "";

  return (
    <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl shadow-lg p-6 text-white">
      <h2 className="text-2xl font-bold mb-4">Contact Information</h2>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-[#ffc525]" />
          <div>
            <div className="text-sm text-white/70">Email</div>
            {email ? (
              <a href={`mailto:${email}`} className="hover:text-[#ffc525] transition">
                {email}
              </a>
            ) : (
              <span className="text-white/90">—</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Phone className="w-5 h-5 text-[#ffc525]" />
          <div>
            <div className="text-sm text-white/70">Phone</div>
            {phone ? (
              <a href={`tel:${phone}`} className="hover:text-[#ffc525] transition">
                {phone}
              </a>
            ) : (
              <span className="text-white/90">—</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

