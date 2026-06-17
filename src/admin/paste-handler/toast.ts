/**
 * Minimal toast notification for paste upload progress.
 */

const STYLES_ID = 'paste-handler-styles';
const TOAST_ID = 'paste-upload-toast';

function injectStyles(): void {
  if (document.getElementById(STYLES_ID)) return;
  const style = document.createElement('style');
  style.id = STYLES_ID;
  style.textContent = `
    #${TOAST_ID} {
      position: fixed;
      bottom: 28px;
      left: 50%;
      transform: translateX(-50%);
      background: #1e1e2e;
      color: #e2e8f0;
      padding: 10px 18px;
      border-radius: 10px;
      font-size: 13px;
      font-family: system-ui, sans-serif;
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 999999;
      box-shadow: 0 4px 20px rgba(0,0,0,0.35);
      opacity: 0;
      transition: opacity 0.2s ease;
      pointer-events: none;
    }
    #${TOAST_ID}.visible { opacity: 1; }
    #${TOAST_ID} .toast-icon {
      flex-shrink: 0;
      width: 14px; height: 14px;
      border: 2px solid #6366f1;
      border-top-color: transparent;
      border-radius: 50%;
      animation: paste-spin 0.7s linear infinite;
    }
    @keyframes paste-spin { to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);
}

/** Show a toast and return a function to dismiss it. */
export function showToast(message: string): () => void {
  injectStyles();

  let toast = document.getElementById(TOAST_ID);
  if (!toast) {
    toast = document.createElement('div');
    toast.id = TOAST_ID;
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<div class="toast-icon"></div><span>${message}</span>`;
  requestAnimationFrame(() => toast!.classList.add('visible'));

  return () => {
    toast?.classList.remove('visible');
    setTimeout(() => toast?.remove(), 250);
  };
}
