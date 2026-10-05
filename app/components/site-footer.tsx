import Image from "next/image";
import Link from "next/link";
import {Fragment} from "react";
import type { SiteSettings } from "@/sanity/lib/site";

function SocialIcon({platform}: {platform: string}) {
  const name = platform.toLocaleLowerCase("en-GB");
  if (name === "facebook") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h3V4.5c-.8-.2-1.9-.3-3.1-.3-3.1 0-5.2 1.9-5.2 5.4V12H5.2v4h3.5v8h4.2v-8h3.5l.6-4h-4.1V10c0-1.2.3-2 1.1-2Z" /></svg>;
  if (name === "tiktok") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3c.4 2.4 1.8 3.9 4 4.1v3.3a8.4 8.4 0 0 1-4-1.1v6.2a6.4 6.4 0 1 1-5.5-6.3v3.4a3 3 0 1 0 2.1 2.9V3H15Z" /></svg>;
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle className="fill" cx="17.3" cy="6.8" r="1" />
    </svg>
  );
}

export function SiteFooter({settings}: {settings: SiteSettings}) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="siteFooter" aria-label={`${settings.restaurantName} footer`}>
      <div className="siteFooterLead">
        <div className="siteFooterIntro">
          <p>{settings.footerEyebrow}</p>
          <h2>{settings.footerHeading}</h2>
          <span>{settings.footerText}</span>
          <div className="siteFooterSocials">
            {settings.socialLinks.map((social) => <a className="siteFooterSocial" href={social.url} target="_blank" rel="noreferrer" aria-label={`Follow ${settings.restaurantName} on ${social.platform}`} key={`${social.platform}-${social.url}`}>
              <i><SocialIcon platform={social.platform} /></i>
              <span><small>Follow us on</small><strong>{social.platform}</strong></span>
              <b aria-hidden="true">↗</b>
            </a>)}
          </div>
        </div>

        <nav className="siteFooterNav" aria-label="Footer navigation">
          <p className="siteFooterSectionLabel">Explore</p>
          {settings.primaryNavigation.filter((link) => link.href !== "/checkout").map((link) => (
            <Link href={link.href} key={`${link.href}-${link.label}`} target={link.openInNewTab ? "_blank" : undefined} rel={link.openInNewTab ? "noreferrer" : undefined}>{link.label} <span aria-hidden="true">↗</span></Link>
          ))}
          <Link href="/careers">Careers <span aria-hidden="true">↗</span></Link>
        </nav>

        <address className="siteFooterAddress">
          <p>Come ashore</p>
          <strong>{settings.address.streetAddress}</strong>
          <span>{settings.address.locality}, {settings.address.region}</span>
          <span>{settings.address.postalCode} · Scotland</span>
          <a href={settings.mapUrl} target="_blank" rel="noreferrer">Get directions <span aria-hidden="true">↗</span></a>
        </address>
      </div>

      <div className="siteFooterBrand" aria-hidden="true">
        <i />
        <Image src="/malabar.png" alt="" width={2384} height={2403} sizes="(max-width: 600px) 28vw, 7rem" />
        <i />
      </div>

      <div className="siteFooterLegal">
        <div aria-label="Legal and policy pages">
          {settings.footerNavigation.map((link, index) => <Fragment key={`${link.href}-${link.label}`}><Link href={link.href}>{link.label}</Link>{index < settings.footerNavigation.length - 1 && <i>·</i>}</Fragment>)}
        </div>
        <p aria-label={`Copyright ${currentYear} ${settings.restaurantName}, trademark. All rights reserved.`}>
          <span className="siteFooterTrademark">© {currentYear} {settings.restaurantName}<sup>™</sup></span>
          <span> All rights reserved.</span>
        </p>
      </div>

      <a className="siteFooterCredit" href={settings.footerCreditUrl} target="_blank" rel="noreferrer" aria-label={settings.footerCreditLabel}>
        {settings.footerCreditLabel}
      </a>
    </footer>
  );
}
