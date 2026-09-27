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
const TURNSTILE_ACTION = "meaningful_action";

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
  env
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
      result.action === TURNSTILE_ACTION
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
      env
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
   WORKER
------------------------- */

export default {
  async fetch(request, env) {
    const url =
      new URL(request.url);

    try {
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
