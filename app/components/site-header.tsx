"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./cart-provider";
import type { SiteSettings } from "@/sanity/lib/site";

const NAV_REVEAL_SCROLL_THRESHOLD = 4;

const fallbackNavigationDescriptions: Record<string, string> = {
  "/story": "From India's spice coast to Scotland",
  "/offers": "Today's specials, posters and offers",
  "/restaurant": "The room, the team and how to find us",
  "/faq": "Helpful answers before you visit",
  "/checkout": "Review your basket and continue",
};

export function SiteHeader({settings}: {settings: SiteSettings}) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [menuOpenedOnPath, setMenuOpenedOnPath] = useState<string | null>(null);
  const [homeNavScrolled, setHomeNavScrolled] = useState(false);
  const isMenuOpen = menuOpenedOnPath === pathname;
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLElement>(null);
  const { itemCount, openCart, hydrated } = useCart();
  const navMinimal = isHome && !homeNavScrolled;

  useEffect(() => {
    if (!isHome) return;

    const checkScroll = () => {
      if (window.scrollY > NAV_REVEAL_SCROLL_THRESHOLD) setHomeNavScrolled(true);
    };

    checkScroll();
    window.addEventListener("scroll", checkScroll, { passive: true });
    return () => window.removeEventListener("scroll", checkScroll);
  }, [isHome]);

  const handleBrandClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== "/") return;

    event.preventDefault();
    setMenuOpenedOnPath(null);
    window.scrollTo({ top: 0, behavior: "instant" });
    window.dispatchEvent(new Event("malabar:replay-intro"));
  };

  useEffect(() => {
    if (!isMenuOpen) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpenedOnPath(null);
        return;
      }

      if (event.key !== "Tab") return;

      const panel = menuPanelRef.current;
      const toggle = menuButtonRef.current;
      if (!panel || !toggle) return;

      const panelLinks = Array.from(panel.querySelectorAll<HTMLElement>("a[href]"));
      const focusableElements = [toggle, ...panelLinks];
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    const focusFrame = window.requestAnimationFrame(() => {
      menuPanelRef.current?.querySelector<HTMLElement>("a[href]")?.focus();
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isMenuOpen]);

  return (
    <>
      <header className={`nav siteHeader ${navMinimal ? "navMinimal" : ""}`} aria-label="Primary navigation">
        <div className="headerPrimaryActions" inert={navMinimal}>
          <Link className="bookButton" href="/book-a-table">
            <span className="bookButtonLabel">Book your table</span>
            <span className="bookButtonMobile" aria-hidden="true">Book</span>
            <span className="arrow" aria-hidden="true">↗</span>
          </Link>
          <Link className="headerOfferButton" href="/offers">Offers <span aria-hidden="true">↗</span></Link>
        </div>

        <Link className="brand" href="/" aria-label={`${settings.restaurantName} home`} onClick={handleBrandClick}>
          <Image src={settings.logo.url} alt={settings.logo.alt} width={2383} height={2402} priority />
        </Link>

        <div className="headerActions" inert={navMinimal}>
          <button className="cartButton" type="button" onClick={openCart} aria-label={`Open order, ${itemCount} items`}>
            <span>Order</span><b aria-live="polite">{hydrated ? itemCount : 0}</b>
          </button>
          <button
            ref={menuButtonRef}
            className={`menuButton ${isMenuOpen ? "isOpen" : ""}`}
            type="button"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="site-navigation"
            onClick={() => setMenuOpenedOnPath((currentPath) => currentPath === pathname ? null : pathname)}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <button
        className={`siteMenuScrim ${isMenuOpen ? "isOpen" : ""}`}
        type="button"
        aria-label="Close menu"
        tabIndex={-1}
        onClick={() => setMenuOpenedOnPath(null)}
      />

      <aside
        ref={menuPanelRef}
        className={`menuPanel siteMenuPanel ${isMenuOpen ? "isOpen" : ""}`}
        id="site-navigation"
        role="dialog"
        aria-label="Site navigation"
        aria-modal="true"
        aria-hidden={!isMenuOpen}
        inert={!isMenuOpen}
      >
        <div className="menuInner">
          <p>Everything, one tap away</p>
          <div className="menuQuickLinks" aria-label="Popular choices">
            {["/menu", "/book-a-table", "/hall"].map((href) => {
              const link = settings.primaryNavigation.find((entry) => entry.href === href) || {href, label: href === "/menu" ? "Menu" : href === "/hall" ? "Private hall" : "Book a table"};
              return <Link href={href} key={href} onClick={() => setMenuOpenedOnPath(null)}><small>{link.eyebrow || (href === "/menu" ? "Food & drink" : href === "/hall" ? "Private events" : "Reservations")}</small><strong>{link.label}</strong><span aria-hidden="true">{href === "/book-a-table" ? "→" : "↗"}</span></Link>;
            })}
          </div>
          <nav aria-label="Menu">
            {settings.primaryNavigation.filter((link) => !["/menu", "/book-a-table", "/hall"].includes(link.href)).map((link, index) => (
              <Link href={link.href} key={`${link.href}-${link.label}`} target={link.openInNewTab ? "_blank" : undefined} rel={link.openInNewTab ? "noreferrer" : undefined} onClick={() => setMenuOpenedOnPath(null)}>
                <span className="menuNavIndex">{String(index + 1).padStart(2, "0")}</span>
                <span className="menuNavCopy"><strong>{link.label}</strong><small>{link.description || fallbackNavigationDescriptions[link.href] || "Explore Malabar Coast"}</small></span>
                <span className="menuNavArrow" aria-hidden="true">↗</span>
              </Link>
            ))}
          </nav>
          <div className="siteMenuFooter">
            <small className="menuAddress">{settings.address.streetAddress} · {settings.address.locality} · {settings.address.postalCode}</small>
            <a className="menuAskLink" href={`mailto:${settings.reservationEmail}`}>Need a hand? <strong>Ask our team</strong><span aria-hidden="true">→</span></a>
          </div>
        </div>
      </aside>
    </>
  );
}
