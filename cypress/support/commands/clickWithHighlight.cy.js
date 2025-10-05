// cypress/support/commands/clickWithHighlight.cy.js
export const clickWithHighlight = () => {
    // Custom command to highlight and click an element with arrow position control
    Cypress.Commands.add('clickWithHighlight', { prevSubject: 'element' }, (subject, options = {}) => {
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

        // Click the element
        cy.wrap(subject).click(options);
    });
};

clickWithHighlight();