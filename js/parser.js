/**
 * MessToCal - Local NLP / Heuristic Parser for Messenger, Facebook & Chat Messages
 * 100% Client-Side - Zero external API required
 */

const EventParser = (function() {
  const MONTHS_MAP = {
    // Français
    'janvier': 0, 'janv': 0, 'jan': 0,
    'février': 1, 'fevrier': 1, 'févr': 1, 'fevr': 1, 'fév': 1, 'fev': 1,
    'mars': 2, 'mar': 2,
    'avril': 3, 'avr': 3, 'apr': 3,
    'mai': 4, 'may': 4,
    'juin': 5, 'jun': 5,
    'juillet': 6, 'juil': 6, 'jul': 6,
    'août': 7, 'aout': 7, 'aug': 7,
    'septembre': 8, 'sept': 8, 'sep': 8,
    'octobre': 9, 'oct': 9,
    'novembre': 10, 'nov': 10,
    'décembre': 11, 'decembre': 11, 'déc': 11, 'dec': 11,
    // Anglais
    'january': 0, 'february': 1, 'march': 2, 'april': 3,
    'june': 5, 'july': 6, 'august': 7, 'september': 8,
    'october': 9, 'november': 10, 'december': 11,
    // Espagnol
    'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
    'julio': 6, 'agosto': 7, 'septiembre': 8, 'setiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11,
    // Allemand
    'januar': 0, 'februar': 1, 'märz': 2, 'maerz': 2, 'juni': 5, 'juli': 6, 'oktober': 9, 'dezember': 11,
    // Italien
    'gennaio': 0, 'febbraio': 1, 'maggio': 4, 'giugno': 5, 'luglio': 6, 'settembre': 8, 'ottobre': 9, 'novembre': 10, 'dicembre': 11,
    // Portugais
    'janeiro': 0, 'fevereiro': 1, 'março': 2, 'marco': 2, 'maio': 4, 'junho': 5, 'julho': 6, 'outubro': 9, 'novembro': 10, 'dezembro': 11
  };

  const DAYS_OF_WEEK = {
    // Français
    'lundi': 1, 'mardi': 2, 'mercredi': 3, 'jeudi': 4, 'vendredi': 5, 'samedi': 6, 'dimanche': 0,
    // Anglais
    'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6, 'sunday': 0,
    // Espagnol
    'lunes': 1, 'martes': 2, 'miércoles': 3, 'miercoles': 3, 'jueves': 4, 'viernes': 5, 'sábado': 6, 'sabado': 6, 'domingo': 0,
    // Allemand
    'montag': 1, 'dienstag': 2, 'mittwoch': 3, 'donnerstag': 4, 'freitag': 5, 'samstag': 6, 'sonntag': 0,
    // Italien
    'lunedì': 1, 'lunedi': 1, 'martedì': 2, 'martedi': 2, 'mercoledì': 3, 'mercoledi': 3, 'giovedì': 4, 'giovedi': 4, 'venerdì': 5, 'venerdi': 5, 'sabato': 6, 'domenica': 0,
    // Portugais
    'segunda-feira': 1, 'terça-feira': 2, 'quarta-feira': 3, 'quinta-feira': 4, 'sexta-feira': 5, 'sábado': 6, 'domingo': 0
  };

  /**
   * Main parsing entry point
   * @param {string} rawText 
   * @returns {Object} Structured event data
   */
  function parse(rawText) {
    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      return null;
    }

    const cleanRaw = rawText.trim();
    const lines = cleanRaw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const normalizedText = cleanRaw.replace(/\s+/g, ' ');

    const result = {
      rawText: cleanRaw,
      title: '',
      organizer: '',
      startDate: null,      // YYYY-MM-DD
      startTime: '12:00',   // HH:mm
      endDate: null,        // YYYY-MM-DD
      endTime: '18:00',     // HH:mm
      location: '',
      locationType: 'unknown', // 'address', 'home', 'restaurant', 'outdoor', 'virtual', 'unspecified'
      theme: '',
      foodInfo: '',
      notes: '',
      facebookLink: '',
      confidence: {
        date: false,
        time: false,
        location: false,
        title: false
      },
      warnings: []
    };

    // 1. Detect Facebook Event links
    const fbLinkMatch = cleanRaw.match(/https?:\/\/(?:fb\.me\/e\/[a-zA-Z0-9_-]+|(?:www\.)?facebook\.com\/events\/[a-zA-Z0-9_\-\/?=&]+)/i);
    if (fbLinkMatch) {
      result.facebookLink = fbLinkMatch[0];
    }

    // 2. Extract Organizer (e.g. "Alex Dupont" on first line or "De : Alex")
    extractOrganizer(lines, result);

    // 3. Extract Date
    extractDate(cleanRaw, result);

    // 4. Extract Start and End Time
    extractTimes(cleanRaw, result);

    // 5. Extract Title
    extractTitle(lines, cleanRaw, result);

    // 6. Extract Location
    extractLocation(cleanRaw, result);

    // 7. Extract Theme & Food details & Special notes
    extractExtras(cleanRaw, result);

    // 8. Build rich formatted description
    buildFormattedNotes(result);

    return result;
  }

  /**
   * Detects host or sender name
   */
  function extractOrganizer(lines, result) {
    if (lines.length === 0) return;

    // Check if line 1 looks like a sender name (e.g. "Alex Dupont", "De: Jean Tremblay")
    const firstLine = lines[0].replace(/^(de\s*:\s*|organisateur\s*:\s*|from\s*:\s*)/i, '').trim();
    
    // If first line is short (2-4 words, capitalized, no digits, no common greetings)
    const isGreeting = /^(salut|bonjour|bonsoir|coucou|hello|hi|hey|chere|cher|tous|famille|les amis)/i.test(firstLine);
    const hasDigits = /\d/.test(firstLine);
    const wordCount = firstLine.split(/\s+/).length;

    if (!isGreeting && !hasDigits && wordCount >= 1 && wordCount <= 4 && firstLine.length < 40) {
      result.organizer = firstLine;
    } else {
      // Look for "De : X" or "Organisé par X" anywhere
      const orgMatch = result.rawText.match(/(?:de\s*:|organisé\s+par|hôte\s*:|hosted\s+by)\s*([A-ZÀ-ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-ÿ][a-zà-ÿ]+){1,3})/i);
      if (orgMatch) {
        result.organizer = orgMatch[1].trim();
      }
    }
  }

  /**
   * Robust Date Extraction with support for french/english, relative days and auto year inference
   */
  function extractDate(text, result) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();

    let foundDate = null;
    let explicitDay = null;
    let explicitMonth = null;
    let explicitYear = null;

    // Pattern A: "samedi 10 octobre 2026" or "10 octobre" or "19 septembre"
    const monthNamesRegex = Object.keys(MONTHS_MAP).sort((a, b) => b.length - a.length).join('|');
    const fullDateRegex = new RegExp(
      `(?:(?:le|ce|ce\\s+prochain)\\s+)?(?:(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\\s+)?(\\d{1,2})(?:er|e|th|st|nd|rd)?\\s+(${monthNamesRegex})(?:\\s+(\\d{4}))?`,
      'i'
    );

    const matchA = text.match(fullDateRegex);
    if (matchA) {
      explicitDay = parseInt(matchA[2], 10);
      const monthStr = matchA[3].toLowerCase();
      explicitMonth = MONTHS_MAP[monthStr];
      if (matchA[4]) {
        explicitYear = parseInt(matchA[4], 10);
      }
    }

    // Pattern B: "10/10/2026" or "19/09" or "19-09-2026" or "2026-10-10"
    if (!matchA) {
      const isoMatch = text.match(/\b(202[4-9])-(\d{1,2})-(\d{1,2})\b/);
      if (isoMatch) {
        explicitYear = parseInt(isoMatch[1], 10);
        explicitMonth = parseInt(isoMatch[2], 10) - 1;
        explicitDay = parseInt(isoMatch[3], 10);
      } else {
        const dmyMatch = text.match(/\b(\d{1,2})[\/\.-](\d{1,2})(?:[\/\.-](202[4-9]|\d{2}))?\b/);
        if (dmyMatch) {
          explicitDay = parseInt(dmyMatch[1], 10);
          explicitMonth = parseInt(dmyMatch[2], 10) - 1;
          if (dmyMatch[3]) {
            let y = parseInt(dmyMatch[3], 10);
            explicitYear = y < 100 ? 2000 + y : y;
          }
        }
      }
    }

    // Pattern C: Relative days (demain, ce weekend, samedi prochain, ce samedi)
    if (explicitDay === null) {
      if (/\bdemain\b/i.test(text)) {
        const d = new Date(now);
        d.setDate(d.getDate() + 1);
        explicitYear = d.getFullYear();
        explicitMonth = d.getMonth();
        explicitDay = d.getDate();
      } else if (/\bce\s+soir\b/i.test(text) || /\baujourd'?hui\b/i.test(text)) {
        explicitYear = now.getFullYear();
        explicitMonth = now.getMonth();
        explicitDay = now.getDate();
      } else {
        const dowMatch = text.match(/\b(?:ce|samedi|dimanche|vendredi|lundi|mardi|mercredi|jeudi)\s+(prochain|qui\s+s'en\s+vient)?\b/i);
        // Check if a day of week is mentioned alone (e.g. "ce samedi")
        for (const [dayName, dayIndex] of Object.entries(DAYS_OF_WEEK)) {
          const reg = new RegExp(`\\b(?:ce|le)?\\s*${dayName}\\b`, 'i');
          if (reg.test(text)) {
            const currentDow = now.getDay();
            let diff = dayIndex - currentDow;
            if (diff <= 0) diff += 7; // Next occurrence
            const target = new Date(now);
            target.setDate(target.getDate() + diff);
            explicitYear = target.getFullYear();
            explicitMonth = target.getMonth();
            explicitDay = target.getDate();
            break;
          }
        }
      }
    }

    // Determine correct Year if not explicitly specified
    if (explicitDay !== null && explicitMonth !== null) {
      if (!explicitYear) {
        // If the date has already passed by more than 30 days in the current year, set to next year
        const testDate = new Date(currentYear, explicitMonth, explicitDay);
        const daysDiff = (testDate - now) / (1000 * 60 * 60 * 24);
        if (daysDiff < -30) {
          explicitYear = currentYear + 1;
        } else {
          explicitYear = currentYear;
        }
      }

      const formattedMonth = String(explicitMonth + 1).padStart(2, '0');
      const formattedDay = String(explicitDay).padStart(2, '0');
      foundDate = `${explicitYear}-${formattedMonth}-${formattedDay}`;

      result.startDate = foundDate;
      result.endDate = foundDate;
      result.confidence.date = true;
    } else {
      // Fallback: Default to next Saturday
      const d = new Date(now);
      const diff = (6 - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
      const formattedMonth = String(d.getMonth() + 1).padStart(2, '0');
      const formattedDay = String(d.getDate()).padStart(2, '0');
      result.startDate = `${d.getFullYear()}-${formattedMonth}-${formattedDay}`;
      result.endDate = result.startDate;
      result.warnings.push("Aucune date précise n'a été détectée. La date a été configurée par défaut au prochain samedi.");
    }
  }

  /**
   * Start and End Time extraction with intelligent context defaults
   */
  function extractTimes(text, result) {
    let startHour = null;
    let startMin = 0;
    let endHour = null;
    let endMin = 0;
    let isExplicitEndTime = false;

    // Range Pattern: "de 14h à 18h", "12h30 - 18h00", "entre 15:00 et 20:00", "12h30 à 17h"
    const rangeRegex = /(?:de|entre|from)?\s*(\d{1,2})(?:[h:](\d{2}))?\s*(?:à|a|jusqu'à|jusqu’à|au|et|-|to|till)\s*(\d{1,2})(?:[h:](\d{2}))?/i;
    const rangeMatch = text.match(rangeRegex);

    if (rangeMatch && parseInt(rangeMatch[1], 10) <= 24 && parseInt(rangeMatch[3], 10) <= 24) {
      startHour = parseInt(rangeMatch[1], 10);
      startMin = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : 0;
      endHour = parseInt(rangeMatch[3], 10);
      endMin = rangeMatch[4] ? parseInt(rangeMatch[4], 10) : 0;
      isExplicitEndTime = true;
      result.confidence.time = true;
    } else {
      // Single Start Time Patterns: "vers 12h30", "pour 15:30", "à 18h", "15:30", "12h30", "3:30 pm"
      const timeRegex = /(?:vers|pour|à|a|at|around|dès|des)?\s*(\d{1,2})(?:[h:](\d{2})|\s*h(?:eures?)?)\s*(am|pm)?\b/i;
      const match = text.match(timeRegex);

      if (match && parseInt(match[1], 10) <= 24) {
        startHour = parseInt(match[1], 10);
        startMin = match[2] ? parseInt(match[2], 10) : 0;
        const ampm = match[3] ? match[3].toLowerCase() : null;

        if (ampm === 'pm' && startHour < 12) startHour += 12;
        if (ampm === 'am' && startHour === 12) startHour = 0;

        result.confidence.time = true;
      }
    }

    // Contextual time fallbacks if not matched by numbers
    if (startHour === null) {
      if (/\b(?:dîner|diner|midi|lunch)\b/i.test(text)) {
        startHour = 12;
        startMin = 0;
        result.confidence.time = true;
      } else if (/\b(?:souper|dîner du soir|soirée|dinner|supper)\b/i.test(text)) {
        startHour = 17;
        startMin = 30;
        result.confidence.time = true;
      } else if (/\b(?:brunch)\b/i.test(text)) {
        startHour = 10;
        startMin = 30;
        result.confidence.time = true;
      } else if (/\b(?:déjeuner|dejeuner|matin|breakfast)\b/i.test(text)) {
        startHour = 9;
        startMin = 0;
        result.confidence.time = true;
      } else if (/\b(?:apéro|apero|cocktail|5 à 7|5a7)\b/i.test(text)) {
        startHour = 17;
        startMin = 0;
        result.confidence.time = true;
      } else {
        startHour = 12;
        startMin = 0;
      }
    }

    // SMART END TIME HEURISTICS (As specified by user)
    // 1. If lunch / diner around noon (11:00 - 13:30) -> finishes around 18:00 (dîner d'anniversaire ne dépassera pas 18h)
    // 2. If afternoon or evening (>= 15:00, souper, party) -> finishes at 22:00
    // 3. If morning (< 11:00) -> default +3 hours (e.g. 9h -> 12h)
    if (!isExplicitEndTime || endHour === null) {
      const isLunchTime = (startHour >= 11 && startHour <= 13) || /\b(?:dîner|diner|midi|lunch)\b/i.test(text);
      const isEveningOrLate = (startHour >= 14) || /\b(?:souper|soirée|party|fête|fete|dinner)\b/i.test(text);

      if (isLunchTime && startHour <= 13) {
        endHour = 18;
        endMin = 0;
      } else if (isEveningOrLate) {
        endHour = 22;
        endMin = 0;
      } else {
        endHour = Math.min(startHour + 4, 23);
        endMin = startMin;
      }
    }

    // Format HH:mm strings
    result.startTime = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;
    result.endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
  }

  /**
   * Title detection (e.g. "Fête à Jacob", "Fête à Michel", "Anniversaire de...", "Souper chez...")
   */
  function extractTitle(lines, text, result) {
    // 1. Look for explicit celebration phrases
    const eventPatterns = [
      /(?:pour\s+)?(la\s+fête\s+[àa]\s+[A-ZÀ-ÿa-zà-ÿ\-]+)/i,
      /(?:pour\s+)?(l'anniversaire\s+(?:de|d')\s*[A-ZÀ-ÿa-zà-ÿ\-]+)/i,
      /(?:pour\s+)?(anniversaire\s+(?:de|d')\s*[A-ZÀ-ÿa-zà-ÿ\-]+)/i,
      /(?:pour\s+)?(la\s+fête\s+(?:de|d')\s*[A-ZÀ-ÿa-zà-ÿ\-]+)/i,
      /(fête\s+d'anniversaire(?:\s+[àa]\s+[A-ZÀ-ÿa-zà-ÿ\-]+)?)/i,
      /(fête\s+[àa]\s+[A-ZÀ-ÿa-zà-ÿ\-]+)/i,
      /(party\s+de\s+[A-ZÀ-ÿa-zà-ÿ\-]+)/i,
      /(shower\s+(?:de\s+bébé|de\s+mariage)?(?:\s+(?:de|pour)\s+[A-ZÀ-ÿa-zà-ÿ\-]+)?)/i,
      /(souper\s+(?:de\s+famille|entre\s+amis|des\s+fêtes)?)/i,
      /(dîner\s+(?:de\s+famille|d'anniversaire|entre\s+amis)?)/i,
      /(mariage\s+(?:de|d')\s*[A-ZÀ-ÿa-zà-ÿ\-]+(?:\s+et\s+[A-ZÀ-ÿa-zà-ÿ\-]+)?)/i,
      /(bbq\s+(?:de\s+famille|entre\s+amis)?)/i,
      /(soirée\s+jeux(?:\s+de\s+société)?)/i
    ];

    for (const pat of eventPatterns) {
      const match = text.match(pat);
      if (match) {
        let titleCandidate = match[1].replace(/\s+/g, ' ').trim();
        // Capitalize first letter properly
        titleCandidate = titleCandidate.charAt(0).toUpperCase() + titleCandidate.slice(1);
        result.title = titleCandidate;
        result.confidence.title = true;
        return;
      }
    }

    // 2. If organizer is known, e.g. "Événement de Alex Dupont"
    if (result.organizer) {
      result.title = `Invitation de ${result.organizer}`;
      result.confidence.title = true;
      return;
    }

    // 3. Fallback to first line or generic
    if (lines.length > 0 && lines[0].length <= 50) {
      result.title = lines[0].replace(/\s+/g, ' ').trim();
    } else {
      result.title = "Événement / Rassemblement";
    }
  }

  /**
   * Location detection & classification
   */
  function extractLocation(text, result) {
    // Check for "à la maison", "chez nous", "chez moi"
    if (/\b(?:à\s+la\s+maison|a\s+la\s+maison|chez\s+nous|chez\s+moi)\b/i.test(text)) {
      result.location = "À la maison / Chez l'hôte";
      result.locationType = 'home';
      result.confidence.location = true;
      return;
    }

    const chezMatch = text.match(/\bchez\s+([A-ZÀ-ÿ][a-zà-ÿ]+)\b/i);
    if (chezMatch) {
      result.location = `Chez ${chezMatch[1]}`;
      result.locationType = 'home';
      result.confidence.location = true;
      return;
    }

    // Check for restaurant
    if (/\b(?:au\s+resto|au\s+restaurant|dans\s+un\s+resto|en\s+resto)\b/i.test(text)) {
      result.location = "Restaurant (À confirmer / livraison à la maison)";
      result.locationType = 'restaurant';
      result.confidence.location = true;
      return;
    }

    // Check for street address (e.g. "123 rue Principale, Montreal", "456 chemin du Lac, Gatineau J8T 1A1")
    const addressMatch = text.match(/\b\d{1,5}\s+(?:rue|avenue|av\.|boul\.|boulevard|chemin|ch\.|route|rte|place|croissant|montée)\s+[^,\.\n]+(?:,\s*[^,\.\n]+)?/i);
    if (addressMatch) {
      result.location = addressMatch[0].replace(/\s+/g, ' ').trim();
      result.locationType = 'address';
      result.confidence.location = true;
      return;
    }

    // Check for parks or outdoor places
    const outdoorMatch = text.match(/\b(?:au\s+parc\s+[^,\.\n]+|à\s+la\s+plage|en\s+plein\s+air|dans\s+la\s+cour)\b/i);
    if (outdoorMatch) {
      result.location = outdoorMatch[0].replace(/\s+/g, ' ').trim();
      result.locationType = 'outdoor';
      result.confidence.location = true;
      return;
    }

    // Default if not clearly found
    result.location = "";
    result.locationType = 'unspecified';
    result.warnings.push("Aucune adresse précise n'a été trouvée dans le message.");
  }

  /**
   * Extra features: theme, food/potluck, weather/outdoor, reminders
   */
  function extractExtras(text, result) {
    // Theme extraction (e.g. "Le thème sera l'espace", "theme: casino", "déguisement")
    const themeMatch = text.match(/(?:le\s+)?th[èe]me\s+(?:sera|est|:)?\s*([^,\.\n\?!;]+)/i);
    if (themeMatch) {
      let themeCandidate = themeMatch[1].replace(/\s+/g, ' ').trim();
      // Handle incomplete typing like "l'espac" -> "l'espace"
      if (themeCandidate.toLowerCase() === "l'espac" || themeCandidate.toLowerCase() === "espac") {
        themeCandidate = "L'espace";
      }
      result.theme = themeCandidate;
    }

    // Food / Drinks instructions (e.g. "on se commenderas du resto", "apportez votre boisson", "potluck")
    const foodItems = [];
    if (/\b(?:on\s+se\s+commende(?:ras)?\s+du\s+resto|commander\s+du\s+resto|livraison|take-out)\b/i.test(text)) {
      foodItems.push("Commande au restaurant / Take-out");
    }
    if (/\b(?:apportez\s+votre\s+boisson|byob|apportez\s+vos\s+consommations|chacun\s+sa\s+boisson)\b/i.test(text)) {
      foodItems.push("Apportez vos boissons (BYOB)");
    }
    if (/\b(?:potluck|chacun\s+amène\s+un\s+plat|buffet\s+partagé)\b/i.test(text)) {
      foodItems.push("Potluck (Chacun apporte un plat)");
    }
    if (/\b(?:gâteau|gateau|dessert)\b/i.test(text)) {
      foodItems.push("Gâteau / Dessert prévu");
    }
    if (/\b(?:bbq|barbecue|grillades)\b/i.test(text)) {
      foodItems.push("BBQ & Grillades");
    }
    if (foodItems.length > 0) {
      result.foodInfo = foodItems.join(" • ");
    }

    // Outdoor / Weather notes
    if (/\b(?:extérieur|exterieur|dehors|dans\s+la\s+cour|si\s+la\s+météo|beau\s+temps)\b/i.test(text)) {
      if (!result.foodInfo.includes("Extérieur")) {
        result.foodInfo = result.foodInfo ? `${result.foodInfo} • Activité en partie à l'extérieur ☀️` : "Activité en partie à l'extérieur ☀️";
      }
    }

    // Parking & Access Code extraction
    extractParkingAndAccess(text, result);

    // GiftList / Wishlist detection
    const giftListMatch = text.match(/(?:https?:\/\/(?:www\.)?(?:giftlist\.com|amazon\.[a-z.]+\/(?:hz\/)?wishlist|mesenvies\.com|okpal\.com|lepotcommun\.fr|leetchi\.com)[^\s]+)/i) ||
                          text.match(/(?:giftlist|liste\s+de\s+cadeaux|liste\s+de\s+souhaits?|cagnotte)\s*:\s*(https?:\/\/[^\s]+|[^\n\.,]+)/i);
    if (giftListMatch) {
      result.giftListUrl = giftListMatch[1] ? giftListMatch[1].trim() : giftListMatch[0].trim();
    }
  }

  /**
   * Parking instructions & Door code / Intercom detector
   */
  function extractParkingAndAccess(text, result) {
    // Parking Detection
    const parkingMatch = text.match(/(?:stationnement|parking|se\s+garer|places?\s+de\s+parc)\s+([^,\.\n]+)/i);
    if (parkingMatch) {
      result.parkingInfo = `🅿️ Stationnement : ${parkingMatch[0].trim()}`;
    }

    // Door code / Buzzer / Intercom detection
    const codeMatch = text.match(/(?:code\s+(?:de\s+)?porte|code\s+d['’]entr[ée]e|interphone|buzzer|digicode|code\s*:?)\s*([#A-Za-z0-9\s-]+)/i);
    if (codeMatch) {
      result.accessCode = `🔑 Accès / Code : ${codeMatch[0].trim()}`;
    }
  }

  /**
   * Assembles clean multi-line notes for calendar descriptions & messenger shares
   */
  function buildFormattedNotes(result) {
    const lines = [];

    if (result.organizer) {
      lines.push(`👤 Organisateur / Hôte : ${result.organizer}`);
    }
    if (result.theme) {
      lines.push(`✨ Thème : ${result.theme}`);
    }
    if (result.foodInfo) {
      lines.push(`🍽️ Repas & Consignes : ${result.foodInfo}`);
    }
    if (result.parkingInfo) {
      lines.push(`${result.parkingInfo}`);
    }
    if (result.accessCode) {
      lines.push(`${result.accessCode}`);
    }
    if (result.giftListUrl) {
      lines.push(`🎁 Liste de cadeaux / Cagnotte : ${result.giftListUrl}`);
    }
    if (result.facebookLink) {
      lines.push(`🔗 Lien de l'événement Facebook : ${result.facebookLink}`);
    }

    lines.push(``);
    lines.push(`📝 Message d'origine :`);
    lines.push(`"${result.rawText}"`);
    lines.push(``);
    lines.push(`✨ Converti automatiquement avec MessToCal`);

    result.notes = lines.join('\n');
  }

  return {
    parse: parse
  };
})();

// Export for module/browser environments
if (typeof window !== 'undefined') {
  window.EventParser = EventParser;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EventParser;
}
