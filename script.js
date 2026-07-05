const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');
const form = document.getElementById('orderForm');
const formMessage = document.getElementById('formMessage');
const submitButton = form?.querySelector('.submit-btn');
const toast = document.createElement('div');
const year = document.getElementById('year');

if (year) {
  year.textContent = new Date().getFullYear();
}

toast.className = 'toast';
toast.setAttribute('aria-live', 'polite');
toast.setAttribute('role', 'status');
document.body.appendChild(toast);

function showToast(message, status = 'success') {
  toast.textContent = message;
  toast.className = `toast ${status} is-visible`;
  setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 4200);
}

if (menuToggle && siteNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  siteNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const revealElements = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

revealElements.forEach((element) => observer.observe(element));

function setMessage(text, type = '') {
  if (!formMessage) return;
  formMessage.textContent = text;
  formMessage.className = `form-message ${type}`.trim();
}

function validateForm() {
  const requiredFields = form.querySelectorAll('[required]');
  let isValid = true;

  requiredFields.forEach((field) => {
    if (!field.value.trim()) {
      isValid = false;
      field.reportValidity();
      return;
    }
  });

  const emailField = form.querySelector('input[name="email"]');
  if (emailField && emailField.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value)) {
    isValid = false;
    emailField.setCustomValidity('Enter a valid email address');
    emailField.reportValidity();
  } else if (emailField) {
    emailField.setCustomValidity('');
  }

  const phoneField = form.querySelector('input[name="phone"]');
  if (phoneField && !phoneField.value.trim()) {
    isValid = false;
    phoneField.setCustomValidity('Phone number is required');
    phoneField.reportValidity();
  } else if (phoneField) {
    phoneField.setCustomValidity('');
  }

  return isValid;
}

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      setMessage('Please fill in the required fields correctly.', 'error');
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Sending...';
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    setMessage('Sending your project request...', '');

    const emailParams = {
      from_name: data.name,
      from_email: data.email,
      customer_phone: `${data.countryCode || '+91'} ${data.phone}`,
      service_type: data.service,
      company_name: data.company || 'Not provided',
      budget: data.budget || 'Not provided',
      timeline: data.timeline || 'Not provided',
      message: data.message,
      to_email: 'rathoretechlabs@gmail.com'
    };

    async function sendViaFormSubmit(payload) {
      const response = await fetch('https://formsubmit.co/ajax/rathoretechlabs@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('FormSubmit fallback failed');
      }

      return response.json();
    }

    async function sendViaEmailJS(params) {
      if (!window.emailjs) {
        throw new Error('EmailJS library not loaded');
      }
      emailjs.init('d9g-vfXHlgZA-hYtQ');
      return emailjs.send('service_9nvlhkl', 'template_ay4xsxk', params);
    }

    try {
      const result = await sendViaEmailJS(emailParams);

      if (result.status !== 200) {
        throw new Error('EmailJS send failed');
      }

      form.reset();
      setMessage('Your request has been received. Rathore Tech Labs will contact you soon.', 'success');
      showToast('Your request has been received. Rathore Tech Labs will contact you soon.', 'success');
    } catch (error) {
      console.error('EmailJS failed, falling back to FormSubmit.', error);

      try {
        await sendViaFormSubmit(data);
        form.reset();
        setMessage('Your request has been received. Rathore Tech Labs will contact you soon.', 'success');
        showToast('Your request has been received. Rathore Tech Labs will contact you soon.', 'success');
      } catch (fallbackError) {
        console.error('FormSubmit fallback also failed.', fallbackError);
        setMessage('There was a problem sending your request. Please email rathoretechlabs@gmail.com directly.', 'error');
        showToast('Failed to send request. Please email rathoretechlabs@gmail.com.', 'error');
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Send request';
      }
    }
  });
}
