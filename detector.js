
/* CleanMark AI — Corner Mark Candidate Finder
   This is a visual heuristic, NOT an AI watermark detector.
*/
(function (global) {
  "use strict";

  function detectCornerCandidates(imageData, options = {}) {
    if (!imageData || !imageData.data) {
      throw new TypeError("Valid ImageData required");
    }

    const { width, height, data } = imageData;
    const fraction = Math.min(0.45, Math.max(0.08,
      options.cornerFraction || 0.22));
    const threshold = Math.max(12, options.contrastThreshold || 34);
    const zoneW = Math.floor(width * fraction);
    const zoneH = Math.floor(height * fraction);
    const mask = new Uint8ClampedArray(width * height);

    const zones = [
      [0, 0, zoneW, zoneH],
      [width - zoneW, 0, width, zoneH],
      [0, height - zoneH, zoneW, height],
      [width - zoneW, height - zoneH, width, height]
    ];

    function lum(x, y) {
      const i = (y * width + x) * 4;
      return 0.2126 * data[i] +
             0.7152 * data[i + 1] +
             0.0722 * data[i + 2];
    }

    for (const [x0, y0, x1, y1] of zones) {
      for (let y = Math.max(1, y0); y < Math.min(height - 1, y1); y++) {
        for (let x = Math.max(1, x0); x < Math.min(width - 1, x1); x++) {
          const center = lum(x, y);
          const avg = (
            lum(x - 1, y) + lum(x + 1, y) +
            lum(x, y - 1) + lum(x, y + 1)
          ) / 4;

          if (Math.abs(center - avg) >= threshold) {
            mask[y * width + x] = 255;
          }
        }
      }
    }

    // Expand thin candidate pixels for easier selection.
    const expanded = new Uint8ClampedArray(mask);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (!mask[y * width + x]) continue;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            expanded[(y + dy) * width + (x + dx)] = 255;
          }
        }
      }
    }

    return { width, height, mask: expanded };
  }

  global.CleanMarkDetector = Object.freeze({
    detectCornerCandidates
  });

})(window);
