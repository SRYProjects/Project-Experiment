const CATEGORIES = new Set([
  "Family",
  "Relationships",
  "Health",
  "Work",
  "Learning",
  "Creativity",
  "Service",
  "Faith",
  "Responsibility",
  "Sacrifice",
  "Other"
]);

const EXPECTED_HOSTNAME = "projectmeaningful.app";
const ACTION_TURNSTILE_ACTION = "meaningful_action";
const DISCOVERY_TURNSTILE_ACTION = "meaningful_discovery";
const REGISTRATION_TURNSTILE_ACTION = "meaningful_registration";

function json(
  data,
  status = 200,
  extraHeaders = {}
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders
    }
  });
}

function containsProhibitedMarkupOrLink(text) {
  return (
    /<[^>]*>/i.test(text) ||
    /\bhttps?:\/\//i.test(text) ||
    /\bwww\./i.test(text) ||
    /\b[a-z0-9-]+\.(com|org|net|io|app|co|me|ai)\b/i.test(text)
  );
}

/* -------------------------
   AUTHENTICATION
------------------------- */

async function getAuthenticatedUser(request, env) {
  const authHeader =
    request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token =
    authHeader.slice(7);

  const response =
    await fetch(
      `${env.SUPABASE_URL}/auth/v1/user`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: env.SUPABASE_SECRET_KEY
        }
      }
    );

  if (!response.ok) {
    return null;
  }

  return response.json();
}

function clientIp(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    ""
  ).trim();
}

function validEmail(email) {
  return (
    typeof email === "string" &&
    email.length >= 3 &&
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

function bytesToHex(bytes) {
  return Array.from(
    new Uint8Array(bytes),
    (byte) =>
      byte.toString(16).padStart(2, "0")
  ).join("");
}

async function hashRateLimitKey(value, env) {
  const encoder = new TextEncoder();

  const key =
    await crypto.subtle.importKey(
      "raw",
      encoder.encode(
        env.SUPABASE_SECRET_KEY
      ),
      {
        name: "HMAC",
        hash: "SHA-256"
      },
      false,
      ["sign"]
    );

  const signature =
    await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(
        `project-experiment-rate-limit:${value}`
      )
    );

  return bytesToHex(signature);
}

async function consumeRateLimit(
  env,
  scope,
  rawKey,
  limit,
  windowSeconds
) {
  if (!rawKey) {
    return {
      allowed: true,
      remaining: limit,
      retryAfter: 0
    };
  }

  const keyHash =
    await hashRateLimitKey(
      rawKey,
      env
    );

  const response =
    await fetch(
      `${env.SUPABASE_URL}/rest/v1/rpc/consume_rate_limit`,
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${env.SUPABASE_SECRET_KEY}`,
          apikey:
            env.SUPABASE_SECRET_KEY,
          "content-type":
            "application/json"
        },
        body:
          JSON.stringify({
            p_scope: scope,
            p_key_hash: keyHash,
            p_limit: limit,
            p_window_seconds:
              windowSeconds
          })
      }
    );

  if (!response.ok) {
    const detail =
      await response.text();

    console.error(
      "Rate-limit RPC failed:",
      detail
    );

    throw new Error(
      "Rate-limit check failed"
    );
  }

  const rows =
    await response.json();

  const result =
    Array.isArray(rows)
      ? rows[0]
      : rows;

  return {
    allowed:
      result?.allowed === true,
    remaining:
      Number(result?.remaining ?? 0),
    retryAfter:
      Number(
        result?.retry_after_seconds ??
        1
      )
  };
}

function rateLimitResponse(
  message,
  retryAfter
) {
  const seconds =
    Math.max(
      1,
      Number(retryAfter) || 1
    );

  return json(
    { error: message },
    429,
    {
      "retry-after":
        String(seconds)
    }
  );
}

async function enforceAuthRateLimits(
  request,
  email,
  env
) {
  const ip = clientIp(request);

  if (ip) {
    const ipLimit =
      await consumeRateLimit(
        env,
        "auth:ip:15m",
        ip,
        8,
        900
      );

    if (!ipLimit.allowed) {
      return rateLimitResponse(
        "Too many sign-in requests. Please wait before trying again.",
        ipLimit.retryAfter
      );
    }
  }

  const emailLimit =
    await consumeRateLimit(
      env,
      "auth:email:15m",
      email.toLowerCase(),
      3,
      900
    );

  if (!emailLimit.allowed) {
    return rateLimitResponse(
      "Too many sign-in links were requested for this email. Please wait before trying again.",
      emailLimit.retryAfter
    );
  }

  return null;
}

async function enforceSubmissionRateLimits(
  request,
  userId,
  env
) {
  const userHour =
    await consumeRateLimit(
      env,
      "submission:user:1h",
      userId,
      12,
      3600
    );

  if (!userHour.allowed) {
    return rateLimitResponse(
      "You've submitted several entries recently. Please wait before adding another.",
      userHour.retryAfter
    );
  }

  const userDay =
    await consumeRateLimit(
      env,
      "submission:user:1d",
      userId,
      40,
      86400
    );

  if (!userDay.allowed) {
    return rateLimitResponse(
      "You've reached today's submission limit. Please try again tomorrow.",
      userDay.retryAfter
    );
  }

  const ip = clientIp(request);

  if (ip) {
    const ipHour =
      await consumeRateLimit(
        env,
        "submission:ip:1h",
        ip,
        30,
        3600
      );

    if (!ipHour.allowed) {
      return rateLimitResponse(
        "Too many submissions are coming from this connection. Please wait before trying again.",
        ipHour.retryAfter
      );
    }
  }

  return null;
}

async function enforceSearchRateLimit(
  request,
  env
) {
  const ip = clientIp(request);

  if (!ip) {
    return null;
  }

  const limit =
    await consumeRateLimit(
      env,
      "search:ip:1m",
      ip,
      30,
      60
    );

  if (!limit.allowed) {
    return rateLimitResponse(
      "Too many searches. Please wait a moment and try again.",
      limit.retryAfter
    );
  }

  return null;
}

async function isReservedUsername(
  username,
  env
) {
  const params =
    new URLSearchParams({
      select:
        "username_normalized",
      username_normalized:
        `eq.${username.toLowerCase()}`,
      limit:
        "1"
    });

  const response =
    await fetch(
      `${env.SUPABASE_URL}/rest/v1/reserved_usernames?${params.toString()}`,
      {
        headers: {
          Authorization:
            `Bearer ${env.SUPABASE_SECRET_KEY}`,
          apikey:
            env.SUPABASE_SECRET_KEY
        }
      }
    );

  if (!response.ok) {
    throw new Error(
      "Reserved username lookup failed"
    );
  }

  const rows =
    await response.json();

  return rows.length > 0;
}

async function sendAuthOtp(
  email,
  createUser,
  username,
  env
) {
  return fetch(
    `${env.SUPABASE_URL}/auth/v1/otp?redirect_to=${encodeURIComponent("https://projectmeaningful.app")}`,
    {
      method: "POST",
      headers: {
        Authorization:
          `Bearer ${env.SUPABASE_SECRET_KEY}`,
        apikey:
          env.SUPABASE_SECRET_KEY,
        "content-type":
          "application/json"
      },
      body:
        JSON.stringify({
          email,
          create_user:
            createUser,
          data:
            createUser
              ? {
                  requested_username:
                    username
                }
              : {}
        })
    }
  );
}

async function requestAuthLink(
  request,
  env
) {
  let body;

  try {
    body = await request.json();
  } catch {
    return json(
      { error: "Invalid request." },
      400
    );
  }

  const mode =
    body.mode === "new"
      ? "new"
      : body.mode === "existing"
        ? "existing"
        : "";

  const email =
    typeof body.email === "string"
      ? body.email
          .trim()
          .toLowerCase()
      : "";

  if (!mode || !validEmail(email)) {
    return json(
      {
        error:
          "Enter a valid email address."
      },
      400
    );
  }

  const limited =
    await enforceAuthRateLimits(
      request,
      email,
      env
    );

  if (limited) {
    return limited;
  }

  let username = "";

  if (mode === "new") {
    username =
      typeof body.username === "string"
        ? body.username.trim()
        : "";

    if (
      !/^[A-Za-z0-9_]{3,30}$/.test(
        username
      )
    ) {
      return json(
        {
          error:
            "Username must be 3–30 characters using only letters, numbers, or underscores."
        },
        400
      );
    }

    const verified =
      await verifyTurnstile(
        body.turnstileToken,
        request,
        env,
        REGISTRATION_TURNSTILE_ACTION
      );

    if (!verified) {
      return json(
        {
          error:
            "Verification failed or expired. Please try again."
        },
        403
      );
    }

    if (
      await isReservedUsername(
        username,
        env
      )
    ) {
      return json(
        {
          error:
            "That username isn't available. Please choose another."
        },
        409
      );
    }

    const existingProfile =
      await fetchProfileByUsername(
        username,
        env
      );

    if (existingProfile) {
      return json(
        {
          error:
            "That username is already in use. Please choose another."
        },
        409
      );
    }
  }

  const authResponse =
    await sendAuthOtp(
      email,
      mode === "new",
      username,
      env
    );

  if (
    authResponse.status === 429
  ) {
    const retryAfter =
      Number(
        authResponse.headers.get(
          "Retry-After"
        )
      ) || 60;

    return rateLimitResponse(
      "Please wait before requesting another sign-in link.",
      retryAfter
    );
  }

  if (!authResponse.ok) {
    const detail =
      await authResponse.text();

    console.error(
      "Supabase OTP request failed:",
      detail
    );

    return json(
      {
        error:
          "We couldn't send the sign-in link. Please try again."
      },
      502
    );
  }

  return json({
    success: true
  });
}

async function createProfileForUser(
  request,
  env
) {
  const user =
    await getAuthenticatedUser(
      request,
      env
    );

  if (!user) {
    return json(
      {
        error:
          "Authentication required."
      },
      401
    );
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return json(
      { error: "Invalid request." },
      400
    );
  }

  const username =
    typeof body.username === "string"
      ? body.username.trim()
      : "";

  if (
    !/^[A-Za-z0-9_]{3,30}$/.test(
      username
    )
  ) {
    return json(
      {
        error:
          "Choose a valid username."
      },
      400
    );
  }

  const existingParams =
    new URLSearchParams({
      select: "id,username",
      id: `eq.${user.id}`,
      limit: "1"
    });

  const existingResponse =
    await fetch(
      `${env.SUPABASE_URL}/rest/v1/profiles?${existingParams.toString()}`,
      {
        headers: {
          Authorization:
            `Bearer ${env.SUPABASE_SECRET_KEY}`,
          apikey:
            env.SUPABASE_SECRET_KEY
        }
      }
    );

  if (!existingResponse.ok) {
    throw new Error(
      "Profile lookup failed"
    );
  }

  const existingRows =
    await existingResponse.json();

  if (existingRows[0]) {
    return json({
      success: true,
      profile: existingRows[0]
    });
  }

  if (
    await isReservedUsername(
      username,
      env
    )
  ) {
    return json(
      {
        error:
          "That username isn't available. Please choose another."
      },
      409
    );
  }

  const otherProfile =
    await fetchProfileByUsername(
      username,
      env
    );

  if (otherProfile) {
    return json(
      {
        error:
          "That username is already in use. Please choose another."
      },
      409
    );
  }

  const insertResponse =
    await fetch(
      `${env.SUPABASE_URL}/rest/v1/profiles`,
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${env.SUPABASE_SECRET_KEY}`,
          apikey:
            env.SUPABASE_SECRET_KEY,
          "content-type":
            "application/json",
          Prefer:
            "return=representation"
        },
        body:
          JSON.stringify({
            id: user.id,
            username,
            is_demo: false
          })
      }
    );

  if (!insertResponse.ok) {
    const detail =
      await insertResponse.text();

    console.error(
      "Profile creation failed:",
      detail
    );

    if (
      insertResponse.status === 409 ||
      detail.includes("23505") ||
      detail.includes("23514")
    ) {
      return json(
        {
          error:
            "That username isn't available. Please choose another."
        },
        409
      );
    }

    throw new Error(
      "Profile creation failed"
    );
  }

  const rows =
    await insertResponse.json();

  return json({
    success: true,
    profile:
      rows?.[0] ?? null
  });
}

/* -------------------------
   TURNSTILE
------------------------- */

async function verifyTurnstile(
  token,
  request,
  env,
  expectedAction
) {
  if (
    typeof token !== "string" ||
    token.length === 0 ||
    token.length > 2048
  ) {
    return false;
  }

  const remoteIp =
    request.headers.get("CF-Connecting-IP") || "";

  try {
    const response =
      await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",

          headers: {
            "content-type":
              "application/x-www-form-urlencoded"
          },

          body: new URLSearchParams({
            secret:
              env.TURNSTILE_SECRET_KEY,

            response:
              token,

            remoteip:
              remoteIp
          })
        }
      );

    if (!response.ok) {
      return false;
    }

    const result =
      await response.json();

    return (
      result.success === true &&
      result.hostname === EXPECTED_HOSTNAME &&
      result.action === expectedAction
    );
  } catch (error) {
    console.error(
      "Turnstile verification failed:",
      error
    );

    return false;
  }
}

/* -------------------------
   MODERATION
------------------------- */

async function moderateAction(text, env) {
  try {
    const result =
      await env.AI.run(
        "@cf/meta/llama-guard-3-8b",
        {
          messages: [
            {
              role: "user",
              content: text
            }
          ],

          max_tokens: 32,
          temperature: 0
        }
      );

    const output =
      typeof result?.response === "string"
        ? result.response
            .trim()
            .toLowerCase()
        : "";

    if (output.startsWith("safe")) {
      return "published";
    }

    return "pending";
  } catch (error) {
    console.error(
      "Moderation failed:",
      error
    );

    return "pending";
  }
}

/* -------------------------
   DATABASE
------------------------- */

async function insertAction(
  userId,
  category,
  actionText,
  status,
  env
) {
  const row = {
    user_id: userId,
    category,
    action_text: actionText,
    moderation_status: status,
    is_demo: false
  };

  if (status === "published") {
    row.moderated_at =
      new Date().toISOString();
  }

  const response =
    await fetch(
      `${env.SUPABASE_URL}/rest/v1/meaningful_actions`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${env.SUPABASE_SECRET_KEY}`,

          apikey:
            env.SUPABASE_SECRET_KEY,

          "content-type":
            "application/json",

          Prefer:
            "return=representation"
        },

        body:
          JSON.stringify(row)
      }
    );

  if (!response.ok) {
    const detail =
      await response.text();

    console.error(
      "Supabase action insert failed:",
      detail
    );

    throw new Error(
      "Database insert failed"
    );
  }

  return response.json();
}

/* -------------------------
   PUBLIC ACTION FEED
------------------------- */

async function fetchProfileByUsername(username, env) {
  const params = new URLSearchParams({
    select: "id,username",
    username_normalized: `eq.${username.toLowerCase()}`,
    limit: "1"
  });

  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`,
        apikey: env.SUPABASE_SECRET_KEY
      }
    }
  );

  if (!response.ok) {
    throw new Error("Profile lookup failed");
  }

  const rows = await response.json();
  return rows[0] ?? null;
}

async function fetchPublishedActions(
  env,
  { limit = 100, offset = 0, category = "", userId = "", demoUsername = "" } = {}
) {
  const params = new URLSearchParams({
    select: "id,user_id,demo_username,category,action_text,is_demo,created_at",
    moderation_status: "eq.published",
    order: "created_at.desc",
    limit: String(limit),
    offset: String(offset)
  });

  if (category) {
    params.set("category", `eq.${category}`);
  }

  if (userId) {
    params.set("user_id", `eq.${userId}`);
  }

  if (demoUsername) {
    params.set(
      "demo_username",
      `eq.${demoUsername}`
    );
  }

  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/meaningful_actions?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`,
        apikey: env.SUPABASE_SECRET_KEY
      }
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    console.error("Supabase public actions fetch failed:", detail);
    throw new Error("Database fetch failed");
  }

  return response.json();
}

async function fetchProfilesById(userIds, env) {
  if (userIds.length === 0) {
    return [];
  }

  const params = new URLSearchParams({
    select: "id,username",
    id: `in.(${userIds.join(",")})`
  });

  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`,
        apikey: env.SUPABASE_SECRET_KEY
      }
    }
  );

  if (!response.ok) {
    throw new Error("Profile fetch failed");
  }

  return response.json();
}

async function getPublicActions(request, env) {
  const url = new URL(request.url);
  const rawLimit = Number.parseInt(url.searchParams.get("limit") || "100", 10);
  const rawOffset = Number.parseInt(url.searchParams.get("offset") || "0", 10);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), 100)
    : 100;
  const offset = Number.isFinite(rawOffset)
    ? Math.max(rawOffset, 0)
    : 0;

  const category = (url.searchParams.get("category") || "").trim();
  const username = (url.searchParams.get("username") || "").trim();

  if (category && !CATEGORIES.has(category)) {
    return json({ error: "Invalid category." }, 400);
  }

  if (username && !/^[A-Za-z0-9_]{3,30}$/.test(username)) {
    return json({ actions: [], hasMore: false });
  }

  if (username) {
    const limited =
      await enforceSearchRateLimit(
        request,
        env
      );

    if (limited) {
      return limited;
    }
  }

  let userId = "";
  let demoUsername = "";

  if (username) {
    const profile =
      await fetchProfileByUsername(
        username,
        env
      );

    if (profile) {
      userId = profile.id;
    } else {
      demoUsername =
        username.toLowerCase();
    }
  }

  const rows = await fetchPublishedActions(env, {
    limit: limit + 1,
    offset,
    category,
    userId,
    demoUsername
  });

  const hasMore = rows.length > limit;
  const pageRows = rows.slice(0, limit);

  const userIds = [
    ...new Set(
      pageRows
        .map((row) => row.user_id)
        .filter(
          (id) =>
            typeof id === "string" &&
            /^[0-9a-f-]{36}$/i.test(id)
        )
    )
  ];

  const profiles = await fetchProfilesById(userIds, env);
  const usernameById = new Map(
    profiles
      .filter(
        (profile) =>
          typeof profile?.id === "string" &&
          typeof profile?.username === "string" &&
          profile.username.trim()
      )
      .map((profile) => [profile.id, profile.username.trim()])
  );

  const actions = pageRows
    .map((row) => {
      const publicUsername =
        row.is_demo === true &&
        typeof row.demo_username === "string" &&
        row.demo_username.trim()
          ? row.demo_username.trim()
          : usernameById.get(
              row.user_id
            );

      if (!publicUsername) {
        return null;
      }

      return {
        id: row.id,
        username: publicUsername,
        category: row.category,
        actionText: row.action_text,
        createdAt: row.created_at,
        isExample: row.is_demo === true
      };
    })
    .filter(Boolean);

  return json({ actions, hasMore });
}

/* -------------------------
   PRIVATE USER RECORD
------------------------- */

function easternDateKey(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone: "America/New_York",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }
    ).formatToParts(date);

  const byType =
    Object.fromEntries(
      parts.map((part) => [
        part.type,
        part.value
      ])
    );

  if (
    !byType.year ||
    !byType.month ||
    !byType.day
  ) {
    return "";
  }

  return `${byType.year}-${byType.month}-${byType.day}`;
}

async function fetchUserActions(
  userId,
  env
) {
  const rows = [];
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const params =
      new URLSearchParams({
        select:
          "id,category,action_text,moderation_status,created_at",
        user_id:
          `eq.${userId}`,
        is_demo:
          "eq.false",
        order:
          "created_at.desc",
        limit:
          String(pageSize),
        offset:
          String(offset)
      });

    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/meaningful_actions?${params.toString()}`,
      {
        headers: {
          Authorization:
            `Bearer ${env.SUPABASE_SECRET_KEY}`,
          apikey:
            env.SUPABASE_SECRET_KEY
        }
      }
    );

    if (!response.ok) {
      const detail =
        await response.text();

      console.error(
        "Supabase user record fetch failed:",
        detail
      );

      throw new Error(
        "Database fetch failed"
      );
    }

    const page =
      await response.json();

    rows.push(...page);

    if (page.length < pageSize) {
      break;
    }

    offset += pageSize;
  }

  return rows;
}

async function getUserRecord(
  request,
  env
) {
  const user =
    await getAuthenticatedUser(
      request,
      env
    );

  if (!user) {
    return json(
      {
        error:
          "Authentication required."
      },
      401
    );
  }

  const rows =
    await fetchUserActions(
      user.id,
      env
    );

  const published =
    rows.filter(
      (row) =>
        row.moderation_status ===
        "published"
    );

  const publishedDays =
    new Set(
      published
        .map((row) =>
          easternDateKey(
            row.created_at
          )
        )
        .filter(Boolean)
    ).size;

  return json({
    summary: {
      publishedActions:
        published.length,
      publishedDays
    },
    actions:
      rows.map((row) => ({
        id: row.id,
        category: row.category,
        actionText:
          row.action_text,
        status:
          row.moderation_status,
        createdAt:
          row.created_at
      }))
  });
}

/* -------------------------
   ACTION SUBMISSION
------------------------- */

async function submitAction(request, env) {
  const user =
    await getAuthenticatedUser(
      request,
      env
    );

  if (!user) {
    return json(
      {
        error:
          "Authentication required."
      },
      401
    );
  }

  let body;

  try {
    body =
      await request.json();
  } catch {
    return json(
      {
        error:
          "Invalid request."
      },
      400
    );
  }

  const category =
    typeof body.category === "string"
      ? body.category.trim()
      : "";

  const actionText =
    typeof body.actionText === "string"
      ? body.actionText.trim()
      : "";

  if (!CATEGORIES.has(category)) {
    return json(
      {
        error:
          "Choose a valid category."
      },
      400
    );
  }

  if (
    !actionText ||
    actionText.length > 140
  ) {
    return json(
      {
        error:
          "Meaningful Actions must contain 1–140 characters."
      },
      400
    );
  }

  if (
    containsProhibitedMarkupOrLink(
      actionText
    )
  ) {
    return json(
      {
        error:
          "Links and markup are not permitted in Meaningful Actions."
      },
      400
    );
  }

  const limited =
    await enforceSubmissionRateLimits(
      request,
      user.id,
      env
    );

  if (limited) {
    return limited;
  }

  const verified =
    await verifyTurnstile(
      body.turnstileToken,
      request,
      env,
      ACTION_TURNSTILE_ACTION
    );

  if (!verified) {
    return json(
      {
        error:
          "Verification failed or expired. Please try again."
      },
      403
    );
  }

  const status =
    await moderateAction(
      actionText,
      env
    );

  const rows =
    await insertAction(
      user.id,
      category,
      actionText,
      status,
      env
    );

  return json({
    success: true,
    status,
    action:
      rows?.[0] ?? null
  });
}


/* -------------------------
   DISCOVERIES
------------------------- */

async function insertDiscovery(
  userId,
  discoveryText,
  status,
  env
) {
  const row = {
    user_id: userId,
    discovery_text: discoveryText,
    moderation_status: status,
    is_demo: false
  };

  if (status === "published") {
    row.moderated_at =
      new Date().toISOString();
  }

  const response =
    await fetch(
      `${env.SUPABASE_URL}/rest/v1/discoveries`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${env.SUPABASE_SECRET_KEY}`,

          apikey:
            env.SUPABASE_SECRET_KEY,

          "content-type":
            "application/json",

          Prefer:
            "return=representation"
        },

        body:
          JSON.stringify(row)
      }
    );

  if (!response.ok) {
    const detail =
      await response.text();

    console.error(
      "Supabase discovery insert failed:",
      detail
    );

    throw new Error(
      "Database insert failed"
    );
  }

  return response.json();
}

async function fetchPublishedDiscoveries(
  env,
  { limit = 100, offset = 0, userId = "", demoUsername = "" } = {}
) {
  const params = new URLSearchParams({
    select:
      "id,user_id,demo_username,discovery_text,is_demo,created_at",
    moderation_status:
      "eq.published",
    order:
      "created_at.desc",
    limit:
      String(limit),
    offset:
      String(offset)
  });

  if (userId) {
    params.set(
      "user_id",
      `eq.${userId}`
    );
  }

  if (demoUsername) {
    params.set(
      "demo_username",
      `eq.${demoUsername}`
    );
  }

  const response =
    await fetch(
      `${env.SUPABASE_URL}/rest/v1/discoveries?${params.toString()}`,
      {
        headers: {
          Authorization:
            `Bearer ${env.SUPABASE_SECRET_KEY}`,
          apikey:
            env.SUPABASE_SECRET_KEY
        }
      }
    );

  if (!response.ok) {
    const detail =
      await response.text();

    console.error(
      "Supabase public discoveries fetch failed:",
      detail
    );

    throw new Error(
      "Database fetch failed"
    );
  }

  return response.json();
}

async function getPublicDiscoveries(
  request,
  env
) {
  const url =
    new URL(request.url);

  const rawLimit =
    Number.parseInt(
      url.searchParams.get("limit") || "100",
      10
    );

  const rawOffset =
    Number.parseInt(
      url.searchParams.get("offset") || "0",
      10
    );

  const limit =
    Number.isFinite(rawLimit)
      ? Math.min(
          Math.max(rawLimit, 1),
          100
        )
      : 100;

  const offset =
    Number.isFinite(rawOffset)
      ? Math.max(rawOffset, 0)
      : 0;

  const username =
    (
      url.searchParams.get("username") ||
      ""
    ).trim();

  if (
    username &&
    !/^[A-Za-z0-9_]{3,30}$/.test(
      username
    )
  ) {
    return json({
      discoveries: [],
      hasMore: false
    });
  }

  if (username) {
    const limited =
      await enforceSearchRateLimit(
        request,
        env
      );

    if (limited) {
      return limited;
    }
  }

  let userId = "";
  let demoUsername = "";

  if (username) {
    const profile =
      await fetchProfileByUsername(
        username,
        env
      );

    if (profile) {
      userId = profile.id;
    } else {
      demoUsername =
        username.toLowerCase();
    }
  }

  const rows =
    await fetchPublishedDiscoveries(
      env,
      {
        limit: limit + 1,
        offset,
        userId,
        demoUsername
      }
    );

  const hasMore =
    rows.length > limit;

  const pageRows =
    rows.slice(0, limit);

  const userIds = [
    ...new Set(
      pageRows
        .map((row) => row.user_id)
        .filter(
          (id) =>
            typeof id === "string" &&
            /^[0-9a-f-]{36}$/i.test(id)
        )
    )
  ];

  const profiles =
    await fetchProfilesById(
      userIds,
      env
    );

  const usernameById =
    new Map(
      profiles
        .filter(
          (profile) =>
            typeof profile?.id === "string" &&
            typeof profile?.username === "string" &&
            profile.username.trim()
        )
        .map(
          (profile) => [
            profile.id,
            profile.username.trim()
          ]
        )
    );

  const discoveries =
    pageRows
      .map((row) => {
        const publicUsername =
          row.is_demo === true &&
          typeof row.demo_username ===
            "string" &&
          row.demo_username.trim()
            ? row.demo_username.trim()
            : usernameById.get(
                row.user_id
              );

        if (!publicUsername) {
          return null;
        }

        return {
          id: row.id,
          username:
            publicUsername,
          discoveryText:
            row.discovery_text,
          createdAt:
            row.created_at,
          isExample:
            row.is_demo === true
        };
      })
      .filter(Boolean);

  return json({
    discoveries,
    hasMore
  });
}

async function submitDiscovery(
  request,
  env
) {
  const user =
    await getAuthenticatedUser(
      request,
      env
    );

  if (!user) {
    return json(
      {
        error:
          "Authentication required."
      },
      401
    );
  }

  let body;

  try {
    body =
      await request.json();
  } catch {
    return json(
      {
        error:
          "Invalid request."
      },
      400
    );
  }

  const discoveryText =
    typeof body.discoveryText === "string"
      ? body.discoveryText.trim()
      : "";

  if (
    !discoveryText ||
    discoveryText.length > 280
  ) {
    return json(
      {
        error:
          "Discoveries must contain 1–280 characters."
      },
      400
    );
  }

  if (
    containsProhibitedMarkupOrLink(
      discoveryText
    )
  ) {
    return json(
      {
        error:
          "Links and markup are not permitted in Discoveries."
      },
      400
    );
  }

  const limited =
    await enforceSubmissionRateLimits(
      request,
      user.id,
      env
    );

  if (limited) {
    return limited;
  }

  const verified =
    await verifyTurnstile(
      body.turnstileToken,
      request,
      env,
      DISCOVERY_TURNSTILE_ACTION
    );

  if (!verified) {
    return json(
      {
        error:
          "Verification failed or expired. Please try again."
      },
      403
    );
  }

  const status =
    await moderateAction(
      discoveryText,
      env
    );

  const rows =
    await insertDiscovery(
      user.id,
      discoveryText,
      status,
      env
    );

  return json({
    success: true,
    status,
    discovery:
      rows?.[0] ?? null
  });
}

/* -------------------------
   WORKER
------------------------- */

export default {
  async fetch(request, env) {
    const url =
      new URL(request.url);

    try {
      if (
        url.pathname === "/api/auth/request" &&
        request.method === "POST"
      ) {
        return await requestAuthLink(
          request,
          env
        );
      }

      if (
        url.pathname === "/api/profile" &&
        request.method === "POST"
      ) {
        return await createProfileForUser(
          request,
          env
        );
      }

      if (
        url.pathname === "/api/record" &&
        request.method === "GET"
      ) {
        return await getUserRecord(
          request,
          env
        );
      }

      if (
        url.pathname === "/api/actions" &&
        request.method === "GET"
      ) {
        return await getPublicActions(
          request,
          env
        );
      }

      if (
        url.pathname === "/api/actions" &&
        request.method === "POST"
      ) {
        return await submitAction(
          request,
          env
        );
      }

      if (
        url.pathname === "/api/discoveries" &&
        request.method === "GET"
      ) {
        return await getPublicDiscoveries(
          request,
          env
        );
      }

      if (
        url.pathname === "/api/discoveries" &&
        request.method === "POST"
      ) {
        return await submitDiscovery(
          request,
          env
        );
      }

      if (
        url.pathname.startsWith("/api/")
      ) {
        return json(
          {
            error:
              "Not found."
          },
          404
        );
      }

      return env.ASSETS.fetch(
        request
      );
    } catch (error) {
      console.error(
        "Worker error:",
        error
      );

      return json(
        {
          error:
            "Something went wrong. Please try again."
        },
        500
      );
    }
  }
};
