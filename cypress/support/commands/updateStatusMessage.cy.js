// cypress/support/commands/updateStatusMessage.cy.js

import { statusMessages } from './statusMessagesStore.js';
export const updateStatusMessage = () => {
    // Command to update an existing status message
    Cypress.Commands.add('updateStatusMessage', (messageId, newText, newSubText = null) => {
        cy.log(`📢 Updating status message (ID: ${messageId})`);

        cy.window().then((win) => {
            const message = statusMessages[messageId];

            if (message) {
                const textElement = win.document.getElementById(`${messageId}-text`);
                const subTextElement = win.document.getElementById(`${messageId}-subtext`);

                if (textElement) {
                    textElement.textContent = newText;
                    // Apply professional styling to ensure it matches the new design
                    textElement.style.cssText = `
          font-size: 22px;
          font-weight: 600;
          color: #2c3e50;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          line-height: 1.4;
          text-align: center;
          margin-bottom: ${newSubText ? '8px' : '0'};
          white-space: nowrap;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        `;
                    cy.log(`📢 Status message text updated (ID: ${messageId})`);
                }

                if (subTextElement && newSubText) {
                    subTextElement.textContent = newSubText;
                    // Apply professional styling to subtext
                    subTextElement.style.cssText = `
          font-size: 16px;
          color: #7f8c8d;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          line-height: 1.3;
          text-align: center;
          font-weight: 400;
        `;
                    cy.log(`📢 Status message subtext updated (ID: ${messageId})`);
                } else if (subTextElement && !newSubText) {
                    subTextElement.remove();
                    cy.log(`📢 Status message subtext removed (ID: ${messageId})`);
                } else if (!subTextElement && newSubText) {
                    const newSubTextElement = win.document.createElement('div');
                    newSubTextElement.id = `${messageId}-subtext`;
                    // Apply professional styling to new subtext element
                    newSubTextElement.style.cssText = `
          font-size: 16px;
          color: #7f8c8d;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          line-height: 1.3;
          text-align: center;
          font-weight: 400;
        `;
                    newSubTextElement.textContent = newSubText;

                    const messageContainer = win.document.getElementById(`${messageId}-container`);
                    if (messageContainer) {
                        messageContainer.appendChild(newSubTextElement);
                    }
                    cy.log(`📢 Status message subtext added (ID: ${messageId})`);
                }
            } else {
                cy.log(`⚠️ Status message not found (ID: ${messageId})`);
            }
        });
    });
};

updateStatusMessage();