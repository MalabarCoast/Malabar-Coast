# Responsive design lessons

- Treat 601–900px as a tablet composition, not a larger phone. Preserve editorial image-and-copy relationships where space allows.
- Fixed navigation requires `scroll-margin-top` on in-page destinations so anchored headings remain visible.
- Primary ordering controls and quantity controls must remain at least 44px at phone and tablet breakpoints.
- Use native scrolling and lighter transform work on touch-first devices; reserve continuous parallax and smooth-wheel interpolation for precise-pointer desktop layouts.
- Verify phone landscape separately. Short viewports need compact navigation even when their CSS width resembles a tablet.

# Discovery and answer-engine lessons

- A cinematic restaurant hero still needs to answer what the business is, where it is and what the visitor can do within the first viewport.
- Preserve the voyage image as brand theatre, then add a real menu image as the immediate food cue instead of replacing the concept wholesale.
- Never invent opening hours, phone numbers, reviews, awards or social profiles for local-business schema; publish them only after the owner verifies them.
- Keep FAQ schema identical to visible FAQ content, with stable anchor IDs and concise 30–50 word answers.
- Drive canonical URLs, sitemap entries and agent files from one site configuration so production-domain changes cannot drift across files.
- CSS background images bypass Next Image optimization; provide a compressed derivative when the background is critical to the intro experience.

# Editorial composition lessons

- Route graphics should connect their visible location labels and remain outside the primary headline channel; decorative geography becomes confusing when its endpoints drift from their captions.
- Use intentional asymmetry: when one editorial card is taller than its neighbors, the resulting lower channel is an effective place for a strong next-step CTA.
- A fixed light navigation system needs a controlled dark backdrop when later sections use pale backgrounds.
- Hide route graphics on compact layouts when their coordinate labels are removed; an unlabeled line adds clutter rather than meaning.

# Loading transition lessons

- A branded intro should use one clear replay contract: mount on every homepage entry and expose an explicit event for same-route logo clicks.
- Smooth handoffs come from spatial continuity, not only opacity; land the intro logo on the real navbar logo before the overlay disappears.
- Keep reduced-motion behavior short and functional even when the standard experience intentionally replays a cinematic loader.

# Restaurant operations lessons

- Keep payment state and fulfilment state operationally distinct: provider webhooks establish financial truth, while staff advance only valid paid-order stages.
- A kitchen board and an accounting report need different density. The board prioritizes due time, quantities and notes; the report prioritizes comparable totals and trends.
- Wide order tables and multi-lane kitchen boards should scroll inside their own regions so the application shell never creates body-level horizontal overflow.
- Staff notes belong behind a narrow database function that can change only the note field; never reuse a general JSON update for order administration.
- Day and month boundaries must follow the restaurant time zone, including daylight-saving offsets, rather than server-local or naive UTC midnight.
- Readiness must verify the database contract version, not merely that one table is reachable; otherwise a partially applied schema can look healthy while administrator actions fail.
- Audit touch targets at the shared shell level as well as on primary buttons. Brand, footer, table-reference and tab links are easy to leave below 44px even when the main flows are responsive.

# Mobile PWA and map lessons

- Treat an embedded venue map as managed content: validate its host and path, retain a trusted fallback, lazy-load it and keep a separate directions link when tiles cannot load.
- A compact visual control can keep its small artwork while exposing a full 44px hit area; carousel dots are a common place where the visible mark and the interactive target should differ.
- PWA interfaces need safe-area padding, dynamic viewport units and contained scrolling so modals and navigation remain usable around mobile browser chrome and device cut-outs.
- Administrator tables should preserve reachable row actions on narrow screens; a sticky action column is more reliable than expecting staff to discover a long horizontal scroll.
- Use 16px form text on mobile to avoid automatic input zoom, and test short landscape viewports separately from portrait breakpoints.

# Public editorial layout lessons

- Cap content gutters on ultra-wide screens so related headlines and supporting copy remain visually connected instead of drifting toward opposite edges.
- Long editorial narratives can use two readable text columns on wide screens, but should return to one continuous column before tablet widths.
- Treat venue address, coordinates and actions as one information group; a restrained panel gives them hierarchy without changing the content.
- Size editorial grid columns for their longest unbroken display word, and stack before laptop widths force headings to paint into adjacent content.

# CMS-led client feedback lessons

- Treat drink-price suppression as a category-wide rule in both the CMS adapter and the storefront model so soft drinks, mixers and alcohol cannot drift apart.
- Keep editorial fallbacks and published CMS content aligned; responsive verification can otherwise pass locally while production renders an older content shape.
- For a place-led menu story, connect each port to a real supplied dish photograph and a specific culinary note instead of relying on decorative geography alone.
- A mobile off-canvas menu should be inspected after its transition completes; intermediate animation frames can resemble a layout failure even when the settled panel is correct.

# Event-media and compact-type lessons

- Treat owner-supplied event video snippets as motion sources, not image assets: extract an intentional still for an image gallery and keep the original media separate from Sanity image fields.
- A CMS gallery needs parity across schema, query, checked-in fallback, seed data and live content; updating only the public component leaves editors unable to maintain the same experience.
- Large uppercase display words need explicit compact clamps and normal word wrapping. `overflow-wrap: anywhere` can prevent overflow while still producing visibly broken words.
- Test touch targets in rendered pixels rather than assuming a rem value reaches 44px; a reduced root size can quietly shrink otherwise reasonable controls.

# Intermediate-width and restaurant-photography lessons

- Never anchor a CTA over content whose height can grow from responsive wrapping or CMS copy; keep it in grid flow and use grid placement for the intended alignment.
- A breakpoint that works at 900px can still fail at a 916px tablet viewport. Derive transitions from the layout's real minimum column widths, not familiar device numbers.
- Restaurant photography feels more credible when it shows service, preparation, worn working surfaces and mixed practical light instead of isolated, perfectly arranged plates.
- Keep generated source outputs outside the public bundle and publish compressed, correctly cropped derivatives with descriptive filenames and alt text.

# Allergen governance and final-handover lessons

- A menu PDF with names and prices is not an allergen source. Keep unknown declarations visibly unconfirmed and require recipe, ingredient-label and cross-contact evidence before publishing a claim.
- Separate “not yet reviewed” from “confirmed none”; an empty allergen array cannot safely communicate both states.
- Preserve confirmed declarations during broad catalogue synchronisation, and require an evidence source, named approver and approval date so later recipe changes can be audited.
- Owner-supplied venue photography needs the same parity as other managed content: checked-in fallback, responsive layout, accessible descriptions, CMS assets and a reproducible synchronisation command.
- Final responsive evidence should include a smallest supported width after the last CSS change; a long email or URL can be the only remaining source of document-level overflow.
