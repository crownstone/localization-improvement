export const Util = {
  getHubHexToken : () : string => {
    let str = '';
    for (let i = 0; i < 64; i++) {
      str += Util.getRandomByte();
    }
    return str;
  },

  getRandomByte: () : string => {
    let byteValue = Math.floor(Math.random()*255);
    let str = byteValue.toString(16);
    if (byteValue < 16) {
      return '0'+str;
    }
    return str
  },

  getToken : () : string => {
    return Math.floor(Math.random() * 1e8 /* 65536 */).toString(36);
  },

  getUUID : () : string => {
    return (
      S4() + S4() + '-' +
      S4() + '-' +
      S4() + '-' +
      S4() + '-' +
      S4() + S4() + S4()
    );
  },

  getShortUUID : () : string => {
    return (
      S4() + S4() + '-' +
      S4()
    );
  },

  deepCompare: function (a, b, d=0) : boolean {
    let iterated = false;
    for (let prop in b) {
      iterated = true;
      if (b.hasOwnProperty(prop)) {
        if (a[prop] === undefined) {
          return false;
        }
        else if (b[prop] && !a[prop] || a[prop] && !b[prop]) {
          return false;
        }
        else if (!b[prop] && !a[prop] && a[prop] != b[prop]) {
          return false;
        }
        else if (!b[prop] && !a[prop] && a[prop] == b[prop]) {
          continue;
        }
        else if (b[prop].constructor === Object) {
          if (a[prop].constructor === Object) {
            if (Util.deepCompare(a[prop], b[prop], d+1) === false) {
              return false
            }
          }
          else {
            return false;
          }
        }
        else if (Array.isArray(b[prop])) {
          if (Array.isArray(a[prop]) === false) {
            return false;
          }
          else if (a[prop].length !== b[prop].length) {
            return false;
          }

          for (let i = 0; i < b[prop].length; i++) {
            if (Util.deepCompare(a[prop][i], b[prop][i]) === false) {
              return false;
            }
          }
        }
        else {
          if (a[prop] !== b[prop]) {
            return false;
          }
        }
      }
    }

    if (!iterated) {
      return a === b;
    }

    return true;
  },

}

const S4 = function () {
  return Math.floor(Math.random() * 0x10000 /* 65536 */).toString(16);
};
