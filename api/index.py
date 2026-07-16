from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import asyncpg
from datetime import datetime, timezone

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.environ.get("DATABASE_URL", "")
DASHBOARD_PASSWORD = os.environ.get("DASHBOARD_PASSWORD", "")


async def get_pool():
    """Get or create the database connection pool."""
    if not hasattr(app.state, "pool") or app.state.pool is None:
        if not DATABASE_URL:
            raise RuntimeError("DATABASE_URL not set")
        app.state.pool = await asyncpg.create_pool(
            DATABASE_URL,
            min_size=1,
            max_size=5,
        )
    return app.state.pool


@app.on_event("shutdown")
async def shutdown():
    if hasattr(app.state, "pool") and app.state.pool:
        await app.state.pool.close()


def get_country_from_request(request: Request) -> str:
    """Extract country code from Cloudflare/standard headers."""
    # Cloudflare country header
    country = request.headers.get("cf-ipcountry", "")
    if country and len(country) == 2:
        return country.upper()
    # Vercel edge country header
    country = request.headers.get("x-vercel-ip-country", "")
    if country and len(country) == 2:
        return country.upper()
    return ""


def verify_password(request: Request) -> bool:
    """Check dashboard password from query param."""
    password = request.query_params.get("password", "")
    return password == DASHBOARD_PASSWORD


# ─── Tracking endpoints ──────────────────────────────────────


@app.post("/api/track")
async def track_visit(request: Request):
    """Record a page visit."""
    try:
        data = await request.json()
    except Exception:
        return JSONResponse({"error": "invalid json"}, status_code=400)

    page = data.get("page", "")
    visitor_id = data.get("visitorId", "")
    referrer = data.get("referrer", "")
    user_agent = data.get("userAgent", "")
    screen_width = data.get("screenWidth", 0)
    screen_height = data.get("screenHeight", 0)

    if not page or not visitor_id:
        return JSONResponse({"error": "page and visitorId required"}, status_code=400)

    country = get_country_from_request(request)
    if not user_agent:
        user_agent = request.headers.get("user-agent", "")
    if not referrer:
        referrer = request.headers.get("referer", "")

    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            # Check if this visitor already has a visit for this page
            existing = await conn.fetchrow(
                "SELECT id FROM visits WHERE visitor_id = $1 AND page = $2",
                visitor_id,
                page,
            )
            if existing:
                # Update time on page for subsequent pings
                timestamp = data.get("timestamp", datetime.now(timezone.utc).isoformat())
                await conn.execute(
                    "UPDATE visits SET time_on_page_seconds = GREATEST(time_on_page_seconds, $3) WHERE id = $1",
                    existing["id"],
                    page,
                    data.get("heartbeatSeconds", 0),
                )
                return JSONResponse({"ok": True, "updated": True}, status_code=200)

            await conn.execute(
                """INSERT INTO visits (page, visitor_id, referrer, user_agent, country, screen_width, screen_height)
                   VALUES ($1, $2, $3, $4, $5, $6, $7)""",
                page,
                visitor_id,
                referrer[:500],
                user_agent[:500],
                country,
                screen_width,
                screen_height,
            )
        return JSONResponse({"ok": True}, status_code=200)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@app.post("/api/click")
async def track_click(request: Request):
    """Record a CTA click."""
    try:
        data = await request.json()
    except Exception:
        return JSONResponse({"error": "invalid json"}, status_code=400)

    page = data.get("page", "")
    visitor_id = data.get("visitorId", "")

    if not page or not visitor_id:
        return JSONResponse({"error": "page and visitorId required"}, status_code=400)

    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                "INSERT INTO clicks (page, visitor_id) VALUES ($1, $2)",
                page,
                visitor_id,
            )
            # Also mark click on the visit record
            await conn.execute(
                "UPDATE visits SET clicked = TRUE WHERE visitor_id = $1 AND page = $2",
                visitor_id,
                page,
            )
        return JSONResponse({"ok": True}, status_code=200)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


# ─── Stats endpoints ─────────────────────────────────────────


@app.get("/api/stats")
async def get_stats(request: Request):
    """Return aggregated analytics. Protected by password."""
    if not verify_password(request):
        return JSONResponse({"error": "unauthorized"}, status_code=401)

    bot_filter = request.query_params.get("filter_bots", "").lower() in ("1", "true", "yes")
    page_filter = request.query_params.get("page", "")
    since = request.query_params.get("since", "")

    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            where_clauses = []
            params = []
            param_idx = 0

            if page_filter:
                param_idx += 1
                where_clauses.append(f"v.page = ${param_idx}")
                params.append(page_filter)

            if bot_filter:
                param_idx += 1
                where_clauses.append(
                    f"v.user_agent NOT ILIKE ${param_idx}"
                )
                params.append("%bot%")

            if since:
                param_idx += 1
                where_clauses.append(f"v.created_at >= ${param_idx}")
                params.append(since)

            where_sql = ""
            if where_clauses:
                where_sql = "WHERE " + " AND ".join(where_clauses)

            # Total views
            total_views = await conn.fetchval(
                f"SELECT COUNT(*) FROM visits v {where_sql}", *params
            )
            total_views = total_views or 0

            # Unique visitors
            unique_visitors = await conn.fetchval(
                f"SELECT COUNT(DISTINCT v.visitor_id) FROM visits v {where_sql}",
                *params,
            )
            unique_visitors = unique_visitors or 0

            # Total clicks
            click_params = params.copy()
            click_where = where_sql.replace("v.", "c.")
            total_clicks = await conn.fetchval(
                f"SELECT COUNT(*) FROM clicks c {click_where}", *params
            )
            total_clicks = total_clicks or 0

            # Views per page
            views_per_page = await conn.fetch(
                f"""SELECT v.page,
                           COUNT(*) AS views,
                           COUNT(DISTINCT v.visitor_id) AS uniques,
                           COUNT(DISTINCT v.country) AS countries
                    FROM visits v {where_sql}
                    GROUP BY v.page
                    ORDER BY views DESC""",
                *params,
            )

            # Average time on page
            avg_time = await conn.fetchval(
                f"SELECT AVG(v.time_on_page_seconds) FROM visits v {where_sql}",
                *params,
            )
            avg_time = round(float(avg_time or 0), 1)

            # Top referrers
            top_referrers = await conn.fetch(
                f"""SELECT v.referrer, COUNT(*) AS count
                    FROM visits v {where_sql}
                    GROUP BY v.referrer
                    ORDER BY count DESC
                    LIMIT 10""",
                *params,
            )

            return JSONResponse(
                {
                    "total_views": total_views,
                    "unique_visitors": unique_visitors,
                    "total_clicks": total_clicks,
                    "click_through_rate": round(
                        (total_clicks / total_views * 100) if total_views > 0 else 0, 2
                    ),
                    "avg_time_on_page_seconds": avg_time,
                    "views_per_page": [
                        {
                            "page": r["page"],
                            "views": r["views"],
                            "unique_visitors": r["uniques"],
                            "countries": r["countries"],
                        }
                        for r in views_per_page
                    ],
                    "top_referrers": [
                        {
                            "referrer": r["referrer"] or "(direct)",
                            "count": r["count"],
                        }
                        for r in top_referrers
                    ],
                }
            )
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@app.get("/api/stats/recent")
async def get_recent_visits(request: Request):
    """Return recent visits with details. Protected by password."""
    if not verify_password(request):
        return JSONResponse({"error": "unauthorized"}, status_code=401)

    page_filter = request.query_params.get("page", "")
    limit = int(request.query_params.get("limit", "50"))
    offset = int(request.query_params.get("offset", "0"))
    bot_filter = request.query_params.get("filter_bots", "").lower() in ("1", "true", "yes")

    limit = min(limit, 200)

    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            where_clauses = []
            params = []
            param_idx = 0

            if page_filter:
                param_idx += 1
                where_clauses.append(f"v.page = ${param_idx}")
                params.append(page_filter)

            if bot_filter:
                param_idx += 1
                where_clauses.append(f"v.user_agent NOT ILIKE ${param_idx}")
                params.append("%bot%")

            where_sql = ""
            if where_clauses:
                where_sql = "WHERE " + " AND ".join(where_clauses)

            param_idx += 1
            visits = await conn.fetch(
                f"""SELECT v.id, v.page, v.visitor_id, v.referrer, v.user_agent,
                           v.country, v.screen_width, v.screen_height,
                           v.time_on_page_seconds, v.clicked, v.created_at
                    FROM visits v {where_sql}
                    ORDER BY v.created_at DESC
                    LIMIT ${param_idx} OFFSET ${param_idx + 1}""",
                *params,
                limit,
                offset,
            )

            param_idx += 2
            total = await conn.fetchval(
                f"SELECT COUNT(*) FROM visits v {where_sql}", *params[: param_idx - 2]
            )

            return JSONResponse(
                {
                    "total": total or 0,
                    "offset": offset,
                    "limit": limit,
                    "visits": [
                        {
                            "id": r["id"],
                            "page": r["page"],
                            "visitorId": r["visitor_id"],
                            "referrer": r["referrer"],
                            "userAgent": r["user_agent"],
                            "country": r["country"],
                            "screenWidth": r["screen_width"],
                            "screenHeight": r["screen_height"],
                            "timeOnPageSeconds": r["time_on_page_seconds"],
                            "clicked": r["clicked"],
                            "createdAt": r["created_at"].isoformat() if r["created_at"] else None,
                        }
                        for r in visits
                    ],
                }
            )
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


# Health check
@app.get("/api/health")
async def health():
    return {"status": "ok"}
