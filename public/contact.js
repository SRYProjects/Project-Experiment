const form = document.querySelector("#contactForm");
const nameInput = document.querySelector("#contactName");
const emailInput = document.querySelector("#contactEmail");
const topicInput = document.querySelector("#contactTopic");
const messageInput = document.querySelector("#contactMessageText");
const characterCount = document.querySelector("#contactCharacterCount");
const submitButton = document.querySelector("#contactSubmitButton");
const status = document.querySelector("#contactStatus");
const success = document.querySelector("#contactSuccess");
const feedback = document.querySelector("#contactFeedback");
const feedbackText = document.querySelector("#contactFeedbackText");
const emailFallback = document.querySelector("#contactEmailFallback");
const verificationStatus = document.querySelector("#contactVerificationStatus");

const fieldMessages = {
  name: document.querySelector("#contactNameMessage"),
  email: document.querySelector("#contactEmailMessage"),
  topic: document.querySelector("#contactTopicMessage"),
  message: document.querySelector("#contactBodyMessage")
};

let turnstileWidgetId = null;

function showFieldMessage(field, message) {
  const target = fieldMessages[field];
  target.textContent = message;
  target.className = message
    ? "field-message"
    : "field-message hidden";
}

function clearFieldMessages() {
  Object.keys(fieldMessages).forEach(
    (field) => showFieldMessage(field, "")
  );
}

function showStatus(message, { sending = false, focus = false, offerEmail = false } = {}) {
  status.textContent = sending ? message : "";
  status.classList.toggle("hidden", !sending || !message);
  feedback.classList.toggle("hidden", sending || !message);
  feedbackText.textContent = sending ? "" : message;
  emailFallback.classList.toggle("hidden", !offerEmail || sending || !message);

  if (offerEmail) {
    const subject = `Project Meaningful: ${topicInput.value || "General question"}`;
    const body = `Name: ${nameInput.value.trim()}\nReply email: ${emailInput.value.trim()}\n\n${messageInput.value.trim()}`;
    emailFallback.href = `mailto:pr@meaningfulventuresinc.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  if (message && !sending && focus) {
    feedback.focus({ preventScroll: true });
    feedback.scrollIntoView({ block: "center", behavior: "auto" });
  }
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function resetTurnstile() {
  verificationStatus.textContent = "Complete the human verification, then select Send Message.";
  if (window.turnstile && turnstileWidgetId !== null) {
    window.turnstile.reset(turnstileWidgetId);
  }
}

function initTurnstile(attempt = 0) {
  if (!window.turnstile) {
    if (attempt < 40) {
      window.setTimeout(
        () => initTurnstile(attempt + 1),
        250
      );
    } else {
      showStatus(
        "Verification could not load. Refresh the page and try again."
      );
    }
    return;
  }

  try {
    if (turnstileWidgetId === null) {
      turnstileWidgetId = window.turnstile.render(
        "#contactTurnstile",
        {
          sitekey: "0x4AAAAAAFFXWD-I0BinHjw3",
          action: "meaningful_contact",
          callback: () => {
            verificationStatus.textContent = "Verification complete. Select Send Message to send your message.";
          },
          "expired-callback": () => {
            verificationStatus.textContent = "Verification expired. Complete the human verification again before sending.";
          },
          "error-callback": () => {
            showStatus(
              "Verification could not be completed. Please try again."
            );
          }
        }
      );
    }
  } catch (error) {
    console.error("Contact verification failed to initialize:", error);
    showStatus(
      "Verification could not load. Refresh the page and try again."
    );
  }
}

messageInput.addEventListener("input", () => {
  characterCount.textContent = String(messageInput.value.length);
  showFieldMessage("message", "");
});

nameInput.addEventListener("input", () => showFieldMessage("name", ""));
emailInput.addEventListener("input", () => showFieldMessage("email", ""));
topicInput.addEventListener("change", () => showFieldMessage("topic", ""));

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearFieldMessages();
  showStatus("");

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const topic = topicInput.value;
  const message = messageInput.value.trim();

  let valid = true;

  if (name.length < 2) {
    showFieldMessage("name", "Enter your name.");
    valid = false;
  }

  if (!validEmail(email)) {
    showFieldMessage("email", "Enter a valid email address.");
    valid = false;
  }

  if (!topic) {
    showFieldMessage("topic", "Choose what your message is about.");
    valid = false;
  }

  if (message.length < 10) {
    showFieldMessage("message", "Enter a message of at least 10 characters.");
    valid = false;
  }

  if (!valid) {
    const firstInvalid = name.length < 2
      ? nameInput
      : !validEmail(email)
        ? emailInput
        : !topic
          ? topicInput
          : messageInput;
    firstInvalid.focus();
    return;
  }

  const turnstileToken =
    window.turnstile && turnstileWidgetId !== null
      ? window.turnstile.getResponse(turnstileWidgetId)
      : "";

  if (!turnstileToken) {
    showStatus(
      "Complete the verification before sending your message.",
      { focus: true }
    );
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Sending…";
  showStatus("Sending your message…", { sending: true });

  try {
    const response = await fetch(
      "/api/contact",
      {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          topic,
          message,
          turnstileToken
        })
      }
    );

    const result = await response.json();

    if (!response.ok || result.success !== true) {
      showStatus(
        result.error ||
          "We couldn't send your message. Please try again or email us instead.",
        { focus: true, offerEmail: true }
      );
      resetTurnstile();
      return;
    }

    form.classList.add("hidden");
    success.classList.remove("hidden");
    success.focus({ preventScroll: true });
    success.scrollIntoView({ block: "center", behavior: "auto" });
  } catch (error) {
    console.error("Contact submission failed:", error);
    showStatus(
      "We couldn't confirm that your message was sent. Your text is still here. You can email us instead.",
      { focus: true, offerEmail: true }
    );
    resetTurnstile();
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Send Message";
  }
});

initTurnstile();
