// Manual Jest mock for @react-native-community/datetimepicker (auto-applied
// — see https://jestjs.io/docs/manual-mocks#mocking-node-modules). The real
// package renders a native view; it's only ever mounted after the user taps
// a "change date/time" field, which none of these tests trigger, so a
// no-op stand-in is enough to keep it out of the render tree without
// crashing on the native module it would otherwise reach for.
function DateTimePicker() {
  return null;
}

module.exports = DateTimePicker;
module.exports.default = DateTimePicker;
