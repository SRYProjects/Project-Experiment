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

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
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
