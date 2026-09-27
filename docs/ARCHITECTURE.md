# Architecture

Medusa is the commerce core. The storefront consumes the Medusa Store API. AI services are separate modules/workflows and never become the source of truth for prices, inventory, orders or payment state. CJ is the supplier source of truth for supplier catalog, stock and fulfillment. OpenAI can reason over verified data and generate content but cannot invent transactional facts.

The production deployment must include PostgreSQL and Redis, and Medusa's server/worker architecture should be used for scheduled synchronization and fulfillment workflows.
