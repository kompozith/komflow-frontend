# Purpose

Define DeleevX-specific business language and product rules. These rules extend the reusable agent setup without polluting framework-agnostic instructions.

extends: ../.github/agents/base.md
extends: ../.agents/angular.md

## Scope

- Apply this file when editing user-facing text, translation files, business workflows, feature names, roles, permissions, finance flows, order flows, delivery flows, onboarding flows, or dashboards.
- Keep these rules out of reusable files under `.github/agents/`.

## Product Context

- DeleevX is a commerce and delivery platform for web administration and operations.
- Supported translation files are `src/assets/i18n/en.json` and `src/assets/i18n/fr.json`.
- User-facing text must use `@ngx-translate/core` through the `translate` pipe or `TranslateService`.
- Currency values displayed for this product use FCFA/XAF unless a feature explicitly defines another currency source.

## Terminology

Use the approved product terms consistently.

| Concept | French | English | Avoid |
|---|---|---|---|
| Store owner actor | Marchand | Merchant | Vendeur, Seller, Vendor |
| Delivery actor | Livreur | Driver | Conducteur, Rider |
| Customer purchase | Commande | Order | Ordre, Purchase |
| Merchant point of sale | Établissement | Establishment | Boutique, Magasin, Shop, Store |
| Delivery action | Livraison | Delivery | Expedition, Shipment |
| Internal payment account | Portefeuille | Wallet | Purse |
| Bank transfer from wallet | Retrait | Withdrawal | Cashout |
| Application to join | Requête | Request | Candidature, Application, Onboarding as visible label |
| Main overview page | Tableau de bord | Dashboard | Home panel |

## i18n Rules

- Do not add visible template text without a translation key.
- Every key added to `en.json` must also be added to `fr.json`.
- Every key added to `fr.json` must also be added to `en.json`.
- Use `SCREAMING_SNAKE_CASE` for translation key segments.
- Put shared labels under `COMMON`.
- Put feature-specific labels under a feature namespace.
- Prefix error messages with `ERROR_` and success messages with `SUCCESS_` inside the relevant namespace.
- Keep terminology aligned with the table in this file.

## Business Logic Boundaries

- Keep role, permission, finance, delivery, order, and onboarding rules inside their owning feature or a clearly named domain service.
- Do not move product-specific rules into generic utilities.
- Do not infer a business rule from one screen; verify at least two usages or an existing domain service before extracting it.
- `[TO DEFINE]` Source of truth for role and permission definitions.
- `[TO DEFINE]` Source of truth for wallet and withdrawal state transitions.
- `[TO DEFINE]` Source of truth for order and delivery status transitions.
