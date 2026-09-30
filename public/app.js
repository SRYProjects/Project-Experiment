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

const actionEntryState =
  document.querySelector("#actionEntryState");

const actionPublishedState =
  document.querySelector("#actionPublishedState");

const actionPendingState =
  document.querySelector("#actionPendingState");

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

const viewPublishedActionButton =
  document.querySelector("#viewPublishedActionButton");

const shareAnotherActionButton =
  document.querySelector("#shareAnotherActionButton");

const shareAnotherPendingActionButton =
  document.querySelector("#shareAnotherPendingActionButton");

const closePendingActionButton =
  document.querySelector("#closePendingActionButton");

const actionsFeed =
  document.querySelector("#actionsFeed");

let lastPublishedActionId = null;

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

function showActionMessage(message) {
  actionMessage.textContent = message;
  actionMessage.className = "message";
}

function clearActionMessage() {
  actionMessage.textContent = "";
  actionMessage.className = "message hidden";
}

/* -------------------------
   ACTION DIALOG STATES
------------------------- */

function showActionEntryState() {
  actionEntryState.classList.remove("hidden");
  actionPublishedState.classList.add("hidden");
  actionPendingState.classList.add("hidden");
}

function showActionPublishedState() {
  actionEntryState.classList.add("hidden");
  actionPublishedState.classList.remove("hidden");
  actionPendingState.classList.add("hidden");
}

function showActionPendingState() {
  actionEntryState.classList.add("hidden");
  actionPublishedState.classList.add("hidden");
  actionPendingState.classList.remove("hidden");
}

function resetActionForm() {
  actionForm.reset();

  actionCharacterCount.textContent = "0";

  clearActionMessage();

  if (window.turnstile) {
    try {
      window.turnstile.reset();
    } catch (error) {
      console.warn(
        "Turnstile reset unavailable:",
        error
      );
    }
  }
}

function prepareNewAction() {
  resetActionForm();
  showActionEntryState();

  window.setTimeout(() => {
    actionCategory.focus();
  }, 0);
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
    prepareNewAction();
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

closeDialog.addEventListener(
  "click",
  () => {
    authDialog.close();
  }
);

closeActionDialog.addEventListener(
  "click",
  () => {
    actionDialog.close();
  }
);

/*
  Native <dialog> already supports Escape.

  This adds closing when the user clicks
  directly on the shaded backdrop.
*/

function enableBackdropClose(dialog) {
  dialog.addEventListener(
    "click",
    (event) => {
      if (event.target === dialog) {
        dialog.close();
      }
    }
  );
}

enableBackdropClose(authDialog);
enableBackdropClose(actionDialog);

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

    await supabase.auth.signInWithOtp({
      email,

      options: {
        emailRedirectTo:
          "https://projectmeaningful.app",

        shouldCreateUser: false
      }
    });

    /*
      Same response regardless of whether
      the email belongs to an account.
    */

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
   PUBLIC MEANINGFUL ACTIONS
------------------------- */

function formatActionDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  ).format(date);
}

function createActionCard(action) {
  const article =
    document.createElement("article");

  article.className = "action-card";
  article.dataset.actionId =
    String(action.id);

  const meta =
    document.createElement("div");

  meta.className = "action-meta";

  const username =
    document.createElement("strong");

  username.textContent =
    action.username;

  const category =
    document.createElement("span");

  category.textContent =
    action.category;

  const date =
    document.createElement("time");

  date.dateTime =
    action.createdAt;

  date.textContent =
    formatActionDate(action.createdAt);

  meta.append(
    username,
    category,
    date
  );

  if (action.isExample) {
    const example =
      document.createElement("span");

    example.className = "example-label";
    example.textContent = "Example";

    meta.append(example);
  }

  const text =
    document.createElement("p");

  text.className = "action-text";
  text.textContent =
    action.actionText;

  article.append(meta, text);

  return article;
}

async function loadPublicActions() {
  actionsFeed.setAttribute(
    "aria-busy",
    "true"
  );

  try {
    const response =
      await fetch("/api/actions");

    if (!response.ok) {
      throw new Error(
        "Public actions request failed"
      );
    }

    const result =
      await response.json();

    const actions =
      Array.isArray(result.actions)
        ? result.actions
        : [];

    actionsFeed.replaceChildren();

    if (actions.length === 0) {
      const empty =
        document.createElement("p");

      empty.className = "empty-state";
      empty.textContent =
        "No Meaningful Actions have been published yet.";

      actionsFeed.append(empty);

      return;
    }

    const fragment =
      document.createDocumentFragment();

    for (const action of actions) {
      fragment.append(
        createActionCard(action)
      );
    }

    actionsFeed.append(fragment);
  } catch (error) {
    console.error(
      "Meaningful Actions feed failed:",
      error
    );

    const unavailable =
      document.createElement("p");

    unavailable.className =
      "empty-state";

    unavailable.textContent =
      "Meaningful Actions are temporarily unavailable.";

    actionsFeed.replaceChildren(
      unavailable
    );
  } finally {
    actionsFeed.setAttribute(
      "aria-busy",
      "false"
    );
  }
}

/* -------------------------
   POST-SUBMISSION ACTIONS
------------------------- */

shareAnotherActionButton.addEventListener(
  "click",
  prepareNewAction
);

shareAnotherPendingActionButton.addEventListener(
  "click",
  prepareNewAction
);

closePendingActionButton.addEventListener(
  "click",
  () => {
    actionDialog.close();
  }
);

viewPublishedActionButton.addEventListener(
  "click",
  async () => {
    actionDialog.close();

    await loadPublicActions();

    document
      .querySelector("#actions")
      .scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    if (lastPublishedActionId !== null) {
      const card =
        actionsFeed.querySelector(
          `[data-action-id="${lastPublishedActionId}"]`
        );

      if (card) {
        card.scrollIntoView({
          behavior: "smooth",
          block: "nearest"
        });
      }
    }
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

      /*
        Clear the completed form immediately.
        The confirmation state then replaces it.
      */

      actionForm.reset();

      actionCharacterCount.textContent =
        "0";

      if (window.turnstile) {
        window.turnstile.reset();
      }

      if (result.status === "published") {
        lastPublishedActionId =
          result.action?.id ?? null;

        showActionPublishedState();

        await Promise.all([
          loadProjectStats(),
          loadPublicActions()
        ]);
      } else {
        showActionPendingState();
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

await Promise.all([
  loadProjectStats(),
  loadPublicActions()
]);
