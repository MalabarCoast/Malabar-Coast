# Malabar Coast

## Complete Product Delivery, Operations and Handover Report

**Document version:** 2.0 — final consolidated handover

**Prepared:** 29 September 2026
**Production website:** https://www.malabarcoast.co.uk  
**Administration:** https://www.malabarcoast.co.uk/admin/login  
**Content Studio:** https://malabar-coast.sanity.studio/  
**Prepared for:** Client handover  
**Prepared by:** Codrant Labs  

---

## 1. Document purpose

This is the operational handover for the complete Malabar Coast digital product. It records what has been delivered, every customer-facing and administration page, the purpose of each major component, the CMS content model, commands, integrations, environment settings, verification evidence, free-tier constraints, operating procedures and the actions required for final production acceptance.

The report is intentionally evidence-led. “Verified” means the relevant source, local build, automated test, rendered route or provider was actually checked on 28–29 September 2026. Items that require the client’s future administrator credentials, a controlled live payment, a real email delivery, restaurant allergen evidence or access to the Vercel project are explicitly marked as pending operational acceptance.

### Delivery position at a glance

| Area | Position | Evidence / note |
|---|---|---|
| Public website | Release candidate complete; final deployment verification pending | The public domain exists and the latest release candidate passed local production-mode review. The final menu, FAQ, gallery, Chennai Dosa and documentation changes must be deployed and smoke-tested on the canonical domain before client acceptance. |
| Responsive presentation | Verified locally | Twenty-one public and entry routes were reviewed at 320 × 800 and 390 × 844 phone, 768 × 1024 tablet and 1440 × 900 desktop sizes with no broken images. A long privacy-page email was found at phone width and corrected with safe wrapping before the final recheck. |
| Administration application | Delivered and protected | Every protected administration URL redirected unauthenticated visitors to `/admin/login`. Credentialed role-by-role review remains pending because credentials are intentionally not included. |
| CMS and live content | Updated and readable | The owner-supplied menu, 63 source-backed D/N/G declarations, 21 FAQs, Chennai Dosa journey entry and ten restaurant images are synchronised. A live read-only Sanity audit returned 24 categories, 201 menu documents (195 current catalogue items), 8 marketing pages, 4 legal pages, 3 promotions and 1 daily special. |
| Database and administrator contract | Connected | Supabase health checks reported all required operational tables and one active administrator. |
| Payments | Provider account connected | Stripe reported a live GB/GBP account with charges and payouts enabled. A canonical-domain webhook check remains a handover action; the current enabled endpoint is on the Vercel deployment URL. |
| Transactional email | Provider connected | Brevo connection check passed. Actual inbox placement was not tested because that would send a real external email. |
| Code quality | Passed | ESLint, TypeScript and 104 automated tests passed. The website and standalone Content Studio production builds passed; the updated Studio was deployed. The current working-tree delivery changes still require the normal commit, review and website deployment process. |

### Important production acceptance statement

The implementation and page-review scope is complete, but no responsible delivery report should claim that live commerce and allergen information are “100% production accepted” without controlled operational evidence. Before announcing the service as fully operational, complete the short acceptance sequence in section 15: approve the item-level allergen register, deploy the final release to the canonical domain, verify its production environment and Stripe webhook, submit one real booking and Kerala Suite enquiry, perform one controlled Stripe order, confirm signed webhook processing, confirm both customer and owner emails, test a refund/dispute rehearsal where appropriate, and validate each administrator role with real accounts.

### Final consolidation record — 29 September 2026

- Updated the owner menu and published its D/N/G meanings: **D = dairy/milk**, **N = nuts**, **G = cereals containing gluten**.
- Removed the repeated per-dish wording “Allergens: confirmation required · ask our team”; unmarked dishes now show no allergen line and remain unconfirmed internally.
- Added all ten owner-supplied restaurant photographs to the CMS restaurant presentation.
- Corrected the FAQ content for Kerala cuisine, The Kerala Suite, licensed alcohol service, signature dishes, vegan guidance and gluten guidance.
- Changed the Chennai menu-journey stop to Dosa/Masala Dosa and added a photorealistic generated Chennai dosa image.
- Consolidated the separate allergen handover into section 6.16 so this report is the single narrative delivery document.

### Handover pack

- **Master client document:** `Malabar_Coast_Complete_Product_Delivery_Report.docx`
- **Editable master source:** `CLIENT_PRODUCT_DELIVERY_REPORT.md`
- **Supporting operational evidence:** `MENU_ALLERGEN_REGISTER.csv` and `Malabar_Coast_Full_Menu_Updated.pdf`

The Word file and Markdown file are two formats of the same master report. The CSV and source PDF remain separate because they are operational evidence/registers, not competing handover documents.

---

## 2. Product scope delivered

The product is a single, integrated restaurant platform made up of:

- A branded public website for discovery, story, menu, offers, bookings, The Kerala Suite enquiries and careers.
- A CMS-driven menu and editorial system using Sanity.
- Online collection and delivery ordering with server-side pricing and Stripe Checkout.
- Customer order-status access protected by a signed access mechanism.
- Table reservations with schedule, capacity, lead-time and advance-booking rules.
- The Kerala Suite enquiry capture and staff follow-up workflow.
- Career vacancy publishing and application handoff.
- A role-protected administration application for orders, kitchen fulfilment, reservations, calendar, enquiries, reports, content, careers and system readiness.
- Supabase-backed operational data, authentication, audit records and realtime notifications.
- Transactional customer/owner email using Brevo.
- Search-engine, structured-data, PWA and agent-readable discovery surfaces.

The application is built with Next.js 16, React 19, TypeScript and Tailwind CSS. Motion and interaction are enhanced with GSAP and Lenis. The Sanity Studio is intentionally kept as a standalone application under `studio/`, while the main Next.js application remains at the repository root.

---

## 3. Complete public page register

The canonical website origin is **https://www.malabarcoast.co.uk**. The non-`www` domain redirects to the canonical `www` host.

### 3.1 Primary guest pages

| Page | URL | Purpose and delivered content | Main actions |
|---|---|---|---|
| Home | https://www.malabarcoast.co.uk/ | Brand introduction and the principal conversion page. Includes the hero, primary “Explore the menu” action, booking action, restaurant overview, featured menu/special content, opening information, booking section, story, testimonials, location/map and full footer. | Explore menu, order, book a table, read the story, get directions. |
| Menu | https://www.malabarcoast.co.uk/menu | CMS-powered menu arranged as a six-destination culinary journey. Includes category navigation, descriptions, prices where publishable, dietary/spice indicators, availability state and order controls. | Browse categories, inspect a dish, add an available priced dish to the order. |
| Offers | https://www.malabarcoast.co.uk/offers | Publishes active promotions and daily specials from the CMS, including poster, summary, validity information, code/terms where supplied and related calls to action. | View offer, browse menu, book or order. |
| Book a table | https://www.malabarcoast.co.uk/book-a-table | Guest reservation journey connected to the restaurant schedule and capacity rules. Captures full name, phone, email, date, arrival time, number of guests, occasion, dietary requirements, accessibility needs, notes and consent. | Check availability and submit reservation. |
| Restaurant | https://www.malabarcoast.co.uk/restaurant | Restaurant overview covering the food, room, welcome, locations/visit information, opening calendar, imagery and links to booking and menu. | View menu, book, get directions. |
| The Kerala Suite | https://www.malabarcoast.co.uk/hall | Dedicated private-event presentation for The Kerala Suite, with stage/bar context, gallery, occasions, planning information, FAQs and a structured enquiry form. Fields include name, email, phone, preferred/alternative date, preferred time, guest estimate, occasion, contact preference, event description and consent. | Submit an enquiry, contact the restaurant. |
| Careers | https://www.malabarcoast.co.uk/careers | Lists currently published vacancies only. Each card exposes the role, team, location, employment type, summary and route to the detailed vacancy. | Open a vacancy. |
| Career detail | `https://www.malabarcoast.co.uk/careers/[slug]` | Dynamic page for a published vacancy. Includes overview, responsibilities, skills, benefits, employment/salary metadata, closing date and application email. Also supplies JobPosting and breadcrumb structured data. | Apply by email. |
| Our story | https://www.malabarcoast.co.uk/story | Editorial brand story with chapters, imagery, menu references and calls to action. | Continue to Calicut story, menu or booking. |
| Calicut story | https://www.malabarcoast.co.uk/story/calicut | Extended heritage/archive narrative covering Calicut, pepper, exchange and the continuing journey. | Continue exploring the restaurant/menu. |
| FAQs | https://www.malabarcoast.co.uk/faq | CMS-managed answers covering the India-wide cuisine, licensed bar, signature dishes, vegan and gluten guidance, restaurant visits, ordering, opening times and The Kerala Suite. | Navigate to the relevant service page. |

### 3.2 Commerce and customer-status pages

| Page | URL | Purpose and behaviour |
|---|---|---|
| Checkout | https://www.malabarcoast.co.uk/checkout | Reviews the basket, collects customer and fulfilment details and creates a hosted Stripe checkout. The server fetches the current CMS catalogue and recalculates every line and total; browser-supplied prices are never trusted. An empty basket displays a clear route back to the menu. |
| Payment success | https://www.malabarcoast.co.uk/checkout/success | Return page after successful Stripe Checkout. It does not independently declare payment truth; the signed provider event/reconciliation flow establishes the financial state. |
| Payment cancelled | https://www.malabarcoast.co.uk/checkout/cancelled | Explains that checkout was cancelled and lets the guest return without losing the intended journey. |
| Payment expired | https://www.malabarcoast.co.uk/checkout/expired | Explains that the hosted session expired and directs the guest to restart safely. |
| Payment failure | https://www.malabarcoast.co.uk/checkout/failure | Provides a clear recovery path after a payment failure. |
| Customer order status | `https://www.malabarcoast.co.uk/order/[id]` | Dynamic, non-indexed order record for the purchaser. Access depends on the signed order-access mechanism. It shows the reference, payment/fulfilment state, ordered items, totals, requested time and relevant customer guidance without exposing the public orders table. |

### 3.3 Legal and policy pages

| Page | URL | Purpose |
|---|---|---|
| Payments policy | https://www.malabarcoast.co.uk/payments | Explains checkout, payment confirmation, provider processing, failures, refunds and related customer expectations. |
| Returns/refunds | https://www.malabarcoast.co.uk/returns | Sets out cancellation, refund and issue-resolution guidance for restaurant orders. |
| Cookie notice | https://www.malabarcoast.co.uk/cookie | Explains cookies/storage and the categories used by the website. |
| Privacy notice | https://www.malabarcoast.co.uk/privacy | Explains personal-data processing across orders, reservations, enquiries, careers and administration. Client/legal counsel should review policy wording whenever operating practice or providers change. |

### 3.4 Discovery, PWA and machine-readable routes

| Resource | URL | Purpose |
|---|---|---|
| Sitemap | https://www.malabarcoast.co.uk/sitemap.xml | Search-engine discovery of indexable canonical pages. |
| Robots policy | https://www.malabarcoast.co.uk/robots.txt | Crawler access and sitemap declaration. |
| Web-app manifest | https://www.malabarcoast.co.uk/manifest.webmanifest | Public PWA identity, icons, theme and install metadata. |
| Public facts | https://www.malabarcoast.co.uk/facts.json | Structured restaurant facts for machine consumers. |
| LLM summary | https://www.malabarcoast.co.uk/llm.txt | Concise machine-readable restaurant guidance. |
| Extended LLM guide | https://www.malabarcoast.co.uk/llms.txt | Extended authoritative navigation and usage guidance for AI/agent clients. |
| Agent guide | https://www.malabarcoast.co.uk/agents.txt | Declares safe agent-facing routes and the boundaries of publishable information. |
| Not-found page | Any unknown route | Branded recovery state for invalid URLs, with navigation back into the live site. |

### 3.5 Public API/service routes

These routes support the pages above. They are not ordinary navigation pages and must not be treated as editable web content.

| Endpoint | Method/use | Scope |
|---|---|---|
| `/api/checkout` | POST | Validates the basket/customer/fulfilment request, re-prices from current CMS data, creates the pending order and Stripe Checkout session. |
| `/api/webhooks/stripe` | POST | Verifies Stripe signatures, stores idempotent provider events and applies financial state transitions. |
| `/api/orders/[id]` | GET | Returns a specific order only when signed customer access is valid. |
| `/api/payment-config` | GET | Supplies safe public payment-availability configuration; no secret key is returned. |
| `/api/reservations` | GET/POST as implemented | Supplies availability and accepts validated guest reservations. |
| `/api/schedule` | GET | Supplies the published restaurant opening calendar. |
| `/api/hall-enquiries` | POST | Validates and stores a Kerala Suite event enquiry. |
| `/api/health/live` | GET | Lightweight process liveness endpoint. |
| `/api/health/ready` | GET | Dependency/configuration readiness endpoint. Detailed output is restricted to an authorised health token or authenticated administrator. |

---

## 4. Administration access handover

### 4.1 Access details to complete at handover

Actual credentials must be exchanged through an approved password manager or another secure one-time channel. They must not be inserted into this report, committed to the repository, emailed in plain text or shared in a group chat.

| Item | Handover value |
|---|---|
| Administration URL | https://www.malabarcoast.co.uk/admin/login |
| Username / email | ______________________________ |
| Password | ______________________________ |
| Assigned role | ______________________________ |
| Recovery email | ______________________________ |
| Multi-factor authentication | ______________________________ |
| Credential owner | ______________________________ |
| Last login verified | ______________________________ |

Login uses **Supabase Auth email and password**, not a hard-coded website username. After Supabase accepts the login, the application rechecks the active administrator profile and role before issuing the administration session.

### 4.2 Session and access controls

- Administration sessions are signed, HTTP-only and `SameSite=Strict`; secure-cookie behaviour is enabled for HTTPS production use.
- The maximum application session duration is eight hours.
- Every mutating administration action is protected by a CSRF token.
- Administrator profiles include an active state and a `session_version`, allowing access to be revoked centrally.
- Server-side permission checks are authoritative; hiding a menu item is not the security boundary.
- Private operations use server credentials and do not expose Supabase service-role access to the browser.
- Security-relevant changes are written to the administrator audit log where implemented.

### 4.3 Role and permission matrix

| Capability | Owner | Administrator | Manager | Kitchen | Viewer |
|---|:---:|:---:|:---:|:---:|:---:|
| View overview/dashboard | Yes | Yes | Yes | Yes | Yes |
| Read orders | Yes | Yes | Yes | Yes | Yes |
| Advance paid fulfilment | Yes | Yes | Yes | Yes | No |
| Add staff order notes | Yes | Yes | Yes | No | No |
| Delete orders | Yes | Yes | No | No | No |
| Use kitchen board | Yes | Yes | Yes | Yes | No |
| Read reservations | Yes | Yes | Yes | No | Yes |
| Create/edit reservations and settings | Yes | Yes | Yes | No | No |
| Delete reservations | Yes | Yes | No | No | No |
| Read Kerala Suite enquiries | Yes | Yes | Yes | No | Yes |
| Edit Kerala Suite enquiries | Yes | Yes | Yes | No | No |
| Delete Kerala Suite enquiries | Yes | Yes | No | No | No |
| View reports | Yes | Yes | Yes | No | No |
| Open/write CMS content | Yes | Yes | No | No | No |
| Manage careers | Yes | Yes | No | No | No |
| View system settings/readiness | Yes | Yes | No | No | No |

`Owner` and `Administrator` intentionally have the widest operational authority. `Manager` runs day-to-day front-of-house activity without deletion, content or system-setting privileges. `Kitchen` receives the minimum fulfilment access required. `Viewer` is read-only.

---

## 5. Complete administration page and component register

Every protected URL below was checked while signed out and correctly redirected to the login screen.

### 5.1 Login

**URL:** https://www.malabarcoast.co.uk/admin/login

**Purpose:** Establish a Supabase-authenticated administrator session.

**Components and behaviour:**

- Email field: identifies the Supabase Auth user.
- Password field: submitted only to the server-side login route; it is not stored in CMS content.
- Sign-in action: verifies identity and then checks the active administration profile/role.
- Setup notice: appears when the required Supabase environment is not configured.
- Safe failure messaging: rejects invalid credentials without exposing secrets or internal provider responses.

### 5.2 Overview dashboard

**URL:** https://www.malabarcoast.co.uk/admin

**Purpose:** Give managers a concise operational start screen.

**Components:**

- 30-day confirmed sales: paid order revenue for the rolling reporting window.
- Orders due today: split into collection and delivery counts.
- Live flow: current orders in active fulfilment states.
- Average paid order: revenue divided by confirmed paid orders.
- Workspace cards: direct access to Orders, Tables, Hall and Content.
- Kitchen-state summary: counts of paid, confirmed, preparing, ready and delivery activity.
- Top dishes: ranked paid-item quantities/revenue for operational insight.
- Recent orders: a quick list linked to full order detail.
- Realtime refresh/notifications: alerts authorised staff when new operational records are published.

### 5.3 Orders register

**URL:** https://www.malabarcoast.co.uk/admin/orders

**Purpose:** Search, filter and manage the complete order register.

**Components:**

- Search: order reference, customer name, email, phone or dish name.
- Status filter: payment and fulfilment states.
- Method filter: collection or delivery.
- Provider filter: Stripe.
- Pagination: 25 rows per page to prevent an unbounded operational table.
- Order row: reference, customer, requested time, method/provider, total and status.
- Closed-calendar warning: highlights paid/active orders that now fall outside the current schedule and require staff intervention.
- Realtime refresh: reflects incoming order changes without relying only on manual reload.
- Permission-aware actions: staff can open, advance, annotate or delete only when their role permits it.

**Order-state vocabulary:** awaiting payment, paid, confirmed, preparing, ready, out for delivery, completed, payment failed, cancelled, expired, partially refunded, refunded, disputed and reversed.

**Operational rule:** Stripe/provider events establish payment state. Staff operate fulfilment only after payment is confirmed. Collection flows move `paid → confirmed → preparing → ready → completed`; delivery flows may move `ready → out for delivery → completed`.

### 5.4 Order detail

**URL:** `https://www.malabarcoast.co.uk/admin/orders/[id]`

**Purpose:** Present a complete, auditable view of one order.

**Components:**

- Reference header, current status and return navigation.
- Kitchen ticket: item, quantity and line note for each dish.
- Financial summary: subtotal, delivery charge and GBP total.
- Customer note and fulfilment request.
- Payment panel: provider, payment status, provider reference and provider outcome.
- Immutable status history: timestamp, actor and note for each transition.
- Customer/contact panel and delivery address when relevant.
- Staff notes: internal context not shown as public page copy.
- Transition actions: only valid next states are offered, and only after verified payment.
- Delete action: restricted to high-authority roles and separately protected.

### 5.5 Kitchen board

**URL:** https://www.malabarcoast.co.uk/admin/kitchen

**Purpose:** Provide a focused live fulfilment view for kitchen and service staff.

**Components:**

- New/paid lane: financially confirmed orders waiting for staff confirmation.
- Confirmed lane: accepted jobs queued for preparation.
- Preparing lane: active kitchen work.
- Ready lane: prepared collection/delivery work.
- Out-for-delivery lane: delivery jobs with the driver/service flow.
- Order card: due time, customer, method, items, quantities and notes.
- Advance action: shows only the legal next transition for that order and role.

### 5.6 Tables / reservations

**URL:** https://www.malabarcoast.co.uk/admin/reservations

**Purpose:** Manage the reservation book and online-booking rules.

**Components:**

- Metrics: reservation totals/statuses and guest capacity context.
- Reservation list: searchable operational records with reference and timing.
- Create/edit form fields:
  - Name, email and phone: guest identity and contact.
  - Booking date, start time and end time: table occupancy window.
  - Party size: capacity calculation.
  - Status: confirmed, cancelled, completed or no-show.
  - Occasion: service context such as birthday/anniversary.
  - Dietary requirements: kitchen/service preparation note.
  - Accessibility needs: reasonable-adjustment planning.
  - Guest notes: request submitted by or on behalf of the guest.
  - Staff notes: private operational information.
- Email state/actions: decision/confirmation delivery status and retry where supported.
- Delete action: restricted to permitted roles.
- Booking-settings form:
  - `capacity`: total simultaneous covers available to the online book.
  - `sittingMinutes`: default occupancy duration used to calculate availability.
  - `slotMinutes`: interval between bookable start times.
  - `minimumPartySize` / `maximumPartySize`: bounds for self-service online booking.
  - `firstSitting` / `lastSitting`: earliest/latest generated booking slots.
  - `minimumLeadMinutes`: how far ahead a guest must book.
  - `advanceDays`: furthest future date guests can select.
  - `bookingEnabled`: master switch for online reservations.

### 5.7 Restaurant calendar

**URL:** https://www.malabarcoast.co.uk/admin/schedule

**Purpose:** Maintain the shared operating calendar used by visit information, reservation validation and order-time validation.

**Components and fields:**

- Change type: choose a recurring weekday or a dated exception.
- Day/date: identifies the affected service period.
- Status: open, closed, reduced hours or remove an existing exception.
- Reason/holiday name: explains a dated exception internally and, where appropriate, to guests.
- First opens/closes: first service interval.
- Optional second opens/closes: supports split lunch/dinner service.
- Impact preview: lists paid orders or reservations that the proposed change would place outside opening hours.
- Save action: validates time ordering and persists the calendar change.
- External-channel reminder: staff must separately update third-party listings/channels that are not controlled by this product.

### 5.8 The Kerala Suite enquiries

**URL:** https://www.malabarcoast.co.uk/admin/hall-enquiries

**Purpose:** Convert enquiries for events in The Kerala Suite into a managed follow-up pipeline.

**Components:**

- Pipeline metrics: new, contacted, approved and total enquiries.
- Enquiry list and record editor.
- Fields: name, email, phone, preferred date/time, alternative date, guest estimate, occasion, preferred contact method, event description and staff notes.
- Statuses: new, contacted, approved and declined.
- Decision/contact email status and retry action where supported.
- Create, edit and delete operations subject to role permission.

### 5.9 Reports

**URL:** https://www.malabarcoast.co.uk/admin/reports

**Purpose:** Turn paid-order data into practical restaurant reporting.

**Components:**

- Period selector: today, 7 days, 30 days, 90 days, year or all time.
- Confirmed sales and average paid order.
- Completed and active order counts.
- Preparation-time indicator.
- Daily-sales chart.
- Collection versus delivery mix.
- Stripe/payment mix as applicable.
- Top dishes.
- Monthly roll-up.
- Daily ledger for traceable totals.

Reports deliberately use confirmed payment state rather than assuming that an initiated checkout equals revenue.

### 5.10 Content command centre

**URL:** https://www.malabarcoast.co.uk/admin/content

**Purpose:** Give Owners/Administrators an operational view of Sanity content and safe deep links into the Studio.

**Components:**

- Published dish, category, orderable-item, special and offer counts.
- Content-health issues such as missing checkout price data or promotion poster/accessibility data.
- Searchable menu inventory.
- Direct Sanity intents to create/edit the relevant document.
- Workflow guidance: create, read/preview, update and retire.
- Links for site settings, website pages, FAQs, testimonials, menu and offers.
- Public preview links to verify the output on the guest site.

### 5.11 Careers manager

**URL:** https://www.malabarcoast.co.uk/admin/careers

**Purpose:** Create, publish, close and retire job opportunities without a code deployment.

**Fields and reasons:**

- Role title: public vacancy heading.
- Public URL slug: stable readable route segment.
- Team/department: groups the role operationally.
- Location: required location shown publicly and used in structured data.
- Employment type: full-time, part-time, casual or another accurate value.
- Hours/shifts: candidate expectations.
- Pay display text: fallback when structured minimum/maximum salary is not supplied.
- Minimum/maximum salary: machine-readable pay range.
- Currency and period: explains whether pay is GBP per hour/day/week/month/year.
- Application email: the destination for candidate applications.
- Closing date: communicates and enforces recruitment timing.
- Status: draft, published or closed.
- Role overview: concise public summary.
- Responsibilities, skills and benefits: line-based sections rendered on the vacancy page.

Published roles have a direct public-preview action. Deletion is a controlled soft-retirement workflow.

### 5.12 System settings/readiness

**URL:** https://www.malabarcoast.co.uk/admin/settings

**Purpose:** Show high-authority users whether the major operational dependencies are configured, without revealing credentials.

**Checks represented:** administrator authentication, durable database, signed customer-order privacy, Stripe readiness, Brevo, Sanity/Studio connection and canonical HTTPS origin. It also reinforces three operating principles: provider events are payment truth; customer records remain server-side; and fulfilment progress is auditable.

### 5.13 Shared administration components

| Component | Function |
|---|---|
| Administration frame/sidebar | Role-filtered navigation, current user/role, page layout and sign-out. |
| Page header | Consistent eyebrow, title, explanation and relevant page actions. |
| Metric card | Compact, comparable operational KPI presentation. |
| Status badge | Human-readable visual state for orders, payment and records. |
| Realtime refresh | Subscribes to permitted Supabase changes and refreshes operational views. |
| Activity notifications | Alerts staff to relevant new orders/reservations/enquiries without exposing unrelated data. |
| Empty state | Explains why no data is present and the appropriate next step. |
| Native picker/date-time controls | Accessible operating-system input for dates/times where used. |
| Sign-out form | CSRF-protected server action that clears the administration session. |
| Administration manifest/service worker | Separate private PWA identity and network-first operational behaviour. Sensitive responses remain protected and are not made public. |

---

## 6. CMS operating model and complete field dictionary

### 6.1 CMS access

**Studio URL:** https://malabar-coast.sanity.studio/  
**Sanity project:** `x3srlrl4`  
**Dataset:** `production`

Public project/dataset identifiers are expected to be visible; write tokens are secret. Website administration opens the Studio only for users with `content:write` permission (Owner or Administrator). Sanity itself still applies its own project membership and role.

### 6.2 Current verified content inventory

The live read-only audit on 29 September 2026 returned:

| Content type | Count / state |
|---|---:|
| Menu categories | 24 |
| Menu documents | 201 total; 195 current catalogue items, 5 deliberately retired source items and 1 disabled historical test item |
| FAQs | 21 |
| Marketing pages | 8 |
| Legal pages | 4 |
| Promotions | 3 |
| Daily specials | 1 |
| Menu journey regions | 6 |
| Site settings | Navigation, footer and default SEO present |
| Menu page | SEO present |

The eight CMS marketing page keys are `home`, `restaurant`, `hall`, `story`, `story-calicut`, `book-a-table`, `offers` and `faq`. The legal page keys are `privacy`, `cookie`, `returns` and `payments`.

The final content review also confirmed that all six menu-journey regions are present, the Chennai stop uses Dosa/Masala Dosa with its new image, the restaurant page uses the ten supplied photographs, and the 21 published FAQs include the client-requested Kerala Suite, cuisine, alcohol, signature-dish, vegan and gluten answers.

### 6.3 Editorial workflow

1. Create or edit a document in Content Studio.
2. Supply required descriptive and accessibility fields; never use a filename as image alt text.
3. Preview the related public page.
4. Publish only after price, dates, links, claims, allergens/dietary status and image rights have been checked.
5. For menu availability, offers and specials, use the intended status/availability controls instead of deleting historical documents.
6. After important content changes, verify both desktop and mobile public output.
7. For structural schema changes, deploy the Studio/schema first, then update/query the website, then regenerate types.

### 6.4 Site settings fields

| Field | What it is | Why / how it is used |
|---|---|---|
| Restaurant name | Public trading name | Brand heading and structured site identity. |
| Legal name | Registered/operator name | Legal/footer contexts where the trading name is insufficient. |
| Short description | Summary up to 160 characters | Metadata and compact brand descriptions. |
| Description | Longer brand description | Editorial/supporting copy. |
| Logo / light logo | Brand image variants | Header/footer contexts with different backgrounds. Each image requires meaningful alt text. |
| Favicon | Small browser/app mark | Browser tabs and application identity. |
| Site URL | Canonical HTTPS origin | Absolute metadata, links and structured data. Must match the production `www` domain. |
| Phone / email | Primary public contacts | Click-to-call/email and structured contact data. |
| Reservation email | Booking contact | Reservation-specific routing where different from the general inbox. |
| Address | Street, locality, region, postcode and country | Visit information, email footers and structured data. |
| Coordinates | Latitude and longitude | Map/directions context. Use the exact venue entrance location. |
| Map URL | External map/directions link | Opens the map provider for directions. |
| Map embed URL | HTTPS embed source | Renders the on-page map. Only trusted HTTPS values should be used. |
| Social links | Platform and URL pairs | Footer/social navigation; publish only maintained official accounts. |
| Primary navigation | Ordered links | Main guest navigation without a code edit. |
| Footer navigation | Ordered links | Policy/service navigation in the footer. |
| Announcement | Optional short message | Temporary high-visibility notice. Remove when no longer current. |
| Footer eyebrow/heading/text | Footer campaign copy | Controls the closing brand/action block. |
| Footer credit label/URL | Attribution | Agency or partner credit. |
| Copyright text | Ownership notice | Footer legal identity. |
| Default SEO | Default title, description, image and indexing control | Fallback metadata for pages without an override. |

### 6.5 Menu category fields

| Field | What it is | Why / how it is used |
|---|---|---|
| Title | Full category name | Public menu section heading. |
| Slug | URL-safe identifier | Stable linking/query identity. Avoid changing after publication. |
| Short title | Compact label | Mobile/navigation contexts when the full title is too long. |
| Eyebrow | Small contextual label | Adds hierarchy above the title. |
| Description | Category introduction | Helps guests understand the dishes in the section. |
| Order rank | Numeric sort position | Controls category order without code changes. |
| Published | Visibility switch | Allows a category to be prepared in draft before appearing publicly. |

### 6.6 Menu item fields

| Field | What it is | Why / how it is used |
|---|---|---|
| Published | Public visibility | Explicitly controls whether the dish is included in the live catalogue. |
| Name | Dish name | Primary public and checkout label. |
| Slug | Stable identifier | Deep links and editorial references. |
| Source key (deprecated) | Legacy import identifier | Kept only for migration compatibility; do not use for new content. |
| Category | Reference to a menu category | Reuses the canonical category and determines grouping. |
| Description | Required single-line text, max 180 characters | Guest decision support, cards and ordering presentation. |
| Subheading | Optional supporting label | Adds context without overloading the dish name. |
| Image | Dish photography plus alt text/caption | Visual menu presentation and accessibility. |
| Price in pence | Integer minor-unit price, e.g. `1295` = £12.95 | Prevents floating-point money errors and is authoritative for server-side checkout repricing. |
| Price label | Optional display wording | Handles “from”, market price or other approved labels. |
| Hide price | Visibility control | Used where a price must not be published online, such as selected alcoholic listings. |
| Alcoholic | Product classification | Ensures alcohol-specific catalogue rules can be applied. |
| Vegetarian / vegan | Confirmed dietary flags | Guest guidance. Vegan logically implies vegetarian. Do not guess. |
| Dietary review status | Confirmed or needs review | Separates verified claims from editorial assumptions. |
| Dietary notes | Qualification | Explains shared-fryer, recipe or confirmation caveats. |
| Allergens | Selection from the 14 UK-regulated allergen groups | Structured guest guidance; it does not replace staff confirmation or legally appropriate allergen controls. |
| Allergen declaration status | Needs confirmation, confirmed allergens listed, or confirmed no regulated allergens | Prevents an unreviewed blank list from being presented as “none”. |
| Allergen notes | Free-text qualification | Cross-contact and recipe-change context. |
| Allergen evidence source | Recipe, ingredient-label or approved matrix reference | Required for a confirmed declaration so the decision remains auditable. |
| Allergen approver / approval date | Named responsible person and completion timestamp | Required for a confirmed declaration and future change control. |
| Spice level | Relative heat indicator | Helps guests choose; keep the scale consistent. |
| Available | Current service availability | Temporarily removes sold-out/unavailable ordering without deleting the dish. |
| Online ordering | Checkout eligibility | Only items with a valid price and appropriate classification should be enabled. Alcoholic items are not enabled for online ordering. |
| Featured | Editorial prominence | Allows selected dishes to appear in featured surfaces. |
| Display order | Numeric item order | Controls placement inside the category. |

Validation enforces key business rules: an orderable dish needs a price; vegan implies vegetarian; alcoholic items cannot be marked for online ordering; confirmed allergen declarations require evidence, an approver and an approval date; and a confirmed allergen list cannot be empty unless the editor deliberately chooses the confirmed-none status.

### 6.7 Menu page fields

| Field | What it is | Why / how it is used |
|---|---|---|
| Eyebrow | Introductory label | Establishes page hierarchy. |
| Heading line 1 / line 2 | Split hero title | Preserves the designed typographic composition. |
| Introduction | Menu overview | Explains the culinary journey. |
| Journey link label | Navigation wording | Names the jump into the voyage section. |
| Manifest eyebrow/heading/introduction | Menu philosophy block | Explains the concept before the catalogue. |
| Dietary/alcohol notice | Safety and price guidance | Sets expectations about allergens, dietary confirmation and unpublished bar pricing. |
| Voyage stops | Exactly six referenced dishes with destination, region, coordinates, year/course labels, image and description | Powers the six-place culinary journey while reusing canonical dish records. |
| SEO | Page metadata | Search title, description, image and indexing status. |

### 6.8 Marketing page fields

| Field | What it is | Why / how it is used |
|---|---|---|
| Page key | One of the eight controlled page identifiers | Connects one CMS document to the matching application route. |
| Internal title | Editor-facing name | Helps Studio users find the correct page. |
| Hero eyebrow/heading/text/image | Page introduction | Controls the primary visual and message. |
| Primary/secondary links | Calls to action | Maintains a clear action hierarchy; the primary action should remain visually dominant. |
| Sections | Ordered content-section/CTA blocks | Builds page-specific storytelling without uncontrolled layout markup. |
| SEO | Page metadata | Route-specific search and social presentation. |

### 6.9 FAQ fields

| Field | What it is | Why / how it is used |
|---|---|---|
| Question | Guest-facing question | Accordion/list heading and search relevance. |
| Answer | Approved response | Public operational guidance. Keep it accurate when policy or hours change. |
| Category | Topic grouping | Organises the FAQ list. |
| Display order | Numeric sort | Controls editorial priority. |
| Published | Visibility | Drafts or retires an answer without deletion. |

### 6.10 Legal page fields

| Field | What it is | Why / how it is used |
|---|---|---|
| Page key | Privacy, cookie, returns or payments | Maps the document to its fixed route. |
| Title / eyebrow / summary | Legal page introduction | Makes policy scope clear to the reader. |
| Last updated | Effective/review date | Lets users and operators identify the current version. |
| Sections | Stable section ID, title and portable rich-text body | Supports anchor navigation and accessible policy structure. Links must be reviewed and intentional. |
| Legacy body (deprecated) | Previous unstructured content | Migration compatibility only; new edits belong in sections. |
| SEO | Search/index metadata | Controls the policy page’s search presentation. |

### 6.11 Testimonial fields

| Field | What it is | Why / how it is used |
|---|---|---|
| Quote | Approved testimonial wording | Social proof. Keep evidence/permission for publication. |
| Name/attribution | Speaker/source identity | Makes the quote appropriately attributable. |
| Source | Review platform or context | Transparency about origin. |
| Rating | 1–5 value | Optional structured/display rating; must match the source. |
| Display order | Sort position | Controls sequence. |
| Published | Visibility | Allows moderation and retirement. |

### 6.12 Promotion fields

| Field | What it is | Why / how it is used |
|---|---|---|
| Title / slug | Offer name and stable identifier | Card heading and internal identity. |
| Status | Active or paused | Operational visibility control. |
| Poster | Required promotional artwork with alt text | Main offer presentation and accessibility. |
| Badge | Short label | Examples: “Weekday”, “Limited”. |
| Summary | Up to 220 characters | Quick explanation without hiding essential terms. |
| Offer code | Redemption code | Publish only when the operational team accepts it. |
| Validity label | Human-readable timing | Complements machine dates with guest-friendly wording. |
| Starts/ends at | Scheduled availability | Prevents early/expired display; end must follow start. |
| Show on homepage | Featured control | Promotes the offer outside `/offers`. |
| CTA | Label and destination | Sends guests to the correct booking/menu/contact action. |
| Terms | Up to 800 characters | Essential restrictions and eligibility. |
| Display order | Sort position | Controls priority among live offers. |

### 6.13 Daily special fields

| Field | What it is | Why / how it is used |
|---|---|---|
| Title / slug | Special name and identifier | Public heading and stable content identity. |
| Status | Active, sold out or paused | Lets staff update daily availability safely. |
| Image | Required visual with alt text | Special card/feature presentation. |
| Badge | Short emphasis | Examples: “Today”, “Chef’s special”. |
| Description | Up to 260 characters | Concise guest explanation. |
| Price in pence / price note | Numeric price and any approved qualifier | Accurate display and money-safe storage. |
| Dietary note | Confirmed qualification | Avoids unsupported dietary claims. |
| Menu-item reference | Optional canonical dish link | Reuses a menu item when the special is the same product. |
| Active days | Days of week | Recurring publication rule. |
| Starts/ends at | Date-time window | Temporary/scheduled special control. |
| CTA | Guest action | Links to menu/order/booking as appropriate. |
| Display order | Sort position | Controls special priority. |

### 6.14 Reusable object fields

| Object | Fields and use |
|---|---|
| Image with alt | Asset, required 3–180 character alt description and optional caption. Decorative images should be deliberately handled; informative images need meaningful alt text. |
| Link | Label, optional eyebrow/description, validated internal/anchor/`mailto:`/`tel:`/HTTPS destination and new-tab choice. New-tab should be used sparingly. |
| SEO | Title (max 70), description (max 170), image and `noIndex`. `noIndex` should only be enabled deliberately. |
| Content section | Internal name, eyebrow, heading, rich body, main/secondary images, links, repeatable title/text items, short label, note and theme. It models content, not arbitrary presentation code. |
| Call to action | Eyebrow, heading, text, primary link, secondary link and image. Preserve one clear primary action. |

### 6.15 CMS housekeeping and final menu synchronisation

The September 2026 synchronisation resolved the six earlier housekeeping records. “Gautham Krishna” is unpublished, unavailable and excluded from online ordering. Mango Chutney, Mixed Pickle, Pakora Sauce, Poppadom and Spiced Onion now have an explicit published state.

The owner-supplied PDF was reconciled into 24 categories and 195 current catalogue items. Five removed source items were retired without deletion, preserving history. The ten supplied restaurant photographs were uploaded to Sanity and connected to the restaurant hero, room image and responsive gallery. The hosted Studio was redeployed with the expanded allergen governance fields.

The revised PDF contains item-level D/N/G markers, defined by the restaurant as dairy, nuts and gluten. The synchronisation applies those source markers to 63 matching current catalogue items, records the PDF evidence in the CMS and shows compact D/N/G codes with a visible legend on the public menu. Unmarked dishes remain **Needs restaurant confirmation** internally and show no allergen line publicly; absence of a marker must not be interpreted as allergen-free. Complete the remaining regulated-allergen and cross-contact review in `MENU_ALLERGEN_REGISTER.csv` under the process in section 6.16.

### 6.16 Menu allergen evidence, workflow and sign-off

#### Current position

The owner-supplied `Malabar_Coast_Full_Menu_Updated.pdf` uses item-level **D**, **N** and **G** markers. Those printed markers have been mapped to the matching catalogue records and implemented as compact public codes with a visible legend: **D = Dairy**, **N = Nuts**, **G = Gluten**.

Only markers explicitly printed in the supplied menu are treated as source-confirmed. The mapping covers 63 of the 195 current catalogue items. Unmarked dishes remain **Needs restaurant confirmation** internally and show no allergen line publicly. A missing marker does not mean allergen-free, and the D/N/G system does not cover all 14 regulated allergen groups or kitchen cross-contact. The general guest notice remains in place, asking customers to tell the team about allergies before ordering because recipes can change and cross-contact may occur.

#### Evidence and working files

| File / record | Purpose |
|---|---|
| `Malabar_Coast_Full_Menu_Updated.pdf` | Owner-supplied item, price and D/N/G source. |
| `MENU_ALLERGEN_REGISTER.csv` | One row for each of the 195 current items, with the 63 source-backed declarations and evidence fields pre-populated. |
| Content Studio menu-item records | Publishing source for public website allergen information. |

The CSV is the restaurant’s working and sign-off register. `pnpm handover:allergen-register` recreates it from the checked-in catalogue and replaces the working copy, so preserve every signed/approved version separately before regenerating it.

#### Regulated allergen coverage

The register provides columns for celery, cereals containing gluten, crustaceans, eggs, fish, lupin, milk, molluscs, mustard, nuts, peanuts, sesame, soya and sulphites. Source code D populates milk, N populates nuts and G populates cereals containing gluten.

#### Source-confirmed D/N/G items by category

| Category | Count | Source-confirmed items |
|---|---:|---|
| Biriyani | 4 | Chicken; Beef; Lamb; Fish |
| Breads | 8 | Plain Naan; Butter Naan; Garlic Naan; Peshwari Naan; Tandoori Roti; Kerala Porotta (2); Appam (3); Chapathi (2) |
| Chicken | 6 | Traditional Chicken Curry; Butter Chicken; Chicken Chasni; Mughlai Korma; Indian Garlic Chilli Chicken; Malaidar Chicken |
| Clay Oven | 7 | Tandoori Chicken; Chicken Tikka; Lamb Tikka; Tandoori Mixed Grill; Paneer Tikka; Chicken Shashlik; Tandoori Jinga |
| Desserts | 3 | Gulab Jamun; Palada Payasam; Malabar Coast Special Dessert |
| Dosa | 2 | Ghee Roast; Chicken Tikka Dosa |
| Kids Menu | 5 | Chicken Chasni; Chicken Korma; Chicken Nuggets & Chips; Fish Fingers & Chips; Fish & Chips |
| Lamb | 3 | Traditional Lamb Curry; Lamb Chasni; Indian Garlic Chilli Lamb |
| Malabar Coast Signature | 11 | Chicken Pollichathu; Kozhi Varutharacha; Aattirachi Kurumulak; Beef Roast; Beef Thenga Kothu; Kizhi Porotta; Masala Grilled Fish; Meen Manga Curry; Meen Moilee; Konju Coconut Fry; Prawn Moilee |
| Rice | 2 | Ghee Rice; Mushroom Pilau |
| Starters | 2 | Chicken 65; Chicken Chaat |
| Sundries | 2 | Raita; Pakora Sauce |
| Tea & Coffee | 3 | Tea; Coffee; Masala Chai |
| Vegetarian | 5 | Dal Tadka; Vegetable Mughlai Korma; Paneer Butter Masala; Vegetable Chasni; Aloo Gobi |
| **Total** | **63** | Owner-menu D/N/G evidence mapped |

#### Required completion workflow

1. Nominate the restaurant person responsible for allergen information.
2. Review every dish against its current recipe, packaged ingredient labels and actual preparation method, including the 63 source-marked items.
3. Confirm D/N/G and add any other regulated allergens supported by evidence. Record shared-fryer, shared-equipment and other cross-contact risks separately; absence from ingredients is not proof that cross-contact cannot occur.
4. Record the evidence source, approver and approval date for every completed row.
5. In Content Studio, open the matching item and choose either **Confirmed allergens listed** or **Confirmed: no regulated allergens declared**. Enter the same evidence source, approver, approval date and cross-contact note.
6. Preview the public menu on phone and desktop, then publish.
7. Keep the signed register with restaurant operating records and repeat the review whenever a recipe, supplier, product label or kitchen process changes.

Do not bulk-mark blank allergen columns as “none”. A blank cell means it has not yet been confirmed.

#### CMS safeguards

The Studio rejects a confirmed item when no allergen is selected unless the editor deliberately chooses **Confirmed: no regulated allergens declared**. It also requires an evidence source, named approver and approval date for any confirmed status. Catalogue synchronisation reapplies the owner-supplied D/N/G markers to matching records and preserves an existing restaurant-confirmed declaration on unmarked items.

#### Final allergen acceptance

- [x] Source D/N/G markers mapped to the 63 matching current items.
- [x] Public menu legend and compact item codes implemented.
- [ ] All 195 current items reviewed against recipes and ingredient labels for all regulated allergens.
- [ ] Cross-contact and shared-equipment risks recorded.
- [ ] Evidence source present for every confirmed row.
- [ ] Responsible approver and approval date present for every confirmed row.
- [ ] CMS declarations match the signed register.
- [ ] Front-of-house and kitchen staff know how to respond to allergen enquiries.
- [ ] Printed, online and third-party menus use the same current information.
- [ ] Change-control owner and next review date recorded.

| Responsibility | Name | Approval reference | Date |
|---|---|---|---|
| Restaurant allergen owner | __________________ | __________________ | __________ |
| Head chef / recipe owner | __________________ | __________________ | __________ |
| Client product owner | __________________ | __________________ | __________ |

---

## 7. Service and integration register

### 7.1 Runtime services

| Service | Product use | Current verification | Commercial position |
|---|---|---|---|
| Vercel | Hosts the Next.js website, functions, domains and deployments | Live site and routes reachable | A commercial restaurant must not rely on Vercel Hobby; Hobby is described as personal/non-commercial. Use a business-eligible paid plan for production. |
| Supabase | PostgreSQL operations database, Auth, Realtime and server-side data access | Database contract passed; required tables present; one active administrator | Free is suitable for development/low-risk evaluation, not recommended as the final production footing for payments/bookings because of pausing, backup, support and capacity constraints. |
| Sanity | CMS dataset, asset CDN and hosted Content Studio | Live content audit passed and inventory recorded | Free can support the current content volume, but it has hard usage caps, limited roles/history and no SLA. Monitor usage and upgrade before limits or governance needs demand it. |
| Stripe | Hosted Checkout, signed webhooks, provider queries, refund/dispute state | Live GB/GBP account reachable; charges and payouts enabled | Not a “free tier”. Standard pricing has no setup/monthly platform fee but charges per successful transaction and for some additional services/currency conversion. |
| Brevo | Transactional customer/owner email | Connection check passed | Free allows 300 sends/day, includes Brevo branding and has queue/delivery limitations at the cap. Monitor usage or upgrade before sustained live volume. |
| Google Maps | Embedded venue map and directions link | Page-level map/directions integration present | Current code uses configured URLs rather than a bespoke server API integration. Provider terms and branding still apply. |
| Git repository | Version history and deployment source | Source snapshot audited | Repository access, branch protection and backup policy are client/agency operational responsibilities. |

### 7.2 Frameworks and libraries

Next.js, React, TypeScript, Tailwind CSS, GSAP and Lenis are software dependencies rather than separately billed runtime services in this implementation. Their licences and security updates must be maintained through normal dependency review.

### 7.3 Authoritative service references

- Vercel Hobby plan: https://vercel.com/docs/plans/hobby
- Supabase pricing: https://supabase.com/pricing
- Supabase billing/usage documentation: https://supabase.com/docs/guides/platform/billing-on-supabase
- Brevo Free plan limits: https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan
- Sanity pricing: https://www.sanity.io/pricing?lang=en
- Sanity plans and payments: https://www.sanity.io/docs/platform-management/plans-and-payments
- Stripe UK pricing: https://stripe.com/gb/pricing

Provider plans change. Recheck the linked official pages before contract signature or launch-budget approval.

---

## 8. Free-tier constraints and required mitigations

### 8.1 Vercel

**Issue:** Vercel Hobby is intended for personal, non-commercial use. This website represents a trading restaurant and processes commercial orders, so Hobby is not the appropriate production plan even if the traffic fits its technical allowances.

**Required action:** Place the live project on Vercel Pro or another business-eligible hosting plan before commercial production acceptance. Confirm the custom `www` domain, environment variables, function region, log retention, spend controls and responsible billing owner.

**Operational risks if ignored:** plan/terms mismatch, constrained collaboration/support, usage interruption, and insufficient production governance.

### 8.2 Supabase

The current Free plan documentation lists allowances such as two active free projects, 500 MB database size per project, 5 GB egress, 50,000 MAU, 1 GB storage, 200 peak realtime connections and 2 million realtime messages. Free projects may pause after inactivity; automatic backups/PITR, SLA and production support are not equivalent to paid production plans.

**Required action:** Treat Free as development/staging. For live order, reservation and administrator data, move to Pro before launch or formally accept the business-continuity risk. Configure backup retention, restore testing, spend alerts and a named owner. Never rely on the application repository as a database backup.

**Monitoring:** database size, egress, storage, realtime connections/messages, auth MAU, slow queries, logs, backup status and restoration evidence.

### 8.3 Brevo

The Free plan permits 300 emails per day. Unused allowance does not roll over. When the daily transactional limit is reached, only a limited number may be held temporarily for retry; messages beyond provider constraints may not be delivered. Free mail also retains Brevo branding.

One customer action can generate more than one email—for example, a paid order may notify both the customer and restaurant, and later lifecycle events may send further messages. Therefore “300 emails” does not mean “300 orders”.

**Required action:** Before marketing or volume growth, choose a paid allowance sized for peak sends, verify the sender/domain authentication, configure alerting and review the email-delivery log daily. Document a phone/manual fallback for orders or booking events whose email fails.

### 8.4 Sanity

The current Free plan is generous enough for the verified dataset but includes hard caps and only basic role/history/support controls. Current published allowances include 10,000 documents, 100 GB assets, 100 GB bandwidth, API/CDN request limits, two datasets and limited role choices. At hard request/bandwidth limits, content delivery can be interrupted.

**Mitigation already present:** key website content has checked-in fallbacks so a temporary CMS read failure does not necessarily take down the whole site. That safety net is not a substitute for current content delivery; an unavailable CMS can hide time-sensitive offers and prevent editorial updates from reaching guests.

**Required action:** Monitor API/CDN requests, bandwidth, assets, document count, webhook usage and editor seats. Upgrade when content governance needs finer roles, longer history, higher limits, support or an SLA. Limit write tokens to server/Studio use and rotate them at handover.

### 8.5 Stripe

Stripe Standard is usage-priced, not a free tier. Its UK pricing page currently states no setup or monthly fee for standard payments, with per-transaction charges that vary by card origin and extra cost where currency conversion applies.

**Required action:** Budget transaction fees, refunds/disputes and any optional Stripe products. Do not test local checkout with live credentials. Use Stripe test mode locally; reserve live mode for the deployed HTTPS environment and a controlled acceptance transaction.

### 8.6 Recommended production baseline

| Area | Minimum recommended decision |
|---|---|
| Hosting | Vercel Pro/business-eligible account with client-owned billing and deployment access. |
| Database/Auth | Supabase Pro with backups, restore procedure, alerts and client-owned organisation access. |
| Email | Brevo paid allowance once expected peak notifications approach the free cap; authenticated sending domain and failure monitoring from day one. |
| CMS | Sanity Free is acceptable at current size only with usage monitoring and the role limitations accepted; upgrade for SLA/finer governance. |
| Payments | Stripe live account under the client’s legal entity, with custom-domain webhook, required events and reconciliation checks. |

---

## 9. Configuration and environment-variable dictionary

No secret values belong in this document. Values must be stored in `.env.local` for local development and in the deployment provider’s encrypted environment settings for production.

| Variable | Scope | What / why / how |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Browser + server, non-secret | Canonical origin used for metadata, links, cookies and security checks. Production value must be `https://www.malabarcoast.co.uk`. |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Browser + server, public identifier | Selects the Sanity project. It is not a write credential. |
| `NEXT_PUBLIC_SANITY_DATASET` | Browser + server, public identifier | Selects the dataset, currently `production`. |
| `SANITY_API_TOKEN` | Server/build secret | Authenticates protected Sanity reads/writes and management scripts. Give only the minimum required permissions. |
| `NEXT_PUBLIC_SANITY_STUDIO_URL` | Browser + server, non-secret | Directs authorised admins to the hosted Studio. |
| `DELIVERY_FEE_PENCE` | Server configuration | Delivery charge in integer pence. Avoid decimal money. |
| `MAX_ORDER_TOTAL_PENCE` | Server configuration | Safety ceiling for an accepted online order. |
| `TRUSTED_PROXY_COUNT` | Server security | Defines how many known reverse proxies can be trusted when resolving the client address. Must match hosting topology. |
| `ORDER_ACCESS_SECRET` | Server secret | Signs customer order-access state. Use a long random value and rotate with care because rotation invalidates existing access tokens/cookies. |
| `HEALTH_CHECK_TOKEN` | Server secret | Authorises detailed readiness output for monitoring without making dependency data public. |
| `ADMIN_SESSION_SECRET` | Server secret | HMAC-signs the administration session. Use a unique long random value. |
| `STRIPE_SECRET_KEY` | Server secret | Creates/queries Stripe Checkout and payment resources. Use `sk_test_...` locally and `sk_live_...` only in production. |
| `STRIPE_WEBHOOK_SECRET` | Server secret | Verifies that webhook payloads came from the configured Stripe endpoint. It is endpoint-specific. |
| `STRIPE_WEBHOOK_URL` | Server/deployment configuration | Expected HTTPS webhook URL. Production should use the canonical public domain endpoint. |
| `BREVO_API_KEY` | Server secret | Sends transactional messages and performs connection checks. |
| `SENDER_EMAIL` | Server configuration | Verified From address for email. Must be authorised in Brevo. |
| `SENDER_NAME` | Server configuration | Human-readable sender name. |
| `OWNER_EMAIL` | Server configuration | Restaurant destination for operational notifications. |
| `SUPABASE_URL` | Server configuration | Project API origin. |
| `SUPABASE_SECRET_KEY` | Server secret | Preferred server-side elevated credential for protected data access. Never expose with a `NEXT_PUBLIC_` prefix. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server secret, legacy fallback | Older name accepted by the implementation when `SUPABASE_SECRET_KEY` is unavailable. Prefer the current secret-key convention. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe credential | Enables approved public/realtime/auth client operations under RLS. It does not replace server authorisation. |

**Rotation order:** create the replacement secret, update every relevant deployment environment, redeploy, verify health and workflows, then revoke the old secret. Stripe webhook-secret rotation must match the exact endpoint configuration.

---

## 10. CMD / command-line operations handbook

Run commands from the repository root unless a command explicitly targets `studio/`. Use the package manager matching the lockfile and team policy; the examples below use the existing npm scripts. On Windows/noninteractive systems, `CI=true` may be needed when pnpm attempts to rebuild `node_modules` without a terminal.

### 10.1 Development, quality and build commands

| Command | Scope | What it does | When / why to use it |
|---|---|---|---|
| `npm run dev` | Main website | Starts Next.js development mode, normally on `http://localhost:3000`. | Daily local website/admin development. Use test credentials only. |
| `npm run dev:studio` | Content Studio | Starts standalone Sanity Studio, normally on `http://localhost:3333`. | Schema/content-structure development. |
| `npm run lint` | Main repository | Runs the configured ESLint checks. | Before every merge/deployment. Treat errors as release blockers. |
| `npm test` | Main repository | Runs the Node test suite. | Before every merge/deployment and after payment/auth/data changes. |
| `npm run build` | Main website | Produces the production Next.js build using webpack and validates route compilation/type/build integration. | Mandatory pre-deployment check. |
| `npm run build:studio` | Content Studio | Produces the deployable Studio bundle. | Before Studio deployment or schema release. |
| `npm run start` | Built website | Starts the previously built production server. | Local production-mode smoke test after `npm run build`. |

### 10.2 Realtime diagnostic commands

| Command | Scope | What it does | Safe use |
|---|---|---|---|
| `npm run test:realtime` | Supabase database/realtime | Exercises the repository’s realtime integration test. | Use against an approved non-production environment unless the script’s target and cleanup are explicitly reviewed. |
| `npm run test:realtime-transport` | Supabase transport | Verifies realtime transport/subscription behaviour. | Use for connection troubleshooting and release verification. |

### 10.3 Sanity CMS commands

| Command | Scope | What it does | Important operating note |
|---|---|---|---|
| `npm run sanity:seed` | Sanity dataset | Idempotently creates/updates the baseline content set. | Requires an authorised token. Review target project/dataset before running; do not treat seeding as a routine editorial action. |
| `npm run sanity:sync-menu-catalogue` | Menu catalogue | Dry-runs the checked-in menu against Sanity; add `-- --apply` only after reviewing the proposed changes. | Preserves confirmed allergen declarations, retires removed source items without deleting them, and marks new items as needing confirmation. |
| `npm run sanity:sync-menu-descriptions` | Menu content | Synchronises maintained menu descriptions into CMS records. | Preview the diff/content result and back up/export when making broad content changes. |
| `npm run sanity:sync-faqs` | FAQ content | Synchronises the maintained client-approved FAQ answers. | Dry-runs by default; add `-- --apply` only after reviewing the target project/dataset and proposed changes. |
| `npm run sanity:sync-menu-page` | Menu-page singleton | Synchronises the designed menu-page content/structure, six journey stops and their image references. | Use after intentional source/content updates; confirm the Chennai Dosa image and every journey stop in preview. |
| `npm run sanity:sync-brand-content` | Brand/editorial content | Synchronises brand content to the CMS model. | Verify marketing/legal copy before publication. |
| `npm run sanity:sync-map` | Site settings | Synchronises map/location configuration. | Confirm exact coordinates/embed URL first. |
| `npm run sanity:sync-restaurant-gallery` | Restaurant page | Dry-runs the ten checked-in restaurant images; add `-- --apply` to upload and connect them. | Review image rights, alt text and crops before publication. |
| `npm run sanity:typegen` | Website types | Regenerates Sanity query/schema TypeScript types. | Run after schema/query changes; commit the generated type changes. |
| `npm run handover:allergen-register` | Handover records | Recreates the 195-row allergen working register from the checked-in catalogue. | Preserve a signed copy first: regeneration replaces the working CSV and does not replace restaurant review. |
| `npm --prefix studio run build` | Studio | Builds the standalone Studio. | Same intent as `npm run build:studio`. |
| `npm --prefix studio run deploy` | Hosted Studio | Publishes the Studio application. | External state change; run only with approved Sanity access and after a successful Studio build. |
| `npm --prefix studio run typegen` | Studio types | Generates Studio-side schema/query types where configured. | Run after schema edits. |
| `npx tsx scripts/audit-cms.ts` | Read-only CMS audit | Reports document counts, page sections, core singleton health and suspicious menu records. | Safe read-only audit when credentials/environment target the intended dataset. |

### 10.4 Stripe/payment commands

| Command | Scope | What it does | Important operating note |
|---|---|---|---|
| `npm run stripe:webhook:sync` | Stripe account | Creates or updates the required webhook event subscription for the configured URL. | Changes external payment configuration. Confirm test/live key, canonical URL and account before running. |
| `npx tsx scripts/audit-production-readiness.ts` | Stripe/Supabase/Brevo/config | Performs read-only readiness checks and reports provider/account/table state. | It can query live providers. It should not replace an end-to-end transaction test. |

Required Stripe events currently include checkout completion/async success/async failure/expiry, payment-intent cancellation, refund events and dispute events. The code treats repeated events idempotently.

### 10.5 Brevo diagnostic command

| Command | Scope | What it does | Important operating note |
|---|---|---|---|
| `npx tsx scripts/test-brevo.ts` | Transactional email | Sends a real test email using configured Brevo credentials. | This has an external side effect. Confirm the recipient, sender, environment and permission before running. A connection check alone does not prove inbox placement. |

### 10.6 Database/schema operations

The authoritative database definitions are under `supabase/`, including the main `schema.sql` and subsequent migrations for schedule/careers where present.

Recommended procedure:

1. Confirm the exact Supabase project and take/verify a recoverable backup.
2. Review the SQL diff and migration order.
3. Apply in the Supabase SQL editor or the team’s approved migration workflow.
4. Run the database health functions.
5. Run automated tests and the production-readiness audit.
6. Verify admin login and a non-destructive read on each admin module.
7. Record the applied version and operator in the change log.

Never paste service-role/secret keys into SQL, screenshots, tickets or source control.

---

## 11. Payment, order and email lifecycle

### 11.1 Order creation

1. Guest adds available CMS items to the browser basket.
2. Checkout sends item IDs/quantities plus customer and fulfilment details.
3. The server fetches the current menu record, rejects invalid/unavailable items and recomputes every price and total.
4. A pending order is stored with an idempotency/fingerprint safeguard.
5. Stripe creates the hosted checkout session.
6. The guest completes card entry on Stripe, not in a custom card form on this site.

### 11.2 Payment truth

- A browser redirect to “success” is a user experience, not authoritative proof of payment.
- Signed Stripe webhook events and authenticated Stripe provider queries establish payment state.
- Processed event IDs and database operations protect against duplicate deliveries/retries.
- Refund, partial refund, dispute, reversal, cancellation, failure and expiry are modelled separately.

### 11.3 Fulfilment truth

Financial state and kitchen state are deliberately separate. A paid order still requires staff confirmation. Staff then move the record through the permitted collection/delivery sequence. The database validates each transition and stores history.

### 11.4 Email

Transactional messages cover relevant customer and owner events such as booking/enquiry decisions and paid-order lifecycle communication. Delivery attempts are recorded so staff can identify and retry failures where supported. Email is a notification layer, not the source of payment truth; staff must use the admin order/provider record when there is a conflict.

---

## 12. Security, privacy and resilience delivered

- Server-side order pricing and maximum-total enforcement.
- Hosted Stripe Checkout; card details are not stored by this application.
- Raw-body webhook verification and explicit event allow-list.
- Idempotent/replay-aware payment-event handling.
- Provider reconciliation for checkout state.
- Signed customer order access; no public orders table policy.
- Supabase Auth plus application role and active-profile checks.
- HMAC-signed, time-limited admin session.
- CSRF protection for state-changing administration actions.
- Permission checks for every admin module/action.
- Administrator audit records and immutable order status history.
- Input length, format, date/time, money and schedule validation.
- Rate-limit/security controls implemented in the application layer as documented in the source/security guide.
- Content Security Policy with per-request nonce, plus security headers in the proxy/application configuration.
- Private routes marked to prevent inappropriate caching/indexing.
- Liveness and readiness endpoints with protected diagnostic detail.
- CMS fallback content for resilience during read-provider interruption.

Operational security still depends on client controls: individual accounts, MFA where available, password-manager use, prompt offboarding, key rotation, least privilege, backups, alert review and access-log review.

---

## 13. Verification performed on 28–29 September 2026

### 13.1 Automated verification

| Check | Result |
|---|---|
| ESLint | Passed |
| TypeScript | Passed with no emitted files |
| Automated tests | 104 passed, 0 failed |
| Main Next.js production build | Passed |
| Standalone Sanity Studio production build | Passed; a non-blocking Tailwind content warning was emitted by the Studio build context and should be reviewed during the next Studio tooling update. |
| Hosted Sanity Studio deployment | Passed at https://malabar-coast.sanity.studio/ |

The tests cover authentication/roles, reservations, Kerala Suite enquiries, CMS behaviour, payment lifecycle, database contracts, email, schedule logic, responsive/security behaviours and Stripe environment controls.

### 13.2 Page review

The following public and entry routes were opened in a local production-mode build: `/`, `/menu`, `/offers`, `/book-a-table`, `/restaurant`, `/hall`, `/careers`, `/story`, `/story/calicut`, `/faq`, `/special-days`, `/payments`, `/returns`, `/cookie`, `/privacy`, `/checkout`, `/checkout/success`, `/checkout/cancelled`, `/checkout/expired`, `/checkout/failure` and `/admin/login`. `/special-days` correctly redirects to `/book-a-table`.

The surfaces were checked at 320 × 800 and 390 × 844 phone, 768 × 1024 tablet and 1440 × 900 desktop sizes. No broken images were found. The first phone pass identified a long privacy-page contact link extending 33 pixels beyond the viewport; the legal-link wrapping rule was corrected, covered by an automated regression test, and the final 320-pixel route sweep reported zero horizontal overflow. The restaurant gallery and full menu were also inspected visually on desktop and phone, including the 195-item catalogue. The final menu implementation shows source-backed D/N/G codes only on marked dishes, with a compact legend and no per-dish confirmation prompt on unmarked items.

Protected-route checks covered `/admin`, `/admin/orders`, `/admin/kitchen`, `/admin/reservations`, `/admin/schedule`, `/admin/hall-enquiries`, `/admin/reports`, `/admin/content`, `/admin/careers` and `/admin/settings`; all redirected a signed-out visitor to `/admin/login`.

### 13.3 Provider/readiness audit

- Sanity read access: passed; current counts recorded in section 6.
- Supabase database contract: passed for orders, reservations, admin audit/profile, Kerala Suite enquiry records, payment events, email log, schedule and careers tables.
- Admin-auth health: passed; one active administrator reported.
- Brevo provider connection: passed.
- Stripe provider connection: passed; live account, charges enabled, payouts enabled, country GB, currency GBP.
- Stripe event subscription: an enabled webhook was found at `https://malabar-coast.vercel.app` with the required events.
- Canonical environment check: the environment used by the audit did not report an HTTPS canonical `NEXT_PUBLIC_SITE_URL`, and no Stripe webhook matching that configured origin was found. This must be reconciled with the production deployment settings before final acceptance.

### 13.4 Not claimed as verified

The following were deliberately not performed without the client’s credentials/approval and a controlled live-test plan:

- Successful login for every real administrator role.
- Creation/edit/deletion through every live admin form.
- A real customer booking and Kerala Suite enquiry submission with received emails.
- A live Stripe charge, customer return, signed webhook receipt and order-status email.
- Live refund, partial refund and dispute/reversal drills.
- Inbox/spam placement across customer mail providers.
- Backup restoration and disaster recovery.
- Vercel plan/billing ownership and deployment-environment inspection.
- Formal accessibility conformance or independent penetration testing.
- Legal approval of privacy, cookie, payments and returns wording.

### 13.5 Final release, verification and rollback procedure

1. Confirm no `.env` file, provider secret, customer data or private export is staged for source control.
2. Commit the approved release changes and complete the repository’s normal review/merge process.
3. Confirm the production deployment variables, especially `NEXT_PUBLIC_SITE_URL=https://www.malabarcoast.co.uk`, against the secured provider records.
4. Deploy the approved website revision to Vercel production and record its commit/deployment identifier.
5. Synchronise Stripe’s live webhook to `https://www.malabarcoast.co.uk/api/webhooks/stripe`, store the matching live secret securely and verify the complete required event set.
6. Check `/api/health/live` and review `/api/health/ready` through authorised monitoring; do not expose diagnostic secrets in screenshots or tickets.
7. Smoke-test the public pages on desktop and phone, then complete the controlled booking, Kerala Suite enquiry, order, webhook and email checks in section 15.
8. Record the acceptance evidence, approvers and date in this report or in the client’s secure operational register.

If the release fails, redeploy the previous known-good website revision. If payment state is uncertain, pause online ordering rather than guessing or manually marking orders paid. Restore CMS content through Sanity document history where available, and recover operational data only through the approved Supabase backup/restore procedure. Never delete payment, order or audit records to make systems appear reconciled.

---

## 14. Outstanding actions and priorities

### Priority 0 — before commercial go-live/sign-off

1. Complete and sign the 195-item allergen register from recipes, ingredient labels and kitchen cross-contact controls; then publish matching declarations in the CMS.
2. Put the commercial production site on Vercel Pro or another business-eligible plan; do not rely on Hobby for this commercial product.
3. In the production deployment, set `NEXT_PUBLIC_SITE_URL=https://www.malabarcoast.co.uk` and set the Stripe webhook URL to `https://www.malabarcoast.co.uk/api/webhooks/stripe` unless an intentionally documented alternative is approved.
4. Create/synchronise the canonical-domain Stripe webhook, confirm it is enabled with every required event, update the matching webhook secret, redeploy and verify readiness.
5. Complete the controlled live acceptance order and email checks in section 15.
6. Confirm client ownership/billing/recovery access for Vercel, Supabase, Sanity, Stripe, Brevo, domain/DNS and source repository.
7. Decide whether Supabase Free risk is acceptable. The recommendation is Supabase Pro for production data continuity.
8. Fill the administrator handover placeholders through a secure credential exchange and validate each assigned role.

### Priority 1 — content/data hygiene

1. Confirm all dietary claims with the restaurant’s responsible person; do not treat CMS flags as a substitute for the restaurant’s operating controls.
2. Confirm The Kerala Suite capacity, package pricing and claims before publishing any currently withheld figures.
3. Obtain client/legal approval for policy pages and record the approval date.

### Priority 2 — operational maturity

1. Configure provider usage/billing alerts and a named on-call owner.
2. Run and document a Supabase restore test.
3. Verify sending-domain authentication and establish a Brevo failure/overflow procedure.
4. Add a quarterly access review and secret-rotation calendar.
5. Commission formal accessibility and security assessments before any material traffic/feature expansion.

---

## 15. Final production acceptance checklist

### Service ownership record

Complete this table through the client’s secure handover process; do not put passwords, recovery codes or secret keys in this document.

| Service / responsibility | Named owner | Billing owner | Recovery contact | Next access review |
|---|---|---|---|---|
| Domain and DNS | __________________ | __________________ | __________________ | __________ |
| Vercel hosting/deployment | __________________ | __________________ | __________________ | __________ |
| Supabase database/auth | __________________ | __________________ | __________________ | __________ |
| Sanity CMS/Studio | __________________ | __________________ | __________________ | __________ |
| Stripe payments | __________________ | __________________ | __________________ | __________ |
| Brevo transactional email | __________________ | __________________ | __________________ | __________ |
| Source repository | __________________ | N/A | __________________ | __________ |
| Restaurant allergen process | __________________ | N/A | __________________ | __________ |

### Ownership and access

- [ ] Client owns or has administrator access to domain/DNS, Vercel, Supabase, Sanity, Stripe, Brevo and repository.
- [ ] Billing owner and renewal method recorded for each paid provider.
- [ ] At least two authorised recovery contacts recorded securely.
- [ ] Individual admin accounts created; shared accounts avoided.
- [ ] Each role tested against its permission matrix.

### Deployment and configuration

- [ ] Vercel commercial/business plan confirmed.
- [ ] Canonical `www` domain and HTTPS certificate confirmed.
- [ ] Production environment variables reviewed without copying secrets into the report.
- [ ] Canonical Stripe webhook enabled with all required events.
- [ ] Live readiness endpoint reviewed through authorised monitoring.
- [ ] Database backup and recovery procedure documented.

### Guest journeys

- [ ] Home, menu, offer, story, restaurant, The Kerala Suite, FAQ, careers and legal pages rechecked after final deployment.
- [ ] Mobile check completed on at least one iPhone-sized and one Android-sized real device.
- [ ] Booking submitted, stored, shown in admin and emails received.
- [ ] Kerala Suite enquiry submitted, stored, shown in admin and emails received.
- [ ] Career role published/closed and public page behaviour confirmed.

### Payments and fulfilment

- [ ] Controlled low-value live order completed on canonical domain.
- [ ] Stripe webhook signature and event recorded.
- [ ] Order moved to paid only from provider evidence.
- [ ] Customer order-status link works only for the authorised purchaser.
- [ ] Customer and owner paid-order emails received.
- [ ] Collection workflow tested through completion.
- [ ] Delivery workflow tested through out-for-delivery and completion.
- [ ] Refund/reconciliation procedure rehearsed and recorded.

### Content and compliance

- [x] Six identified CMS housekeeping records resolved.
- [ ] All 195 current menu items have a signed allergen declaration backed by recipe/label evidence and cross-contact review.
- [ ] CMS allergen statuses, evidence source, approver and approval date match the signed register.
- [ ] Prices, opening hours, address, contact details and offer dates signed off by client.
- [ ] Dietary/allergen process reviewed by the restaurant.
- [ ] Privacy/cookie/payments/returns content approved by qualified client advisers.
- [ ] Image rights and testimonial permissions recorded.

### Acceptance record

| Role | Name | Signature / approval reference | Date |
|---|---|---|---|
| Client product owner | __________________ | __________________ | __________ |
| Restaurant operations owner | __________________ | __________________ | __________ |
| Payments owner | __________________ | __________________ | __________ |
| Delivery representative | __________________ | __________________ | __________ |

---

## 16. Routine operating schedule

### Daily

- Review new paid orders, reservations, Kerala Suite enquiries and failed email deliveries.
- Check offers/specials and menu availability.
- Resolve any paid order outside the current opening calendar.
- Check Stripe/Supabase/Vercel incident notifications.

### Weekly

- Review sales, top dishes and fulfilment exceptions.
- Review upcoming calendar exceptions and booking capacity.
- Check CMS drafts, expired offers and closed vacancies.
- Review Brevo volume against the daily allowance.

### Monthly

- Review provider usage, invoices and spend alerts.
- Export/review operational and payment reconciliation evidence.
- Review administrator access and remove leavers promptly.
- Apply supported dependency/security updates after testing.
- Verify database backups and recent restore evidence.

### Quarterly

- Rotate appropriate secrets/tokens and review webhook endpoints.
- Re-test the complete acceptance journey.
- Review legal text, cookie behaviour and retention practice.
- Review accessibility, performance and mobile-device behaviour.
- Re-evaluate provider plans against real traffic and business impact.

---

## 17. Handover conclusion

Malabar Coast has been delivered as a complete restaurant product rather than a brochure site: guest discovery, CMS publishing, reservations, event enquiries, ordering, hosted payment, customer status, kitchen fulfilment, reporting, careers and controlled administration all form one coherent operating system.

The code, CMS synchronisation and responsive page surfaces passed the documented quality checks. The menu, prices, D/N/G declarations, corrected FAQs, Chennai Dosa presentation and restaurant photography are in place; the Studio is deployed; and the earlier CMS housekeeping is resolved. The remaining actions are production ownership and operational acceptance: deploy the final website revision, complete the restaurant-signed allergen register, confirm commercial hosting and canonical-domain configuration, run a controlled live transaction/email test, decide provider backup/limit arrangements and perform credentialed role checks. Completing the checklist in section 15 converts the technically delivered release candidate into a formally accepted live service with named accountability.

---

## Appendix A — Administration/API route inventory

### Administration API routes

| Route | Purpose |
|---|---|
| `/api/admin/login` | Authenticates an administrator and establishes the signed session. |
| `/api/admin/logout` | Ends the administration session. |
| `/api/admin/orders/[id]` | Retrieves/updates permitted order administration context. |
| `/api/admin/orders/[id]/status` | Applies a validated fulfilment transition. |
| `/api/admin/orders/[id]/notes` | Updates private staff notes. |
| `/api/admin/orders/[id]/delete` | High-authority order deletion workflow. |
| `/api/admin/reservations` | Creates/lists administrator-managed reservations. |
| `/api/admin/reservations/[id]` | Updates/deletes a reservation and related email actions. |
| `/api/admin/reservations/settings` | Updates booking-capacity and timing rules. |
| `/api/admin/hall-enquiries` | Creates/lists administrator-managed Kerala Suite enquiries. |
| `/api/admin/hall-enquiries/[id]` | Updates/deletes a Kerala Suite enquiry and related email actions. |
| `/api/admin/schedule` | Validates/previews/saves operating-calendar changes. |
| `/api/admin/careers` | Creates/lists career opportunities. |
| `/api/admin/careers/[id]` | Updates/closes/deletes a career opportunity. |

### Administration PWA route

| Route | Purpose |
|---|---|
| `/admin/manifest.webmanifest` | Private administration app identity and install metadata. |

## Appendix B — Source snapshot

- Audited local branch: `codex/restaurant-calendar-careers`
- Audited local HEAD on 29 September 2026: `eecc5d7`
- Source repository: `https://github.com/MalabarCoast/Malabar-Coast.git`
- The final handover changes were present in the working tree when this report was generated and were not represented by a newer commit or confirmed Vercel deployment. Record the approved release commit and production deployment identifier during section 15 acceptance.

## Appendix C — Content and image provenance register

| Asset/content group | Origin and treatment | Acceptance action |
|---|---|---|
| `Malabar_Coast_Full_Menu_Updated.pdf` | Supplied by the client; used as the source for catalogue, prices and D/N/G markers. | Restaurant confirms accuracy and authority to publish. |
| `public/Store/1.jpeg` to `10.jpeg` | Supplied by the client; uploaded to Sanity and used for restaurant hero, room and gallery presentation. | Client records ownership/licence, subject permissions where applicable, approved crops and alt text. |
| `public/food/Chennai masala dosa.jpeg` | Photorealistic Chennai-style masala dosa image generated for this project with OpenAI’s built-in image-generation service on 29 September 2026; production JPEG, 1536 × 1024, without embedded text, logo or watermark. | Client approves visual accuracy and publication use. Do not present it as documentary photography of a dish actually served unless the restaurant confirms that representation. |
| Existing food, venue, campaign and story media | Pre-existing project/client assets or project-created editorial assets already in the repository/CMS. | Client completes the rights, consent, accuracy and retention review before final acceptance. |
| FAQ, menu descriptions and marketing copy | Client instructions combined with maintained project copy and CMS synchronisation. | Client/restaurant approves operational claims; qualified advisers approve legal wording. |

For every future asset, record who supplied or created it, its licence/consent basis, the approval date, meaningful alt text and any restrictions. Replace an asset in the CMS rather than silently reusing it for a materially different claim.

