// cypress/support/commands/typeWithHighlight.cy.js
export const typeWithHighlight = () => {
    // Custom command to highlight and type text with arrow position control
    Cypress.Commands.add('typeWithHighlight', { prevSubject: 'element' }, (subject, text, options = {}) => {
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

        // Type the text
        cy.wrap(subject).type(text, options);
    });
};

typeWithHighlight();