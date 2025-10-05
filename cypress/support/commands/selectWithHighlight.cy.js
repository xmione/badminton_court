// cypress/support/commands/selectWithHighlight.cy.js
export const selectWithHighlight = () => {
    // Custom command to highlight and select from dropdown with arrow position control
    Cypress.Commands.add('selectWithHighlight', { prevSubject: 'element' }, (subject, value, options = {}) => {
        const {
            duration = 2000,
            arrowPosition = 'auto',
            ...highlightOptions
        } = options;

        // Apply highlight with arrow
        cy.wrap(subject).highlightWithArrow({
            duration,
            borderColor: '#00ff00',
            borderWidth: '10px',
            arrowColor: '#00ff00',
            arrowPosition: arrowPosition,
            ...highlightOptions
        });

        // Select the value
        cy.wrap(subject).select(value, options);
    });
};

selectWithHighlight();