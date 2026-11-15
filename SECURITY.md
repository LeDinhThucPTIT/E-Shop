# Credentials and vulnerability reports

Use `.env` or `.env.local` for local configuration and the hosting provider's environment settings for deployments. Only `.env.example` belongs in Git. Never place database credentials, JWT secrets or payment secrets in `VITE_*` variables: these are included in the public frontend build.

Earlier revisions tracked environment files. Removing them from the current Git index does not remove historical copies. Rotate any database credentials, JWT signing secrets and merchant keys that were exposed in a public repository. This cleanup does not rewrite Git history or rotate credentials automatically.

Do not include secrets, access tokens or customer information in public bug reports. For a security issue, contact the repository owner through their GitHub profile before publishing sensitive details. No private vulnerability reporting channel has been configured by this project.

Payment tests use mocked gateway responses or explicit sandbox sessions. Never test refunds, settlement or live payment flows against production credentials without a separate, reviewed operational procedure.
