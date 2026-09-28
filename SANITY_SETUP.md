# Malabar Coast CMS

The repository contains two independent applications:

- the repository root — the Next.js website
- `studio` — the standalone Sanity Studio

The Studio is not embedded in the website. The website reads published content from Sanity and falls back to checked-in content when Sanity is unavailable or not configured.

## Local environment

Keep these values in the root `.env.local` only:

```text
NEXT_PUBLIC_SANITY_PROJECT_ID=x3srlrl4
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_server_only_token
NEXT_PUBLIC_SANITY_STUDIO_URL=https://malabar-coast.sanity.studio
```

The API token must never use a `NEXT_PUBLIC_` prefix. The token used for the initial import needs content Editor permission. Schema deployment also needs `sanity.project/deploySchema` permission.

The protected `/admin/content` command centre reads the same published catalogue used by the public website and checkout. It provides live menu and promotion health, searchable inventory, and direct Studio intents for creating and editing records. Destructive content changes remain inside authenticated Studio; pause or unpublish content before deleting whenever practical.

## Run locally

From the repository root:

```text
npm run dev
npm run dev:studio
```

The commands run separately. By default the website uses port 3000 and the local Studio uses port 3333. The protected `/admin/content` page opens the deployed standalone Studio at `https://malabar-coast.sanity.studio`.

## Publish the content model and initial content

1. Deploy the Studio schema from `studio` with `sanity schema deploy`.
2. Publish the hosted Studio interface with `npm --prefix studio run deploy` from the repository root. Schema deployment alone does not update the menus at `https://malabar-coast.sanity.studio`.
3. Run `npm run sanity:seed` from the repository root.
4. Open Studio, hard-refresh once after a deployment, review the dietary and allergen fields marked **Needs restaurant confirmation**, and publish corrections.

For an owner-supplied menu revision, first run `npm run sanity:sync-menu-catalogue` as a dry run. After reviewing the proposed counts, run `npm run sanity:sync-menu-catalogue -- --apply`. The synchroniser updates category, dish, price and availability data, retires deliberately removed source items without deleting them, and preserves any existing restaurant-confirmed allergen declaration.

Restaurant photography is synchronised separately. Run `npm run sanity:sync-restaurant-gallery` to preview the ten local `public/Store` images and `npm run sanity:sync-restaurant-gallery -- --apply` to upload and connect them to the restaurant page.

The Sanity project dashboard may continue to show an **Initialize your project with the CLI** onboarding card even when this repository and hosted Studio are already configured. The deployed Studio URL and the dataset document count are the useful checks for this project.

The seed is idempotent: it updates imported records by category slug, legacy menu key, page key or question instead of creating duplicates. Menu items created directly in Studio use their stable Sanity document ID and do not need a legacy key.

## Promotions and offers

- Create one **Promotion or offer** document per poster.
- Add accessible poster text, a title and the public offer details; use the start/end dates for automatic scheduling.
- Keep the status **Active** for a live promotion. **Paused** hides it without deleting it.
- Enable **Show in the homepage popup** when it should appear in the homepage carousel.
- All active promotions appear on `/offers`. One active popup poster is shown on its own; multiple active posters become a carousel.

## Today's specials

- Create one **Today's special** document per live kitchen feature.
- Add the public price in pennies, image, description, dietary note, active days and optional start/end dates.
- Connect it to a menu item only when the special price matches that item; this enables the homepage order button without creating a checkout price mismatch.
- **Available** and **Sold out** specials can appear in the homepage “Come to the table” chapter. **Paused** keeps a prepared special in Studio without publishing it.
- The seed creates one editable current-menu example so the homepage integration can be checked immediately.

## Menu safety rules

- Alcoholic drink prices are deliberately empty and hidden.
- Alcoholic drinks cannot be added to online orders.
- Online-orderable items require a numeric price.
- Checkout reads the current CMS price on the server, with the checked-in menu used only when Sanity cannot be reached.
- Newly created Studio dishes are supported automatically; they no longer depend on the original import key.
- Vegan, gluten-free and allergen claims are not published until the restaurant confirms recipes and cross-contact handling.
- The supplied September 2026 menu uses item-level **D**, **N** and **G** markers. The synchroniser records those marked items as restaurant-confirmed for dairy/milk, nuts and cereals containing gluten, and the public menu renders the same compact codes with a legend.
- An unmarked dish does not display an allergen line and remains **Needs restaurant confirmation** internally. A missing D/N/G marker must not be interpreted as allergen-free or as confirmation against the other regulated allergens.
- A confirmed allergen status requires the selected regulated allergens (or an explicit confirmed-none choice), an evidence source, a named approver and an approval date.
- Use `docs/MENU_ALLERGEN_REGISTER.csv` and section 6.16 of `docs/CLIENT_PRODUCT_DELIVERY_REPORT.md` for the item-level restaurant review and sign-off.
