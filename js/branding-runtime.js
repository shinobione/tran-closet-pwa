const BRAND_MARK = './branding/logo-mark-256.png';

function applyBrandOrb() {
  document.querySelectorAll('.hero-orb').forEach(orb => {
    const symbol = orb.textContent.trim();
    if (symbol === '✦') {
      orb.classList.add('brand-orb');
      orb.replaceChildren();
      const img = document.createElement('img');
      img.src = BRAND_MARK;
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      orb.append(img);
    } else if (orb.classList.contains('brand-orb') && !orb.querySelector('img')) {
      orb.classList.remove('brand-orb');
    }
  });
}

function startBrandObserver() {
  const main = document.querySelector('#mainContent');
  if (!main) return;
  applyBrandOrb();
  new MutationObserver(applyBrandOrb).observe(main, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startBrandObserver, { once: true });
} else {
  startBrandObserver();
}
