# DNS: plaintools.vip → Cloudflare + prepare.plaintools.vip Worker

## Current status (2026-09-05 PT)

- Worker **prepare-context** is live at:
  `https://prepare-context.waddington-dan.workers.dev`
- Verified: `GET /` and `GET /health` return JSON 200 on workers.dev.
- Cloudflare **zone for plaintools.vip does not exist yet**.
- Wrangler OAuth (`zone:read` only) **cannot** `POST /zones` or attach Workers custom domains
  (`com.cloudflare.api.account.zone.create` / workers domains auth scheme). Dan must create the
  zone in the Cloudflare dashboard (or supply an API token with Zone Create + DNS Edit + Workers
  Scripts Edit), then finish the steps below.
- Until Porkbun nameservers point at Cloudflare, `prepare.plaintools.vip` will **not** resolve via CF.

Account ID: `4ceca3535621e2003bf442189353b56d`  
Worker: `prepare-context`  
Desired hostname: `prepare.plaintools.vip`

---

## A. Create Cloudflare zone (Dan / browser — required)

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com) as `waddington.dan@gmail.com`.
2. **Add a site** → enter `plaintools.vip` → Free plan is fine.
3. On the overview / setup screen, copy the **two Cloudflare nameservers** (look like
   `*.ns.cloudflare.com`). You will paste these at Porkbun in step C.
4. Do **not** finish by changing Porkbun yet until DNS records in Cloudflare match step B.

Optional API (needs a real API token, not Wrangler OAuth):

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"name":"plaintools.vip","account":{"id":"4ceca3535621e2003bf442189353b56d"},"type":"full"}'
```

---

## B. Recreate DNS records in Cloudflare (DNS-only / proxied=false)

These mirror the current Porkbun / GitHub Pages setup. Set **Proxy status = DNS only** (grey cloud)
for all of them so GitHub Pages keeps working the same way.

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `@` | `185.199.108.153` | DNS only |
| A | `@` | `185.199.109.153` | DNS only |
| A | `@` | `185.199.110.153` | DNS only |
| A | `@` | `185.199.111.153` | DNS only |
| CNAME | `www` | `plain-tools.github.io` | DNS only |
| CNAME | `finance` | `plain-finance.github.io` | DNS only |
| CNAME | `compare` | `plain-compare.github.io` | DNS only |

**Do not** add a generic `prepare` CNAME here. Attach the Worker custom domain instead (step D).

---

## C. Porkbun nameserver update (Dan / browser — required)

No Porkbun API keys were available on this box, so this is manual.

1. Log in to [Porkbun](https://porkbun.com) → **Domain Management** → `plaintools.vip`.
2. Open **Authoritative Nameservers** (or **DNS** → nameserver / “Use custom nameservers”).
3. Replace Porkbun’s default NS with the **exact two** Cloudflare nameservers from step A
   (example shape only — use the ones Cloudflare shows for *your* zone):
   - `xxxx.ns.cloudflare.com`
   - `yyyy.ns.cloudflare.com`
4. Save. Leave existing Porkbun DNS host records alone until CF is authoritative; after the NS
   switch, Cloudflare’s records (step B) become live.
5. Propagation: often minutes to a few hours; up to ~24–48h in worst cases.
6. In Cloudflare, wait until the zone status is **Active**.

Until this NS switch completes, `prepare.plaintools.vip` will not resolve through Cloudflare.

---

## D. Attach Worker custom domain `prepare.plaintools.vip`

After the zone is **Active**:

### Dashboard
1. Workers & Pages → **prepare-context** → **Settings** → **Domains & Routes** (or **Triggers**).
2. **Add Custom Domain** → `prepare.plaintools.vip` → confirm.
3. Cloudflare will create the hostname / route and issue TLS. Do **not** add a separate generic
   CNAME for `prepare` unless the UI explicitly asks you to.

### API (API token required)

```bash
# zone id from: GET /zones?name=plaintools.vip
curl -X POST "https://api.cloudflare.com/client/v4/accounts/4ceca3535621e2003bf442189353b56d/workers/domains" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"hostname":"prepare.plaintools.vip","service":"prepare-context","environment":"production"}'
```

### Verify
- `https://prepare.plaintools.vip/` → JSON service index (`ok`, `service`, `health`, `prepare`, `public_base_url`)
- `https://prepare.plaintools.vip/health` → health JSON
- `POST https://prepare.plaintools.vip/v1/prepare` → prepare API

Interim (no custom domain yet): use workers.dev as above.

---

## Do not break GitHub Pages

Keep apex / www / finance / compare **DNS-only** pointing at the GitHub Pages targets listed in
step B. Only `prepare` should be the Workers custom domain.
