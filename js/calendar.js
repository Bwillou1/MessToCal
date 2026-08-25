/**
 * MessToCal - Calendar Link & File Generator
 * Generates Google Calendar, Outlook, Yahoo URLs and RFC 5545 standard .ics files
 */

const CalendarGenerator = (function() {

  /**
   * Formats date and time into iCal ISO string: YYYYMMDDTHHmmSS
   */
  function formatICalDateTime(dateStr, timeStr) {
    if (!dateStr) return '';
    const cleanDate = dateStr.replace(/-/g, '');
    const cleanTime = (timeStr || '00:00').replace(/:/g, '') + '00';
    return `${cleanDate}T${cleanTime}`;
  }

  /**
   * Formats for Outlook (YYYY-MM-DDTHH:mm:ss)
   */
  function formatIsoDateTime(dateStr, timeStr) {
    if (!dateStr) return '';
    return `${dateStr}T${timeStr || '00:00'}:00`;
  }

  /**
   * Formats for Yahoo Calendar (YYYYMMDDTHHmmSSZ)
   */
  function formatYahooDateTime(dateStr, timeStr) {
    return formatICalDateTime(dateStr, timeStr);
  }

  /**
   * Generates Google Calendar web link
   */
  function getGoogleCalendarUrl(event) {
    const startIso = formatICalDateTime(event.startDate, event.startTime);
    const endIso = formatICalDateTime(event.endDate || event.startDate, event.endTime);

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title || 'Événement',
      dates: `${startIso}/${endIso}`,
      details: event.notes || '',
      location: event.location || ''
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  /**
   * Generates Microsoft Outlook Web deeplink
   */
  function getOutlookUrl(event) {
    const startIso = formatIsoDateTime(event.startDate, event.startTime);
    const endIso = formatIsoDateTime(event.endDate || event.startDate, event.endTime);

    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: event.title || 'Événement',
      startdt: startIso,
      enddt: endIso,
      body: event.notes || '',
      location: event.location || ''
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  }

  /**
   * Generates Yahoo Calendar link
   */
  function getYahooCalendarUrl(event) {
    const startIso = formatYahooDateTime(event.startDate, event.startTime);
    const endIso = formatYahooDateTime(event.endDate || event.startDate, event.endTime);

    const params = new URLSearchParams({
      v: '60',
      title: event.title || 'Événement',
      st: startIso,
      et: endIso,
      desc: event.notes || '',
      in_loc: event.location || ''
    });

    return `https://calendar.yahoo.com/?${params.toString()}`;
  }

  /**
   * Generates RFC 5545 compliant iCalendar (.ics) string
   */
  function generateIcsContent(event) {
    const now = new Date();
    const dtstamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const uid = `messtocal-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@messtocal.app`;

    const dtstart = formatICalDateTime(event.startDate, event.startTime);
    const dtend = formatICalDateTime(event.endDate || event.startDate, event.endTime);

    // Escape special characters in text fields
    const cleanSummary = (event.title || 'Événement').replace(/[\\,;]/g, '\\$&');
    const cleanLocation = (event.location || '').replace(/[\\,;]/g, '\\$&');
    const cleanDescription = (event.notes || '')
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//MessToCal//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${cleanSummary}`,
      `DESCRIPTION:${cleanDescription}`,
      cleanLocation ? `LOCATION:${cleanLocation}` : '',
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      // Reminder 1: 1 day before
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:Rappel: ${cleanSummary} demain`,
      'END:VALARM',
      // Reminder 2: 2 hours before
      'BEGIN:VALARM',
      'TRIGGER:-PT2H',
      'ACTION:DISPLAY',
      `DESCRIPTION:Rappel: ${cleanSummary} dans 2 heures`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean);

    return lines.join('\r\n');
  }

  /**
   * Triggers download of .ics file
   */
  function downloadIcs(event) {
    const icsContent = generateIcsContent(event);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const filename = `${(event.title || 'evenement').toLowerCase().replace(/[^a-z0-9]/gi, '_')}.ics`;

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }

  /**
   * Generates a clean, friendly text summary formatted for Messenger / WhatsApp / SMS / Facebook
   * Includes direct links to 3D interactive envelope and 1-click calendar adding!
   */
  function generateMessengerText(event) {
    const dateFormatted = formatDateFrench(event.startDate);
    const timeFormatted = `${event.startTime || '12:00'} à ${event.endTime || '18:00'}`;
    const shareUrl = generateShareUrl(event);
    const googleUrl = getGoogleCalendarUrl(event);
    const outlookUrl = getOutlookUrl(event);

    let text = `🎉 *${event.title || 'Invitation Officielle'}*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📅 *Date :* ${dateFormatted}\n`;
    text += `⏰ *Heure :* ${timeFormatted}\n`;
    
    if (event.location) {
      text += `📍 *Lieu :* ${event.location}\n`;
    }
    if (event.theme) {
      text += `✨ *Thème :* ${event.theme}\n`;
    }
    if (event.foodInfo) {
      text += `🍽️ *Consignes :* ${event.foodInfo}\n`;
    }
    if (event.organizer) {
      text += `👤 *Hôte :* ${event.organizer}\n`;
    }
    if (event.giftListUrl) {
      text += `🎁 *Liste de cadeaux / Cagnotte :* ${event.giftListUrl}\n`;
    }
    if (event.facebookLink) {
      text += `🔗 *Événement FB :* ${event.facebookLink}\n`;
    }

    text += `\n💌 *Ouvrir votre invitation & enveloppe 3D :*\n${shareUrl}\n`;
    text += `\n📅 *Ajouter à votre agenda en 1 clic :*\n`;
    text += `• 🔵 Google Agenda : ${googleUrl}\n`;
    text += `• 🔷 Outlook : ${outlookUrl}\n`;

    return text;
  }

  /**
   * Generates shareable URL with encoded state in URL Hash
   */
  function generateShareUrl(event) {
    const minimalState = {
      t: event.title,
      sd: event.startDate,
      st: event.startTime,
      ed: event.endDate,
      et: event.endTime,
      l: event.location,
      th: event.theme,
      f: event.foodInfo,
      o: event.organizer,
      gl: event.giftListUrl,
      fb: event.facebookLink
    };
    
    const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(minimalState)))));
    const baseUrl = (typeof window !== 'undefined' && window.location) ? window.location.href.split('#')[0] : '';
    return `${baseUrl}#event=${encoded}`;
  }

  /**
   * Decodes event from URL Hash if present
   */
  function parseShareUrl() {
    const hash = window.location.hash;
    if (!hash || !hash.includes('#event=')) return null;

    try {
      const encoded = hash.split('#event=')[1];
      const jsonStr = decodeURIComponent(escape(atob(decodeURIComponent(encoded))));
      const data = JSON.parse(jsonStr);
      return {
        title: data.t || '',
        startDate: data.sd || '',
        startTime: data.st || '12:00',
        endDate: data.ed || data.sd || '',
        endTime: data.et || '18:00',
        location: data.l || '',
        theme: data.th || '',
        foodInfo: data.f || '',
        organizer: data.o || '',
        giftListUrl: data.gl || '',
        facebookLink: data.fb || '',
        notes: '',
        rawText: `Événement partagé : ${data.t}`
      };
    } catch (e) {
      console.warn("Could not parse shared event from URL hash", e);
      return null;
    }
  }

  /**
   * Helper: formats YYYY-MM-DD into readable French (e.g. "Samedi 10 octobre 2026")
   */
  function formatDateFrench(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;

    const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formatted = dateObj.toLocaleDateString('fr-FR', options);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  return {
    getGoogleCalendarUrl,
    getOutlookUrl,
    getYahooCalendarUrl,
    generateIcsContent,
    downloadIcs,
    generateMessengerText,
    generateShareUrl,
    parseShareUrl,
    formatDateFrench
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CalendarGenerator;
}
