import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL =
  "https://edfvxbfzvzfeqcutpzhk.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_vJx36vqFzXH8JKAVBEFivA_0n4FjsM8";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

let currentSession = null;

/* -------------------------
   ELEMENTS
------------------------- */

const authDialog =
  document.querySelector("#authDialog");

const actionDialog =
  document.querySelector("#actionDialog");

const participateButton =
  document.querySelector("#participateButton");

const closeDialog =
  document.querySelector("#closeDialog");

const closeActionDialog =
  document.querySelector("#closeActionDialog");

const joinForm =
  document.querySelector("#joinForm");

const signInForm =
  document.querySelector("#signInForm");

const existingUserButton =
  document.querySelector("#existingUserButton");

const newUserButton =
  document.querySelector("#newUserButton");

const authForm =
  document.querySelector("#authForm");

const existingForm =
  document.querySelector("#existingForm");

const authMessage =
  document.querySelector("#authMessage");

const recordButton =
  document.querySelector("#recordButton");

const signOutButton =
  document.querySelector("#signOutButton");

const actionForm =
  document.querySelector("#actionForm");

const actionCategory =
  document.querySelector("#actionCategory");

const actionText =
  document.querySelector("#actionText");

const actionCharacterCount =
  document.querySelector("#actionCharacterCount");

const actionMessage =
  document.querySelector("#actionMessage");

const submitActionButton =
  document.querySelector("#submitActionButton");

/* -------------------------
   MESSAGES
------------------------- */

function showAuthMessage(message) {
  authMessage.textContent = message;
  authMessage.classList.remove("hidden");
}

function clearAuthMessage() {
  authMessage.textContent = "";
  authMessage.classList.add("hidden");
}

function showActionMessage(message, type = "") {
  actionMessage.textContent = message;
  actionMessage.className = "message";

  if (type) {
    actionMessage.classList.add(type);
  }
}

function clearActionMessage() {
  actionMessage.textContent = "";
  actionMessage.className = "message hidden";
}

/* -------------------------
   AUTHENTICATED UI
------------------------- */

function setAuthenticatedUI(authenticated) {
  recordButton.classList.toggle(
    "hidden",
    !authenticated
  );

  signOutButton.classList.toggle(
    "hidden",
    !authenticated
  );
}

function openParticipation() {
  if (currentSession?.user) {
    clearActionMessage();
    actionDialog.showModal();
    return;
  }

  clearAuthMessage();
  authDialog.showModal();
}

/* -------------------------
   DIALOGS
------------------------- */

participateButton.addEventListener(
  "click",
  openParticipation
);

closeDialog.addEventListener("click", () => {
  authDialog.close();
});

closeActionDialog.addEventListener(
  "click",
  () => {
    actionDialog.close();
  }
);

existingUserButton.addEventListener(
  "click",
  () => {
    clearAuthMessage();
    authForm.classList.add("hidden");
    existingForm.classList.remove("hidden");
  }
);

newUserButton.addEventListener(
  "click",
  () => {
    clearAuthMessage();
    existingForm.classList.add("hidden");
    authForm.classList.remove("hidden");
  }
);

/* -------------------------
   NEW PARTICIPANT
------------------------- */

joinForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();
    clearAuthMessage();

    const username =
      document
        .querySelector("#username")
        .value
        .trim();

    const email =
      document
        .querySelector("#email")
        .value
        .trim();

    if (!/^[A-Za-z0-9_]{3,30}$/.test(username)) {
      showAuthMessage(
        "Username must be 3–30 characters using only letters, numbers, or underscores."
      );
      return;
    }

    localStorage.setItem(
      "meaningful_pending_username",
      username
    );

    const { error } =
      await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo:
            "https://projectmeaningful.app",
          data: {
            requested_username: username
          }
        }
      });

    if (error) {
      localStorage.removeItem(
        "meaningful_pending_username"
      );

      showAuthMessage(
        "We couldn't send the sign-in link. Please try again."
      );

      return;
    }

    showAuthMessage(
      "Check your email for your secure Project Meaningful sign-in link."
    );
  }
);

/* -------------------------
   RETURNING PARTICIPANT
------------------------- */

signInForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();
    clearAuthMessage();

    const email =
      document
        .querySelector("#existingEmail")
        .value
        .trim();

    const { error } =
      await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo:
            "https://projectmeaningful.app",
          shouldCreateUser: false
        }
      });

    /*
      Deliberately use the same response whether
      the account exists or not.
    */

    if (error) {
      showAuthMessage(
        "If that email belongs to an account, a secure sign-in link will be sent."
      );

      return;
    }

    showAuthMessage(
      "If that email belongs to an account, a secure sign-in link will be sent."
    );
  }
);

/* -------------------------
   PROFILE
------------------------- */

async function ensureProfile(user) {
  const {
    data: existingProfile,
    error: readError
  } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("id", user.id)
    .maybeSingle();

  if (readError) {
    console.error(
      "Profile lookup failed:",
      readError
    );

    return;
  }

  if (existingProfile) {
    localStorage.removeItem(
      "meaningful_pending_username"
    );

    return;
  }

  const pendingUsername =
    localStorage.getItem(
      "meaningful_pending_username"
    ) ||
    user.user_metadata?.requested_username;

  if (!pendingUsername) {
    return;
  }

  const { error: insertError } =
    await supabase
      .from("profiles")
      .insert({
        id: user.id,
        username: pendingUsername
      });

  if (insertError) {
    console.error(
      "Profile creation failed:",
      insertError
    );

    if (insertError.code === "23505") {
      alert(
        "That username is already in use. Please choose another username."
      );
    }

    return;
  }

  localStorage.removeItem(
    "meaningful_pending_username"
  );
}

/* -------------------------
   SESSION
------------------------- */

async function handleSession(session) {
  currentSession = session;

  const authenticated =
    Boolean(session?.user);

  setAuthenticatedUI(authenticated);

  if (authenticated) {
    await ensureProfile(session.user);
  }
}

const {
  data: { session }
} = await supabase.auth.getSession();

await handleSession(session);

supabase.auth.onAuthStateChange(
  async (_event, newSession) => {
    await handleSession(newSession);
  }
);

/* -------------------------
   SIGN OUT
------------------------- */

signOutButton.addEventListener(
  "click",
  async () => {
    await supabase.auth.signOut();

    currentSession = null;

    setAuthenticatedUI(false);
  }
);

/* -------------------------
   YOUR RECORD
------------------------- */

recordButton.addEventListener(
  "click",
  () => {
    alert(
      "Your Record will be added in the next build stage."
    );
  }
);

/* -------------------------
   ACTION CHARACTER COUNT
------------------------- */

actionText.addEventListener(
  "input",
  () => {
    actionCharacterCount.textContent =
      actionText.value.length;
  }
);

/* -------------------------
   SUBMIT MEANINGFUL ACTION
------------------------- */

actionForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    clearActionMessage();

    if (!currentSession?.access_token) {
      actionDialog.close();
      authDialog.showModal();
      return;
    }

    const text =
      actionText.value.trim();

    const category =
      actionCategory.value;

    if (!category) {
      showActionMessage(
        "Choose a category."
      );

      return;
    }

    if (!text || text.length > 140) {
      showActionMessage(
        "Your Meaningful Action must contain 1–140 characters."
      );

      return;
    }

    const turnstileToken =
      document.querySelector(
        '#actionForm input[name="cf-turnstile-response"]'
      )?.value;

    if (!turnstileToken) {
      showActionMessage(
        "Please complete the verification."
      );

      return;
    }

    submitActionButton.disabled = true;
    submitActionButton.textContent =
      "Sharing...";

    try {
      const response =
        await fetch(
          "/api/actions",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json",

              Authorization:
                `Bearer ${currentSession.access_token}`
            },

            body: JSON.stringify({
              category,
              actionText: text,
              turnstileToken
            })
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        showActionMessage(
          result.error ||
            "We couldn't submit your action. Please try again."
        );

        if (window.turnstile) {
          window.turnstile.reset();
        }

        return;
      }

      actionForm.reset();

      actionCharacterCount.textContent =
        "0";

      if (window.turnstile) {
        window.turnstile.reset();
      }

      if (result.status === "published") {
        showActionMessage(
          "Your Meaningful Action has been published.",
          "success"
        );

        await loadProjectStats();
      } else {
        showActionMessage(
          "Your Meaningful Action was received and is pending review.",
          "pending"
        );
      }
    } catch (error) {
      console.error(
        "Submission failed:",
        error
      );

      showActionMessage(
        "We couldn't submit your action. Please try again."
      );

      if (window.turnstile) {
        window.turnstile.reset();
      }
    } finally {
      submitActionButton.disabled = false;

      submitActionButton.textContent =
        "Share Meaningful Action";
    }
  }
);

/* -------------------------
   PROJECT STATISTICS
------------------------- */

async function loadProjectStats() {
  const { data, error } =
    await supabase.rpc(
      "project_stats"
    );

  if (error || !data?.length) {
    return;
  }

  const stats = data[0];

  document.querySelector(
    "#totalActions"
  ).textContent =
    stats.total_actions ?? 0;

  document.querySelector(
    "#todayActions"
  ).textContent =
    stats.actions_today ?? 0;

  document.querySelector(
    "#participants"
  ).textContent =
    stats.real_participants ?? 0;
}

await loadProjectStats();
