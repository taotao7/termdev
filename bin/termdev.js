#!/usr/bin/env node
import { createRequire } from "node:module";
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __require = /* @__PURE__ */ createRequire(import.meta.url);

// node_modules/tinycolor2/cjs/tinycolor.js
var require_tinycolor = __commonJS((exports, module) => {
  (function(global, factory) {
    typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define(factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, global.tinycolor = factory());
  })(exports, function() {
    function _typeof(obj) {
      "@babel/helpers - typeof";
      return _typeof = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(obj2) {
        return typeof obj2;
      } : function(obj2) {
        return obj2 && typeof Symbol == "function" && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
      }, _typeof(obj);
    }
    var trimLeft = /^\s+/;
    var trimRight = /\s+$/;
    function tinycolor(color, opts) {
      color = color ? color : "";
      opts = opts || {};
      if (color instanceof tinycolor) {
        return color;
      }
      if (!(this instanceof tinycolor)) {
        return new tinycolor(color, opts);
      }
      var rgb = inputToRGB(color);
      this._originalInput = color, this._r = rgb.r, this._g = rgb.g, this._b = rgb.b, this._a = rgb.a, this._roundA = Math.round(100 * this._a) / 100, this._format = opts.format || rgb.format;
      this._gradientType = opts.gradientType;
      if (this._r < 1)
        this._r = Math.round(this._r);
      if (this._g < 1)
        this._g = Math.round(this._g);
      if (this._b < 1)
        this._b = Math.round(this._b);
      this._ok = rgb.ok;
    }
    tinycolor.prototype = {
      isDark: function isDark() {
        return this.getBrightness() < 128;
      },
      isLight: function isLight() {
        return !this.isDark();
      },
      isValid: function isValid() {
        return this._ok;
      },
      getOriginalInput: function getOriginalInput() {
        return this._originalInput;
      },
      getFormat: function getFormat() {
        return this._format;
      },
      getAlpha: function getAlpha() {
        return this._a;
      },
      getBrightness: function getBrightness() {
        var rgb = this.toRgb();
        return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
      },
      getLuminance: function getLuminance() {
        var rgb = this.toRgb();
        var RsRGB, GsRGB, BsRGB, R, G, B;
        RsRGB = rgb.r / 255;
        GsRGB = rgb.g / 255;
        BsRGB = rgb.b / 255;
        if (RsRGB <= 0.03928)
          R = RsRGB / 12.92;
        else
          R = Math.pow((RsRGB + 0.055) / 1.055, 2.4);
        if (GsRGB <= 0.03928)
          G = GsRGB / 12.92;
        else
          G = Math.pow((GsRGB + 0.055) / 1.055, 2.4);
        if (BsRGB <= 0.03928)
          B = BsRGB / 12.92;
        else
          B = Math.pow((BsRGB + 0.055) / 1.055, 2.4);
        return 0.2126 * R + 0.7152 * G + 0.0722 * B;
      },
      setAlpha: function setAlpha(value) {
        this._a = boundAlpha(value);
        this._roundA = Math.round(100 * this._a) / 100;
        return this;
      },
      toHsv: function toHsv() {
        var hsv = rgbToHsv(this._r, this._g, this._b);
        return {
          h: hsv.h * 360,
          s: hsv.s,
          v: hsv.v,
          a: this._a
        };
      },
      toHsvString: function toHsvString() {
        var hsv = rgbToHsv(this._r, this._g, this._b);
        var h = Math.round(hsv.h * 360), s = Math.round(hsv.s * 100), v = Math.round(hsv.v * 100);
        return this._a == 1 ? "hsv(" + h + ", " + s + "%, " + v + "%)" : "hsva(" + h + ", " + s + "%, " + v + "%, " + this._roundA + ")";
      },
      toHsl: function toHsl() {
        var hsl = rgbToHsl(this._r, this._g, this._b);
        return {
          h: hsl.h * 360,
          s: hsl.s,
          l: hsl.l,
          a: this._a
        };
      },
      toHslString: function toHslString() {
        var hsl = rgbToHsl(this._r, this._g, this._b);
        var h = Math.round(hsl.h * 360), s = Math.round(hsl.s * 100), l = Math.round(hsl.l * 100);
        return this._a == 1 ? "hsl(" + h + ", " + s + "%, " + l + "%)" : "hsla(" + h + ", " + s + "%, " + l + "%, " + this._roundA + ")";
      },
      toHex: function toHex(allow3Char) {
        return rgbToHex(this._r, this._g, this._b, allow3Char);
      },
      toHexString: function toHexString(allow3Char) {
        return "#" + this.toHex(allow3Char);
      },
      toHex8: function toHex8(allow4Char) {
        return rgbaToHex(this._r, this._g, this._b, this._a, allow4Char);
      },
      toHex8String: function toHex8String(allow4Char) {
        return "#" + this.toHex8(allow4Char);
      },
      toRgb: function toRgb() {
        return {
          r: Math.round(this._r),
          g: Math.round(this._g),
          b: Math.round(this._b),
          a: this._a
        };
      },
      toRgbString: function toRgbString() {
        return this._a == 1 ? "rgb(" + Math.round(this._r) + ", " + Math.round(this._g) + ", " + Math.round(this._b) + ")" : "rgba(" + Math.round(this._r) + ", " + Math.round(this._g) + ", " + Math.round(this._b) + ", " + this._roundA + ")";
      },
      toPercentageRgb: function toPercentageRgb() {
        return {
          r: Math.round(bound01(this._r, 255) * 100) + "%",
          g: Math.round(bound01(this._g, 255) * 100) + "%",
          b: Math.round(bound01(this._b, 255) * 100) + "%",
          a: this._a
        };
      },
      toPercentageRgbString: function toPercentageRgbString() {
        return this._a == 1 ? "rgb(" + Math.round(bound01(this._r, 255) * 100) + "%, " + Math.round(bound01(this._g, 255) * 100) + "%, " + Math.round(bound01(this._b, 255) * 100) + "%)" : "rgba(" + Math.round(bound01(this._r, 255) * 100) + "%, " + Math.round(bound01(this._g, 255) * 100) + "%, " + Math.round(bound01(this._b, 255) * 100) + "%, " + this._roundA + ")";
      },
      toName: function toName() {
        if (this._a === 0) {
          return "transparent";
        }
        if (this._a < 1) {
          return false;
        }
        return hexNames[rgbToHex(this._r, this._g, this._b, true)] || false;
      },
      toFilter: function toFilter(secondColor) {
        var hex8String = "#" + rgbaToArgbHex(this._r, this._g, this._b, this._a);
        var secondHex8String = hex8String;
        var gradientType = this._gradientType ? "GradientType = 1, " : "";
        if (secondColor) {
          var s = tinycolor(secondColor);
          secondHex8String = "#" + rgbaToArgbHex(s._r, s._g, s._b, s._a);
        }
        return "progid:DXImageTransform.Microsoft.gradient(" + gradientType + "startColorstr=" + hex8String + ",endColorstr=" + secondHex8String + ")";
      },
      toString: function toString(format) {
        var formatSet = !!format;
        format = format || this._format;
        var formattedString = false;
        var hasAlpha = this._a < 1 && this._a >= 0;
        var needsAlphaFormat = !formatSet && hasAlpha && (format === "hex" || format === "hex6" || format === "hex3" || format === "hex4" || format === "hex8" || format === "name");
        if (needsAlphaFormat) {
          if (format === "name" && this._a === 0) {
            return this.toName();
          }
          return this.toRgbString();
        }
        if (format === "rgb") {
          formattedString = this.toRgbString();
        }
        if (format === "prgb") {
          formattedString = this.toPercentageRgbString();
        }
        if (format === "hex" || format === "hex6") {
          formattedString = this.toHexString();
        }
        if (format === "hex3") {
          formattedString = this.toHexString(true);
        }
        if (format === "hex4") {
          formattedString = this.toHex8String(true);
        }
        if (format === "hex8") {
          formattedString = this.toHex8String();
        }
        if (format === "name") {
          formattedString = this.toName();
        }
        if (format === "hsl") {
          formattedString = this.toHslString();
        }
        if (format === "hsv") {
          formattedString = this.toHsvString();
        }
        return formattedString || this.toHexString();
      },
      clone: function clone() {
        return tinycolor(this.toString());
      },
      _applyModification: function _applyModification(fn, args) {
        var color = fn.apply(null, [this].concat([].slice.call(args)));
        this._r = color._r;
        this._g = color._g;
        this._b = color._b;
        this.setAlpha(color._a);
        return this;
      },
      lighten: function lighten() {
        return this._applyModification(_lighten, arguments);
      },
      brighten: function brighten() {
        return this._applyModification(_brighten, arguments);
      },
      darken: function darken() {
        return this._applyModification(_darken, arguments);
      },
      desaturate: function desaturate() {
        return this._applyModification(_desaturate, arguments);
      },
      saturate: function saturate() {
        return this._applyModification(_saturate, arguments);
      },
      greyscale: function greyscale() {
        return this._applyModification(_greyscale, arguments);
      },
      spin: function spin() {
        return this._applyModification(_spin, arguments);
      },
      _applyCombination: function _applyCombination(fn, args) {
        return fn.apply(null, [this].concat([].slice.call(args)));
      },
      analogous: function analogous() {
        return this._applyCombination(_analogous, arguments);
      },
      complement: function complement() {
        return this._applyCombination(_complement, arguments);
      },
      monochromatic: function monochromatic() {
        return this._applyCombination(_monochromatic, arguments);
      },
      splitcomplement: function splitcomplement() {
        return this._applyCombination(_splitcomplement, arguments);
      },
      triad: function triad() {
        return this._applyCombination(polyad, [3]);
      },
      tetrad: function tetrad() {
        return this._applyCombination(polyad, [4]);
      }
    };
    tinycolor.fromRatio = function(color, opts) {
      if (_typeof(color) == "object") {
        var newColor = {};
        for (var i in color) {
          if (color.hasOwnProperty(i)) {
            if (i === "a") {
              newColor[i] = color[i];
            } else {
              newColor[i] = convertToPercentage(color[i]);
            }
          }
        }
        color = newColor;
      }
      return tinycolor(color, opts);
    };
    function inputToRGB(color) {
      var rgb = {
        r: 0,
        g: 0,
        b: 0
      };
      var a = 1;
      var s = null;
      var v = null;
      var l = null;
      var ok = false;
      var format = false;
      if (typeof color == "string") {
        color = stringInputToObject(color);
      }
      if (_typeof(color) == "object") {
        if (isValidCSSUnit(color.r) && isValidCSSUnit(color.g) && isValidCSSUnit(color.b)) {
          rgb = rgbToRgb(color.r, color.g, color.b);
          ok = true;
          format = String(color.r).substr(-1) === "%" ? "prgb" : "rgb";
        } else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.v)) {
          s = convertToPercentage(color.s);
          v = convertToPercentage(color.v);
          rgb = hsvToRgb(color.h, s, v);
          ok = true;
          format = "hsv";
        } else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.l)) {
          s = convertToPercentage(color.s);
          l = convertToPercentage(color.l);
          rgb = hslToRgb(color.h, s, l);
          ok = true;
          format = "hsl";
        }
        if (color.hasOwnProperty("a")) {
          a = color.a;
        }
      }
      a = boundAlpha(a);
      return {
        ok,
        format: color.format || format,
        r: Math.min(255, Math.max(rgb.r, 0)),
        g: Math.min(255, Math.max(rgb.g, 0)),
        b: Math.min(255, Math.max(rgb.b, 0)),
        a
      };
    }
    function rgbToRgb(r, g, b) {
      return {
        r: bound01(r, 255) * 255,
        g: bound01(g, 255) * 255,
        b: bound01(b, 255) * 255
      };
    }
    function rgbToHsl(r, g, b) {
      r = bound01(r, 255);
      g = bound01(g, 255);
      b = bound01(b, 255);
      var max = Math.max(r, g, b), min = Math.min(r, g, b);
      var h, s, l = (max + min) / 2;
      if (max == min) {
        h = s = 0;
      } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          case b:
            h = (r - g) / d + 4;
            break;
        }
        h /= 6;
      }
      return {
        h,
        s,
        l
      };
    }
    function hslToRgb(h, s, l) {
      var r, g, b;
      h = bound01(h, 360);
      s = bound01(s, 100);
      l = bound01(l, 100);
      function hue2rgb(p2, q2, t) {
        if (t < 0)
          t += 1;
        if (t > 1)
          t -= 1;
        if (t < 1 / 6)
          return p2 + (q2 - p2) * 6 * t;
        if (t < 1 / 2)
          return q2;
        if (t < 2 / 3)
          return p2 + (q2 - p2) * (2 / 3 - t) * 6;
        return p2;
      }
      if (s === 0) {
        r = g = b = l;
      } else {
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
      }
      return {
        r: r * 255,
        g: g * 255,
        b: b * 255
      };
    }
    function rgbToHsv(r, g, b) {
      r = bound01(r, 255);
      g = bound01(g, 255);
      b = bound01(b, 255);
      var max = Math.max(r, g, b), min = Math.min(r, g, b);
      var h, s, v = max;
      var d = max - min;
      s = max === 0 ? 0 : d / max;
      if (max == min) {
        h = 0;
      } else {
        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          case b:
            h = (r - g) / d + 4;
            break;
        }
        h /= 6;
      }
      return {
        h,
        s,
        v
      };
    }
    function hsvToRgb(h, s, v) {
      h = bound01(h, 360) * 6;
      s = bound01(s, 100);
      v = bound01(v, 100);
      var i = Math.floor(h), f = h - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s), mod = i % 6, r = [v, q, p, p, t, v][mod], g = [t, v, v, q, p, p][mod], b = [p, p, t, v, v, q][mod];
      return {
        r: r * 255,
        g: g * 255,
        b: b * 255
      };
    }
    function rgbToHex(r, g, b, allow3Char) {
      var hex = [pad2(Math.round(r).toString(16)), pad2(Math.round(g).toString(16)), pad2(Math.round(b).toString(16))];
      if (allow3Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1)) {
        return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0);
      }
      return hex.join("");
    }
    function rgbaToHex(r, g, b, a, allow4Char) {
      var hex = [pad2(Math.round(r).toString(16)), pad2(Math.round(g).toString(16)), pad2(Math.round(b).toString(16)), pad2(convertDecimalToHex(a))];
      if (allow4Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1) && hex[3].charAt(0) == hex[3].charAt(1)) {
        return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0) + hex[3].charAt(0);
      }
      return hex.join("");
    }
    function rgbaToArgbHex(r, g, b, a) {
      var hex = [pad2(convertDecimalToHex(a)), pad2(Math.round(r).toString(16)), pad2(Math.round(g).toString(16)), pad2(Math.round(b).toString(16))];
      return hex.join("");
    }
    tinycolor.equals = function(color1, color2) {
      if (!color1 || !color2)
        return false;
      return tinycolor(color1).toRgbString() == tinycolor(color2).toRgbString();
    };
    tinycolor.random = function() {
      return tinycolor.fromRatio({
        r: Math.random(),
        g: Math.random(),
        b: Math.random()
      });
    };
    function _desaturate(color, amount) {
      amount = amount === 0 ? 0 : amount || 10;
      var hsl = tinycolor(color).toHsl();
      hsl.s -= amount / 100;
      hsl.s = clamp01(hsl.s);
      return tinycolor(hsl);
    }
    function _saturate(color, amount) {
      amount = amount === 0 ? 0 : amount || 10;
      var hsl = tinycolor(color).toHsl();
      hsl.s += amount / 100;
      hsl.s = clamp01(hsl.s);
      return tinycolor(hsl);
    }
    function _greyscale(color) {
      return tinycolor(color).desaturate(100);
    }
    function _lighten(color, amount) {
      amount = amount === 0 ? 0 : amount || 10;
      var hsl = tinycolor(color).toHsl();
      hsl.l += amount / 100;
      hsl.l = clamp01(hsl.l);
      return tinycolor(hsl);
    }
    function _brighten(color, amount) {
      amount = amount === 0 ? 0 : amount || 10;
      var rgb = tinycolor(color).toRgb();
      rgb.r = Math.max(0, Math.min(255, rgb.r - Math.round(255 * -(amount / 100))));
      rgb.g = Math.max(0, Math.min(255, rgb.g - Math.round(255 * -(amount / 100))));
      rgb.b = Math.max(0, Math.min(255, rgb.b - Math.round(255 * -(amount / 100))));
      return tinycolor(rgb);
    }
    function _darken(color, amount) {
      amount = amount === 0 ? 0 : amount || 10;
      var hsl = tinycolor(color).toHsl();
      hsl.l -= amount / 100;
      hsl.l = clamp01(hsl.l);
      return tinycolor(hsl);
    }
    function _spin(color, amount) {
      var hsl = tinycolor(color).toHsl();
      var hue = (hsl.h + amount) % 360;
      hsl.h = hue < 0 ? 360 + hue : hue;
      return tinycolor(hsl);
    }
    function _complement(color) {
      var hsl = tinycolor(color).toHsl();
      hsl.h = (hsl.h + 180) % 360;
      return tinycolor(hsl);
    }
    function polyad(color, number) {
      if (isNaN(number) || number <= 0) {
        throw new Error("Argument to polyad must be a positive number");
      }
      var hsl = tinycolor(color).toHsl();
      var result = [tinycolor(color)];
      var step = 360 / number;
      for (var i = 1;i < number; i++) {
        result.push(tinycolor({
          h: (hsl.h + i * step) % 360,
          s: hsl.s,
          l: hsl.l
        }));
      }
      return result;
    }
    function _splitcomplement(color) {
      var hsl = tinycolor(color).toHsl();
      var h = hsl.h;
      return [tinycolor(color), tinycolor({
        h: (h + 72) % 360,
        s: hsl.s,
        l: hsl.l
      }), tinycolor({
        h: (h + 216) % 360,
        s: hsl.s,
        l: hsl.l
      })];
    }
    function _analogous(color, results, slices) {
      results = results || 6;
      slices = slices || 30;
      var hsl = tinycolor(color).toHsl();
      var part = 360 / slices;
      var ret = [tinycolor(color)];
      for (hsl.h = (hsl.h - (part * results >> 1) + 720) % 360;--results; ) {
        hsl.h = (hsl.h + part) % 360;
        ret.push(tinycolor(hsl));
      }
      return ret;
    }
    function _monochromatic(color, results) {
      results = results || 6;
      var hsv = tinycolor(color).toHsv();
      var { h, s, v } = hsv;
      var ret = [];
      var modification = 1 / results;
      while (results--) {
        ret.push(tinycolor({
          h,
          s,
          v
        }));
        v = (v + modification) % 1;
      }
      return ret;
    }
    tinycolor.mix = function(color1, color2, amount) {
      amount = amount === 0 ? 0 : amount || 50;
      var rgb1 = tinycolor(color1).toRgb();
      var rgb2 = tinycolor(color2).toRgb();
      var p = amount / 100;
      var rgba = {
        r: (rgb2.r - rgb1.r) * p + rgb1.r,
        g: (rgb2.g - rgb1.g) * p + rgb1.g,
        b: (rgb2.b - rgb1.b) * p + rgb1.b,
        a: (rgb2.a - rgb1.a) * p + rgb1.a
      };
      return tinycolor(rgba);
    };
    tinycolor.readability = function(color1, color2) {
      var c1 = tinycolor(color1);
      var c2 = tinycolor(color2);
      return (Math.max(c1.getLuminance(), c2.getLuminance()) + 0.05) / (Math.min(c1.getLuminance(), c2.getLuminance()) + 0.05);
    };
    tinycolor.isReadable = function(color1, color2, wcag2) {
      var readability = tinycolor.readability(color1, color2);
      var wcag2Parms, out;
      out = false;
      wcag2Parms = validateWCAG2Parms(wcag2);
      switch (wcag2Parms.level + wcag2Parms.size) {
        case "AAsmall":
        case "AAAlarge":
          out = readability >= 4.5;
          break;
        case "AAlarge":
          out = readability >= 3;
          break;
        case "AAAsmall":
          out = readability >= 7;
          break;
      }
      return out;
    };
    tinycolor.mostReadable = function(baseColor, colorList, args) {
      var bestColor = null;
      var bestScore = 0;
      var readability;
      var includeFallbackColors, level, size;
      args = args || {};
      includeFallbackColors = args.includeFallbackColors;
      level = args.level;
      size = args.size;
      for (var i = 0;i < colorList.length; i++) {
        readability = tinycolor.readability(baseColor, colorList[i]);
        if (readability > bestScore) {
          bestScore = readability;
          bestColor = tinycolor(colorList[i]);
        }
      }
      if (tinycolor.isReadable(baseColor, bestColor, {
        level,
        size
      }) || !includeFallbackColors) {
        return bestColor;
      } else {
        args.includeFallbackColors = false;
        return tinycolor.mostReadable(baseColor, ["#fff", "#000"], args);
      }
    };
    var names = tinycolor.names = {
      aliceblue: "f0f8ff",
      antiquewhite: "faebd7",
      aqua: "0ff",
      aquamarine: "7fffd4",
      azure: "f0ffff",
      beige: "f5f5dc",
      bisque: "ffe4c4",
      black: "000",
      blanchedalmond: "ffebcd",
      blue: "00f",
      blueviolet: "8a2be2",
      brown: "a52a2a",
      burlywood: "deb887",
      burntsienna: "ea7e5d",
      cadetblue: "5f9ea0",
      chartreuse: "7fff00",
      chocolate: "d2691e",
      coral: "ff7f50",
      cornflowerblue: "6495ed",
      cornsilk: "fff8dc",
      crimson: "dc143c",
      cyan: "0ff",
      darkblue: "00008b",
      darkcyan: "008b8b",
      darkgoldenrod: "b8860b",
      darkgray: "a9a9a9",
      darkgreen: "006400",
      darkgrey: "a9a9a9",
      darkkhaki: "bdb76b",
      darkmagenta: "8b008b",
      darkolivegreen: "556b2f",
      darkorange: "ff8c00",
      darkorchid: "9932cc",
      darkred: "8b0000",
      darksalmon: "e9967a",
      darkseagreen: "8fbc8f",
      darkslateblue: "483d8b",
      darkslategray: "2f4f4f",
      darkslategrey: "2f4f4f",
      darkturquoise: "00ced1",
      darkviolet: "9400d3",
      deeppink: "ff1493",
      deepskyblue: "00bfff",
      dimgray: "696969",
      dimgrey: "696969",
      dodgerblue: "1e90ff",
      firebrick: "b22222",
      floralwhite: "fffaf0",
      forestgreen: "228b22",
      fuchsia: "f0f",
      gainsboro: "dcdcdc",
      ghostwhite: "f8f8ff",
      gold: "ffd700",
      goldenrod: "daa520",
      gray: "808080",
      green: "008000",
      greenyellow: "adff2f",
      grey: "808080",
      honeydew: "f0fff0",
      hotpink: "ff69b4",
      indianred: "cd5c5c",
      indigo: "4b0082",
      ivory: "fffff0",
      khaki: "f0e68c",
      lavender: "e6e6fa",
      lavenderblush: "fff0f5",
      lawngreen: "7cfc00",
      lemonchiffon: "fffacd",
      lightblue: "add8e6",
      lightcoral: "f08080",
      lightcyan: "e0ffff",
      lightgoldenrodyellow: "fafad2",
      lightgray: "d3d3d3",
      lightgreen: "90ee90",
      lightgrey: "d3d3d3",
      lightpink: "ffb6c1",
      lightsalmon: "ffa07a",
      lightseagreen: "20b2aa",
      lightskyblue: "87cefa",
      lightslategray: "789",
      lightslategrey: "789",
      lightsteelblue: "b0c4de",
      lightyellow: "ffffe0",
      lime: "0f0",
      limegreen: "32cd32",
      linen: "faf0e6",
      magenta: "f0f",
      maroon: "800000",
      mediumaquamarine: "66cdaa",
      mediumblue: "0000cd",
      mediumorchid: "ba55d3",
      mediumpurple: "9370db",
      mediumseagreen: "3cb371",
      mediumslateblue: "7b68ee",
      mediumspringgreen: "00fa9a",
      mediumturquoise: "48d1cc",
      mediumvioletred: "c71585",
      midnightblue: "191970",
      mintcream: "f5fffa",
      mistyrose: "ffe4e1",
      moccasin: "ffe4b5",
      navajowhite: "ffdead",
      navy: "000080",
      oldlace: "fdf5e6",
      olive: "808000",
      olivedrab: "6b8e23",
      orange: "ffa500",
      orangered: "ff4500",
      orchid: "da70d6",
      palegoldenrod: "eee8aa",
      palegreen: "98fb98",
      paleturquoise: "afeeee",
      palevioletred: "db7093",
      papayawhip: "ffefd5",
      peachpuff: "ffdab9",
      peru: "cd853f",
      pink: "ffc0cb",
      plum: "dda0dd",
      powderblue: "b0e0e6",
      purple: "800080",
      rebeccapurple: "663399",
      red: "f00",
      rosybrown: "bc8f8f",
      royalblue: "4169e1",
      saddlebrown: "8b4513",
      salmon: "fa8072",
      sandybrown: "f4a460",
      seagreen: "2e8b57",
      seashell: "fff5ee",
      sienna: "a0522d",
      silver: "c0c0c0",
      skyblue: "87ceeb",
      slateblue: "6a5acd",
      slategray: "708090",
      slategrey: "708090",
      snow: "fffafa",
      springgreen: "00ff7f",
      steelblue: "4682b4",
      tan: "d2b48c",
      teal: "008080",
      thistle: "d8bfd8",
      tomato: "ff6347",
      turquoise: "40e0d0",
      violet: "ee82ee",
      wheat: "f5deb3",
      white: "fff",
      whitesmoke: "f5f5f5",
      yellow: "ff0",
      yellowgreen: "9acd32"
    };
    var hexNames = tinycolor.hexNames = flip(names);
    function flip(o) {
      var flipped = {};
      for (var i in o) {
        if (o.hasOwnProperty(i)) {
          flipped[o[i]] = i;
        }
      }
      return flipped;
    }
    function boundAlpha(a) {
      a = parseFloat(a);
      if (isNaN(a) || a < 0 || a > 1) {
        a = 1;
      }
      return a;
    }
    function bound01(n, max) {
      if (isOnePointZero(n))
        n = "100%";
      var processPercent = isPercentage(n);
      n = Math.min(max, Math.max(0, parseFloat(n)));
      if (processPercent) {
        n = parseInt(n * max, 10) / 100;
      }
      if (Math.abs(n - max) < 0.000001) {
        return 1;
      }
      return n % max / parseFloat(max);
    }
    function clamp01(val) {
      return Math.min(1, Math.max(0, val));
    }
    function parseIntFromHex(val) {
      return parseInt(val, 16);
    }
    function isOnePointZero(n) {
      return typeof n == "string" && n.indexOf(".") != -1 && parseFloat(n) === 1;
    }
    function isPercentage(n) {
      return typeof n === "string" && n.indexOf("%") != -1;
    }
    function pad2(c) {
      return c.length == 1 ? "0" + c : "" + c;
    }
    function convertToPercentage(n) {
      if (n <= 1) {
        n = n * 100 + "%";
      }
      return n;
    }
    function convertDecimalToHex(d) {
      return Math.round(parseFloat(d) * 255).toString(16);
    }
    function convertHexToDecimal(h) {
      return parseIntFromHex(h) / 255;
    }
    var matchers = function() {
      var CSS_INTEGER = "[-\\+]?\\d+%?";
      var CSS_NUMBER = "[-\\+]?\\d*\\.\\d+%?";
      var CSS_UNIT = "(?:" + CSS_NUMBER + ")|(?:" + CSS_INTEGER + ")";
      var PERMISSIVE_MATCH3 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
      var PERMISSIVE_MATCH4 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
      return {
        CSS_UNIT: new RegExp(CSS_UNIT),
        rgb: new RegExp("rgb" + PERMISSIVE_MATCH3),
        rgba: new RegExp("rgba" + PERMISSIVE_MATCH4),
        hsl: new RegExp("hsl" + PERMISSIVE_MATCH3),
        hsla: new RegExp("hsla" + PERMISSIVE_MATCH4),
        hsv: new RegExp("hsv" + PERMISSIVE_MATCH3),
        hsva: new RegExp("hsva" + PERMISSIVE_MATCH4),
        hex3: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
        hex6: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
        hex4: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
        hex8: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
      };
    }();
    function isValidCSSUnit(color) {
      return !!matchers.CSS_UNIT.exec(color);
    }
    function stringInputToObject(color) {
      color = color.replace(trimLeft, "").replace(trimRight, "").toLowerCase();
      var named = false;
      if (names[color]) {
        color = names[color];
        named = true;
      } else if (color == "transparent") {
        return {
          r: 0,
          g: 0,
          b: 0,
          a: 0,
          format: "name"
        };
      }
      var match;
      if (match = matchers.rgb.exec(color)) {
        return {
          r: match[1],
          g: match[2],
          b: match[3]
        };
      }
      if (match = matchers.rgba.exec(color)) {
        return {
          r: match[1],
          g: match[2],
          b: match[3],
          a: match[4]
        };
      }
      if (match = matchers.hsl.exec(color)) {
        return {
          h: match[1],
          s: match[2],
          l: match[3]
        };
      }
      if (match = matchers.hsla.exec(color)) {
        return {
          h: match[1],
          s: match[2],
          l: match[3],
          a: match[4]
        };
      }
      if (match = matchers.hsv.exec(color)) {
        return {
          h: match[1],
          s: match[2],
          v: match[3]
        };
      }
      if (match = matchers.hsva.exec(color)) {
        return {
          h: match[1],
          s: match[2],
          v: match[3],
          a: match[4]
        };
      }
      if (match = matchers.hex8.exec(color)) {
        return {
          r: parseIntFromHex(match[1]),
          g: parseIntFromHex(match[2]),
          b: parseIntFromHex(match[3]),
          a: convertHexToDecimal(match[4]),
          format: named ? "name" : "hex8"
        };
      }
      if (match = matchers.hex6.exec(color)) {
        return {
          r: parseIntFromHex(match[1]),
          g: parseIntFromHex(match[2]),
          b: parseIntFromHex(match[3]),
          format: named ? "name" : "hex"
        };
      }
      if (match = matchers.hex4.exec(color)) {
        return {
          r: parseIntFromHex(match[1] + "" + match[1]),
          g: parseIntFromHex(match[2] + "" + match[2]),
          b: parseIntFromHex(match[3] + "" + match[3]),
          a: convertHexToDecimal(match[4] + "" + match[4]),
          format: named ? "name" : "hex8"
        };
      }
      if (match = matchers.hex3.exec(color)) {
        return {
          r: parseIntFromHex(match[1] + "" + match[1]),
          g: parseIntFromHex(match[2] + "" + match[2]),
          b: parseIntFromHex(match[3] + "" + match[3]),
          format: named ? "name" : "hex"
        };
      }
      return false;
    }
    function validateWCAG2Parms(parms) {
      var level, size;
      parms = parms || {
        level: "AA",
        size: "small"
      };
      level = (parms.level || "AA").toUpperCase();
      size = (parms.size || "small").toLowerCase();
      if (level !== "AA" && level !== "AAA") {
        level = "AA";
      }
      if (size !== "small" && size !== "large") {
        size = "small";
      }
      return {
        level,
        size
      };
    }
    return tinycolor;
  });
});

// node_modules/tinygradient/index.js
var require_tinygradient = __commonJS((exports, module) => {
  var tinycolor = require_tinycolor();
  var RGBA_MAX = { r: 256, g: 256, b: 256, a: 1 };
  var HSVA_MAX = { h: 360, s: 1, v: 1, a: 1 };
  function stepize(start, end, steps) {
    let step = {};
    for (let k in start) {
      if (start.hasOwnProperty(k)) {
        step[k] = steps === 0 ? 0 : (end[k] - start[k]) / steps;
      }
    }
    return step;
  }
  function interpolate(step, start, i, max) {
    let color = {};
    for (let k in start) {
      if (start.hasOwnProperty(k)) {
        color[k] = step[k] * i + start[k];
        color[k] = color[k] < 0 ? color[k] + max[k] : max[k] !== 1 ? color[k] % max[k] : color[k];
      }
    }
    return color;
  }
  function interpolateRgb(stop1, stop2, steps) {
    const start = stop1.color.toRgb();
    const end = stop2.color.toRgb();
    const step = stepize(start, end, steps);
    let gradient = [stop1.color];
    for (let i = 1;i < steps; i++) {
      const color = interpolate(step, start, i, RGBA_MAX);
      gradient.push(tinycolor(color));
    }
    return gradient;
  }
  function interpolateHsv(stop1, stop2, steps, mode) {
    const start = stop1.color.toHsv();
    const end = stop2.color.toHsv();
    if (start.s === 0 || end.s === 0) {
      return interpolateRgb(stop1, stop2, steps);
    }
    let trigonometric;
    if (typeof mode === "boolean") {
      trigonometric = mode;
    } else {
      const trigShortest = start.h < end.h && end.h - start.h < 180 || start.h > end.h && start.h - end.h > 180;
      trigonometric = mode === "long" && trigShortest || mode === "short" && !trigShortest;
    }
    const step = stepize(start, end, steps);
    let gradient = [stop1.color];
    let diff;
    if (start.h <= end.h && !trigonometric || start.h >= end.h && trigonometric) {
      diff = end.h - start.h;
    } else if (trigonometric) {
      diff = 360 - end.h + start.h;
    } else {
      diff = 360 - start.h + end.h;
    }
    step.h = Math.pow(-1, trigonometric ? 1 : 0) * Math.abs(diff) / steps;
    for (let i = 1;i < steps; i++) {
      const color = interpolate(step, start, i, HSVA_MAX);
      gradient.push(tinycolor(color));
    }
    return gradient;
  }
  function computeSubsteps(stops, steps) {
    const l = stops.length;
    steps = parseInt(steps, 10);
    if (isNaN(steps) || steps < 2) {
      throw new Error("Invalid number of steps (< 2)");
    }
    if (steps < l) {
      throw new Error("Number of steps cannot be inferior to number of stops");
    }
    let substeps = [];
    for (let i = 1;i < l; i++) {
      const step = (steps - 1) * (stops[i].pos - stops[i - 1].pos);
      substeps.push(Math.max(1, Math.round(step)));
    }
    let totalSubsteps = 1;
    for (let n = l - 1;n--; )
      totalSubsteps += substeps[n];
    while (totalSubsteps !== steps) {
      if (totalSubsteps < steps) {
        const min = Math.min.apply(null, substeps);
        substeps[substeps.indexOf(min)]++;
        totalSubsteps++;
      } else {
        const max = Math.max.apply(null, substeps);
        substeps[substeps.indexOf(max)]--;
        totalSubsteps--;
      }
    }
    return substeps;
  }
  function computeAt(stops, pos, method, max) {
    if (pos < 0 || pos > 1) {
      throw new Error("Position must be between 0 and 1");
    }
    let start, end;
    for (let i = 0, l = stops.length;i < l - 1; i++) {
      if (pos >= stops[i].pos && pos < stops[i + 1].pos) {
        start = stops[i];
        end = stops[i + 1];
        break;
      }
    }
    if (!start) {
      start = end = stops[stops.length - 1];
    }
    const step = stepize(start.color[method](), end.color[method](), (end.pos - start.pos) * 100);
    const color = interpolate(step, start.color[method](), (pos - start.pos) * 100, max);
    return tinycolor(color);
  }

  class TinyGradient {
    constructor(stops) {
      if (stops.length < 2) {
        throw new Error("Invalid number of stops (< 2)");
      }
      const havingPositions = stops[0].pos !== undefined;
      let l = stops.length;
      let p = -1;
      let lastColorLess = false;
      this.stops = stops.map((stop, i) => {
        const hasPosition = stop.pos !== undefined;
        if (havingPositions ^ hasPosition) {
          throw new Error("Cannot mix positionned and not posionned color stops");
        }
        if (hasPosition) {
          const hasColor = stop.color !== undefined;
          if (!hasColor && (lastColorLess || i === 0 || i === l - 1)) {
            throw new Error("Cannot define two consecutive position-only stops");
          }
          lastColorLess = !hasColor;
          stop = {
            color: hasColor ? tinycolor(stop.color) : null,
            colorLess: !hasColor,
            pos: stop.pos
          };
          if (stop.pos < 0 || stop.pos > 1) {
            throw new Error("Color stops positions must be between 0 and 1");
          } else if (stop.pos < p) {
            throw new Error("Color stops positions are not ordered");
          }
          p = stop.pos;
        } else {
          stop = {
            color: tinycolor(stop.color !== undefined ? stop.color : stop),
            pos: i / (l - 1)
          };
        }
        return stop;
      });
      if (this.stops[0].pos !== 0) {
        this.stops.unshift({
          color: this.stops[0].color,
          pos: 0
        });
        l++;
      }
      if (this.stops[l - 1].pos !== 1) {
        this.stops.push({
          color: this.stops[l - 1].color,
          pos: 1
        });
      }
    }
    reverse() {
      let stops = [];
      this.stops.forEach(function(stop) {
        stops.push({
          color: stop.color,
          pos: 1 - stop.pos
        });
      });
      return new TinyGradient(stops.reverse());
    }
    loop() {
      let stops1 = [];
      let stops2 = [];
      this.stops.forEach((stop) => {
        stops1.push({
          color: stop.color,
          pos: stop.pos / 2
        });
      });
      this.stops.slice(0, -1).forEach((stop) => {
        stops2.push({
          color: stop.color,
          pos: 1 - stop.pos / 2
        });
      });
      return new TinyGradient(stops1.concat(stops2.reverse()));
    }
    rgb(steps) {
      const substeps = computeSubsteps(this.stops, steps);
      let gradient = [];
      this.stops.forEach((stop, i) => {
        if (stop.colorLess) {
          stop.color = interpolateRgb(this.stops[i - 1], this.stops[i + 1], 2)[1];
        }
      });
      for (let i = 0, l = this.stops.length;i < l - 1; i++) {
        const rgb = interpolateRgb(this.stops[i], this.stops[i + 1], substeps[i]);
        gradient.splice(gradient.length, 0, ...rgb);
      }
      gradient.push(this.stops[this.stops.length - 1].color);
      return gradient;
    }
    hsv(steps, mode) {
      const substeps = computeSubsteps(this.stops, steps);
      let gradient = [];
      this.stops.forEach((stop, i) => {
        if (stop.colorLess) {
          stop.color = interpolateHsv(this.stops[i - 1], this.stops[i + 1], 2, mode)[1];
        }
      });
      for (let i = 0, l = this.stops.length;i < l - 1; i++) {
        const hsv = interpolateHsv(this.stops[i], this.stops[i + 1], substeps[i], mode);
        gradient.splice(gradient.length, 0, ...hsv);
      }
      gradient.push(this.stops[this.stops.length - 1].color);
      return gradient;
    }
    css(mode, direction) {
      mode = mode || "linear";
      direction = direction || (mode === "linear" ? "to right" : "ellipse at center");
      let css = mode + "-gradient(" + direction;
      this.stops.forEach(function(stop) {
        css += ", " + (stop.colorLess ? "" : stop.color.toRgbString() + " ") + stop.pos * 100 + "%";
      });
      css += ")";
      return css;
    }
    rgbAt(pos) {
      return computeAt(this.stops, pos, "toRgb", RGBA_MAX);
    }
    hsvAt(pos) {
      return computeAt(this.stops, pos, "toHsv", HSVA_MAX);
    }
  }
  module.exports = function(stops) {
    if (arguments.length === 1) {
      if (!Array.isArray(arguments[0])) {
        throw new Error('"stops" is not an array');
      }
      stops = arguments[0];
    } else {
      stops = Array.prototype.slice.call(arguments);
    }
    return new TinyGradient(stops);
  };
});

// src/cli.ts
var HELP_TEXT = `termdev (Bun + TS)

Usage:
  termdev [options]

  # or inside this repo:
  bun run termdev -- [options]

Options:
  --host <host>         Chrome remote debugging host (default: 127.0.0.1)
  --port <port>         Chrome remote debugging port (default: 9222)
  --target <query>      Auto-attach to first target whose title/url matches query
  --network             Also show basic Network events
  --poll <ms>           Auto refresh targets every N ms (default: 2000, 0 disables)
  --help, -h            Show help

Chrome launch example:
  # macOS
  open -na "Google Chrome" --args --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-cdp

  # Linux/Windows (conceptually)
  chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-cdp
`;
function parseCli(argv) {
  const opts = {
    host: "127.0.0.1",
    port: 9222,
    network: false,
    pollMs: 2000,
    help: false
  };
  const args = [...argv];
  while (args.length > 0) {
    const cur = args.shift();
    if (!cur)
      break;
    if (cur === "--help" || cur === "-h") {
      opts.help = true;
      continue;
    }
    if (cur === "--network") {
      opts.network = true;
      continue;
    }
    if (cur === "--no-network") {
      opts.network = false;
      continue;
    }
    if (cur === "--poll") {
      const v = args.shift();
      if (!v)
        throw new Error("--poll requires a value");
      const ms = Number(v);
      if (!Number.isFinite(ms) || ms < 0)
        throw new Error(`Invalid --poll: ${v}`);
      opts.pollMs = ms;
      continue;
    }
    if (cur === "--no-poll") {
      opts.pollMs = 0;
      continue;
    }
    if (cur === "--host") {
      const v = args.shift();
      if (!v)
        throw new Error("--host requires a value");
      opts.host = v;
      continue;
    }
    if (cur === "--port") {
      const v = args.shift();
      if (!v)
        throw new Error("--port requires a value");
      const p = Number(v);
      if (!Number.isFinite(p) || p <= 0)
        throw new Error(`Invalid --port: ${v}`);
      opts.port = p;
      continue;
    }
    if (cur === "--target") {
      const v = args.shift();
      if (!v)
        throw new Error("--target requires a value");
      opts.targetQuery = v;
      continue;
    }
    throw new Error(`Unknown argument: ${cur}`);
  }
  return opts;
}

// src/tui.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Text, render, useApp, useInput, useStdout } from "ink";
import TextInput from "ink-text-input";

// node_modules/chalk/source/vendor/ansi-styles/index.js
var ANSI_BACKGROUND_OFFSET = 10;
var wrapAnsi16 = (offset = 0) => (code) => `\x1B[${code + offset}m`;
var wrapAnsi256 = (offset = 0) => (code) => `\x1B[${38 + offset};5;${code}m`;
var wrapAnsi16m = (offset = 0) => (red, green, blue) => `\x1B[${38 + offset};2;${red};${green};${blue}m`;
var styles = {
  modifier: {
    reset: [0, 0],
    bold: [1, 22],
    dim: [2, 22],
    italic: [3, 23],
    underline: [4, 24],
    overline: [53, 55],
    inverse: [7, 27],
    hidden: [8, 28],
    strikethrough: [9, 29]
  },
  color: {
    black: [30, 39],
    red: [31, 39],
    green: [32, 39],
    yellow: [33, 39],
    blue: [34, 39],
    magenta: [35, 39],
    cyan: [36, 39],
    white: [37, 39],
    blackBright: [90, 39],
    gray: [90, 39],
    grey: [90, 39],
    redBright: [91, 39],
    greenBright: [92, 39],
    yellowBright: [93, 39],
    blueBright: [94, 39],
    magentaBright: [95, 39],
    cyanBright: [96, 39],
    whiteBright: [97, 39]
  },
  bgColor: {
    bgBlack: [40, 49],
    bgRed: [41, 49],
    bgGreen: [42, 49],
    bgYellow: [43, 49],
    bgBlue: [44, 49],
    bgMagenta: [45, 49],
    bgCyan: [46, 49],
    bgWhite: [47, 49],
    bgBlackBright: [100, 49],
    bgGray: [100, 49],
    bgGrey: [100, 49],
    bgRedBright: [101, 49],
    bgGreenBright: [102, 49],
    bgYellowBright: [103, 49],
    bgBlueBright: [104, 49],
    bgMagentaBright: [105, 49],
    bgCyanBright: [106, 49],
    bgWhiteBright: [107, 49]
  }
};
var modifierNames = Object.keys(styles.modifier);
var foregroundColorNames = Object.keys(styles.color);
var backgroundColorNames = Object.keys(styles.bgColor);
var colorNames = [...foregroundColorNames, ...backgroundColorNames];
function assembleStyles() {
  const codes = new Map;
  for (const [groupName, group] of Object.entries(styles)) {
    for (const [styleName, style] of Object.entries(group)) {
      styles[styleName] = {
        open: `\x1B[${style[0]}m`,
        close: `\x1B[${style[1]}m`
      };
      group[styleName] = styles[styleName];
      codes.set(style[0], style[1]);
    }
    Object.defineProperty(styles, groupName, {
      value: group,
      enumerable: false
    });
  }
  Object.defineProperty(styles, "codes", {
    value: codes,
    enumerable: false
  });
  styles.color.close = "\x1B[39m";
  styles.bgColor.close = "\x1B[49m";
  styles.color.ansi = wrapAnsi16();
  styles.color.ansi256 = wrapAnsi256();
  styles.color.ansi16m = wrapAnsi16m();
  styles.bgColor.ansi = wrapAnsi16(ANSI_BACKGROUND_OFFSET);
  styles.bgColor.ansi256 = wrapAnsi256(ANSI_BACKGROUND_OFFSET);
  styles.bgColor.ansi16m = wrapAnsi16m(ANSI_BACKGROUND_OFFSET);
  Object.defineProperties(styles, {
    rgbToAnsi256: {
      value(red, green, blue) {
        if (red === green && green === blue) {
          if (red < 8) {
            return 16;
          }
          if (red > 248) {
            return 231;
          }
          return Math.round((red - 8) / 247 * 24) + 232;
        }
        return 16 + 36 * Math.round(red / 255 * 5) + 6 * Math.round(green / 255 * 5) + Math.round(blue / 255 * 5);
      },
      enumerable: false
    },
    hexToRgb: {
      value(hex) {
        const matches = /[a-f\d]{6}|[a-f\d]{3}/i.exec(hex.toString(16));
        if (!matches) {
          return [0, 0, 0];
        }
        let [colorString] = matches;
        if (colorString.length === 3) {
          colorString = [...colorString].map((character) => character + character).join("");
        }
        const integer = Number.parseInt(colorString, 16);
        return [
          integer >> 16 & 255,
          integer >> 8 & 255,
          integer & 255
        ];
      },
      enumerable: false
    },
    hexToAnsi256: {
      value: (hex) => styles.rgbToAnsi256(...styles.hexToRgb(hex)),
      enumerable: false
    },
    ansi256ToAnsi: {
      value(code) {
        if (code < 8) {
          return 30 + code;
        }
        if (code < 16) {
          return 90 + (code - 8);
        }
        let red;
        let green;
        let blue;
        if (code >= 232) {
          red = ((code - 232) * 10 + 8) / 255;
          green = red;
          blue = red;
        } else {
          code -= 16;
          const remainder = code % 36;
          red = Math.floor(code / 36) / 5;
          green = Math.floor(remainder / 6) / 5;
          blue = remainder % 6 / 5;
        }
        const value = Math.max(red, green, blue) * 2;
        if (value === 0) {
          return 30;
        }
        let result = 30 + (Math.round(blue) << 2 | Math.round(green) << 1 | Math.round(red));
        if (value === 2) {
          result += 60;
        }
        return result;
      },
      enumerable: false
    },
    rgbToAnsi: {
      value: (red, green, blue) => styles.ansi256ToAnsi(styles.rgbToAnsi256(red, green, blue)),
      enumerable: false
    },
    hexToAnsi: {
      value: (hex) => styles.ansi256ToAnsi(styles.hexToAnsi256(hex)),
      enumerable: false
    }
  });
  return styles;
}
var ansiStyles = assembleStyles();
var ansi_styles_default = ansiStyles;

// node_modules/chalk/source/vendor/supports-color/index.js
import process2 from "node:process";
import os from "node:os";
import tty from "node:tty";
function hasFlag(flag, argv = globalThis.Deno ? globalThis.Deno.args : process2.argv) {
  const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
  const position = argv.indexOf(prefix + flag);
  const terminatorPosition = argv.indexOf("--");
  return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
}
var { env } = process2;
var flagForceColor;
if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false") || hasFlag("color=never")) {
  flagForceColor = 0;
} else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) {
  flagForceColor = 1;
}
function envForceColor() {
  if ("FORCE_COLOR" in env) {
    if (env.FORCE_COLOR === "true") {
      return 1;
    }
    if (env.FORCE_COLOR === "false") {
      return 0;
    }
    return env.FORCE_COLOR.length === 0 ? 1 : Math.min(Number.parseInt(env.FORCE_COLOR, 10), 3);
  }
}
function translateLevel(level) {
  if (level === 0) {
    return false;
  }
  return {
    level,
    hasBasic: true,
    has256: level >= 2,
    has16m: level >= 3
  };
}
function _supportsColor(haveStream, { streamIsTTY, sniffFlags = true } = {}) {
  const noFlagForceColor = envForceColor();
  if (noFlagForceColor !== undefined) {
    flagForceColor = noFlagForceColor;
  }
  const forceColor = sniffFlags ? flagForceColor : noFlagForceColor;
  if (forceColor === 0) {
    return 0;
  }
  if (sniffFlags) {
    if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) {
      return 3;
    }
    if (hasFlag("color=256")) {
      return 2;
    }
  }
  if ("TF_BUILD" in env && "AGENT_NAME" in env) {
    return 1;
  }
  if (haveStream && !streamIsTTY && forceColor === undefined) {
    return 0;
  }
  const min = forceColor || 0;
  if (env.TERM === "dumb") {
    return min;
  }
  if (process2.platform === "win32") {
    const osRelease = os.release().split(".");
    if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
      return Number(osRelease[2]) >= 14931 ? 3 : 2;
    }
    return 1;
  }
  if ("CI" in env) {
    if (["GITHUB_ACTIONS", "GITEA_ACTIONS", "CIRCLECI"].some((key) => (key in env))) {
      return 3;
    }
    if (["TRAVIS", "APPVEYOR", "GITLAB_CI", "BUILDKITE", "DRONE"].some((sign) => (sign in env)) || env.CI_NAME === "codeship") {
      return 1;
    }
    return min;
  }
  if ("TEAMCITY_VERSION" in env) {
    return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
  }
  if (env.COLORTERM === "truecolor") {
    return 3;
  }
  if (env.TERM === "xterm-kitty") {
    return 3;
  }
  if (env.TERM === "xterm-ghostty") {
    return 3;
  }
  if (env.TERM === "wezterm") {
    return 3;
  }
  if ("TERM_PROGRAM" in env) {
    const version = Number.parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
    switch (env.TERM_PROGRAM) {
      case "iTerm.app": {
        return version >= 3 ? 3 : 2;
      }
      case "Apple_Terminal": {
        return 2;
      }
    }
  }
  if (/-256(color)?$/i.test(env.TERM)) {
    return 2;
  }
  if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
    return 1;
  }
  if ("COLORTERM" in env) {
    return 1;
  }
  return min;
}
function createSupportsColor(stream, options = {}) {
  const level = _supportsColor(stream, {
    streamIsTTY: stream && stream.isTTY,
    ...options
  });
  return translateLevel(level);
}
var supportsColor = {
  stdout: createSupportsColor({ isTTY: tty.isatty(1) }),
  stderr: createSupportsColor({ isTTY: tty.isatty(2) })
};
var supports_color_default = supportsColor;

// node_modules/chalk/source/utilities.js
function stringReplaceAll(string, substring, replacer) {
  let index = string.indexOf(substring);
  if (index === -1) {
    return string;
  }
  const substringLength = substring.length;
  let endIndex = 0;
  let returnValue = "";
  do {
    returnValue += string.slice(endIndex, index) + substring + replacer;
    endIndex = index + substringLength;
    index = string.indexOf(substring, endIndex);
  } while (index !== -1);
  returnValue += string.slice(endIndex);
  return returnValue;
}
function stringEncaseCRLFWithFirstIndex(string, prefix, postfix, index) {
  let endIndex = 0;
  let returnValue = "";
  do {
    const gotCR = string[index - 1] === "\r";
    returnValue += string.slice(endIndex, gotCR ? index - 1 : index) + prefix + (gotCR ? `\r
` : `
`) + postfix;
    endIndex = index + 1;
    index = string.indexOf(`
`, endIndex);
  } while (index !== -1);
  returnValue += string.slice(endIndex);
  return returnValue;
}

// node_modules/chalk/source/index.js
var { stdout: stdoutColor, stderr: stderrColor } = supports_color_default;
var GENERATOR = Symbol("GENERATOR");
var STYLER = Symbol("STYLER");
var IS_EMPTY = Symbol("IS_EMPTY");
var levelMapping = [
  "ansi",
  "ansi",
  "ansi256",
  "ansi16m"
];
var styles2 = Object.create(null);
var applyOptions = (object, options = {}) => {
  if (options.level && !(Number.isInteger(options.level) && options.level >= 0 && options.level <= 3)) {
    throw new Error("The `level` option should be an integer from 0 to 3");
  }
  const colorLevel = stdoutColor ? stdoutColor.level : 0;
  object.level = options.level === undefined ? colorLevel : options.level;
};
var chalkFactory = (options) => {
  const chalk = (...strings) => strings.join(" ");
  applyOptions(chalk, options);
  Object.setPrototypeOf(chalk, createChalk.prototype);
  return chalk;
};
function createChalk(options) {
  return chalkFactory(options);
}
Object.setPrototypeOf(createChalk.prototype, Function.prototype);
for (const [styleName, style] of Object.entries(ansi_styles_default)) {
  styles2[styleName] = {
    get() {
      const builder = createBuilder(this, createStyler(style.open, style.close, this[STYLER]), this[IS_EMPTY]);
      Object.defineProperty(this, styleName, { value: builder });
      return builder;
    }
  };
}
styles2.visible = {
  get() {
    const builder = createBuilder(this, this[STYLER], true);
    Object.defineProperty(this, "visible", { value: builder });
    return builder;
  }
};
var getModelAnsi = (model, level, type, ...arguments_) => {
  if (model === "rgb") {
    if (level === "ansi16m") {
      return ansi_styles_default[type].ansi16m(...arguments_);
    }
    if (level === "ansi256") {
      return ansi_styles_default[type].ansi256(ansi_styles_default.rgbToAnsi256(...arguments_));
    }
    return ansi_styles_default[type].ansi(ansi_styles_default.rgbToAnsi(...arguments_));
  }
  if (model === "hex") {
    return getModelAnsi("rgb", level, type, ...ansi_styles_default.hexToRgb(...arguments_));
  }
  return ansi_styles_default[type][model](...arguments_);
};
var usedModels = ["rgb", "hex", "ansi256"];
for (const model of usedModels) {
  styles2[model] = {
    get() {
      const { level } = this;
      return function(...arguments_) {
        const styler = createStyler(getModelAnsi(model, levelMapping[level], "color", ...arguments_), ansi_styles_default.color.close, this[STYLER]);
        return createBuilder(this, styler, this[IS_EMPTY]);
      };
    }
  };
  const bgModel = "bg" + model[0].toUpperCase() + model.slice(1);
  styles2[bgModel] = {
    get() {
      const { level } = this;
      return function(...arguments_) {
        const styler = createStyler(getModelAnsi(model, levelMapping[level], "bgColor", ...arguments_), ansi_styles_default.bgColor.close, this[STYLER]);
        return createBuilder(this, styler, this[IS_EMPTY]);
      };
    }
  };
}
var proto = Object.defineProperties(() => {}, {
  ...styles2,
  level: {
    enumerable: true,
    get() {
      return this[GENERATOR].level;
    },
    set(level) {
      this[GENERATOR].level = level;
    }
  }
});
var createStyler = (open, close, parent) => {
  let openAll;
  let closeAll;
  if (parent === undefined) {
    openAll = open;
    closeAll = close;
  } else {
    openAll = parent.openAll + open;
    closeAll = close + parent.closeAll;
  }
  return {
    open,
    close,
    openAll,
    closeAll,
    parent
  };
};
var createBuilder = (self2, _styler, _isEmpty) => {
  const builder = (...arguments_) => applyStyle(builder, arguments_.length === 1 ? "" + arguments_[0] : arguments_.join(" "));
  Object.setPrototypeOf(builder, proto);
  builder[GENERATOR] = self2;
  builder[STYLER] = _styler;
  builder[IS_EMPTY] = _isEmpty;
  return builder;
};
var applyStyle = (self2, string) => {
  if (self2.level <= 0 || !string) {
    return self2[IS_EMPTY] ? "" : string;
  }
  let styler = self2[STYLER];
  if (styler === undefined) {
    return string;
  }
  const { openAll, closeAll } = styler;
  if (string.includes("\x1B")) {
    while (styler !== undefined) {
      string = stringReplaceAll(string, styler.close, styler.open);
      styler = styler.parent;
    }
  }
  const lfIndex = string.indexOf(`
`);
  if (lfIndex !== -1) {
    string = stringEncaseCRLFWithFirstIndex(string, closeAll, openAll, lfIndex);
  }
  return openAll + string + closeAll;
};
Object.defineProperties(createChalk.prototype, styles2);
var chalk = createChalk();
var chalkStderr = createChalk({ level: stderrColor ? stderrColor.level : 0 });
var source_default = chalk;

// node_modules/gradient-string/dist/index.js
var import_tinygradient = __toESM(require_tinygradient(), 1);
var gradient = (...colors) => {
  let gradient2;
  let options;
  if (colors.length === 0) {
    throw new Error("Missing gradient colors");
  }
  if (!Array.isArray(colors[0])) {
    if (colors.length === 1) {
      throw new Error(`Expected an array of colors, received ${JSON.stringify(colors[0])}`);
    }
    gradient2 = import_tinygradient.default(...colors);
  } else {
    gradient2 = import_tinygradient.default(colors[0]);
    options = validateOptions(colors[1]);
  }
  const fn = (str, deprecatedOptions) => {
    return applyGradient(str ? str.toString() : "", gradient2, deprecatedOptions ?? options);
  };
  fn.multiline = (str, deprecatedOptions) => multiline(str ? str.toString() : "", gradient2, deprecatedOptions ?? options);
  return fn;
};
var getColors = (gradient2, options, count) => {
  return options.interpolation?.toLowerCase() === "hsv" ? gradient2.hsv(count, options.hsvSpin?.toLowerCase() || false) : gradient2.rgb(count);
};
function applyGradient(str, gradient2, opts) {
  const options = validateOptions(opts);
  const colorsCount = Math.max(str.replace(/\s/g, "").length, gradient2.stops.length);
  const colors = getColors(gradient2, options, colorsCount);
  let result = "";
  for (const s of str) {
    result += s.match(/\s/g) ? s : source_default.hex(colors.shift()?.toHex() || "#000")(s);
  }
  return result;
}
function multiline(str, gradient2, opts) {
  const options = validateOptions(opts);
  const lines = str.split(`
`);
  const maxLength = Math.max(...lines.map((l) => l.length), gradient2.stops.length);
  const colors = getColors(gradient2, options, maxLength);
  const results = [];
  for (const line of lines) {
    const lineColors = colors.slice(0);
    let lineResult = "";
    for (const l of line) {
      lineResult += source_default.hex(lineColors.shift()?.toHex() || "#000")(l);
    }
    results.push(lineResult);
  }
  return results.join(`
`);
}
function validateOptions(opts) {
  const options = { interpolation: "rgb", hsvSpin: "short", ...opts };
  if (opts !== undefined && typeof opts !== "object") {
    throw new TypeError(`Expected \`options\` to be an \`object\`, got \`${typeof opts}\``);
  }
  if (typeof options.interpolation !== "string") {
    throw new TypeError(`Expected \`options.interpolation\` to be \`rgb\` or \`hsv\`, got \`${typeof options.interpolation}\``);
  }
  if (options.interpolation.toLowerCase() === "hsv" && typeof options.hsvSpin !== "string") {
    throw new TypeError(`Expected \`options.hsvSpin\` to be a \`short\` or \`long\`, got \`${typeof options.hsvSpin}\``);
  }
  return options;
}
var aliases = {
  atlas: { colors: ["#feac5e", "#c779d0", "#4bc0c8"], options: {} },
  cristal: { colors: ["#bdfff3", "#4ac29a"], options: {} },
  teen: { colors: ["#77a1d3", "#79cbca", "#e684ae"], options: {} },
  mind: { colors: ["#473b7b", "#3584a7", "#30d2be"], options: {} },
  morning: { colors: ["#ff5f6d", "#ffc371"], options: { interpolation: "hsv" } },
  vice: { colors: ["#5ee7df", "#b490ca"], options: { interpolation: "hsv" } },
  passion: { colors: ["#f43b47", "#453a94"], options: {} },
  fruit: { colors: ["#ff4e50", "#f9d423"], options: {} },
  instagram: { colors: ["#833ab4", "#fd1d1d", "#fcb045"], options: {} },
  retro: {
    colors: ["#3f51b1", "#5a55ae", "#7b5fac", "#8f6aae", "#a86aa4", "#cc6b8e", "#f18271", "#f3a469", "#f7c978"],
    options: {}
  },
  summer: { colors: ["#fdbb2d", "#22c1c3"], options: {} },
  rainbow: { colors: ["#ff0000", "#ff0100"], options: { interpolation: "hsv", hsvSpin: "long" } },
  pastel: { colors: ["#74ebd5", "#74ecd5"], options: { interpolation: "hsv", hsvSpin: "long" } }
};
function gradientAlias(alias) {
  const result = (str) => gradient(...alias.colors)(str, alias.options);
  result.multiline = (str = "") => gradient(...alias.colors).multiline(str, alias.options);
  return result;
}
var dist_default = gradient;
var atlas = gradientAlias(aliases.atlas);
var cristal = gradientAlias(aliases.cristal);
var teen = gradientAlias(aliases.teen);
var mind = gradientAlias(aliases.mind);
var morning = gradientAlias(aliases.morning);
var vice = gradientAlias(aliases.vice);
var passion = gradientAlias(aliases.passion);
var fruit = gradientAlias(aliases.fruit);
var instagram = gradientAlias(aliases.instagram);
var retro = gradientAlias(aliases.retro);
var summer = gradientAlias(aliases.summer);
var rainbow = gradientAlias(aliases.rainbow);
var pastel = gradientAlias(aliases.pastel);
gradient.atlas = atlas;
gradient.cristal = cristal;
gradient.teen = teen;
gradient.mind = mind;
gradient.morning = morning;
gradient.vice = vice;
gradient.passion = passion;
gradient.fruit = fruit;
gradient.instagram = instagram;
gradient.retro = retro;
gradient.summer = summer;
gradient.rainbow = rainbow;
gradient.pastel = pastel;

// src/cdp.ts
import CDPImport from "chrome-remote-interface";
var CDP = CDPImport?.default ?? CDPImport;
async function listTargets(opts) {
  const targets = await CDP.List({ host: opts.host, port: opts.port });
  return targets ?? [];
}
async function connectToTarget(target, opts) {
  const targetOpt = target.webSocketDebuggerUrl ?? target.id;
  return await CDP({ host: opts.host, port: opts.port, target: targetOpt });
}
async function safeCloseClient(client) {
  if (!client)
    return;
  try {
    await client.close();
  } catch {}
}

// src/format.ts
import { inspect } from "node:util";
function toDateFromCdpTimestamp(ts) {
  if (!Number.isFinite(ts))
    return new Date(0);
  const ms = ts > 1000000000000 ? ts : ts * 1000;
  return new Date(ms);
}
function formatTime(ts) {
  const d = toDateFromCdpTimestamp(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}
function formatRemoteObject(obj) {
  if (!obj || typeof obj !== "object")
    return String(obj);
  if (typeof obj.unserializableValue === "string")
    return obj.unserializableValue;
  if ("value" in obj) {
    const v = obj.value;
    if (typeof v === "string")
      return v;
    return inspect(v, {
      depth: 4,
      maxArrayLength: 50,
      breakLength: 120,
      colors: false,
      compact: true
    });
  }
  const className = typeof obj.className === "string" ? obj.className : undefined;
  const description = typeof obj.description === "string" ? obj.description : undefined;
  const preview = obj.preview;
  if (preview && typeof preview === "object") {
    const head = className ?? description ?? (typeof preview.description === "string" ? preview.description : undefined) ?? "Object";
    const body = formatObjectPreview(preview);
    return body ? `${head} ${body}` : head;
  }
  if (className)
    return `#<${className}>`;
  if (description) {
    const m = description.match(/^\[object\s+(.+?)\]$/);
    if (m?.[1])
      return `#<${m[1]}>`;
    return description;
  }
  if (typeof obj.type === "string")
    return `[${obj.type}]`;
  return inspect(obj, { depth: 2, colors: false });
}
function formatObjectPreview(preview) {
  const subtype = typeof preview.subtype === "string" ? preview.subtype : undefined;
  const overflow = Boolean(preview.overflow);
  const props = Array.isArray(preview.properties) ? preview.properties : [];
  const entries = Array.isArray(preview.entries) ? preview.entries : [];
  if (subtype === "array") {
    const items = props.filter((p) => typeof p?.name === "string" && /^\d+$/.test(p.name)).sort((a, b) => Number(a.name) - Number(b.name)).slice(0, 10).map((p) => formatPreviewValue(p));
    const tail2 = overflow ? ", …" : "";
    return `[${items.join(", ")}${tail2}]`;
  }
  if (subtype === "map") {
    const pairs2 = entries.slice(0, 8).map((e) => {
      const k = e?.key ? formatPreviewValue(e.key) : "?";
      const v = e?.value ? formatPreviewValue(e.value) : "?";
      return `${k} => ${v}`;
    });
    const tail2 = overflow ? ", …" : "";
    return `{${pairs2.join(", ")}${tail2}}`;
  }
  if (subtype === "set") {
    const items = entries.slice(0, 8).map((e) => e?.value ? formatPreviewValue(e.value) : "?");
    const tail2 = overflow ? ", …" : "";
    return `{${items.join(", ")}${tail2}}`;
  }
  const pairs = props.slice(0, 12).map((p) => {
    const name = typeof p?.name === "string" ? p.name : "?";
    return `${name}: ${formatPreviewValue(p)}`;
  });
  const tail = overflow ? ", …" : "";
  return `{${pairs.join(", ")}${tail}}`;
}
function formatPreviewValue(p) {
  if (p && typeof p === "object") {
    if (typeof p.value === "string")
      return p.value;
    if (typeof p.description === "string")
      return p.description;
    if (typeof p.type === "string") {
      if (p.type === "function")
        return "ƒ";
      if (p.type === "undefined")
        return "undefined";
      if (p.type === "object")
        return p.subtype ? String(p.subtype) : "Object";
      return p.type;
    }
  }
  return String(p);
}

// src/targets.ts
function pickTargetByQuery(targets, query) {
  const q = query.trim();
  if (!q)
    return { index: -1 };
  const asIndex = Number(q);
  if (Number.isInteger(asIndex) && asIndex >= 0 && asIndex < targets.length) {
    return { target: targets[asIndex], index: asIndex };
  }
  const qLower = q.toLowerCase();
  const idx = targets.findIndex((t) => {
    const title = (t.title ?? "").toLowerCase();
    const url = (t.url ?? "").toLowerCase();
    return title.includes(qLower) || url.includes(qLower);
  });
  return { target: idx >= 0 ? targets[idx] : undefined, index: idx };
}

// src/tui.tsx
import { jsxDEV, Fragment } from "react/jsx-dev-runtime";
var LOG_MAX_LINES = 5000;
var ICONS = {
  logo: "",
  connected: "",
  disconnected: "",
  bullet: "",
  expand: "",
  collapse: "",
  star: "",
  page: "",
  file: "",
  gear: "",
  window: "",
  mobile: "",
  worker: "",
  link: "",
  plug: "",
  search: "",
  zap: "",
  list: "",
  network: "",
  check: "",
  error: "",
  warning: "",
  info: ""
};
var LOGO_ART = `
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   ████████╗███████╗██████╗ ███╗   ███╗██████╗ ███████╗██╗   ██╗║
║   ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██╔══██╗██╔════╝██║   ██║║
║      ██║   █████╗  ██████╔╝██╔████╔██║██║  ██║█████╗  ██║   ██║║
║      ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██║  ██║██╔══╝  ╚██╗ ██╔╝║
║      ██║   ███████╗██║  ██║██║ ╚═╝ ██║██████╔╝███████╗ ╚████╔╝ ║
║      ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═════╝ ╚══════╝  ╚═══╝  ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`;
var LOGO_SUBTITLE = " Terminal DevTools for Chrome DevTools Protocol";
var LOGO_HINT = " Press any key to continue...";
var rainbowGradient = dist_default([
  "#FF6B6B",
  "#FFE66D",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#DDA0DD",
  "#FF6B6B"
]);
var headerGradient = dist_default(["#00D9FF", "#00FF94", "#FFE600"]);
var TARGET_ICONS = {
  page: ICONS.page,
  background_page: ICONS.file,
  service_worker: ICONS.gear,
  iframe: ICONS.window,
  webview: ICONS.mobile,
  worker: ICONS.worker,
  shared_worker: ICONS.link,
  other: ICONS.plug
};
var getTargetIcon = (type) => {
  return TARGET_ICONS[type] ?? TARGET_ICONS.other ?? ICONS.plug;
};
var getTargetColor = (type, selected, attached) => {
  if (attached)
    return "green";
  if (selected)
    return "cyan";
  switch (type) {
    case "page":
      return "white";
    case "service_worker":
      return "yellow";
    case "background_page":
      return "magenta";
    case "iframe":
      return "blue";
    default:
      return;
  }
};
function LogoScreen({
  onDismiss
}) {
  useInput(() => {
    onDismiss();
  });
  const logoLines = LOGO_ART.trim().split(`
`);
  const colors = [
    "#FF6B6B",
    "#FFE66D",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#DDA0DD"
  ];
  const coloredLines = logoLines.map((line, i) => {
    const c1 = colors[i % colors.length];
    const c2 = colors[(i + 1) % colors.length];
    const c3 = colors[(i + 2) % colors.length];
    const lineGradient = dist_default([c1, c2, c3]);
    return lineGradient(line);
  });
  const subtitleColored = dist_default(["#4ECDC4", "#45B7D1", "#96CEB4"])(LOGO_SUBTITLE);
  const hintColored = dist_default(["#888888", "#aaaaaa", "#888888"])(LOGO_HINT);
  return /* @__PURE__ */ jsxDEV(Box, {
    flexDirection: "column",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    children: [
      coloredLines.map((line, i) => /* @__PURE__ */ jsxDEV(Text, {
        children: line
      }, `logo-${i}`, false, undefined, this)),
      /* @__PURE__ */ jsxDEV(Text, {
        children: " "
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV(Text, {
        children: subtitleColored
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV(Text, {
        children: " "
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV(Text, {
        children: hintColored
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
var HEADER_HEIGHT = 1;
var FOOTER_HEIGHT = 1;
var MIN_ROWS = 12;
var TARGET_LINES_PER_ITEM = 2;
function splitLines(s) {
  return String(s).split(`
`);
}
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function useTerminalSizeFallback() {
  const { stdout } = useStdout();
  const rows = stdout?.rows;
  const columns = stdout?.columns;
  return {
    rows: typeof rows === "number" && rows > 0 ? rows : 30,
    columns: typeof columns === "number" && columns > 0 ? columns : 100
  };
}
function truncate(s, max) {
  if (max <= 0)
    return "";
  if (s.length <= max)
    return s;
  if (max === 1)
    return "…";
  return `${s.slice(0, max - 1)}…`;
}
function tryPrettifyJson(body) {
  const trimmed = body.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return { formatted: body, isJson: false };
  }
  try {
    const parsed = JSON.parse(trimmed);
    const pretty = JSON.stringify(parsed, null, 2);
    return { formatted: pretty, isJson: true };
  } catch {
    return { formatted: body, isJson: false };
  }
}
function formatResponseBody(body, base64Encoded) {
  if (base64Encoded) {
    const preview = body.length > 100 ? body.slice(0, 100) + "..." : body;
    return { lines: [preview], typeHint: "(base64 encoded)" };
  }
  const { formatted, isJson } = tryPrettifyJson(body);
  const lines = splitLines(formatted);
  const typeHint = isJson ? "(json, formatted)" : "(text)";
  return { lines, typeHint };
}
function classifyLogLine(line) {
  const l = line.toLowerCase();
  if (l.includes("exception") || l.includes("console.error") || l.includes("log.error"))
    return { color: "red" };
  if (l.includes("warn") || l.includes("warning") || l.includes("console.warn") || l.includes("log.warning")) {
    return { color: "yellow" };
  }
  if (l.startsWith("[eval]"))
    return { color: "green" };
  if (l.startsWith("eval>") || l.startsWith("[eval]"))
    return { color: "green" };
  if (l.includes("[props]"))
    return { color: "cyan" };
  if (l.includes("net.request"))
    return { color: "cyan", dim: true };
  if (l.includes("net.response"))
    return { color: "cyan", dim: true };
  if (l.startsWith("[hint]"))
    return { color: "magenta" };
  if (l.startsWith("[attached]") || l.startsWith("[transport]"))
    return { color: "green" };
  const trimmed = line.trimStart();
  if (/^"[^"]+"\s*:/.test(trimmed))
    return { color: "cyan" };
  if (/^\s*(null|true|false|-?\d+\.?\d*)\s*,?\s*$/.test(trimmed))
    return { color: "yellow" };
  return { dim: false };
}
function isObjectExpandable(obj) {
  return Boolean(obj && typeof obj === "object" && typeof obj.objectId === "string" && obj.objectId.length > 0);
}
function flattenLogTree(nodes, parentId = null, indent = 0) {
  const out = [];
  for (const n of nodes) {
    const expandable = n.kind === "entry" ? Array.isArray(n.args) && n.args.length > 0 || Array.isArray(n.children) && n.children.length > 0 || Boolean(n.loading) : n.kind === "arg" ? isObjectExpandable(n.object) : n.kind === "prop" ? isObjectExpandable(n.value) : false;
    const expanded = Boolean(n.expanded);
    const text = (() => {
      if (n.kind === "text")
        return n.text ?? "";
      if (n.kind === "meta")
        return n.text ?? "";
      if (n.kind === "entry") {
        const label = n.label ?? "";
        const args = Array.isArray(n.args) ? n.args : [];
        const preview = args.map(formatRemoteObject).join(" ");
        return preview ? `${label} ${preview}` : label;
      }
      if (n.kind === "arg") {
        const obj = n.object;
        return obj ? formatRemoteObject(obj) : "";
      }
      if (n.kind === "prop") {
        const name = n.name ?? "?";
        const v = n.value;
        return `${name}: ${v ? formatRemoteObject(v) : "undefined"}`;
      }
      return n.text ?? "";
    })();
    out.push({ nodeId: n.id, parentId, indent, text, expandable, expanded });
    if (expanded && Array.isArray(n.children) && n.children.length > 0) {
      out.push(...flattenLogTree(n.children, n.id, indent + 1));
    }
  }
  return out;
}
function updateNodeById(nodes, id, updater) {
  let changed = false;
  const next = nodes.map((n) => {
    if (n.id === id) {
      changed = true;
      return updater(n);
    }
    if (n.children && n.children.length > 0) {
      const updatedChildren = updateNodeById(n.children, id, updater);
      if (updatedChildren !== n.children) {
        changed = true;
        return { ...n, children: updatedChildren };
      }
    }
    return n;
  });
  return changed ? next : nodes;
}
function findNodeById(nodes, id) {
  for (const n of nodes) {
    if (n.id === id)
      return n;
    if (n.children) {
      const found = findNodeById(n.children, id);
      if (found)
        return found;
    }
  }
  return;
}
function serializeNodeDeep(node, indent = 0) {
  const pad = "  ".repeat(indent);
  const line = (() => {
    if (node.kind === "text" || node.kind === "meta")
      return `${pad}${node.text ?? ""}`.trimEnd();
    if (node.kind === "entry") {
      const label = node.label ?? "";
      const args = Array.isArray(node.args) ? node.args : [];
      const preview = args.map(formatRemoteObject).join(" ");
      return `${pad}${preview ? `${label} ${preview}`.trimEnd() : label}`.trimEnd();
    }
    if (node.kind === "arg") {
      return `${pad}${node.object ? formatRemoteObject(node.object) : ""}`.trimEnd();
    }
    if (node.kind === "prop") {
      const name = node.name ?? "?";
      return `${pad}${name}: ${node.value ? formatRemoteObject(node.value) : "undefined"}`.trimEnd();
    }
    return `${pad}${node.text ?? ""}`.trimEnd();
  })();
  const out = [line];
  const children = Array.isArray(node.children) ? node.children : [];
  for (const c of children)
    out.push(...serializeNodeDeep(c, indent + 1));
  return out;
}
function serializeBodyOnly(node) {
  if (node.kind === "meta") {
    return [];
  }
  if (node.kind === "text") {
    return [node.text ?? ""];
  }
  if (node.kind === "entry" && node.net?.role === "body") {
    const children2 = Array.isArray(node.children) ? node.children : [];
    const out2 = [];
    for (const c of children2) {
      out2.push(...serializeBodyOnly(c));
    }
    return out2;
  }
  const children = Array.isArray(node.children) ? node.children : [];
  const out = [];
  for (const c of children) {
    out.push(...serializeBodyOnly(c));
  }
  return out;
}
async function copyToClipboard(text) {
  const trimmed = text.replace(/\s+$/g, "") + `
`;
  try {
    const { spawn } = await import("child_process");
    const runClipboard = (args) => {
      return new Promise((resolve) => {
        const cmd = args[0];
        if (!cmd) {
          resolve(false);
          return;
        }
        const proc = spawn(cmd, args.slice(1), {
          stdio: ["pipe", "ignore", "ignore"]
        });
        if (proc.stdin) {
          proc.stdin.write(trimmed);
          proc.stdin.end();
        }
        proc.on("close", (code) => {
          resolve(code === 0);
        });
        proc.on("error", () => {
          resolve(false);
        });
      });
    };
    if (process.platform === "darwin") {
      const result = await runClipboard(["pbcopy"]);
      if (result)
        return true;
    }
    const wlResult = await runClipboard(["wl-copy"]);
    if (wlResult)
      return true;
    const xclipResult = await runClipboard([
      "xclip",
      "-selection",
      "clipboard"
    ]);
    if (xclipResult)
      return true;
  } catch {}
  return false;
}
function App({ opts }) {
  const { exit } = useApp();
  const { rows, columns } = useTerminalSizeFallback();
  const safeRows = Math.max(MIN_ROWS, rows);
  const [showLogo, setShowLogo] = useState(true);
  const [host, setHost] = useState(opts.host);
  const [port] = useState(opts.port);
  const [targets, setTargets] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [attachedIndex, setAttachedIndex] = useState(null);
  const [status, setStatus] = useState(`connecting to ${opts.host}:${opts.port}...`);
  const [focus, setFocus] = useState("targets");
  const [rightTab, setRightTab] = useState("logs");
  const [logTree, setLogTree] = useState([]);
  const [followTail, setFollowTail] = useState(true);
  const [logScrollTop, setLogScrollTop] = useState(0);
  const [selectedLogNodeId, setSelectedLogNodeId] = useState(null);
  const [netTree, setNetTree] = useState([]);
  const [followNetTail, setFollowNetTail] = useState(true);
  const [netScrollTop, setNetScrollTop] = useState(0);
  const [selectedNetNodeId, setSelectedNetNodeId] = useState(null);
  const [netSearchOpen, setNetSearchOpen] = useState(false);
  const [netSearchQuery, setNetSearchQuery] = useState("");
  const [targetScrollTop, setTargetScrollTop] = useState(0);
  const [evalOpen, setEvalOpen] = useState(false);
  const [evalText, setEvalText] = useState("");
  const clientRef = useRef(null);
  const hasShownConnectHelpRef = useRef(false);
  const isAttachingRef = useRef(false);
  const lastFetchErrorRef = useRef(null);
  const isExpandingRef = useRef(false);
  const selectedTargetIdRef = useRef(null);
  const attachedTargetIdRef = useRef(null);
  const nextNodeIdRef = useRef(0);
  const newNodeId = () => `n${++nextNodeIdRef.current}`;
  useEffect(() => {
    selectedTargetIdRef.current = targets[selectedIndex]?.id ?? null;
  }, [targets, selectedIndex]);
  useEffect(() => {
    attachedTargetIdRef.current = attachedIndex == null ? null : targets[attachedIndex]?.id ?? null;
  }, [targets, attachedIndex]);
  const mainHeight = Math.max(1, safeRows - HEADER_HEIGHT - FOOTER_HEIGHT);
  const panelInnerHeight = Math.max(3, mainHeight - 2);
  const rightReserved = evalOpen || netSearchOpen ? 2 : 1;
  const visibleLogLines = Math.max(3, panelInnerHeight - 1 - rightReserved);
  const visibleTargetItems = Math.max(1, Math.floor((panelInnerHeight - 1) / TARGET_LINES_PER_ITEM));
  const flatLogs = useMemo(() => flattenLogTree(logTree), [logTree]);
  const filteredNetTree = useMemo(() => {
    const q = netSearchQuery.trim().toLowerCase();
    if (!q)
      return netTree;
    return netTree.filter((n) => {
      const hay = `${n.label ?? ""} ${n.text ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [netTree, netSearchQuery]);
  const flatNet = useMemo(() => flattenLogTree(filteredNetTree), [filteredNetTree]);
  const selectedLogIndex = useMemo(() => {
    if (!flatLogs.length)
      return -1;
    if (!selectedLogNodeId)
      return flatLogs.length - 1;
    const idx = flatLogs.findIndex((l) => l.nodeId === selectedLogNodeId);
    return idx >= 0 ? idx : flatLogs.length - 1;
  }, [flatLogs, selectedLogNodeId]);
  const selectedNetIndex = useMemo(() => {
    if (!flatNet.length)
      return -1;
    if (!selectedNetNodeId)
      return flatNet.length - 1;
    const idx = flatNet.findIndex((l) => l.nodeId === selectedNetNodeId);
    return idx >= 0 ? idx : flatNet.length - 1;
  }, [flatNet, selectedNetNodeId]);
  useEffect(() => {
    if (!flatLogs.length) {
      setSelectedLogNodeId(null);
      setLogScrollTop(0);
      return;
    }
    if (!selectedLogNodeId) {
      setSelectedLogNodeId(flatLogs[flatLogs.length - 1]?.nodeId ?? null);
    }
    if (followTail) {
      setSelectedLogNodeId(flatLogs[flatLogs.length - 1]?.nodeId ?? null);
      setLogScrollTop(Math.max(0, flatLogs.length - visibleLogLines));
      return;
    }
    setLogScrollTop((top) => clamp(top, 0, Math.max(0, flatLogs.length - visibleLogLines)));
  }, [flatLogs.length, followTail, visibleLogLines]);
  useEffect(() => {
    if (!flatNet.length) {
      setSelectedNetNodeId(null);
      setNetScrollTop(0);
      return;
    }
    if (!selectedNetNodeId) {
      setSelectedNetNodeId(flatNet[flatNet.length - 1]?.nodeId ?? null);
    }
    if (followNetTail) {
      setSelectedNetNodeId(flatNet[flatNet.length - 1]?.nodeId ?? null);
      setNetScrollTop(Math.max(0, flatNet.length - visibleLogLines));
      return;
    }
    setNetScrollTop((top) => clamp(top, 0, Math.max(0, flatNet.length - visibleLogLines)));
  }, [flatNet.length, followNetTail, visibleLogLines]);
  useEffect(() => {
    if (netSearchQuery.trim())
      setFollowNetTail(false);
  }, [netSearchQuery]);
  useEffect(() => {
    if (focus !== "right" || rightTab !== "logs")
      return;
    if (!flatLogs.length)
      return;
    if (selectedLogIndex < 0)
      return;
    setLogScrollTop((top) => {
      const maxTop = Math.max(0, flatLogs.length - visibleLogLines);
      let nextTop = clamp(top, 0, maxTop);
      if (selectedLogIndex < nextTop)
        nextTop = selectedLogIndex;
      if (selectedLogIndex >= nextTop + visibleLogLines)
        nextTop = selectedLogIndex - visibleLogLines + 1;
      return nextTop;
    });
  }, [focus, selectedLogIndex, flatLogs.length, visibleLogLines]);
  useEffect(() => {
    if (focus !== "right" || rightTab !== "network")
      return;
    if (!flatNet.length)
      return;
    if (selectedNetIndex < 0)
      return;
    setNetScrollTop((top) => {
      const maxTop = Math.max(0, flatNet.length - visibleLogLines);
      let nextTop = clamp(top, 0, maxTop);
      if (selectedNetIndex < nextTop)
        nextTop = selectedNetIndex;
      if (selectedNetIndex >= nextTop + visibleLogLines)
        nextTop = selectedNetIndex - visibleLogLines + 1;
      return nextTop;
    });
  }, [focus, rightTab, selectedNetIndex, flatNet.length, visibleLogLines]);
  const appendTextLog = (line) => {
    const newLines = splitLines(line);
    setLogTree((prev) => {
      const next = prev.concat(newLines.map((t) => ({
        id: newNodeId(),
        kind: "text",
        text: t
      })));
      if (next.length > LOG_MAX_LINES)
        return next.slice(next.length - LOG_MAX_LINES);
      return next;
    });
  };
  const appendEntryLog = (label, args = [], timestamp) => {
    setLogTree((prev) => {
      const next = prev.concat([
        {
          id: newNodeId(),
          kind: "entry",
          label,
          args,
          timestamp,
          expanded: false
        }
      ]);
      if (next.length > LOG_MAX_LINES)
        return next.slice(next.length - LOG_MAX_LINES);
      return next;
    });
  };
  const clearLogs = () => {
    setLogTree([]);
    setSelectedLogNodeId(null);
    setLogScrollTop(0);
    setFollowTail(true);
  };
  const clearNetwork = () => {
    setNetTree([]);
    netByIdRef.current.clear();
    setSelectedNetNodeId(null);
    setNetScrollTop(0);
    setFollowNetTail(true);
    setNetSearchQuery("");
  };
  const netByIdRef = useRef(new Map);
  const upsertNet = (rid, patch) => {
    const prev = netByIdRef.current.get(rid) ?? { requestId: rid };
    netByIdRef.current.set(rid, { ...prev, ...patch });
  };
  const getNetLabel = (rid) => {
    const r = netByIdRef.current.get(rid);
    const time = formatTime(r?.startTimestamp ?? Date.now());
    const method = r?.method ?? "";
    const url = r?.url ?? "";
    const status2 = typeof r?.status === "number" ? r.status : undefined;
    const tail = r?.errorText ? ` ✖ ${r.errorText}` : status2 != null ? ` ${status2}` : "";
    return `[${time}] ${method} ${url}${tail}`.trimEnd();
  };
  const setNetNode = (rid, updater) => {
    const id = `net:${rid}`;
    setNetTree((prev) => updateNodeById(prev, id, updater));
  };
  const ensureNetRequestNode = (rid) => {
    setNetTree((prev) => {
      const id = `net:${rid}`;
      if (findNodeById(prev, id)) {
        return updateNodeById(prev, id, (n) => ({
          ...n,
          label: getNetLabel(rid)
        }));
      }
      const next = prev.concat([
        {
          id,
          kind: "entry",
          label: getNetLabel(rid),
          expanded: false,
          net: { requestId: rid, role: "request" }
        }
      ]);
      const NET_MAX = 1500;
      return next.length > NET_MAX ? next.slice(next.length - NET_MAX) : next;
    });
  };
  const buildHeadersChildren = (headers) => {
    const entries = Object.entries(headers ?? {});
    entries.sort((a, b) => a[0].localeCompare(b[0]));
    const LIMIT = 120;
    const sliced = entries.slice(0, LIMIT);
    const children = sliced.map(([k, v]) => ({
      id: newNodeId(),
      kind: "text",
      text: `${k}: ${v}`
    }));
    if (entries.length > LIMIT) {
      children.push({
        id: newNodeId(),
        kind: "meta",
        text: `… (${entries.length - LIMIT} more headers)`
      });
    }
    if (children.length === 0)
      children.push({
        id: newNodeId(),
        kind: "meta",
        text: "(no headers)"
      });
    return children;
  };
  const buildNetChildren = (rid) => {
    const r = netByIdRef.current.get(rid);
    const meta = [];
    if (r?.type)
      meta.push({
        id: newNodeId(),
        kind: "text",
        text: `type: ${r.type}`
      });
    if (r?.initiator)
      meta.push({
        id: newNodeId(),
        kind: "text",
        text: `initiator: ${r.initiator}`
      });
    if (typeof r?.encodedDataLength === "number")
      meta.push({
        id: newNodeId(),
        kind: "text",
        text: `bytes: ${r.encodedDataLength}`
      });
    const reqHeadersNode = {
      id: `net:${rid}:reqHeaders`,
      kind: "entry",
      label: `Request Headers (${Object.keys(r?.requestHeaders ?? {}).length})`,
      expanded: false,
      children: buildHeadersChildren(r?.requestHeaders),
      net: { requestId: rid, role: "headers", which: "request" }
    };
    const resLineParts = [];
    if (typeof r?.status === "number")
      resLineParts.push(String(r.status));
    if (r?.statusText)
      resLineParts.push(r.statusText);
    if (r?.mimeType)
      resLineParts.push(r.mimeType);
    const resMeta = [];
    if (r?.protocol)
      resMeta.push({
        id: newNodeId(),
        kind: "text",
        text: `protocol: ${r.protocol}`
      });
    if (r?.remoteIPAddress) {
      const port2 = typeof r.remotePort === "number" ? `:${r.remotePort}` : "";
      resMeta.push({
        id: newNodeId(),
        kind: "text",
        text: `remote: ${r.remoteIPAddress}${port2}`
      });
    }
    if (r?.fromDiskCache)
      resMeta.push({
        id: newNodeId(),
        kind: "text",
        text: `fromDiskCache: true`
      });
    if (r?.fromServiceWorker)
      resMeta.push({
        id: newNodeId(),
        kind: "text",
        text: `fromServiceWorker: true`
      });
    const resHeadersNode = {
      id: `net:${rid}:resHeaders`,
      kind: "entry",
      label: `Response Headers (${Object.keys(r?.responseHeaders ?? {}).length})`,
      expanded: false,
      children: buildHeadersChildren(r?.responseHeaders),
      net: { requestId: rid, role: "headers", which: "response" }
    };
    const bodyNode = {
      id: `net:${rid}:body`,
      kind: "entry",
      label: "Response Body",
      expanded: false,
      children: [
        { id: newNodeId(), kind: "meta", text: "(press z to load)" }
      ],
      net: { requestId: rid, role: "body" }
    };
    const responseNode = {
      id: `net:${rid}:response`,
      kind: "entry",
      label: `Response${resLineParts.length ? `: ${resLineParts.join(" ")}` : ""}`,
      expanded: false,
      children: [resHeadersNode, ...resMeta, bodyNode],
      net: { requestId: rid, role: "response" }
    };
    const reqBodyNode = {
      id: `net:${rid}:reqBody`,
      kind: "entry",
      label: "Request Body",
      expanded: false,
      children: [
        { id: newNodeId(), kind: "meta", text: "(press z to view)" }
      ],
      net: { requestId: rid, role: "body", which: "request" }
    };
    const reqMeta = [];
    if (r?.postData) {
      reqMeta.push(reqBodyNode);
    }
    return [...meta, reqHeadersNode, ...reqMeta, responseNode];
  };
  const loadResponseBody = async (rid) => {
    const c = clientRef.current;
    const Network = c?.Network;
    if (!Network?.getResponseBody)
      throw new Error("Network.getResponseBody is not available (not attached?)");
    const res = await Network.getResponseBody({ requestId: rid });
    return {
      body: String(res?.body ?? ""),
      base64Encoded: Boolean(res?.base64Encoded)
    };
  };
  const ensureEntryChildren = (node) => {
    if (node.kind !== "entry")
      return node;
    if (node.children && node.children.length > 0)
      return node;
    const args = Array.isArray(node.args) ? node.args : [];
    const children = args.map((obj, i) => ({
      id: `${node.id}:arg:${i}`,
      kind: "arg",
      object: obj,
      expanded: false
    }));
    return { ...node, children };
  };
  const ensureObjectChildrenLoading = (nodeId) => {
    setLogTree((prev) => updateNodeById(prev, nodeId, (n) => {
      if (n.kind !== "arg" && n.kind !== "prop")
        return n;
      if (n.loading)
        return n;
      const obj = n.kind === "arg" ? n.object : n.value;
      if (!isObjectExpandable(obj))
        return n;
      return {
        ...n,
        loading: true,
        children: [
          {
            id: newNodeId(),
            kind: "meta",
            text: "(loading properties...)"
          }
        ]
      };
    }));
  };
  const setObjectChildren = (nodeId, children) => {
    setLogTree((prev) => updateNodeById(prev, nodeId, (n) => ({
      ...n,
      loading: false,
      children
    })));
  };
  const loadPropertiesForObjectId = async (objectId) => {
    const c = clientRef.current;
    const Runtime = c?.Runtime;
    if (!Runtime?.getProperties)
      throw new Error("Runtime.getProperties is not available (not attached?)");
    const res = await Runtime.getProperties({
      objectId,
      ownProperties: true,
      accessorPropertiesOnly: false,
      generatePreview: true
    });
    const list = Array.isArray(res?.result) ? res.result : [];
    const items = list.filter((p) => p && typeof p.name === "string" && p.value).map((p) => ({
      name: String(p.name),
      value: p.value,
      enumerable: Boolean(p.enumerable)
    }));
    items.sort((a, b) => Number(b.enumerable) - Number(a.enumerable) || a.name.localeCompare(b.name));
    const LIMIT = 80;
    const sliced = items.slice(0, LIMIT);
    const children = sliced.map((it) => ({
      id: newNodeId(),
      kind: "prop",
      name: it.name,
      value: it.value,
      expanded: false
    }));
    if (items.length > LIMIT) {
      children.push({
        id: newNodeId(),
        kind: "meta",
        text: `… (${items.length - LIMIT} more properties)`
      });
    }
    return children;
  };
  const toggleExpandSelected = async () => {
    if (isExpandingRef.current)
      return;
    if (!flatLogs.length)
      return;
    const nodeId = selectedLogNodeId ?? flatLogs[flatLogs.length - 1]?.nodeId;
    if (!nodeId)
      return;
    const node = findNodeById(logTree, nodeId);
    if (!node)
      return;
    const expandable = node.kind === "entry" ? Array.isArray(node.args) && node.args.length > 0 : node.kind === "arg" ? isObjectExpandable(node.object) : node.kind === "prop" ? isObjectExpandable(node.value) : false;
    if (!expandable)
      return;
    const nextExpanded = !Boolean(node.expanded);
    if (node.kind === "entry") {
      const args = Array.isArray(node.args) ? node.args : [];
      const firstArg = args[0];
      const autoExpandArg0 = nextExpanded && args.length === 1 && isObjectExpandable(firstArg);
      const arg0 = autoExpandArg0 ? firstArg : null;
      const arg0Id = autoExpandArg0 ? `${nodeId}:arg:0` : null;
      setLogTree((prev) => updateNodeById(prev, nodeId, (n) => {
        const ensured = ensureEntryChildren(n);
        if (!autoExpandArg0)
          return { ...ensured, expanded: nextExpanded };
        const children = Array.isArray(ensured.children) ? ensured.children : [];
        const first = children[0];
        const rest = children.slice(1);
        const updatedFirst = first ? {
          ...first,
          expanded: true,
          loading: true,
          children: [
            {
              id: newNodeId(),
              kind: "meta",
              text: "(loading properties...)"
            }
          ]
        } : first;
        return {
          ...ensured,
          expanded: nextExpanded,
          children: updatedFirst ? [updatedFirst, ...rest] : children
        };
      }));
      if (autoExpandArg0 && arg0 && arg0Id) {
        isExpandingRef.current = true;
        try {
          const children = await loadPropertiesForObjectId(arg0.objectId);
          setObjectChildren(arg0Id, children);
        } catch (err) {
          setObjectChildren(arg0Id, [
            {
              id: newNodeId(),
              kind: "meta",
              text: `[props] ! ${String(err)}`
            }
          ]);
        } finally {
          isExpandingRef.current = false;
        }
      }
      return;
    }
    setLogTree((prev) => updateNodeById(prev, nodeId, (n) => ({ ...n, expanded: nextExpanded })));
    if (!nextExpanded)
      return;
    const obj = node.kind === "arg" ? node.object : node.value;
    if (!isObjectExpandable(obj))
      return;
    if (Array.isArray(node.children) && node.children.length > 0 && !node.loading)
      return;
    isExpandingRef.current = true;
    try {
      ensureObjectChildrenLoading(nodeId);
      const children = await loadPropertiesForObjectId(obj.objectId);
      setObjectChildren(nodeId, children);
    } catch (err) {
      setObjectChildren(nodeId, [
        {
          id: newNodeId(),
          kind: "meta",
          text: `[props] ! ${String(err)}`
        }
      ]);
    } finally {
      isExpandingRef.current = false;
    }
  };
  const collapseSelectedRegion = () => {
    if (!flatLogs.length)
      return;
    const currentId = selectedLogNodeId ?? flatLogs[flatLogs.length - 1]?.nodeId;
    if (!currentId)
      return;
    const current = findNodeById(logTree, currentId);
    if (current?.expanded) {
      setLogTree((prev) => updateNodeById(prev, currentId, (n) => ({ ...n, expanded: false })));
      return;
    }
    const flatIndex = flatLogs.findIndex((l) => l.nodeId === currentId);
    if (flatIndex < 0)
      return;
    let parentId = flatLogs[flatIndex]?.parentId ?? null;
    while (parentId) {
      const parentNode = findNodeById(logTree, parentId);
      if (parentNode?.expanded) {
        const pid = parentId;
        setSelectedLogNodeId(pid);
        setLogTree((prev) => updateNodeById(prev, pid, (n) => ({ ...n, expanded: false })));
        return;
      }
      const parentFlatIndex = flatLogs.findIndex((l) => l.nodeId === parentId);
      parentId = parentFlatIndex >= 0 ? flatLogs[parentFlatIndex].parentId : null;
    }
  };
  const toggleNetExpandSelected = async () => {
    if (isExpandingRef.current)
      return;
    if (!flatNet.length)
      return;
    const nodeId = selectedNetNodeId ?? flatNet[flatNet.length - 1]?.nodeId;
    if (!nodeId)
      return;
    const node = findNodeById(netTree, nodeId);
    if (!node)
      return;
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const expandable = node.kind === "entry" ? hasChildren || Boolean(node.net) : false;
    if (!expandable)
      return;
    const nextExpanded = !Boolean(node.expanded);
    if (node.net?.role === "request") {
      const rid = node.net.requestId;
      setNetTree((prev) => updateNodeById(prev, nodeId, (n) => {
        const already = Array.isArray(n.children) && n.children.length > 0;
        const children = already ? n.children : buildNetChildren(rid);
        return { ...n, expanded: nextExpanded, children };
      }));
      return;
    }
    if (node.net?.role === "body" && node.net?.which === "request") {
      const rid = node.net.requestId;
      setNetTree((prev) => updateNodeById(prev, nodeId, (n) => ({ ...n, expanded: nextExpanded })));
      if (!nextExpanded)
        return;
      const record = netByIdRef.current.get(rid);
      if (record?.postData) {
        const { lines, typeHint } = formatResponseBody(record.postData, false);
        const LIMIT = 300;
        const sliced = lines.slice(0, LIMIT);
        const children = [
          { id: newNodeId(), kind: "meta", text: typeHint },
          ...sliced.map((t) => ({
            id: newNodeId(),
            kind: "text",
            text: t
          }))
        ];
        if (lines.length > LIMIT) {
          children.push({
            id: newNodeId(),
            kind: "meta",
            text: `… (${lines.length - LIMIT} more lines)`
          });
        }
        setNetTree((prev) => updateNodeById(prev, nodeId, (n) => ({ ...n, children })));
        return;
      }
      return;
    }
    if (node.net?.role === "body") {
      const rid = node.net.requestId;
      setNetTree((prev) => updateNodeById(prev, nodeId, (n) => ({ ...n, expanded: nextExpanded })));
      if (!nextExpanded)
        return;
      const record = netByIdRef.current.get(rid);
      if (record?.responseBody) {
        const rb = record.responseBody;
        const { lines, typeHint } = formatResponseBody(rb.body, rb.base64Encoded);
        const LIMIT = 300;
        const sliced = lines.slice(0, LIMIT);
        const children = [
          { id: newNodeId(), kind: "meta", text: typeHint },
          ...sliced.map((t) => ({
            id: newNodeId(),
            kind: "text",
            text: t
          }))
        ];
        if (lines.length > LIMIT) {
          children.push({
            id: newNodeId(),
            kind: "meta",
            text: `… (${lines.length - LIMIT} more lines)`
          });
        }
        setNetTree((prev) => updateNodeById(prev, nodeId, (n) => ({ ...n, children })));
        return;
      }
      isExpandingRef.current = true;
      setNetTree((prev) => updateNodeById(prev, nodeId, (n) => ({
        ...n,
        loading: true,
        children: [
          {
            id: newNodeId(),
            kind: "meta",
            text: "(loading response body...)"
          }
        ]
      })));
      try {
        const body = await loadResponseBody(rid);
        upsertNet(rid, { responseBody: body });
        const { lines, typeHint } = formatResponseBody(body.body, body.base64Encoded);
        const LIMIT = 300;
        const sliced = lines.slice(0, LIMIT);
        const children = [
          { id: newNodeId(), kind: "meta", text: typeHint },
          ...sliced.map((t) => ({
            id: newNodeId(),
            kind: "text",
            text: t
          }))
        ];
        if (lines.length > LIMIT) {
          children.push({
            id: newNodeId(),
            kind: "meta",
            text: `… (${lines.length - LIMIT} more lines)`
          });
        }
        setNetTree((prev) => updateNodeById(prev, nodeId, (n) => ({
          ...n,
          loading: false,
          children
        })));
      } catch (err) {
        setNetTree((prev) => updateNodeById(prev, nodeId, (n) => ({
          ...n,
          loading: false,
          children: [
            {
              id: newNodeId(),
              kind: "meta",
              text: `[body] ! ${String(err)}`
            }
          ]
        })));
      } finally {
        isExpandingRef.current = false;
      }
      return;
    }
    setNetTree((prev) => updateNodeById(prev, nodeId, (n) => ({ ...n, expanded: nextExpanded })));
  };
  const collapseNetSelectedRegion = () => {
    if (!flatNet.length)
      return;
    const currentId = selectedNetNodeId ?? flatNet[flatNet.length - 1]?.nodeId;
    if (!currentId)
      return;
    const current = findNodeById(netTree, currentId);
    if (current?.expanded) {
      setNetTree((prev) => updateNodeById(prev, currentId, (n) => ({ ...n, expanded: false })));
      return;
    }
    const flatIndex = flatNet.findIndex((l) => l.nodeId === currentId);
    if (flatIndex < 0)
      return;
    let parentId = flatNet[flatIndex]?.parentId ?? null;
    while (parentId) {
      const parentNode = findNodeById(netTree, parentId);
      if (parentNode?.expanded) {
        const pid = parentId;
        setSelectedNetNodeId(pid);
        setNetTree((prev) => updateNodeById(prev, pid, (n) => ({ ...n, expanded: false })));
        return;
      }
      const parentFlatIndex = flatNet.findIndex((l) => l.nodeId === parentId);
      parentId = parentFlatIndex >= 0 ? flatNet[parentFlatIndex].parentId : null;
    }
  };
  const refreshTargets = async (preferIndex) => {
    setStatus(`fetching targets from ${host}:${port} ...`);
    const fetch = async (h) => {
      return await listTargets({ host: h, port });
    };
    try {
      const t = await fetch(host);
      setTargets(t);
      const prevSelectedId = selectedTargetIdRef.current;
      const prevAttachedId = attachedTargetIdRef.current;
      const selectedById = prevSelectedId != null ? t.findIndex((x) => x.id === prevSelectedId) : -1;
      const attachedById = prevAttachedId != null ? t.findIndex((x) => x.id === prevAttachedId) : -1;
      const idxRaw = selectedById >= 0 ? selectedById : typeof preferIndex === "number" ? preferIndex : selectedIndex;
      const idx = clamp(idxRaw, 0, Math.max(0, t.length - 1));
      setSelectedIndex(idx);
      setAttachedIndex(attachedById >= 0 ? attachedById : null);
      lastFetchErrorRef.current = null;
      setStatus(`targets: ${t.length}  |  ${host}:${port}`);
      return;
    } catch (err) {
      const firstErr = String(err);
      if (host === "localhost") {
        try {
          const t = await fetch("127.0.0.1");
          setHost("127.0.0.1");
          setTargets(t);
          const idx = clamp(typeof preferIndex === "number" ? preferIndex : selectedIndex, 0, Math.max(0, t.length - 1));
          setSelectedIndex(idx);
          appendTextLog("[hint] localhost failed; switched host to 127.0.0.1");
          setStatus(`targets: ${t.length}  |  127.0.0.1:${port}`);
          return;
        } catch {}
      }
      if (lastFetchErrorRef.current !== firstErr) {
        appendTextLog(firstErr);
        lastFetchErrorRef.current = firstErr;
      }
      setTargets([]);
      setStatus(`failed to fetch targets from ${host}:${port}`);
      if (!hasShownConnectHelpRef.current) {
        hasShownConnectHelpRef.current = true;
        appendTextLog([
          "[hint] Start Chrome with remote debugging enabled:",
          '  open -na "Google Chrome" --args --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-cdp',
          "[hint] Verify endpoint:",
          `  curl http://${host}:${port}/json/list`
        ].join(`
`));
      }
    }
  };
  const detach = async () => {
    const c = clientRef.current;
    clientRef.current = null;
    await safeCloseClient(c);
    setAttachedIndex(null);
    setStatus(`detached  |  ${host}:${port}`);
  };
  const submitEval = async () => {
    const expr = evalText.trim();
    setEvalText("");
    setEvalOpen(false);
    if (!expr)
      return;
    appendTextLog(`[eval] ${expr}`);
    const c = clientRef.current;
    const Runtime = c?.Runtime;
    if (!Runtime?.evaluate) {
      appendTextLog("[eval] ! not attached (select a target and press Enter)");
      return;
    }
    try {
      const res = await Runtime.evaluate({
        expression: expr,
        awaitPromise: true,
        returnByValue: false
      });
      if (res?.exceptionDetails) {
        const text = String(res.exceptionDetails.text ?? "exception");
        appendTextLog(`[eval] ! ${text}`);
        if (res.exceptionDetails.exception) {
          appendEntryLog(`eval!`, [res.exceptionDetails.exception], Date.now());
        }
        return;
      }
      appendEntryLog(`eval =>`, [res?.result], Date.now());
    } catch (err) {
      appendTextLog(`[eval] ! ${String(err)}`);
    }
  };
  const attachByIndex = async (index) => {
    if (isAttachingRef.current)
      return;
    isAttachingRef.current = true;
    try {
      const t = targets[index];
      if (!t) {
        setStatus("invalid selection");
        return;
      }
      await detach();
      const title = (t.title ?? "").trim() || "(no title)";
      setStatus(`attaching: ${title}`);
      let c;
      try {
        c = await connectToTarget(t, { host, port });
      } catch (err) {
        appendTextLog(String(err));
        setStatus(`attach failed: ${title}`);
        return;
      }
      clientRef.current = c;
      setAttachedIndex(index);
      attachedTargetIdRef.current = t.id;
      const anyClient = c;
      if (typeof anyClient.on === "function") {
        anyClient.on("disconnect", () => {
          appendTextLog("[transport] disconnected");
          setStatus("disconnected (press r to refresh targets)");
          setAttachedIndex(null);
        });
      }
      const { Runtime, Log, Network, Console } = anyClient;
      try {
        await Promise.all([
          Runtime?.enable?.(),
          Console?.enable?.(),
          Log?.enable?.(),
          Network?.enable?.()
        ]);
      } catch (err) {
        appendTextLog(`[enable] ${String(err)}`);
      }
      Runtime?.consoleAPICalled?.((p) => {
        const time = formatTime(p?.timestamp ?? Date.now());
        const type = String(p?.type ?? "log");
        const args = Array.isArray(p?.args) ? p.args : [];
        appendEntryLog(`[${time}] console.${type}`, args, p?.timestamp);
      });
      Runtime?.exceptionThrown?.((p) => {
        const time = formatTime(p?.timestamp ?? Date.now());
        const details = p?.exceptionDetails;
        const text = details?.text ? String(details.text) : "exception";
        const args = details?.exception ? [details.exception] : [];
        appendEntryLog(`[${time}] exception ${text}`.trimEnd(), args, p?.timestamp);
      });
      Console?.messageAdded?.((p) => {
        const msg = p?.message ?? p;
        const source = typeof msg?.source === "string" ? String(msg.source) : "";
        if (source === "console-api")
          return;
        const time = formatTime(msg?.timestamp ?? Date.now());
        const level = String(msg?.level ?? "log");
        const text = String(msg?.text ?? "");
        const params = Array.isArray(msg?.parameters) ? msg.parameters : [];
        appendEntryLog(`[${time}] console.${level} ${text}`.trimEnd(), params, msg?.timestamp);
      });
      Log?.entryAdded?.((p) => {
        const entry = p?.entry ?? p;
        const time = formatTime(entry?.timestamp ?? Date.now());
        const level = String(entry?.level ?? "info");
        const text = String(entry?.text ?? "");
        const url = entry?.url ? ` (${entry.url})` : "";
        appendTextLog(`[${time}] log.${level} ${text}${url}`.trimEnd());
      });
      Network?.requestWillBeSent?.((p) => {
        const rid = String(p?.requestId ?? "");
        if (!rid)
          return;
        const req = p?.request;
        const url = String(req?.url ?? "");
        const method = String(req?.method ?? "");
        const headers = req?.headers ?? {};
        const postData = typeof req?.postData === "string" ? req.postData : undefined;
        const initiatorUrl = p?.initiator?.url ? String(p.initiator.url) : undefined;
        upsertNet(rid, {
          startTimestamp: p?.timestamp,
          method,
          url,
          requestHeaders: headers,
          postData,
          initiator: initiatorUrl,
          type: p?.type ? String(p.type) : undefined
        });
        ensureNetRequestNode(rid);
      });
      Network?.responseReceived?.((p) => {
        const rid = String(p?.requestId ?? "");
        if (!rid)
          return;
        const res = p?.response;
        const headers = res?.headers ?? {};
        upsertNet(rid, {
          status: typeof res?.status === "number" ? res.status : undefined,
          statusText: typeof res?.statusText === "string" ? res.statusText : undefined,
          mimeType: typeof res?.mimeType === "string" ? res.mimeType : undefined,
          protocol: typeof res?.protocol === "string" ? res.protocol : undefined,
          remoteIPAddress: typeof res?.remoteIPAddress === "string" ? res.remoteIPAddress : undefined,
          remotePort: typeof res?.remotePort === "number" ? res.remotePort : undefined,
          fromDiskCache: Boolean(res?.fromDiskCache),
          fromServiceWorker: Boolean(res?.fromServiceWorker),
          responseHeaders: headers
        });
        ensureNetRequestNode(rid);
        setNetNode(rid, (n) => {
          const children = Array.isArray(n.children) && n.children.length > 0 ? buildNetChildren(rid) : n.children;
          return { ...n, label: getNetLabel(rid), children };
        });
      });
      Network?.loadingFinished?.((p) => {
        const rid = String(p?.requestId ?? "");
        if (!rid)
          return;
        upsertNet(rid, {
          endTimestamp: p?.timestamp,
          encodedDataLength: typeof p?.encodedDataLength === "number" ? p.encodedDataLength : undefined
        });
        ensureNetRequestNode(rid);
        setNetNode(rid, (n) => ({ ...n, label: getNetLabel(rid) }));
      });
      Network?.loadingFailed?.((p) => {
        const rid = String(p?.requestId ?? "");
        if (!rid)
          return;
        upsertNet(rid, {
          endTimestamp: p?.timestamp,
          errorText: typeof p?.errorText === "string" ? p.errorText : "failed",
          canceled: Boolean(p?.canceled)
        });
        ensureNetRequestNode(rid);
        setNetNode(rid, (n) => ({ ...n, label: getNetLabel(rid) }));
      });
      if (opts.network) {
        Network?.webSocketFrameSent?.((p) => {
          const time = formatTime(p?.timestamp ?? Date.now());
          const payload = String(p?.response?.payloadData ?? "");
          appendTextLog(`[${time}] ws.sent ${truncate(payload, 200)}`.trimEnd());
        });
        Network?.webSocketFrameReceived?.((p) => {
          const time = formatTime(p?.timestamp ?? Date.now());
          const payload = String(p?.response?.payloadData ?? "");
          appendTextLog(`[${time}] ws.recv ${truncate(payload, 200)}`.trimEnd());
        });
      }
      appendTextLog(`[attached] ${title}`);
      setStatus(`attached: ${title}  |  ${host}:${port}`);
      setFocus("right");
      setRightTab("logs");
      try {
        await Runtime?.evaluate?.({
          expression: `console.log("[termdev] attached", new Date().toISOString())`
        });
      } catch {}
    } finally {
      isAttachingRef.current = false;
    }
  };
  useEffect(() => {
    refreshTargets();
  }, []);
  useEffect(() => {
    if (!opts.pollMs || opts.pollMs <= 0)
      return;
    const id = setInterval(() => {
      refreshTargets();
    }, opts.pollMs);
    return () => clearInterval(id);
  }, [opts.pollMs, host, port]);
  useEffect(() => {
    if (!opts.targetQuery)
      return;
    if (!targets.length)
      return;
    const picked = pickTargetByQuery(targets, opts.targetQuery);
    if (picked.target && picked.index >= 0) {
      setSelectedIndex(picked.index);
      attachByIndex(picked.index);
    } else {
      appendTextLog(`[auto-attach] no match for: ${opts.targetQuery}`);
    }
  }, [targets.length]);
  useEffect(() => {
    return () => {
      detach();
    };
  }, []);
  useInput((input, key) => {
    if (evalOpen) {
      if (key.escape) {
        setEvalOpen(false);
        setEvalText("");
        return;
      }
      if (key.return) {
        submitEval();
        return;
      }
      if (key.ctrl && input === "c") {
        exit();
        return;
      }
      return;
    }
    if (netSearchOpen) {
      if (key.escape) {
        setNetSearchOpen(false);
        return;
      }
      if (key.return) {
        setNetSearchOpen(false);
        return;
      }
      if (key.ctrl && input === "u") {
        setNetSearchQuery("");
        return;
      }
      if (key.ctrl && input === "c") {
        exit();
        return;
      }
      return;
    }
    if (key.tab) {
      setFocus((f) => f === "targets" ? "right" : "targets");
      return;
    }
    if (input === "q" || key.escape) {
      exit();
      return;
    }
    if (key.ctrl && input === "c") {
      exit();
      return;
    }
    if (input === "r") {
      refreshTargets();
      return;
    }
    if (input === ":") {
      setEvalOpen(true);
      setEvalText("");
      return;
    }
    if (focus === "targets") {
      if (key.upArrow || input === "k") {
        setSelectedIndex((i) => clamp(i - 1, 0, Math.max(0, targets.length - 1)));
        return;
      }
      if (key.downArrow || input === "j") {
        setSelectedIndex((i) => clamp(i + 1, 0, Math.max(0, targets.length - 1)));
        return;
      }
      if (key.return) {
        attachByIndex(selectedIndex);
        return;
      }
    } else {
      if (input === "l") {
        setRightTab("logs");
        return;
      }
      if (input === "n") {
        setRightTab("network");
        return;
      }
      if (input === "[") {
        setRightTab((t) => t === "logs" ? "network" : "logs");
        return;
      }
      if (input === "]") {
        setRightTab((t) => t === "logs" ? "network" : "logs");
        return;
      }
      const activeFlat2 = rightTab === "logs" ? flatLogs : flatNet;
      const activeIndex = rightTab === "logs" ? selectedLogIndex : selectedNetIndex;
      const setActiveSelected = (id) => {
        if (rightTab === "logs")
          setSelectedLogNodeId(id);
        else
          setSelectedNetNodeId(id);
      };
      const setActiveFollow = (v) => {
        if (rightTab === "logs")
          setFollowTail(v);
        else
          setFollowNetTail(v);
      };
      if (key.upArrow || input === "k") {
        if (!activeFlat2.length)
          return;
        setActiveFollow(false);
        const nextIdx = clamp(activeIndex - 1, 0, activeFlat2.length - 1);
        setActiveSelected(activeFlat2[nextIdx]?.nodeId ?? null);
        return;
      }
      if (key.downArrow || input === "j") {
        if (!activeFlat2.length)
          return;
        const nextIdx = clamp(activeIndex + 1, 0, activeFlat2.length - 1);
        setActiveSelected(activeFlat2[nextIdx]?.nodeId ?? null);
        if (nextIdx === activeFlat2.length - 1)
          setActiveFollow(true);
        else
          setActiveFollow(false);
        return;
      }
      if (key.pageUp || key.ctrl && input === "u") {
        if (!activeFlat2.length)
          return;
        setActiveFollow(false);
        const nextIdx = clamp(activeIndex - visibleLogLines, 0, activeFlat2.length - 1);
        setActiveSelected(activeFlat2[nextIdx]?.nodeId ?? null);
        return;
      }
      if (key.pageDown || key.ctrl && input === "d") {
        if (!activeFlat2.length)
          return;
        const nextIdx = clamp(activeIndex + visibleLogLines, 0, activeFlat2.length - 1);
        setActiveSelected(activeFlat2[nextIdx]?.nodeId ?? null);
        if (nextIdx === activeFlat2.length - 1)
          setActiveFollow(true);
        else
          setActiveFollow(false);
        return;
      }
      if (input === "z") {
        if (rightTab === "logs")
          toggleExpandSelected();
        else
          toggleNetExpandSelected();
        return;
      }
      if (input === "Z") {
        if (rightTab === "logs")
          collapseSelectedRegion();
        else
          collapseNetSelectedRegion();
        return;
      }
      if (input === "y") {
        if (!activeFlat2.length)
          return;
        const nodeId = (rightTab === "logs" ? selectedLogNodeId : selectedNetNodeId) ?? activeFlat2[activeFlat2.length - 1]?.nodeId;
        if (!nodeId)
          return;
        const root = rightTab === "logs" ? findNodeById(logTree, nodeId) : findNodeById(netTree, nodeId);
        if (!root)
          return;
        const text = root.net?.role === "body" ? serializeBodyOnly(root).join(`
`) : serializeNodeDeep(root, 0).join(`
`);
        (async () => {
          const ok = await copyToClipboard(text);
          setStatus(ok ? "copied" : "copy failed (no clipboard tool)");
        })();
        return;
      }
      if (rightTab === "network" && input === "/") {
        setNetSearchOpen(true);
        setFollowNetTail(false);
        return;
      }
    }
    if (input === "d") {
      detach();
      return;
    }
    if (input === "p") {
      const c = clientRef.current;
      c?.Runtime?.evaluate?.({
        expression: `console.log("[termdev] ping", new Date().toISOString())`
      });
      return;
    }
    if (input === "c") {
      if (focus === "right" && rightTab === "network") {
        clearNetwork();
        setStatus("network cleared");
      } else {
        clearLogs();
        setStatus("logs cleared");
      }
      return;
    }
    if (input === "f") {
      if (focus === "right") {
        if (rightTab === "logs")
          setFollowTail(true);
        else
          setFollowNetTail(true);
      } else {
        setFollowTail(true);
      }
      return;
    }
    if (input === "?") {
      appendTextLog("Keys: tab focus | q/esc quit | r refresh | targets: ↑↓/j k + enter attach | right: l logs / n network / [ ] switch | j/k select | z toggle | Z collapse | y copy | : eval | d detach | p ping | c clear(logs/network) | f follow");
    }
  });
  useEffect(() => {
    setTargetScrollTop((top) => {
      const maxTop = Math.max(0, targets.length - visibleTargetItems);
      const curTop = clamp(top, 0, maxTop);
      if (selectedIndex < curTop)
        return selectedIndex;
      if (selectedIndex >= curTop + visibleTargetItems)
        return selectedIndex - visibleTargetItems + 1;
      return curTop;
    });
  }, [selectedIndex, targets.length, visibleTargetItems]);
  useEffect(() => {
    setSelectedIndex((i) => clamp(i, 0, Math.max(0, targets.length - 1)));
  }, [targets.length]);
  const attachedTitle = useMemo(() => {
    if (attachedIndex == null)
      return null;
    const t = targets[attachedIndex];
    if (!t)
      return "(attached)";
    return (t.title ?? "").trim() || t.url || "(attached)";
  }, [targets, attachedIndex]);
  const targetsViewport = useMemo(() => {
    if (!targets.length)
      return [];
    const slice = targets.slice(targetScrollTop, targetScrollTop + visibleTargetItems);
    return slice.map((t, offset) => {
      const idx = targetScrollTop + offset;
      const selected = idx === selectedIndex;
      const attached = idx === attachedIndex;
      const title = (t.title ?? "").trim() || "(no title)";
      const url = (t.url ?? "").trim();
      const type = (t.type ?? "").trim();
      const icon = getTargetIcon(type);
      const color = getTargetColor(type, selected, attached);
      const statusIcon = attached ? "●" : selected ? "◦" : " ";
      const line1Prefix = `${icon} ${statusIcon} ${String(idx).padStart(2, " ")}`;
      const line1 = `${line1Prefix} ${title}`;
      const meta = [type ? `${type}` : "", url].filter(Boolean).join(" · ");
      const line2 = `      ${meta}`;
      const maxWidth = Math.max(10, Math.floor(columns * 0.33) - 6);
      return {
        key: t.id,
        lines: [truncate(line1, maxWidth), truncate(line2, maxWidth)],
        selected,
        attached,
        type,
        icon,
        color
      };
    });
  }, [
    targets,
    targetScrollTop,
    visibleTargetItems,
    selectedIndex,
    attachedIndex,
    columns
  ]);
  const activeFlat = rightTab === "logs" ? flatLogs : flatNet;
  const activeScrollTop = rightTab === "logs" ? logScrollTop : netScrollTop;
  const activeSelectedId = rightTab === "logs" ? selectedLogNodeId : selectedNetNodeId;
  const activeFollow = rightTab === "logs" ? followTail : followNetTail;
  const viewport = useMemo(() => {
    if (!activeFlat.length)
      return { start: 0, endExclusive: 0, lines: [] };
    const start = clamp(activeScrollTop, 0, Math.max(0, activeFlat.length - visibleLogLines));
    const endExclusive = clamp(start + visibleLogLines, 0, activeFlat.length);
    return {
      start,
      endExclusive,
      lines: activeFlat.slice(start, endExclusive)
    };
  }, [activeFlat, activeScrollTop, visibleLogLines]);
  if (showLogo) {
    return /* @__PURE__ */ jsxDEV(LogoScreen, {
      onDismiss: () => setShowLogo(false)
    }, undefined, false, undefined, this);
  }
  const headerTitle = headerGradient(`${ICONS.logo} TermDev`);
  const connectionStatus = attachedIndex !== null;
  return /* @__PURE__ */ jsxDEV(Box, {
    flexDirection: "column",
    width: "100%",
    children: [
      /* @__PURE__ */ jsxDEV(Box, {
        height: HEADER_HEIGHT,
        children: [
          /* @__PURE__ */ jsxDEV(Text, {
            children: headerTitle
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV(Text, {
            dimColor: true,
            children: " │ "
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV(Text, {
            color: connectionStatus ? "green" : "yellow",
            children: connectionStatus ? ICONS.connected : ICONS.disconnected
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV(Text, {
            color: connectionStatus ? "green" : "yellow",
            children: connectionStatus ? " connected" : " waiting"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV(Text, {
            dimColor: true,
            children: " │ "
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV(Text, {
            dimColor: true,
            children: [
              host,
              ":",
              port
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV(Text, {
            dimColor: true,
            children: " │ "
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV(Text, {
            color: "cyan",
            children: [
              ICONS.list,
              " "
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV(Text, {
            color: "cyanBright",
            bold: true,
            children: targets.length
          }, undefined, false, undefined, this),
          attachedTitle ? /* @__PURE__ */ jsxDEV(Fragment, {
            children: [
              /* @__PURE__ */ jsxDEV(Text, {
                dimColor: true,
                children: " │ "
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV(Text, {
                color: "green",
                children: [
                  ICONS.plug,
                  " "
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsxDEV(Text, {
                color: "green",
                children: truncate(attachedTitle, Math.max(10, columns - 65))
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this) : null
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV(Box, {
        flexGrow: 1,
        height: mainHeight,
        children: [
          /* @__PURE__ */ jsxDEV(Box, {
            flexDirection: "column",
            width: "33%",
            borderStyle: "round",
            borderColor: focus === "targets" ? "green" : "gray",
            paddingX: 1,
            paddingY: 0,
            marginRight: 1,
            children: [
              /* @__PURE__ */ jsxDEV(Text, {
                bold: true,
                color: focus === "targets" ? "cyan" : undefined,
                children: [
                  ICONS.list,
                  " Targets",
                  focus === "targets" ? ` ${ICONS.star}` : "",
                  " ",
                  /* @__PURE__ */ jsxDEV(Text, {
                    dimColor: true,
                    children: "(↑↓ Enter)"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              targets.length === 0 ? /* @__PURE__ */ jsxDEV(Text, {
                dimColor: true,
                children: [
                  "(no targets)",
                  lastFetchErrorRef.current ? "" : `
Press r to refresh`
                ]
              }, undefined, true, undefined, this) : /* @__PURE__ */ jsxDEV(Box, {
                flexDirection: "column",
                children: [
                  targetsViewport.map((item) => /* @__PURE__ */ jsxDEV(Box, {
                    flexDirection: "column",
                    children: [
                      /* @__PURE__ */ jsxDEV(Text, {
                        color: item.color,
                        bold: item.selected,
                        inverse: item.selected,
                        children: item.lines[0]
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsxDEV(Text, {
                        dimColor: true,
                        color: item.attached ? "green" : undefined,
                        children: item.lines[1]
                      }, undefined, false, undefined, this)
                    ]
                  }, item.key, true, undefined, this)),
                  targets.length > visibleTargetItems ? /* @__PURE__ */ jsxDEV(Text, {
                    dimColor: true,
                    children: [
                      ICONS.bullet,
                      " ",
                      targetScrollTop + 1,
                      "-",
                      Math.min(targetScrollTop + visibleTargetItems, targets.length),
                      "/",
                      targets.length
                    ]
                  }, undefined, true, undefined, this) : null
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV(Box, {
            flexDirection: "column",
            width: "67%",
            borderStyle: "round",
            borderColor: focus === "right" ? "green" : "gray",
            paddingX: 1,
            children: [
              /* @__PURE__ */ jsxDEV(Text, {
                bold: true,
                children: [
                  /* @__PURE__ */ jsxDEV(Text, {
                    color: rightTab === "logs" ? "yellowBright" : "gray",
                    bold: rightTab === "logs",
                    children: [
                      ICONS.list,
                      " Logs"
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ jsxDEV(Text, {
                    dimColor: true,
                    children: " │ "
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV(Text, {
                    color: rightTab === "network" ? "magentaBright" : "gray",
                    bold: rightTab === "network",
                    children: [
                      ICONS.network,
                      " Network"
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ jsxDEV(Text, {
                    dimColor: true,
                    children: "  "
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV(Text, {
                    color: "gray",
                    children: [
                      "(",
                      viewport.start + 1,
                      "-",
                      viewport.endExclusive,
                      "/",
                      activeFlat.length,
                      ")"
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ jsxDEV(Text, {
                    color: activeFollow ? "green" : "yellow",
                    children: activeFollow ? ` ${ICONS.connected} follow` : ` ${ICONS.disconnected} paused`
                  }, undefined, false, undefined, this),
                  focus === "right" ? /* @__PURE__ */ jsxDEV(Text, {
                    color: "greenBright",
                    children: [
                      " ",
                      ICONS.star
                    ]
                  }, undefined, true, undefined, this) : null
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsxDEV(Box, {
                flexDirection: "column",
                children: viewport.lines.map((line, i) => {
                  const idx = viewport.start + i;
                  const isSelected = focus === "right" && activeFlat[idx]?.nodeId === activeSelectedId;
                  const icon = line.expandable ? line.expanded ? ICONS.expand : ICONS.collapse : " ";
                  const prefix = `${" ".repeat(line.indent * 2)}${icon} `;
                  const rendered = `${prefix}${line.text}`;
                  const style = classifyLogLine(line.text);
                  return /* @__PURE__ */ jsxDEV(Text, {
                    inverse: isSelected,
                    color: style.color,
                    dimColor: style.dim || !isSelected && focus !== "right",
                    children: truncate(rendered, Math.max(10, Math.floor(columns * 0.67) - 6))
                  }, line.nodeId, false, undefined, this);
                })
              }, undefined, false, undefined, this),
              evalOpen ? /* @__PURE__ */ jsxDEV(Box, {
                marginTop: 0,
                children: [
                  /* @__PURE__ */ jsxDEV(Text, {
                    color: "greenBright",
                    bold: true,
                    children: [
                      ICONS.zap,
                      " js›",
                      " "
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ jsxDEV(TextInput, {
                    value: evalText,
                    onChange: setEvalText
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV(Text, {
                    dimColor: true,
                    children: " (Enter run, Esc cancel)"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this) : netSearchOpen ? /* @__PURE__ */ jsxDEV(Box, {
                marginTop: 0,
                children: [
                  /* @__PURE__ */ jsxDEV(Text, {
                    color: "cyanBright",
                    bold: true,
                    children: [
                      ICONS.search,
                      " /",
                      " "
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ jsxDEV(TextInput, {
                    value: netSearchQuery,
                    onChange: setNetSearchQuery
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV(Text, {
                    dimColor: true,
                    children: " (Enter done, Esc close, Ctrl+U clear)"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this) : /* @__PURE__ */ jsxDEV(Text, {
                dimColor: true,
                children: [
                  /* @__PURE__ */ jsxDEV(Text, {
                    color: "yellow",
                    children: "l"
                  }, undefined, false, undefined, this),
                  " logs ",
                  /* @__PURE__ */ jsxDEV(Text, {
                    color: "yellow",
                    children: "n"
                  }, undefined, false, undefined, this),
                  " network ",
                  /* @__PURE__ */ jsxDEV(Text, {
                    color: "yellow",
                    children: "j/k"
                  }, undefined, false, undefined, this),
                  " select ",
                  /* @__PURE__ */ jsxDEV(Text, {
                    color: "yellow",
                    children: "z"
                  }, undefined, false, undefined, this),
                  " expand ",
                  /* @__PURE__ */ jsxDEV(Text, {
                    color: "yellow",
                    children: ":"
                  }, undefined, false, undefined, this),
                  " eval"
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV(Box, {
        children: [
          /* @__PURE__ */ jsxDEV(Text, {
            backgroundColor: "gray",
            color: "black",
            children: [
              " ",
              /* @__PURE__ */ jsxDEV(Text, {
                color: connectionStatus ? "green" : "yellow",
                children: connectionStatus ? ICONS.connected : ICONS.disconnected
              }, undefined, false, undefined, this),
              " "
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV(Text, {
            backgroundColor: "gray",
            color: "black",
            children: truncate(status, Math.max(10, columns - 60))
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV(Text, {
            backgroundColor: "gray",
            color: "black",
            children: " │ "
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV(Text, {
            backgroundColor: "gray",
            color: "blue",
            bold: true,
            children: "tab"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV(Text, {
            backgroundColor: "gray",
            color: "black",
            children: " focus "
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV(Text, {
            backgroundColor: "gray",
            color: "blue",
            bold: true,
            children: "r"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV(Text, {
            backgroundColor: "gray",
            color: "black",
            children: " refresh "
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV(Text, {
            backgroundColor: "gray",
            color: "blue",
            bold: true,
            children: "c"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV(Text, {
            backgroundColor: "gray",
            color: "black",
            children: " clear "
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV(Text, {
            backgroundColor: "gray",
            color: "blue",
            bold: true,
            children: "q"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV(Text, {
            backgroundColor: "gray",
            color: "black",
            children: " quit "
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV(Text, {
            backgroundColor: "gray",
            color: "black",
            children: " ".repeat(Math.max(0, columns - 80))
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
async function runTui(opts) {
  const instance = render(/* @__PURE__ */ jsxDEV(App, {
    opts: {
      host: opts.host,
      port: opts.port,
      network: opts.network,
      pollMs: opts.pollMs,
      targetQuery: opts.targetQuery
    }
  }, undefined, false, undefined, this));
  await instance.waitUntilExit();
}

// src/main.ts
async function run(argv) {
  let opts;
  try {
    opts = parseCli(argv);
  } catch (err) {
    console.error(String(err));
    console.log(HELP_TEXT);
    return;
  }
  if (opts.help) {
    console.log(HELP_TEXT);
    return;
  }
  await runTui(opts);
}

// bin/termdev.ts
var argv = typeof Bun !== "undefined" ? Bun.argv : process.argv;
await run(argv.slice(2));

//# debugId=808A6A841733DA0364756E2164756E21
