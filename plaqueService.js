// const Buffer = require('buffer');

const A_CHAR_CODE = "A".charCodeAt(0);
const Z_CHAR_CODE = "Z".charCodeAt(0);
const ZERO_CHAR_CODE = "0".charCodeAt(0);
const NINE_CHAR_CODE = "9".charCodeAt(0);

const getCharCode = (char) => char.charCodeAt(0);
const getStringFromCodes = (codesArray) => Buffer.from(codesArray).toString();

const getNextChar = (charCode) => {
  let nextCharCode;
  let overflow = false;
  switch (charCode) {
    case Z_CHAR_CODE:
      nextCharCode = A_CHAR_CODE;
      overflow = true;
      break;
    case NINE_CHAR_CODE:
      nextCharCode = ZERO_CHAR_CODE;
      overflow = true;
      break;
    default:
      nextCharCode = charCode + 1;
  }

  return ({
    nextCharCode,
    overflow,
  });
}

const getNextPlaque = (previous, skip = 0) => {
  const next = getStringFromCodes(previous.split('').reverse().reduce((acc, elt, index) => {
    const eltCharCode = getCharCode(elt);
    if (acc.overflow || index === skip) {
      const { nextCharCode, overflow } = getNextChar(eltCharCode);
      return ({
        nextPlaque: [...(acc.nextPlaque || []), nextCharCode],
        overflow,
      });
    }
    return ({
      nextPlaque: [...acc.nextPlaque, eltCharCode],
    })
  }, { nextPlaque: [] }).nextPlaque.reverse());
  if (next.includes('000') || next.includes('I')) {
    return getNextPlaque(next, skip);
  }
  return next;
}

module.exports.getNextPlaque = getNextPlaque;

