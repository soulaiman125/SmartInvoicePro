// Prisma returns BigInt for money fields. BigInt is not JSON-serializable by
// default, so teach it to render as a string. Imported once at startup.
if (typeof BigInt.prototype.toJSON !== 'function') {
  // eslint-disable-next-line no-extend-native
  BigInt.prototype.toJSON = function toJSON() {
    return this.toString();
  };
}
