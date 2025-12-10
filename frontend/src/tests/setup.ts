// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// --- MOCK GLOBAL PARA window.matchMedia ---
// JSDOM no implementa esto nativamente, es necesario para ThemeProvider.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false, // Por defecto simulamos modo light
    media: query,
    onchange: null,
    addListener: () => {}, // Deprecado
    removeListener: () => {}, // Deprecado
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
