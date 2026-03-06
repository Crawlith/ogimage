# og-engine

Open-source, platform-agnostic social image generation engine. Zero lock-in, fully extensible, and secure by default.

## Quick Start

Generate an image with a simple GET request:

```bash
curl "https://og.yourdomain.com/api/og?template=sunset&title=Hello+World" --output og.png
```

## Supported Platforms

| Platform | Size | Aspect Ratio |
| :--- | :--- | :--- |
| **Twitter / X** | 1200 × 628 | 1.91:1 |
| **Facebook OG** | 1200 × 630 | 1.91:1 |
| **LinkedIn** | 1200 × 627 | 1.91:1 |
| **Instagram Post** | 1080 × 1080| 1:1 |
| **Generic OG** | 1200 × 630 | 1.91:1 |
| **Discord** | 1280 × 640 | 2:1 |
| **WhatsApp** | 400 × 209 | 1.91:1 |
| **GitHub Social**| 1280 × 640 | 2:1 |

## API Reference

### GET `/api/og`

| Param | Type | Description |
| :--- | :--- | :--- |
| `template` | string | Template ID (default: `sunset`) |
| `size` | enum | One of the supported platform sizes (default: `og`) |
| `format` | enum | `png` or `jpeg` (default: `png`) |
| `quality` | number | JPEG quality (1-100) |
| `...params` | string | Dynamic params defined by the template's schema |

## Self Hosting

### Cloudflare Workers
```bash
pnpm --filter worker-cf deploy
```

### Docker
```bash
docker build -t og-engine -f apps/server-node/Dockerfile .
docker run -p 3000:3000 og-engine
```

## Contributing Templates

We love new templates! Check out [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide on how to create and submit your own designs.

## License

MIT
