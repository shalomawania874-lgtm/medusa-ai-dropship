# Production deployment

Medusa's current production architecture requires PostgreSQL, Redis, a server instance and a worker instance. The included render.yaml defines the two Node services.

Required secrets:
- DATABASE_URL
- REDIS_URL
- OPENAI_API_KEY
- CJ_ACCESS_TOKEN
- CJ_LOGISTIC_NAME
- Pesapal live credentials and IPN URL
- Store/admin/auth CORS URLs
- RESEND credentials if email is enabled

The repository deliberately does not contain secrets.

Before enabling live fulfillment:
1. Configure CJ credentials and a real logistics method.
2. Import a real CJ product and verify its CJ variant metadata.
3. Configure a real stock location and shipping option in Medusa.
4. Configure Pesapal live credentials and IPN.
5. Run a real low-value checkout in the Pesapal sandbox first.
6. Only after payment capture is confirmed should CJ fulfillment be enabled in production.

The deployment is not considered live merely because the code builds. Provider credentials and callbacks must be connected and health checks must pass.
