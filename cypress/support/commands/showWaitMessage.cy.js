// cypress/support/commands/showWaitMessage.cy.js
export const showWaitMessage = () => {
    // New command to display a wait message overlay
    Cypress.Commands.add('showWaitMessage', (message, duration = 3000) => {
        cy.log(`⏳ Displaying wait message: ${message}`);

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
      animation: wait-pulse 2s ease-in-out infinite;
    `;

            // Create wait message container
            const messageContainer = win.document.createElement('div');
            messageContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      text-align: center;
      padding: 24px;
      background-color: rgba(255, 255, 255, 0.98);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(0, 0, 0, 0.05);
      max-width: 80%;
    `;

            // Create spinner
            const spinner = win.document.createElement('div');
            spinner.style.cssText = `
      width: 32px;
      height: 32px;
      border: 3px solid rgba(52, 152, 219, 0.2);
      border-top: 3px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    `;

            // Create message text
            const messageText = win.document.createElement('div');
            messageText.style.cssText = `
      font-size: 22px;
      font-weight: 600;
      color: #2c3e50;
      text-shadow: 0 1px 2px rgba(0,0,0,0.1);
      margin-bottom: 8px;
      white-space: nowrap;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.4;
    `;
            messageText.textContent = message;

            // Create subtext
            const subText = win.document.createElement('div');
            subText.style.cssText = `
      font-size: 16px;
      color: #7f8c8d;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.3;
    `;
            subText.textContent = 'Please wait...';

            // Add CSS animations
            const style = win.document.createElement('style');
            style.textContent = `
      @keyframes wait-pulse {
        0% { background-color: rgba(52, 152, 219, 0.15); }
        50% { background-color: rgba(52, 152, 219, 0.05); }
        100% { background-color: rgba(52, 152, 219, 0.15); }
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;

            // Assemble and append elements
            messageContainer.appendChild(spinner);
            messageContainer.appendChild(messageText);
            messageContainer.appendChild(subText);

            win.document.head.appendChild(style);
            win.document.body.appendChild(overlay);
            win.document.body.appendChild(messageContainer);

            // Log the message display
            cy.log('⏳ Showing wait message overlay');

            // Wait for the specified duration
            cy.wait(duration);

            // Log before cleanup
            cy.log('🧹 Cleaning up wait message');

            // Clean up
            cy.then(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
                if (messageContainer.parentNode) {
                    messageContainer.parentNode.removeChild(messageContainer);
                }
                if (style.parentNode) {
                    style.parentNode.removeChild(style);
                }
            });
        });
    });
};

showWaitMessage();