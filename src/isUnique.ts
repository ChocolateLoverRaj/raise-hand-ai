/**
 * Returns `true` if something is in an array 0 or 1 times
 */
const isUnique = <T>(array: readonly T[], item: T): boolean =>
  array.indexOf(item) === array.lastIndexOf(item)

export default isUnique
