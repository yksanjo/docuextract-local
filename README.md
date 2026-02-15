# DocuExtract Local

Self-hosted Docker deployment of DocuExtract Gateway.

## Quick Start

```bash
# Start the service
npm start

# Check logs
npm run logs

# Stop the service
npm stop
```

## Configuration

Edit `config.yaml` to configure providers:

- Set `langextract.enabled: true` to use local LangExtract service
- Set `aws.enabled: true` and provide credentials for AWS Textract
- Set `azure.enabled: true` and provide credentials for Azure Document Intelligence

## Ports

- HTTP API: `http://localhost:3000`

## Endpoints

- `POST /api/extract` - Extract document
- `GET /api/providers` - List providers
- `GET /api/pricing` - Get pricing
- `GET /api/health` - Health check

## Docker Commands

```bash
# Build image
npm run build

# View logs
npm run logs

# Access shell
npm run shell
```

## License

MIT
