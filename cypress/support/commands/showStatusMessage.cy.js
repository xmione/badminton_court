// cypress/support/commands/showStatusMessage.cy.js
export const showStatusMessage = () => {
    // Command to show a status message
    Cypress.Commands.add('showStatusMessage', (message, options = {}) => {
        const {
            id = null, // Optional ID for the message
            persistent = false, // Whether the message persists until explicitly hidden
            position = 'center', // 'center', 'top', 'bottom'
            showSpinner = false, // Whether to show a spinner
            subText = '' // Optional subtext
        } = options;

        // Generate unique ID if not provided
        const messageId = id || 'status-message-' + Date.now();

        cy.log(`📢 Showing status message: ${message} (ID: ${messageId})`);

        // First, hide any existing message with the same ID
        cy.hideStatusMessage(messageId);

        // Now create the new message
        return cy.window().then((win) => {
            // Create overlay
            const overlay = win.document.createElement('div');
            overlay.id = `${messageId}-overlay`;
            overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(255, 255, 255, 0.95);
      z-index: 9997;
      pointer-events: none;
      backdrop-filter: blur(2px);
      ${persistent ? '' : 'animation: status-pulse 2s ease-in-out infinite;'}
    `;


            // Create message container
            const messageContainer = win.document.createElement('div');
            messageContainer.id = `${messageId}-container`;

            // Position the container based on the position option
            let containerStyles;
            if (position === 'top') {
                containerStyles = `
        position: fixed;
        top: 50px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        z-index: 9998;
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
            } else if (position === 'bottom') {
                containerStyles = `
        position: fixed;
        bottom: 50px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        z-index: 9998;
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
            } else { // center (default)
                containerStyles = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        z-index: 9998;
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
            }

            messageContainer.style.cssText = containerStyles;

            // Create spinner if requested
            if (showSpinner) {
                const spinner = win.document.createElement('div');
                spinner.id = `${messageId}-spinner`;
                spinner.style.cssText = `
        width: 32px;
        height: 32px;
        border: 3px solid rgba(52, 152, 219, 0.2);
        border-top: 3px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 16px;
      `;
                messageContainer.appendChild(spinner);
            }

            // Create message text
            const messageText = win.document.createElement('div');
            messageText.id = `${messageId}-text`;
            messageText.style.cssText = `
      font-size: 22px;
      font-weight: 600;
      color: #2c3e50;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.4;
      text-align: center;
      margin-bottom: ${subText ? '8px' : '0'};
      white-space: nowrap;
      text-shadow: 0 1px 2px rgba(0,0,0,0.1);
    `;

            messageText.textContent = message;
            messageContainer.appendChild(messageText);

            // Create subtext if provided
            if (subText) {
                const subTextElement = win.document.createElement('div');
                subTextElement.id = `${messageId}-subtext`;
                subTextElement.style.cssText = `
        font-size: 16px;
        color: #7f8c8d;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        line-height: 1.3;
        text-align: center;
        font-weight: 400;
      `;

                subTextElement.textContent = subText;
                messageContainer.appendChild(subTextElement);
            }

            // Add CSS animations
            const styleId = `${messageId}-style`;
            const existingStyle = win.document.getElementById(styleId);

            if (!existingStyle) {
                const style = win.document.createElement('style');
                style.id = styleId;
                style.textContent = `
        @keyframes status-pulse {
          0% { background-color: rgba(0, 255, 0, 0.15); }
          50% { background-color: rgba(0, 255, 0, 0.05); }
          100% { background-color: rgba(0, 255, 0, 0.15); }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
                win.document.head.appendChild(style);
            }

            // Append elements to DOM
            win.document.body.appendChild(overlay);
            win.document.body.appendChild(messageContainer);

            // Store reference to the message elements
            statusMessages[messageId] = {
                overlay,
                messageContainer,
                styleId
            };

            cy.log(`📢 Status message displayed (ID: ${messageId})`);

            // Return the message ID using cy.wrap to make it available to the test
            return cy.wrap(messageId);
        });
    });
};

showStatusMessage();