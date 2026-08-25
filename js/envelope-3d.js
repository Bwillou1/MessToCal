/**
 * MessToCal - 3D Interactive Opening Envelope for Guest View
 * Provides a magical unboxing experience when guests open the shared link / QR code
 */

const Envelope3D = (function() {

  /**
   * Initializes the 3D envelope interaction inside a target container
   */
  function renderEnvelope(targetElement, event, onOpenedCallback) {
    if (!targetElement) return;

    targetElement.innerHTML = `
      <div class="envelope-3d-wrapper" id="envelope-3d-interactive">
        <div class="envelope-card-container">
          
          <!-- Back Flap -->
          <div class="env-back"></div>

          <!-- Invitation Card Inside -->
          <div class="env-invitation-slip" id="env-slip">
            <div class="slip-header">🎉 INVITATION OFFICIELLE</div>
            <div class="slip-title">${event.title || 'Vous êtes invité !'}</div>
            <div class="slip-date">📅 ${CalendarGenerator.formatDateFrench(event.startDate)}</div>
            <div class="slip-time">⏰ ${event.startTime} à ${event.endTime}</div>
            ${event.location ? `<div class="slip-loc">📍 ${event.location}</div>` : ''}
            ${event.giftListUrl ? `<div class="slip-loc" style="color: #d97706; font-weight: 700;">🎁 Liste de cadeaux : ${event.giftListUrl}</div>` : ''}
          </div>

          <!-- Front Pocket Layers -->
          <div class="env-front-left"></div>
          <div class="env-front-right"></div>
          <div class="env-front-bottom"></div>

          <!-- Top Opening Flap with Wax Seal -->
          <div class="env-top-flap" id="env-flap">
            <div class="wax-seal" id="wax-seal" title="Touchez pour ouvrir l'enveloppe !">
              <span class="material-symbols-outlined" style="font-size: 26px; color: #ffd700;">mail</span>
            </div>
          </div>

        </div>

        <div class="envelope-tap-prompt" id="env-prompt">
          ✨ Touchez l'enveloppe pour l'ouvrir !
        </div>
      </div>
    `;

    // Click handler to trigger 3D opening animation
    const seal = targetElement.querySelector('#wax-seal');
    const flap = targetElement.querySelector('#env-flap');
    const container = targetElement.querySelector('.envelope-card-container');
    const wrapper = targetElement.querySelector('#envelope-3d-interactive');
    const prompt = targetElement.querySelector('#env-prompt');

    let opened = false;
    const triggerOpen = () => {
      if (opened) return;
      opened = true;
      wrapper?.classList.add('opened');
      if (prompt) prompt.textContent = "🎉 Invitation décachetée ! Ajoutez-la à votre agenda ci-dessous :";
      if (typeof onOpenedCallback === 'function') {
        setTimeout(onOpenedCallback, 500);
      }
    };

    seal?.addEventListener('click', (e) => { e.stopPropagation(); triggerOpen(); });
    flap?.addEventListener('click', (e) => { e.stopPropagation(); triggerOpen(); });
    container?.addEventListener('click', triggerOpen);
  }

  return {
    renderEnvelope
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Envelope3D;
}
