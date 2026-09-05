# DNS: prepare.plaintools.vip → Render

Point the subdomain at the Render free web service. Do this in **Porkbun** after the Render service exists and you have its `*.onrender.com` hostname.

## Record to add

| Field | Value |
|-------|--------|
| **Type** | CNAME |
| **Host** | `prepare` |
| **Answer** / Answer | `<render-service>.onrender.com` |
| **TTL** | default |

Replace `<render-service>.onrender.com` with the real hostname from the Render dashboard (e.g. `prepare-context.onrender.com`).

## Porkbun steps

1. Log in to [Porkbun](https://porkbun.com) → **Domain Management** → `plaintools.vip`.
2. Open **DNS**.
3. **Add** a record:
   - Type: **CNAME**
   - Host: **prepare**
   - Answer: your Render hostname (e.g. `prepare-context.onrender.com`)
   - TTL: leave default
4. Save. Propagation is usually minutes; can take up to an hour.

## Do not change

Leave existing records alone:

- Apex / **@** (A or CNAME)
- **www**
- **finance**
- **compare**

Only add (or update) the **prepare** CNAME.

## After DNS

In Render → your web service → **Custom Domains**, add `prepare.plaintools.vip` and complete any verification Render requests.
