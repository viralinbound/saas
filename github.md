repo: viralinbound/supershowroom
branch: main

secondary-repo: viralinbound/Meerav-E-commerce (SaaS reference + real photography library)

## Last sync
date: 2026-08-26T17:26:18Z
tree: 5396929583f9 (supershowroom), 07e7ecbcc496 (Meerav-E-commerce)

### Updated in this project
- Rebuilt the 7-page static site as one scroll-driven page, then recoloured it to a neutral/navy system with Instrument Sans.
- Repositioned to self-serve SaaS: every CTA routes into the merchant console; no trial or demo language.
- Added the merchant console (onboarding, dashboard, catalog, orders, design editor, billing, analytics, domain/settings, buyer storefront).
- Added a layout-preview page: six layouts × three full screens (storefront with hero carousel, product page, cart & checkout).
- Copied 21 real photos out of Meerav-E-commerce/assets/images (5 named customer avatars + default_avatar, 6 cinematic namkeen shots, 4 pack shots, 4 commercial scenes, 1 packaging) into assets/images/ — avatars are matched to the reviewer named in each review card, the namkeen and pack shots power the fresh mart & kirana gallery.

## Screen map
| Screen | Built from |
|---|---|
| Site — hero storefront mock | supershowroom/index.html, script.js (STORE_DEMOS) |
| Site — live stores strip | supershowroom/README.md + index.html (client names) |
| Site — who does what | supershowroom/features.html |
| Site — layouts section | supershowroom/templates.html |
| Site — pricing + ROI + matrix | supershowroom/pricing.html |
| Site — studio, FAQ | supershowroom/about.html, index.html, contact.html |
| Layouts — six storefronts / PDPs / carts | supershowroom/templates.html, script.js; Meerav-E-commerce/index.html, product.html, js/store.js |
| Layouts — review avatars, kirana gallery | Meerav-E-commerce/assets/images/* (copied into this project) |
| App — onboarding | supershowroom/pricing.html (tiers), domain-search.html (rates) |
| App — dashboard / orders / catalog | Meerav-E-commerce/admin.html, js/admin.js, js/data.js |
| App — design editor | Meerav-E-commerce/design-editor.html, js/editor.js, js/theme.js |
| App — billing & fees | supershowroom/pricing.html (2% fee model) |
| App — buyer storefront | Meerav-E-commerce/index.html, js/store.js |

## Sync history
- 2026-08-26T13:50Z — first import: site content, pricing tiers, store demo data, Meerav admin/editor patterns.
