// cypress/support/commands/highlightWithArrow.cy.js
export const highlightWithArrow = () => {
    // Custom command to add neon highlighting and arrow to an element using overlay
    Cypress.Commands.add('highlightWithArrow', { prevSubject: 'element' }, (subject, options = {}) => {
        // Default options
        const {
            duration = 2000, // How long to highlight before clicking (ms)
            borderColor = '#00ff00', // Neon green
            borderWidth = '10px', // Thicker border
            glowColor = '#00ff00', // Glow color
            arrowColor = '#00ff00', // Changed to green to match
            arrowPosition = 'auto', // 'auto', 'top', 'bottom', 'left', 'right'
            arrowSize = '60px' // Size of the arrow
        } = options;

        // Generate unique ID for this highlight
        const highlightId = 'cypress-highlight-' + Date.now();
        const arrowId = 'cypress-arrow-' + Date.now();

        cy.window().then((win) => {
            // Get element position and dimensions
            const elementRect = subject[0].getBoundingClientRect();
            const centerX = elementRect.left + elementRect.width / 2;
            const centerY = elementRect.top + elementRect.height / 2;

            // Create overlay div
            const overlay = win.document.createElement('div');
            overlay.id = highlightId;
            overlay.style.cssText = `
      position: fixed;
      top: ${elementRect.top}px;
      left: ${elementRect.left}px;
      width: ${elementRect.width}px;
      height: ${elementRect.height}px;
      border: ${borderWidth} solid ${borderColor};
      border-radius: 5px;
      z-index: 9999;
      pointer-events: none;
      background-color: transparent;
      box-shadow: 0 0 20px ${glowColor}, 0 0 30px ${glowColor}, 0 0 40px ${glowColor};
      animation: neon-glow 1s infinite;
    `;

            // Add CSS animation for the overlay
            const style = win.document.createElement('style');
            style.textContent = `
      @keyframes neon-glow {
        0% { 
          box-shadow: 0 0 5px ${glowColor}, 0 0 10px ${glowColor}, 0 0 15px ${glowColor}, 0 0 20px ${glowColor}; 
          filter: brightness(1);
        }
        50% { 
          box-shadow: 0 0 10px ${glowColor}, 0 0 20px ${glowColor}, 0 0 30px ${glowColor}, 0 0 40px ${glowColor}; 
          filter: brightness(1.2);
        }
        100% { 
          box-shadow: 0 0 5px ${glowColor}, 0 0 10px ${glowColor}, 0 0 15px ${glowColor}, 0 0 20px ${glowColor}; 
          filter: brightness(1);
        }
      }
    `;

            win.document.head.appendChild(style);
            win.document.body.appendChild(overlay);

            // Determine arrow position
            let position = arrowPosition;
            if (position === 'auto') {
                // Auto-determine best position based on element location
                const viewportWidth = win.innerWidth;
                const viewportHeight = win.innerHeight;

                if (centerY < viewportHeight * 0.3) {
                    position = 'bottom'; // Element is in top third, put arrow below
                } else if (centerY > viewportHeight * 0.7) {
                    position = 'top'; // Element is in bottom third, put arrow above
                } else if (centerX < viewportWidth * 0.3) {
                    position = 'right'; // Element is in left third, put arrow to the right
                } else {
                    position = 'left'; // Element is in right third, put arrow to the left
                }
            }

            // Choose arrow character based on position
            const arrowChars = {
                'top': '⬇️',
                'bottom': '⬆️',
                'left': '➡️',
                'right': '⬅️'
            };

            const arrowChar = arrowChars[position];

            // Create arrow element
            const arrow = win.document.createElement('div');
            arrow.id = arrowId;
            arrow.textContent = arrowChar;

            // Calculate arrow position based on position
            let arrowTop, arrowLeft;
            const arrowDistance = 80; // Distance from element

            switch (position) {
                case 'top':
                    arrowTop = elementRect.top - arrowDistance;
                    arrowLeft = centerX - 30; // Center the arrow horizontally
                    break;
                case 'bottom':
                    arrowTop = elementRect.bottom + arrowDistance - 60;
                    arrowLeft = centerX - 30; // Center the arrow horizontally
                    break;
                case 'left':
                    arrowTop = centerY - 30; // Center the arrow vertically
                    arrowLeft = elementRect.left - arrowDistance;
                    break;
                case 'right':
                    arrowTop = centerY - 30; // Center the arrow vertically
                    arrowLeft = elementRect.right + arrowDistance - 60;
                    break;
            }

            // Apply arrow styles
            arrow.style.cssText = `
      position: fixed;
      font-size: ${arrowSize};
      z-index: 10000;
      top: ${arrowTop}px;
      left: ${arrowLeft}px;
      color: ${arrowColor};
      text-shadow: 0 0 20px ${arrowColor}, 0 0 40px ${arrowColor}, 0 0 60px ${arrowColor};
      animation: arrow-pulse 0.8s infinite;
      filter: brightness(1.5) saturate(2);
      pointer-events: none;
      font-weight: bold;
      transform-origin: center;
    `;

            // Add CSS animation for arrow pulse
            const arrowStyle = win.document.createElement('style');
            arrowStyle.textContent = `
      @keyframes arrow-pulse {
        0% { 
          opacity: 0.7; 
          transform: scale(1) rotate(0deg); 
        }
        50% { 
          opacity: 1; 
          transform: scale(1.3) rotate(5deg); 
        }
        100% { 
          opacity: 0.7; 
          transform: scale(1) rotate(0deg); 
        }
      }
    `;

            win.document.head.appendChild(arrowStyle);
            win.document.body.appendChild(arrow);

            // Log the highlight action
            cy.log(`⭐ Highlighting element with ${position} arrow for ${duration}ms`);

            // Wait for the highlight duration
            cy.wait(duration);

            // Clean up: remove overlay and arrow
            cy.then(() => {
                const overlayElement = win.document.getElementById(highlightId);
                if (overlayElement) {
                    overlayElement.remove();
                }

                const arrowElement = win.document.getElementById(arrowId);
                if (arrowElement) {
                    arrowElement.remove();
                }

                // Remove style tags
                const styleElements = win.document.querySelectorAll('style');
                styleElements.forEach((el) => {
                    if (el.textContent.includes('neon-glow') || el.textContent.includes('arrow-pulse')) {
                        el.remove();
                    }
                });
            });
        });
    });

};

highlightWithArrow();