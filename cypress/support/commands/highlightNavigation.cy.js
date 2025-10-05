// cypress/support/commands/highlightNavigation.cy.js
export const highlightNavigation = () => {
    // Custom command to add a visual indicator before navigation
    Cypress.Commands.add('highlightNavigation', (url) => {
        cy.log(`🧭 Navigating to: ${url}`);

        cy.window().then((win) => {
            // Create overlay
            const overlay = win.document.createElement('div');
            overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(52, 152, 219, 0.1);
      z-index: 9998;
      pointer-events: none;
      animation: flash-overlay 1s ease-in-out 3;
    `;

            // Add navigation text
            const navText = win.document.createElement('div');
            navText.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 28px;
      font-weight: 600;
      color: #2c3e50;
      text-shadow: 0 1px 2px rgba(0,0,0,0.1);
      z-index: 9999;
      pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      white-space: nowrap;
      line-height: 1.4;
      padding: 16px 24px;
      background-color: rgba(255, 255, 255, 0.9);
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    `;
            navText.textContent = `🧭 NAVIGATING TO: ${url}`;

            // Add CSS animation
            const style = win.document.createElement('style');
            style.textContent = `
      @keyframes flash-overlay {
        0% { background-color: rgba(52, 152, 219, 0.15); }
        50% { background-color: rgba(52, 152, 219, 0.05); }
        100% { background-color: rgba(52, 152, 219, 0.15); }
      }
    `;

            win.document.head.appendChild(style);
            win.document.body.appendChild(overlay);
            win.document.body.appendChild(navText);

            // Log the navigation effect
            cy.log('🎬 Showing navigation effect');

            // Wait to show the navigation effect
            cy.wait(1500);

            // Log before cleanup
            cy.log('🧹 Cleaning up navigation effect');

            // Clean up
            cy.then(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
                if (navText.parentNode) {
                    navText.parentNode.removeChild(navText);
                }
                if (style.parentNode) {
                    style.parentNode.removeChild(style);
                }

                // Small delay before navigation
                cy.wait(500);
            });
        });

        // Navigate to the URL
        cy.visit(url);
    });
};

highlightNavigation();