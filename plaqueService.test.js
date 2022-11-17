const plaqueService = require('./plaqueService')

test('next to 1AAA000 should be 1AAA001', () => {
    expect(plaqueService.getNextPlaque('1AAA000')).toBe('1AAA001');
});
test('next to 1AAA009 should be 1AAA010', () => {
    expect(plaqueService.getNextPlaque('1AAA009')).toBe('1AAA010');
});
test('next to 1AAA999 should be 1AAB001', () => {
    expect(plaqueService.getNextPlaque('1AAA999')).toBe('1AAB001');
});
test('next to 1ZZZ999 should be 2AAA001', () => {
    expect(plaqueService.getNextPlaque('1ZZZ999')).toBe('2AAA001');
});

test('next to 1AAA000 should be 1AAA001', () => {
    expect(plaqueService.getNextPlaque('1AAA001', 3)).toBe('1AAB001');
});