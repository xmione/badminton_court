// cypress/support/commands/hideStatusMessage.cy.js
export const hideStatusMessage = () => {
    // Command to hide a status message
    Cypress.Commands.add('hideStatusMessage', (messageId) => {
        cy.log(`📢 Hiding status message (ID: ${messageId})`);

        cy.window().then((win) => {
            const message = statusMessages[messageId];

            if (message) {
                // Remove elements from DOM
                if (message.overlay && message.overlay.parentNode) {
                    message.overlay.parentNode.removeChild(message.overlay);
                }

                if (message.messageContainer && message.messageContainer.parentNode) {
                    message.messageContainer.parentNode.removeChild(message.messageContainer);
                }

                // Remove from storage
                delete statusMessages[messageId];

                cy.log(`📢 Status message hidden (ID: ${messageId})`);
            } else {
                cy.log(`⚠️ Status message not found (ID: ${messageId})`);
            }
        });
    });
};

hideStatusMessage();