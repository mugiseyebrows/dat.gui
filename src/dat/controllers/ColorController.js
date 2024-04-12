/**
 * dat-gui JavaScript Controller Library
 * https://github.com/dataarts/dat.gui
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

import Controller from './Controller';
import dom from '../dom/dom';
import Color from '../color/Color';
import interpret from '../color/interpret';
import common from '../utils/common';
import math from '../color/math';

const CHECKBOARD_IMAGE = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAGUExURf///7+/v6NDdjkAAAAJcEhZcwAAEnMAABJzAYwiuQcAAAAUSURBVBjTYwABQSCglEENMxgYGAAynwRB8BEAgQAAAABJRU5ErkJggg==)';

/**
 * @class Represents a given property of an object that is a color.
 * @param {Object} object
 * @param {string} property
 */
class ColorController extends Controller {
  constructor(object, property) {
    super(object, property);

    this.__color = new Color(this.getValue());
    this.__temp = new Color(0);

    const _this = this;

    this.domElement = document.createElement('div');

    dom.makeSelectable(this.domElement, false);

    this.__selector = document.createElement('div');
    this.__selector.className = 'selector';

    this.__alpha_field = document.createElement('div');
    this.__alpha_field.className = 'alpha-field';

    this.__alpha_knob = document.createElement('div');
    this.__alpha_knob.className = 'alpha-knob';

    this.__saturation_field = document.createElement('div');
    this.__saturation_field.className = 'saturation-field';

    this.__field_knob = document.createElement('div');
    this.__field_knob.className = 'field-knob';
    this.__field_knob_border = '2px solid ';

    this.__hue_knob = document.createElement('div');
    this.__hue_knob.className = 'hue-knob';

    this.__hue_field = document.createElement('div');
    this.__hue_field.className = 'hue-field';

    this.__input = document.createElement('input');
    this.__input.type = 'text';
    this.__input_textShadow = '0 1px 1px ';

    dom.bind(this.__input, 'keydown', function(e) {
      if (e.keyCode === 13) { // on enter
        onBlur.call(this);
      }
    });

    dom.bind(this.__input, 'blur', onBlur);

    dom.bind(this.__selector, 'mousedown', function(/* e */) {
      dom
        .addClass(this, 'drag')
        .bind(window, 'mouseup', function(/* e */) {
          dom.removeClass(_this.__selector, 'drag');
        });
    });

    dom.bind(this.__selector, 'touchstart', function(/* e */) {
      dom
        .addClass(this, 'drag')
        .bind(window, 'touchend', function(/* e */) {
          dom.removeClass(_this.__selector, 'drag');
        });
    });

    const valueField = document.createElement('div');

    common.extend(this.__selector.style, {
      width: '141px',
      height: '102px',
      padding: '3px',
      backgroundColor: '#222',
      boxShadow: '0px 1px 3px rgba(0,0,0,0.3)'
    });

    common.extend(this.__field_knob.style, {
      position: 'absolute',
      width: '12px',
      height: '12px',
      border: this.__field_knob_border + (this.__color.v < 0.5 ? '#fff' : '#000'),
      boxShadow: '0px 1px 3px rgba(0,0,0,0.5)',
      borderRadius: '12px',
      zIndex: 1
    });

    common.extend(this.__hue_knob.style, {
      position: 'absolute',
      width: '15px',
      height: '2px',
      borderRight: '4px solid #fff',
      zIndex: 1
    });

    common.extend(this.__alpha_knob.style, {
      position: 'absolute',
      width: '15px',
      height: '2px',
      borderLeft: '4px solid #fff',
      left: '-4px',
      zIndex: 100
    });

    common.extend(this.__saturation_field.style, {
      width: '100px',
      height: '100px',
      border: '1px solid #555',
      marginLeft: '20px',
      marginRight: '3px',
      display: 'inline-block',
      cursor: 'pointer'
    });

    common.extend(valueField.style, {
      width: '100%',
      height: '100%',
      background: linearGradient('to bottom', 'rgba(0,0,0,0)', '#000')
    });

    common.extend(this.__hue_field.style, {
      width: '15px',
      height: '100px',
      border: '1px solid #555',
      cursor: 'ns-resize',
      position: 'absolute',
      top: '3px',
      right: '3px'
    });

    common.extend(this.__alpha_field.style, {
      width: '15px',
      height: '100px',
      position: 'absolute',
      top: '3px',
      left: '3px',
      border: '1px solid #555',
      cursor: 'ns-resize',
    });

    this.__hue_field.style.background = hueGradient();

    common.extend(this.__input.style, {
      outline: 'none',
      //      width: '120px',
      textAlign: 'center',
      //      padding: '4px',
      //      marginBottom: '6px',
      color: '#fff',
      border: 0,
      fontWeight: 'bold',
      textShadow: this.__input_textShadow + 'rgba(0,0,0,0.7)'
    });

    dom.bind(this.__saturation_field, 'mousedown', fieldDown);
    dom.bind(this.__saturation_field, 'touchstart', fieldDown);

    dom.bind(this.__field_knob, 'mousedown', fieldDown);
    dom.bind(this.__field_knob, 'touchstart', fieldDown);

    dom.bind(this.__hue_field, 'mousedown', fieldDownH);
    dom.bind(this.__hue_field, 'touchstart', fieldDownH);

    dom.bind(this.__alpha_field, 'mousedown', fieldDownA);
    dom.bind(this.__alpha_field, 'touchstart', fieldDownA);

    function fieldDown(e) {
      setSV(e);
      dom.bind(window, 'mousemove', setSV);
      dom.bind(window, 'touchmove', setSV);
      dom.bind(window, 'mouseup', fieldUpSV);
      dom.bind(window, 'touchend', fieldUpSV);
    }

    function fieldDownH(e) {
      setH(e);
      dom.bind(window, 'mousemove', setH);
      dom.bind(window, 'touchmove', setH);
      dom.bind(window, 'mouseup', fieldUpH);
      dom.bind(window, 'touchend', fieldUpH);
    }

    function fieldDownA(e) {
      setA(e);
      dom.bind(window, 'mousemove', setA);
      dom.bind(window, 'touchmove', setA);
      dom.bind(window, 'mouseup', fieldUpA);
      dom.bind(window, 'touchend', fieldUpA);
    }

    function fieldUpSV() {
      dom.unbind(window, 'mousemove', setSV);
      dom.unbind(window, 'touchmove', setSV);
      dom.unbind(window, 'mouseup', fieldUpSV);
      dom.unbind(window, 'touchend', fieldUpSV);
      onFinish();
    }

    function fieldUpH() {
      dom.unbind(window, 'mousemove', setH);
      dom.unbind(window, 'touchmove', setH);
      dom.unbind(window, 'mouseup', fieldUpH);
      dom.unbind(window, 'touchend', fieldUpH);
      onFinish();
    }

    function fieldUpA() {
      dom.unbind(window, 'mousemove', setA);
      dom.unbind(window, 'touchmove', setA);
      dom.unbind(window, 'mouseup', fieldUpA);
      dom.unbind(window, 'touchend', fieldUpA);
      onFinish();
    }

    function onBlur() {
      const i = interpret(this.value);
      if (i !== false) {
        _this.__color.__state = i;
        _this.setValue(_this.__color.toOriginal());
      } else {
        this.value = _this.__color.toString();
      }
    }

    function onFinish() {
      if (_this.__onFinishChange) {
        _this.__onFinishChange.call(_this, _this.__color.toOriginal());
      }
    }

    this.__saturation_field.appendChild(valueField);
    this.__selector.appendChild(this.__field_knob);
    this.__selector.appendChild(this.__saturation_field);
    this.__selector.appendChild(this.__hue_field);
    this.__hue_field.appendChild(this.__hue_knob);
    this.__selector.appendChild(this.__alpha_field);
    this.__alpha_field.appendChild(this.__alpha_knob);

    this.domElement.appendChild(this.__input);
    this.domElement.appendChild(this.__selector);

    this.updateDisplay();

    updateAlphaBackground();

    function setSV(e) {
      if (e.type.indexOf('touch') === -1) { e.preventDefault(); }

      const fieldRect = _this.__saturation_field.getBoundingClientRect();
      const { clientX, clientY } = (e.touches && e.touches[0]) || e;
      let s = (clientX - fieldRect.left) / (fieldRect.right - fieldRect.left);
      let v = 1 - (clientY - fieldRect.top) / (fieldRect.bottom - fieldRect.top);

      if (v > 1) {
        v = 1;
      } else if (v < 0) {
        v = 0;
      }

      if (s > 1) {
        s = 1;
      } else if (s < 0) {
        s = 0;
      }

      _this.__color.v = v;
      _this.__color.s = s;

      _this.setValue(_this.__color.toOriginal());

      updateAlphaBackground();

      return false;
    }

    function setH(e) {
      if (e.type.indexOf('touch') === -1) { e.preventDefault(); }

      const fieldRect = _this.__hue_field.getBoundingClientRect();
      const { clientY } = (e.touches && e.touches[0]) || e;
      let h = 1 - (clientY - fieldRect.top) / (fieldRect.bottom - fieldRect.top);

      if (h > 1) {
        h = 1;
      } else if (h < 0) {
        h = 0;
      }

      _this.__color.h = h * 360;

      _this.setValue(_this.__color.toOriginal());

      updateAlphaBackground();

      return false;
    }

    function updateAlphaBackground() {
      const { r, g, b } = _this.__color;
      const opaque = new Color([r, g, b, 1]);
      const transparent = new Color([r, g, b, 0]);
      _this.__alpha_field.style.background = linearGradient('to bottom', opaque, transparent) + ', ' + CHECKBOARD_IMAGE;
    }

    function setA(e) {
      if (e.type.indexOf('touch') === -1) { e.preventDefault(); }

      const fieldRect = _this.__hue_field.getBoundingClientRect();
      const { clientY } = (e.touches && e.touches[0]) || e;
      let a = 1 - (clientY - fieldRect.top) / (fieldRect.bottom - fieldRect.top);

      if (a > 1) {
        a = 1;
      } else if (a < 0) {
        a = 0;
      }

      _this.__color.a = a.toFixed(2);

      _this.setValue(_this.__color.toOriginal());
    }
  }

  updateDisplay() {
    const i = interpret(this.getValue());

    if (i !== false) {
      let mismatch = false;

      // Check for mismatch on the interpreted value.

      common.each(Color.COMPONENTS, function(component) {
        if (!common.isUndefined(i[component]) && !common.isUndefined(this.__color.__state[component]) &&
          i[component] !== this.__color.__state[component]) {
          mismatch = true;
          return {}; // break
        }
      }, this);

      // If nothing diverges, we keep our previous values
      // for statefulness, otherwise we recalculate fresh
      if (mismatch) {
        common.extend(this.__color.__state, i);
      }
    }

    common.extend(this.__temp.__state, this.__color.__state);

    this.__temp.a = 1;

    const { r, g, b, a } = this.__color;

    const contrastToWhite = math.contrast_to_white(r, g, b);
    const contrastToBlack = math.contrast_to_black(r, g, b);

    const flip = contrastToWhite > contrastToBlack ? 255 : 0;
    const _flip = 255 - flip;

    common.extend(this.__field_knob.style, {
      marginLeft: 100 * this.__color.s - 7 + 19 + 'px',
      marginTop: 100 * (1 - this.__color.v) - 7 + 'px',
      backgroundColor: this.__temp.toHexString(),
      border: this.__field_knob_border + 'rgb(' + flip + ',' + flip + ',' + flip + ')'
    });

    this.__hue_knob.style.marginTop = (1 - this.__color.h / 360) * 100 + 'px';

    this.__alpha_knob.style.marginTop = (1 - this.__color.a) * 100 + 'px';

    this.__temp.s = 1;
    this.__temp.v = 1;

    this.__saturation_field.style.background = linearGradient('to right', '#fff', this.__temp.toHexString());

    this.__input.value = this.__color.toString();

    common.extend(this.__input.style, {
      background: linearGradient('to right', this.__color, this.__color) + ', ' + CHECKBOARD_IMAGE,
      color: 'rgb(' + flip + ',' + flip + ',' + flip + ')',
      textShadow: this.__input_textShadow + 'rgba(' + _flip + ',' + _flip + ',' + _flip + ',.7)'
    });
  }
}

function linearGradient(dir, a, b) {
  const color1 = common.isString(a) ? a : a.toRGBAString();
  const color2 = common.isString(b) ? b : b.toRGBAString();
  return 'linear-gradient(' + dir + ', ' + color1 + ' 0%, ' + color2 + ' 100%)';
}

function hueGradient() {
  return 'linear-gradient(to bottom, #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%)';
}

export default ColorController;
