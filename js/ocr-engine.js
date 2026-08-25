/**
 * MessToCal - Local Screenshot OCR & Image Processing Engine
 * Extracts text from Messenger, WhatsApp and Facebook screenshots locally
 */

const OcrEngine = (function() {

  /**
   * Pre-processes image on Canvas for OCR enhancement (grayscale, contrast boost)
   */
  function preprocessImage(imgElement) {
    const canvas = document.createElement('canvas');
    canvas.width = imgElement.naturalWidth || imgElement.width;
    canvas.height = imgElement.naturalHeight || imgElement.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(imgElement, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    // Contrast boost & Grayscale
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      // High contrast thresholding for text sharpness
      const contrast = avg > 128 ? Math.min(255, avg * 1.2) : Math.max(0, avg * 0.8);
      data[i] = contrast;
      data[i + 1] = contrast;
      data[i + 2] = contrast;
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas;
  }

  /**
   * Reads text from screenshot using Tesseract.js (or browser fallback)
   */
  async function recognizeImage(fileOrBlob) {
    return new Promise(async (resolve, reject) => {
      try {
        const imgUrl = URL.createObjectURL(fileOrBlob);
        const img = new Image();
        img.onload = async () => {
          // If Tesseract is loaded via CDN
          if (typeof Tesseract !== 'undefined') {
            try {
              const result = await Tesseract.recognize(imgUrl, 'fra+eng', {
                logger: m => console.log('OCR Progress:', m)
              });
              URL.revokeObjectURL(imgUrl);
              return resolve(result.data.text);
            } catch (err) {
              console.warn('Tesseract OCR error', err);
            }
          }

          // Fallback if Tesseract CDN isn't loaded: return notification
          URL.revokeObjectURL(imgUrl);
          resolve('');
        };
        img.onerror = reject;
        img.src = imgUrl;
      } catch (e) {
        reject(e);
      }
    });
  }

  return {
    preprocessImage,
    recognizeImage
  };
})();

if (typeof window !== 'undefined') {
  window.OcrEngine = OcrEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OcrEngine;
}
