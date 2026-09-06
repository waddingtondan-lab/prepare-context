# DNS: prepare.plaintools.vip • Cloudflare Workers

Point the subdomain at the Workers deployment. Prefer attaching the custom domain in the Cloudflare dashboard (or wrangler) when `plaintools.vip` is on a Cloudflare zone. If nameservers stay on **Porkbun**, add only the record below — do not change other records or nameservers in this flow.

## Interim (no custom domain)

Use the workers.dev URL from wrangler, e.g.:

`https://prepare-context.<account-subdomain>.workers.dev/health`

## Record to add (Porkbun, when CF shows a CNAME target)

| Field | Value |
|-|--|--|
| **Type** | CNAME |
| **Host** | `prepare` |
| **Answer** | Workers/custom-domain target from Cloudflare (often `prepare-context.<subdomain>.workers.dev`) |
| **TTL** | default |

If Cloudflare instead asks for an orange-cloud proxy or zone delegation, follow the dashboard — do **not** change Porkbun nameservers unless you intentionally move the zone to Cloudflare.

## Porkbun steps

1. Log in to [Porkbun](https://porkbun.com) ‒ **Domain Management** ‒ `plaintools.vip`.
2. Open **DNS**.
3. **Add** a record:
   - Type: **CNAME**
   - Host: **prepare**
   - Answer: the exact target Cloudflare shows for the Worker custom domain
   - TTL: leave default
4. Save. Propagation is usually minutes; can take up to an hour.

## Do not change

Leave existing records alone:

- Apex / **@@** (A or CNAME)
- **www**
- **finance**
- **compare**

Only add (or update) the **prepare** CNAME.

## After DNS

In Cloudflare ‒ Workers ‒ **prepare-context** ‒ **Custom Domains**, add `prepare.plaintools.vip` and complete verification. Confirm `https://prepare.plaintools.vip/health`.
