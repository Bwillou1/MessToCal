/**
 * MessToCal - Visual Invitation Card Generator with Ultra Glassmorphic Style
 * Features translucent frosted glass cards, specular highlights, luminous borders and embedded QR Code
 */

const CardGenerator = (function() {

  // 5 Unsplash Models / Themes tuned for Glassmorphism
  const TEMPLATES = [
    {
      id: 'confetti',
      name: '1. Confettis & Ballons Festifs',
      icon: 'celebration',
      bgUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1080&q=80',
      badgeColor: 'rgba(255, 255, 255, 0.35)',
      accentColor: '#ffd700',
      overlayGrad: ['rgba(11, 40, 100, 0.45)', 'rgba(60, 20, 90, 0.65)']
    },
    {
      id: 'cake',
      name: '2. Gâteau & Bougies Dorées',
      icon: 'cake',
      bgUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1080&q=80',
      badgeColor: 'rgba(255, 255, 255, 0.35)',
      accentColor: '#ffeb3b',
      overlayGrad: ['rgba(90, 15, 20, 0.45)', 'rgba(40, 5, 10, 0.70)']
    },
    {
      id: 'lights',
      name: '3. Soirée Chic & Guirlandes',
      icon: 'nightlife',
      bgUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1080&q=80',
      badgeColor: 'rgba(255, 255, 255, 0.35)',
      accentColor: '#ffd700',
      overlayGrad: ['rgba(15, 10, 35, 0.50)', 'rgba(40, 20, 70, 0.75)']
    },
    {
      id: 'bbq',
      name: '4. BBQ & Jardin Ensoleillé',
      icon: 'outdoor_grill',
      bgUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1080&q=80',
      badgeColor: 'rgba(255, 255, 255, 0.35)',
      accentColor: '#a7f3d0',
      overlayGrad: ['rgba(0, 50, 80, 0.45)', 'rgba(5, 70, 45, 0.70)']
    },
    {
      id: 'modern_m3',
      name: '5. Gradient Cosmique M3',
      icon: 'palette',
      bgUrl: null, // Pure modern deep cosmic gradient
      badgeColor: 'rgba(255, 255, 255, 0.35)',
      accentColor: '#93c5fd',
      overlayGrad: ['#041e49', '#1e1b4b', '#4c1d95']
    }
  ];

  /**
   * Loads an image safely with crossOrigin
   */
  function loadImage(src) {
    return new Promise((resolve) => {
      if (!src) return resolve(null);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  /**
   * Renders the complete Glassmorphic invitation card with optional custom imported image and live style options
   */
  async function renderCard(event, templateId = 'confetti', customBgImageSrc = null, options = {}) {
    const template = TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0];
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1480; // 3:4 high quality poster format
    const ctx = canvas.getContext('2d');

    const glassOpacity = options.glassOpacity !== undefined ? options.glassOpacity : 0.28;
    const tint = options.tintColor || 'white';
    const font = options.fontFamily || '-apple-system, Roboto, sans-serif';

    // 1. Draw Background (Custom User Image, Preset Photo, or Deep Gradient)
    let bgImage = null;
    if (customBgImageSrc) {
      bgImage = await loadImage(customBgImageSrc);
    } else if (template.bgUrl) {
      bgImage = await loadImage(template.bgUrl);
    }

    if (bgImage) {
      // Draw image covering the entire 1080x1480 canvas while keeping aspect ratio
      const imgRatio = bgImage.width / bgImage.height;
      const canvasRatio = 1080 / 1480;
      let drawW, drawH, drawX, drawY;

      if (imgRatio > canvasRatio) {
        drawH = 1480;
        drawW = 1480 * imgRatio;
        drawX = (1080 - drawW) / 2;
        drawY = 0;
      } else {
        drawW = 1080;
        drawH = 1080 / imgRatio;
        drawX = 0;
        drawY = (1480 - drawH) / 2;
      }

      ctx.drawImage(bgImage, drawX, drawY, drawW, drawH);

      // Darkening vignette gradient overlay
      const overlay = ctx.createLinearGradient(0, 0, 0, 1480);
      overlay.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
      overlay.addColorStop(0.5, template.overlayGrad[0] || 'rgba(11, 40, 100, 0.45)');
      overlay.addColorStop(1, template.overlayGrad[1] || 'rgba(60, 20, 90, 0.65)');
      ctx.fillStyle = overlay;
      ctx.fillRect(0, 0, 1080, 1480);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 1080, 1480);
      grad.addColorStop(0, '#041e49');
      grad.addColorStop(0.5, '#1e1b4b');
      grad.addColorStop(1, '#4c1d95');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1480);
    }

    // Floating colored glass orbs in background for rich refractions
    drawGlassOrb(ctx, 920, 220, 240, tint === 'gold' ? 'rgba(255, 215, 0, 0.28)' : 'rgba(255, 100, 150, 0.25)');
    drawGlassOrb(ctx, 160, 1250, 280, tint === 'cyan' ? 'rgba(0, 240, 255, 0.28)' : 'rgba(56, 189, 248, 0.25)');
    drawGlassOrb(ctx, 950, 1100, 220, 'rgba(168, 85, 247, 0.25)');

    // 2. MAIN GLASSMORPHIC CARD CONTAINER
    const cardX = 65;
    const cardY = 75;
    const cardW = 950;
    const cardH = 1330;
    const radius = 48;

    // A. Card Ambient Shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = 30;

    // B. Translucent Frosted Glass Fill (Customizable Opacity & Tint)
    const glassFill = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    if (tint === 'gold') {
      glassFill.addColorStop(0, `rgba(255, 223, 100, ${glassOpacity + 0.05})`);
      glassFill.addColorStop(0.5, `rgba(255, 255, 255, ${glassOpacity * 0.5})`);
      glassFill.addColorStop(1, `rgba(212, 175, 55, ${glassOpacity * 0.7})`);
    } else if (tint === 'cyan') {
      glassFill.addColorStop(0, `rgba(100, 230, 255, ${glassOpacity + 0.05})`);
      glassFill.addColorStop(0.5, `rgba(255, 255, 255, ${glassOpacity * 0.5})`);
      glassFill.addColorStop(1, `rgba(14, 165, 233, ${glassOpacity * 0.7})`);
    } else if (tint === 'purple') {
      glassFill.addColorStop(0, `rgba(220, 140, 255, ${glassOpacity + 0.05})`);
      glassFill.addColorStop(0.5, `rgba(255, 255, 255, ${glassOpacity * 0.5})`);
      glassFill.addColorStop(1, `rgba(147, 51, 234, ${glassOpacity * 0.7})`);
    } else {
      // Pure White Glass
      glassFill.addColorStop(0, `rgba(255, 255, 255, ${glassOpacity + 0.04})`);
      glassFill.addColorStop(0.3, `rgba(255, 255, 255, ${glassOpacity * 0.6})`);
      glassFill.addColorStop(0.7, `rgba(255, 255, 255, ${glassOpacity * 0.35})`);
      glassFill.addColorStop(1, `rgba(255, 255, 255, ${glassOpacity * 0.7})`);
    }

    ctx.fillStyle = glassFill;
    roundRect(ctx, cardX, cardY, cardW, cardH, radius);
    ctx.fill();
    ctx.restore();

    // C. Glass Card Specular Border (Luminous top-left reflection)
    const glassBorder = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    glassBorder.addColorStop(0, 'rgba(255, 255, 255, 0.90)');
    glassBorder.addColorStop(0.3, 'rgba(255, 255, 255, 0.40)');
    glassBorder.addColorStop(0.7, 'rgba(255, 255, 255, 0.15)');
    glassBorder.addColorStop(1, 'rgba(255, 255, 255, 0.60)');
    ctx.strokeStyle = glassBorder;
    ctx.lineWidth = 3.5;
    roundRect(ctx, cardX, cardY, cardW, cardH, radius);
    ctx.stroke();

    // 3. Top Glass Badge / Tag
    const badgeX = cardX + 50;
    const badgeY = cardY + 55;
    const badgeW = 290;
    const badgeH = 58;

    const badgeGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY + badgeH);
    badgeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    badgeGrad.addColorStop(1, 'rgba(255, 255, 255, 0.15)');
    ctx.fillStyle = badgeGrad;
    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 29);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 29);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 8;
    ctx.font = 'bold 24px -apple-system, Roboto, sans-serif';
    ctx.fillText('✨ VOUS ÊTES INVITÉ', badgeX + 22, badgeY + 38);
    ctx.shadowBlur = 0;

    // 4. Event Title (Glowing Pure White)
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 16;
    ctx.font = 'bold 54px -apple-system, Roboto, sans-serif';
    const title = event.title || 'Invitation Spéciale';
    wrapText(ctx, title, cardX + 50, cardY + 185, cardW - 100, 64, 2);
    ctx.shadowBlur = 0;

    // Glass Separator Line with glow
    const sepGrad = ctx.createLinearGradient(cardX + 50, 0, cardX + cardW - 50, 0);
    sepGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    sepGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    sepGrad.addColorStop(1, 'rgba(255, 255, 255, 0.8)');
    ctx.strokeStyle = sepGrad;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cardX + 50, cardY + 315);
    ctx.lineTo(cardX + cardW - 50, cardY + 315);
    ctx.stroke();

    // 5. Details Glassmorphic Row Cards
    let currentY = cardY + 385;

    // Date
    const dateFormatted = CalendarGenerator.formatDateFrench(event.startDate) || 'Date à confirmer';
    drawGlassDetailRow(ctx, '📅 DATE', dateFormatted, cardX + 50, currentY, template.accentColor);
    currentY += 108;

    // Heure
    const timeFormatted = `${event.startTime || '12:00'} à ${event.endTime || '18:00'}`;
    drawGlassDetailRow(ctx, '⏰ HEURE', timeFormatted, cardX + 50, currentY, '#67e8f9');
    currentY += 108;

    // Lieu
    if (event.location) {
      drawGlassDetailRow(ctx, '📍 LIEU', event.location, cardX + 50, currentY, '#fda4af');
      currentY += 108;
    }

    // Thème / Consignes repas
    if (event.theme || event.foodInfo) {
      const extra = [event.theme ? `Thème: ${event.theme}` : '', event.foodInfo].filter(Boolean).join(' • ');
      drawGlassDetailRow(ctx, '✨ DÉTAILS', extra, cardX + 50, currentY, '#d8b4fe');
      currentY += 108;
    }

    // Hôte / Organisateur
    if (event.organizer) {
      drawGlassDetailRow(ctx, '👤 HÔTE', event.organizer, cardX + 50, currentY, '#e2e8f0');
      currentY += 108;
    }

    // GiftList / Liste de cadeaux
    if (event.giftListUrl) {
      drawGlassDetailRow(ctx, '🎁 CADEAUX', `Liste de souhaits : ${event.giftListUrl}`, cardX + 50, currentY, '#fbbf24');
    }

    // 6. BOTTOM GLASSMORPHIC QR CODE BANNER
    const bannerY = cardY + cardH - 330;
    const bannerH = 280;

    // Glass banner background
    const bannerGrad = ctx.createLinearGradient(cardX + 40, bannerY, cardX + cardW - 40, bannerY + bannerH);
    bannerGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
    bannerGrad.addColorStop(1, 'rgba(255, 255, 255, 0.12)');
    ctx.fillStyle = bannerGrad;
    roundRect(ctx, cardX + 40, bannerY, cardW - 80, bannerH, 36);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2.5;
    roundRect(ctx, cardX + 40, bannerY, cardW - 80, bannerH, 36);
    ctx.stroke();

    // QR Code Frame (Frosted White Plate for 100% camera scan rate)
    const qrSize = 220;
    const qrX = cardX + cardW - 40 - qrSize - 30;
    const qrY = bannerY + 30;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, qrX - 12, qrY - 12, qrSize + 24, qrSize + 24, 20);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = 'rgba(11, 87, 208, 0.3)';
    ctx.lineWidth = 2;
    roundRect(ctx, qrX - 12, qrY - 12, qrSize + 24, qrSize + 24, 20);
    ctx.stroke();

    // Draw QR Code directly on Canvas
    const shareUrl = CalendarGenerator.generateShareUrl(event);
    drawQrOnCanvas(ctx, shareUrl, qrX, qrY, qrSize, '#0b57d0');

    // Callout text on left side of banner (Crisp Glass typography)
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.font = 'bold 30px -apple-system, Roboto, sans-serif';
    ctx.fillText('Scannez pour ajouter', cardX + 75, bannerY + 72);
    ctx.fillText('à votre calendrier :', cardX + 75, bannerY + 112);

    ctx.fillStyle = template.accentColor;
    ctx.font = 'bold 22px -apple-system, Roboto, sans-serif';
    ctx.fillText('🔵 Google Agenda  🍏 Apple .ICS', cardX + 75, bannerY + 170);
    ctx.fillText('🔷 Outlook Live   🟣 Yahoo', cardX + 75, bannerY + 210);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = '18px -apple-system, Roboto, sans-serif';
    ctx.fillText('Pointez votre caméra pour ouvrir', cardX + 75, bannerY + 252);
    ctx.shadowBlur = 0;

    return canvas;
  }

  function drawGlassOrb(ctx, x, y, r, color) {
    ctx.save();
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawGlassDetailRow(ctx, label, text, x, y, color) {
    ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 8;
    ctx.font = 'bold 22px -apple-system, Roboto, sans-serif';
    ctx.fillText(label, x, y);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px -apple-system, Roboto, sans-serif';
    wrapText(ctx, text, x, y + 42, 820, 42, 1);
    ctx.shadowBlur = 0;
  }

  function drawQrOnCanvas(ctx, text, x, y, size, color) {
    try {
      const tempDiv = document.createElement('div');
      const qr = new QRCode(tempDiv, {
        text: text,
        width: size,
        height: size,
        colorDark: color,
        colorLight: '#ffffff'
      });

      const svg = tempDiv.querySelector('svg');
      if (svg) {
        const rects = svg.querySelectorAll('rect');
        rects.forEach(r => {
          const rx = parseFloat(r.getAttribute('x') || 0);
          const ry = parseFloat(r.getAttribute('y') || 0);
          const rw = parseFloat(r.getAttribute('width') || size);
          const rh = parseFloat(r.getAttribute('height') || size);
          const fill = r.getAttribute('fill');
          ctx.fillStyle = fill === '#ffffff' ? '#ffffff' : color;
          ctx.fillRect(x + rx, y + ry, rw, rh);
        });
      }
    } catch (e) {
      console.warn("QR code canvas render fallback", e);
    }
  }

  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    if (!text) return;
    const words = text.split(' ');
    let line = '';
    let lineCount = 0;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
        lineCount++;
        if (maxLines && lineCount >= maxLines - 1) {
          let remaining = words.slice(n).join(' ');
          while (ctx.measureText(remaining + '...').width > maxWidth && remaining.length > 0) {
            remaining = remaining.substring(0, remaining.length - 1);
          }
          ctx.fillText(remaining + '...', x, y);
          return;
        }
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  }

  /**
   * Downloads glassmorphic card as PNG with chosen template or custom image and custom styles
   */
  async function downloadCard(event, templateId = 'confetti', customBgImageSrc = null, options = {}) {
    const canvas = await renderCard(event, templateId, customBgImageSrc, options);
    const filename = `invitation_glassmorphic_${(event.title || 'evenement').toLowerCase().replace(/[^a-z0-9]/gi, '_')}.png`;
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return {
    TEMPLATES,
    renderCard,
    downloadCard
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CardGenerator;
}
