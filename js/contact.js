/* ================================================
   contact.js | CLS Website
   Client-side validation and secure AJAX form submission
   ================================================ */

/* --- Validation Utilities --- */

/**
 * Creates and displays an inline error message next to an invalid form field.
 * @param {HTMLInputElement|HTMLTextAreaElement} input - The input element
 * @param {string} message - The validation error message to display
 * @returns {void}
 */
const showFieldError = (input, message) => {
  input.classList.add('invalid');
  let errorSpan = input.parentNode.querySelector('.form-error-msg');
  if (!errorSpan) {
    errorSpan = document.createElement('span');
    errorSpan.className = 'form-error-msg';
    input.parentNode.appendChild(errorSpan);
  }
  errorSpan.textContent = message;
};

/**
 * Removes any active inline error messages from a validated form field.
 * @param {HTMLInputElement|HTMLTextAreaElement} input - The input element
 * @returns {void}
 */
const clearFieldError = (input) => {
  input.classList.remove('invalid');
  const errorSpan = input.parentNode.querySelector('.form-error-msg');
  if (errorSpan) {
    errorSpan.remove();
  }
};

/**
 * Validates the visitor's name.
 * @param {HTMLInputElement} input - The name input element
 * @returns {boolean} - True if valid, false otherwise
 */
const validateNameField = (input) => {
  const value = input.value.trim();
  if (value.length < 2) {
    showFieldError(input, 'Name must be at least 2 characters long.');
    return false;
  }
  clearFieldError(input);
  return true;
};

/**
 * Validates the visitor's email address using standardized email regex.
 * @param {HTMLInputElement} input - The email input element
 * @returns {boolean} - True if valid, false otherwise
 */
const validateEmailField = (input) => {
  const value = input.value.trim();
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!value) {
    showFieldError(input, 'Email address is required.');
    return false;
  }
  if (!regex.test(value)) {
    showFieldError(input, 'Please provide a valid email address.');
    return false;
  }
  clearFieldError(input);
  return true;
};

/**
 * Validates the visitor's message text length.
 * @param {HTMLTextAreaElement} input - The message textarea element
 * @returns {boolean} - True if valid, false otherwise
 */
const validateMessageField = (input) => {
  const value = input.value.trim();
  if (value.length < 10) {
    showFieldError(input, 'Message must be at least 10 characters long.');
    return false;
  }
  clearFieldError(input);
  return true;
};

/* --- Submission Handlers --- */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById('contact-form');
  const successDiv = document.getElementById('form-success');
  if (!form || !successDiv) return;

  const nameInput = document.getElementById('contact-name');
  const emailInput = document.getElementById('contact-email');
  const messageInput = document.getElementById('contact-message');
  const submitBtn = document.getElementById('contact-submit-btn');

  // Bind real-time validation on blur events
  if (nameInput) {
    nameInput.addEventListener('blur', () => validateNameField(nameInput));
  }
  if (emailInput) {
    emailInput.addEventListener('blur', () => validateEmailField(emailInput));
  }
  if (messageInput) {
    messageInput.addEventListener('blur', () => validateMessageField(messageInput));
  }

  // Handle form submission via AJAX fetch to "/"
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Trigger explicit validation on all inputs before submission
    const isNameValid = nameInput ? validateNameField(nameInput) : true;
    const isEmailValid = emailInput ? validateEmailField(emailInput) : true;
    const isMessageValid = messageInput ? validateMessageField(messageInput) : true;

    if (!isNameValid || !isEmailValid || !isMessageValid) {
      return;
    }

    // Disable submit button to prevent double-sends
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending Message...';
    }

    const formData = new FormData(form);
    const bodyParams = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
      bodyParams.append(key, value);
    }

    try {
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: bodyParams.toString()
      });

      if (!response.ok) {
        throw new Error('Server responded with an error');
      }

      // Smooth inline transition to success state
      form.style.opacity = '0';
      form.style.transform = 'translateY(-10px)';
      form.style.transition = 'all 0.3s ease';

      setTimeout(() => {
        form.style.display = 'none';
        successDiv.style.display = 'block';
        successDiv.style.animation = 'tabFadeIn 0.5s ease both';
      }, 300);

    } catch (err) {
      // Re-enable submit button in case of failure
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message →';
      }
      alert('We were unable to deliver your message. Please verify your connection or contact us at crescentliterarysociety@crescent.education.');
    }
  });
});
