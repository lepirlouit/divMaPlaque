const plaqueService = require('./plaqueService')

test('1AAA000 should be 1AAA001', () => {
    expect(plaqueService.getNextPlaque('1AAA000')).toBe('1AAA001');
});
test('1AAA009 should be 1AAA010', () => {
    expect(plaqueService.getNextPlaque('1AAA009')).toBe('1AAA010');
});
test('1AAA999 should be 1AAB000', () => {
    expect(plaqueService.getNextPlaque('1AAA999')).toBe('1AAB000');
});
test('1ZZZ999 should be 2AAA000', () => {
    expect(plaqueService.getNextPlaque('1ZZZ999')).toBe('2AAA000');
});