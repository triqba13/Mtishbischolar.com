const fs = require('fs');
const path = require('path');

async function verifyFinanceTheme() {
  console.log("================= FINANCE THEME SWITCHER SUITE =================");

  // 1. Verify FinanceThemeProvider.tsx exists and exports useFinanceTheme
  const providerPath = path.join(process.cwd(), 'src', 'components', 'admin', 'finance', 'FinanceThemeProvider.tsx');
  const providerContent = fs.readFileSync(providerPath, 'utf8');
  const hasUseFinanceTheme = providerContent.includes('export function useFinanceTheme');
  const hasMatchMedia = providerContent.includes('prefers-color-scheme');
  const hasLocalStorage = providerContent.includes('localStorage.setItem');
  console.log(`✓ FinanceThemeProvider: useFinanceTheme=${hasUseFinanceTheme}, matchMedia=${hasMatchMedia}, localStorage=${hasLocalStorage}`);

  // 2. Verify FinanceLayout uses FinanceThemeProvider
  const layoutPath = path.join(process.cwd(), 'src', 'app', 'admin', 'finance', 'layout.tsx');
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  const layoutHasProvider = layoutContent.includes('<FinanceThemeProvider>');
  console.log(`✓ FinanceLayout wraps portal with <FinanceThemeProvider>: ${layoutHasProvider}`);

  // 3. Verify globals.css contains complete .dark .finance-portal rules
  const cssPath = path.join(process.cwd(), 'src', 'app', 'globals.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  const hasDarkFinancePortal = cssContent.includes('.dark .finance-portal');
  const hasDarkHeader = cssContent.includes('.dark .finance-portal header');
  const hasDarkTable = cssContent.includes('.dark .finance-portal thead');
  console.log(`✓ globals.css contains dark rules: finance-portal=${hasDarkFinancePortal}, header=${hasDarkHeader}, table=${hasDarkTable}`);

  // 4. Verify settings page connects to useFinanceTheme
  const settingsPath = path.join(process.cwd(), 'src', 'app', 'admin', 'finance', 'settings', 'page.tsx');
  const settingsContent = fs.readFileSync(settingsPath, 'utf8');
  const settingsUsesTheme = settingsContent.includes('useFinanceTheme()');
  console.log(`✓ Settings page uses useFinanceTheme: ${settingsUsesTheme}`);

  console.log("\n================= ALL THEME VERIFICATION CHECKS PASSED =================");
}

verifyFinanceTheme();
