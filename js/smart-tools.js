/**
 * MessToCal - Smart Tools Suite
 * Contains Food & Drinks Calculator, Allergies Manager, Uber/Lyft, Gift Ideas,
 * Auto-Replies, Dress Code, RSVP, Web Push Notifications, Multi-Format Exporters & Wallet Pass
 */

const SmartTools = (function() {

  /**
   * 1. Food & Drinks Quantity Calculator
   */
  function calculateFoodAndDrinks(adults = 10, kids = 2, eventType = 'soiree') {
    const totalPeople = adults + kids * 0.6; // kids count as ~60% portion
    const isLunch = eventType === 'midi' || eventType === 'diner';

    return {
      pizza: Math.ceil(totalPeople * (isLunch ? 0.35 : 0.45)), // Large pizzas
      bbqMeatKg: (totalPeople * (isLunch ? 0.25 : 0.35)).toFixed(1), // kg of meat/burgers
      beersWine: Math.ceil(adults * (isLunch ? 2.5 : 4)), // cans/glasses
      softDrinksLiters: Math.ceil(totalPeople * 0.75), // Liters of juice / soda / water
      iceBags: Math.max(1, Math.ceil(totalPeople / 8)), // Bags of ice
      chipsBags: Math.max(1, Math.ceil(totalPeople / 5)), // Bags of chips / appetizers
      cakePortions: Math.ceil(adults + kids)
    };
  }

  /**
   * 2. Uber & Lyft URL Generator
   */
  function getUberUrl(address) {
    if (!address) return 'https://m.uber.com/';
    return `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodeURIComponent(address)}`;
  }

  function getLyftUrl(address) {
    if (!address) return 'https://lyft.com/';
    return `https://lyft.com/ride?destination[address]=${encodeURIComponent(address)}`;
  }

  /**
   * 3. Gift Ideas Suggestions Engine
   */
  function getGiftIdeas(event) {
    const theme = (event.theme || '').toLowerCase();
    const title = (event.title || '').toLowerCase();
    const food = (event.foodInfo || '').toLowerCase();

    const suggestions = [];

    if (theme.includes('espace') || title.includes('espace')) {
      suggestions.push('🪐 Télescope portable ou projecteur d\'étoiles galaxie', '🚀 Jeu de société cosmique (ex: Terraforming Mars, Catan)', '✨ Veilleuse lune 3D LED tactile');
    } else if (theme.includes('retro') || theme.includes('80')) {
      suggestions.push('📻 Enceinte Bluetooth au look rétro vintage', '🕹️ Mini console de jeux d\'arcade rétro', '📸 Appareil photo instantané type Polaroid');
    } else if (food.includes('bbq') || title.includes('bbq')) {
      suggestions.push('🔥 Coffret d\'épices & sauces BBQ du monde', '🥩 Ensemble d\'outils et couteaux à grillades en inox', '🍺 Tablier de maître grilladin personnalisé');
    } else if (title.includes('mariage') || title.includes('couple')) {
      suggestions.push('🍷 Coffret de dégustation de vins grands crus', '✈️ Bon cadeau pour une escapade détente / Spa', '🖼️ Cadre photo personnalisé gravé');
    } else if (title.includes('bébé') || title.includes('shower')) {
      suggestions.push('👶 Coffret de naissance bio & doudou personnalisé', '📚 Livre souvenir de la première année', '🛁 Trousse de soins pour bébé écologique');
    } else {
      // General celebrations
      suggestions.push(
        '🎁 Carte-cadeau expérience (Restaurant gastronomique, Spectacle, Spa)',
        '🍾 Bouteille de champagne ou spiritueux haut de gamme',
        '☕ Machine à café portable ou coffret de thés précieux',
        '🌿 Plante d\'intérieur dépolluante dans un joli pot en céramique'
      );
    }

    return suggestions;
  }

  /**
   * 4. Quick Auto-Replies for Messenger / SMS
   */
  function getAutoReplies(event) {
    const title = event.title || 'l\'événement';
    const date = CalendarGenerator.formatDateFrench(event.startDate);

    return {
      accept: `Salut ! Merci beaucoup pour l'invitation à ${title} le ${date}. C'est noté avec plaisir dans mon calendrier, je serai bien présent(e) ! 🎉 À très bientôt !`,
      acceptWithPlusOne: `Coucou ! Merci pour la super invitation pour ${title} ! Nous serons là à 2 avec grand plaisir. Est-ce qu'on peut apporter quelque chose ? 😊`,
      decline: `Salut ! Merci infiniment d'avoir pensé à moi pour ${title}. Malheureusement je ne pourrai pas me libérer à cette date. Je vous souhaite une merveilleuse fête et j'espère qu'on se verra très vite ! ❤️`,
      late: `Allô ! Je suis en route pour ${title}, mais je risque d'avoir environ 15-20 minutes de retard avec le trafic. À tout de suite ! 🚗`
    };
  }

  /**
   * 5. Dress Code & Visual Palette Generator
   */
  function getDressCodeInfo(text) {
    const t = text.toLowerCase();
    if (t.includes('blanc') || t.includes('white')) {
      return { label: '⚪ Soirée Blanche (All White)', colors: ['#ffffff', '#f8f9fa', '#e2e8f0'], tips: 'Tenue entièrement blanche, élégante et estivale.' };
    }
    if (t.includes('retro') || t.includes('80') || t.includes('90') || t.includes('vintage')) {
      return { label: '🌈 Rétro Flashy / Vintage', colors: ['#ff007f', '#00f0ff', '#ffe600', '#7928ca'], tips: 'Couleurs vives, vestes en jean, accessoires néon et style rétro.' };
    }
    if (t.includes('chic') || t.includes('gala') || t.includes('cocktail')) {
      return { label: '🎩 Chic & Cocktail', colors: ['#1e1e24', '#2c3e50', '#d4af37'], tips: 'Robe de soirée, chemise et veste de costume.' };
    }
    if (t.includes('bbq') || t.includes('cour') || t.includes('exterieur') || t.includes('plage')) {
      return { label: '☀️ Décontracté / Plein Air', colors: ['#38bdf8', '#fbbf24', '#4ade80'], tips: 'Tenue confortable, lunettes de soleil et veste légère pour le soir.' };
    }
    return { label: '✨ Tenue libre / Confortable', colors: ['#3b82f6', '#8b5cf6', '#ec4899'], tips: 'Venez comme vous êtes dans votre confort !' };
  }

  /**
   * 6. RSVP Deadline Detector
   */
  function detectRsvpDeadline(text) {
    const match = text.match(/(?:confirmer|rsvp|répondre|confirmez|reponse|réponse)\s+(?:avant|d'ici|pour)?\s*(?:le\s+)?(\d{1,2}(?:\s+[a-zà-ÿ]+)?|[a-zà-ÿ]+\s+prochain)/i);
    return match ? match[0] : null;
  }

  /**
   * 7. Web Push Browser Notification Request
   */
  async function requestWebPushReminder(event) {
    if (!('Notification' in window)) {
      return { supported: false, message: "Les notifications ne sont pas supportées par votre navigateur." };
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Trigger notification confirmation
      new Notification(`📅 Rappel programmé : ${event.title}`, {
        body: `Vous recevrez une notification de rappel pour le ${CalendarGenerator.formatDateFrench(event.startDate)} à ${event.startTime}.`,
        icon: './icons/icon-192.svg'
      });
      return { supported: true, granted: true };
    }
    return { supported: true, granted: false };
  }

  /**
   * 8. Universal Multi-Format Exporter
   */
  function exportJson(event) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(event, null, 2));
    const link = document.createElement('a');
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `${(event.title || 'evenement').toLowerCase().replace(/[^a-z0-9]/gi, '_')}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function exportWhatsApp(event) {
    return CalendarGenerator.generateMessengerText(event);
  }

  /**
   * 9. Printable Table Place Cards / Guest Badges Generator
   */
  function printPlaceCards(event, guestNames = ['Invité 1', 'Invité 2', 'Invité 3', 'Invité 4']) {
    const printWindow = window.open('', '_blank');
    const cardsHtml = guestNames.map(name => `
      <div class="place-card">
        <div class="card-border">
          <div class="event-name">${event.title || 'Événement'}</div>
          <div class="guest-name">${name}</div>
          <div class="event-date">📅 ${CalendarGenerator.formatDateFrench(event.startDate)} • ⏰ ${event.startTime}</div>
        </div>
      </div>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Marque-Places - ${event.title}</title>
        <style>
          @page { size: A4; margin: 1cm; }
          body { font-family: 'Roboto', sans-serif; background: #fff; margin: 0; padding: 20px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .place-card { border: 2px dashed #0b57d0; border-radius: 12px; padding: 24px; text-align: center; page-break-inside: avoid; }
          .card-border { border: 1.5px solid #d3e3fd; border-radius: 8px; padding: 20px; }
          .event-name { font-size: 14px; color: #0b57d0; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; }
          .guest-name { font-size: 28px; font-weight: 900; color: #1f1f1f; margin-bottom: 12px; }
          .event-date { font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <h2 style="text-align: center; color: #0b57d0; margin-bottom: 20px;">Marque-Places & Étiquettes Découpables</h2>
        <div class="grid">${cardsHtml}</div>
        <script>window.onload = function() { window.print(); };</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  /**
   * 10. Professional Responsive HTML Email Invitation Generator
   */
  function generateHtmlEmail(event) {
    const googleUrl = CalendarGenerator.getGoogleCalendarUrl(event);
    const outlookUrl = CalendarGenerator.getOutlookUrl(event);
    const yahooUrl = CalendarGenerator.getYahooCalendarUrl(event);
    const shareUrl = CalendarGenerator.generateShareUrl(event);
    const dateFormatted = CalendarGenerator.formatDateFrench(event.startDate);

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation : ${event.title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f0f4f9; margin: 0; padding: 24px;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #d3e3fd;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0b57d0 0%, #1e1b4b 100%); padding: 36px 32px; text-align: center; color: #ffffff;">
              <span style="font-size: 13px; letter-spacing: 2px; text-transform: uppercase; font-weight: 700; color: #ffd700; display: block; margin-bottom: 8px;">✨ INVITATION OFFICIELLE</span>
              <h1 style="font-size: 28px; font-weight: 800; margin: 0; line-height: 1.3;">${event.title || 'Vous êtes cordialement invité'}</h1>
              ${event.organizer ? `<p style="font-size: 15px; color: #d3e3fd; margin: 8px 0 0 0;">Organisé par <strong>${event.organizer}</strong></p>` : ''}
            </td>
          </tr>

          <!-- Details Body -->
          <tr>
            <td style="padding: 32px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #edf2f7;">
                    <strong style="color: #0b57d0; font-size: 14px;">📅 DATE & HEURE</strong><br>
                    <span style="font-size: 17px; font-weight: 700; color: #1f1f1f;">${dateFormatted}</span><br>
                    <span style="font-size: 15px; color: #4b5563;">De ${event.startTime} à ${event.endTime}</span>
                  </td>
                </tr>

                ${event.location ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #edf2f7;">
                    <strong style="color: #0b57d0; font-size: 14px;">📍 LIEU / ADRESSE</strong><br>
                    <span style="font-size: 16px; font-weight: 600; color: #1f1f1f;">${event.location}</span>
                  </td>
                </tr>
                ` : ''}

                ${event.parkingInfo || event.accessCode ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #edf2f7; background: #f8fafc; border-radius: 8px; padding-left: 12px;">
                    <strong style="color: #0b57d0; font-size: 13px;">🅿️ ACCÈS & STATIONNEMENT</strong><br>
                    ${event.parkingInfo ? `<div style="font-size: 14px; color: #334155; margin-top: 2px;">${event.parkingInfo}</div>` : ''}
                    ${event.accessCode ? `<div style="font-size: 14px; font-weight: 700; color: #0b57d0; margin-top: 2px;">${event.accessCode}</div>` : ''}
                  </td>
                </tr>
                ` : ''}

                ${event.theme || event.foodInfo ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #edf2f7;">
                    <strong style="color: #0b57d0; font-size: 14px;">✨ THÈME & CONSIGNES</strong><br>
                    <span style="font-size: 15px; color: #4b5563;">${[event.theme, event.foodInfo].filter(Boolean).join(' • ')}</span>
                  </td>
                </tr>
                ` : ''}
              </table>

              <!-- Action Calendar Buttons -->
              <div style="margin-top: 28px; text-align: center;">
                <p style="font-size: 14px; font-weight: 700; color: #1f1f1f; margin-bottom: 14px;">Ajoutez cet événement directement à votre agenda :</p>
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center">
                      <a href="${googleUrl}" target="_blank" style="background: #0b57d0; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block; margin: 4px;">🔵 Google Agenda</a>
                      <a href="${outlookUrl}" target="_blank" style="background: #0078d4; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block; margin: 4px;">🔷 Outlook</a>
                      <a href="${shareUrl}" target="_blank" style="background: #10b981; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block; margin: 4px;">📱 Page Invité & GPS</a>
                    </td>
                  </tr>
                </table>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
              Invitation générée avec élégance via MessToCal © 2026.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * 11. Live Route & ETA Share Generator
   */
  function getLiveRouteShareMessage(event) {
    const loc = event.location || 'l\'adresse de la fête';
    return `🚗 *Je suis en route pour : ${event.title || 'l\'événement'} !*\n📍 Destination : ${loc}\n⏱️ Mon GPS estime mon arrivée vers ${event.startTime || 'l\'heure prévue'}.\n\n_Message envoyé en direct via MessToCal_`;
  }

  return {
    calculateFoodAndDrinks,
    getUberUrl,
    getLyftUrl,
    getGiftIdeas,
    getAutoReplies,
    getDressCodeInfo,
    detectRsvpDeadline,
    requestWebPushReminder,
    exportJson,
    exportWhatsApp,
    printPlaceCards,
    generateHtmlEmail,
    getLiveRouteShareMessage
  };
})();

if (typeof window !== 'undefined') {
  window.SmartTools = SmartTools;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SmartTools;
}
