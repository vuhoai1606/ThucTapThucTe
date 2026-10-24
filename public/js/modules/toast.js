/**
 * Toast Notification Module
 */
export function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';

  if (type === 'error') {
    toast.style.borderLeftColor = 'var(--fpt-red)';
    toast.innerHTML = `<i class="fas fa-exclamation-circle" style="color: var(--fpt-red);"></i> ${message}`;
  } else if (type === 'success') {
    toast.style.borderLeftColor = 'var(--fpt-green)';
    toast.innerHTML = `<i class="fas fa-check-circle" style="color: var(--fpt-green);"></i> ${message}`;
  } else {
    toast.innerHTML = `<i class="fas fa-info-circle" style="color: var(--primary-fpt);"></i> ${message}`;
  }

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
