import Link from 'next/link';
import Image from 'next/image';

export default function PublicFooter() {
  return (
    <footer className="bg-slate-950 text-slate-100">
      <div className="container mx-auto px-4 md:px-6 py-12 space-y-10">
        <div className="grid gap-10 md:grid-cols-[2fr,1fr,1fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image src="/Mafdc.jpg" alt="MA Florencio Dental Clinic" width={50} height={50} className="rounded-lg" />
              <div>
                <p className="text-lg font-semibold">MA Florencio Dental Clinic</p>
                <p className="text-sm text-slate-400">Smile with confidence</p>
              </div>
            </div>
            <p className="text-sm text-slate-400">
              M&amp;F Building National Road cor. Govic Highway<br />
              Brgy. Del Pilar, Castillejos, Philippines
            </p>
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500 mb-4">Explore</p>
            <ul className="space-y-2 text-sm">
              {[
                { href: '/', label: 'Home' },
                { href: '/services', label: 'Services' },
                { href: '/about', label: 'About' },
                { href: '/contact', label: 'Contact' },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2 text-sm text-slate-400">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Contact</p>
            <p>Phone: <a href="tel:+639949282037" className="text-slate-200 hover:text-white">+63 994 928 2037</a></p>
            <p>Email: <a href="mailto:maflorenciodental@gmail.com" className="text-slate-200 hover:text-white">maflorenciodental@gmail.com</a></p>
            <p>Hours: Mon - Fri, 9:00 AM - 6:00 PM</p>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 text-xs text-slate-500 flex flex-col sm:flex-row gap-2 justify-between">
          <p>© {new Date().getFullYear()} MA Florencio Dental Clinic. All rights reserved.</p>
          <p>Crafted with care for every smile.</p>
        </div>
      </div>
    </footer>
  );
}

