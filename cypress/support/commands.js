// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add('login', (username, password) => {
  cy.visit('/admin/login/')
  cy.get('#id_username').type(username)
  cy.get('#id_password').type(password)
  cy.get('input[type="submit"]').click()
})

Cypress.Commands.add('logout', () => {
  cy.get('a[href="/admin/logout/"]').click()
})

// Command to reset the database
Cypress.Commands.add('resetDatabase', () => {
  cy.log('Resetting database for clean test state')

  // Make a request to a custom Django view that resets the database
  cy.request({
    method: 'POST',
    url: '/api/test-reset-database/',
    timeout: 10000,  // Increase timeout to 10 seconds
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 200) {
      cy.log('Database reset successfully')
    } else {
      cy.log(`Database reset failed with status ${response.status}: ${JSON.stringify(response.body)}`)
    }
  })
})

// Command to create a verified user for testing
Cypress.Commands.add('createVerifiedUser', (email, password) => {
  cy.log(`Creating verified user with email: ${email}`)

  // Make a request to a custom Django view that creates a verified user
  cy.request({
    method: 'POST',
    url: '/api/test-create-user/',
    body: {
      email,
      password
    },
    timeout: 10000,  // Increase timeout to 10 seconds
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 200) {
      cy.log('User created successfully')
    } else {
      cy.log(`User creation failed with status ${response.status}: ${JSON.stringify(response.body)}`)
      // Try to create the user through the UI if the API fails
      cy.visit('/accounts/signup/')
      cy.get('#id_email').type(email)
      cy.get('#id_password1').type(password)
      cy.get('#id_password2').type(password)
      cy.get('button[type="submit"]').click()

      // If we get a verification message, that's fine
      cy.get('body').then(($body) => {
        const pageText = $body.text()
        if (pageText.includes('verification') || pageText.includes('Verification') ||
          pageText.includes('email') || pageText.includes('Email')) {
          cy.log('User created through UI with verification required')
          // Verify the user through the API
          cy.verifyUser(email)
        }
      })
    }
  })
})

// Command to verify a user in the database
Cypress.Commands.add('verifyUser', (email) => {
  cy.log(`Verifying user with email: ${email}`)

  // Make a request to a custom Django view that verifies a user
  cy.request({
    method: 'POST',
    url: '/api/test-verify-user/',
    body: {
      email
    },
    timeout: 10000,  // Increase timeout to 10 seconds
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 200) {
      cy.log('User verified successfully')
    } else {
      cy.log(`User verification failed with status ${response.status}: ${JSON.stringify(response.body)}`)
      // Continue with tests even if verification fails
    }
  })
})

// Command to setup test admin users
Cypress.Commands.add('setupTestAdmin', (options = {}) => {
  cy.log('Setting up test admin users')

  const defaultOptions = {
    reset: true,
    username: 'admin',
    password: 'password',
    email: 'admin@example.com'
  }

  const finalOptions = { ...defaultOptions, ...options }

  // Make a request to setup test admin users with increased timeout and retry
  cy.request({
    method: 'POST',
    url: '/api/test-setup-admin/',
    body: finalOptions,
    timeout: 120000,  // Increase timeout to 120 seconds (2 minutes)
    retryOnNetworkFailure: true,  // Retry on network failures
    retryOnStatusCodeFailure: false,  // Don't retry on status code failures
    failOnStatusCode: false  // Don't fail on non-2xx status codes
  }).then((response) => {
    if (response.status === 200) {
      cy.log(response.body.message)
    } else {
      cy.log(`Admin setup failed with status ${response.status}: ${JSON.stringify(response.body)}`)

      // Try a fallback approach - create admin user directly via Django shell
      cy.log('Trying fallback approach...')
      cy.exec(`python manage.py shell -c "
from django.contrib.auth.models import User
try:
    # Delete existing admin user if reset is true
    if ${finalOptions.reset}:
        User.objects.filter(username='${finalOptions.username}').delete()
    
    # Create or update admin user
    admin_user, created = User.objects.get_or_create(
        username='${finalOptions.username}',
        defaults={
            'email': '${finalOptions.email}',
            'is_superuser': True,
            'is_staff': True,
            'is_active': True,
        }
    )
    
    # Always set the password
    admin_user.set_password('${finalOptions.password}')
    admin_user.save()
    
    if created:
        print('Admin user created successfully via fallback')
    else:
        print('Admin user updated successfully via fallback')
        
except Exception as e:
    print(f'Error in fallback: {str(e)}')
    raise
"`, { timeout: 60000, failOnNonZeroExit: false }).then((result) => {
        if (result.code === 0) {
          cy.log(result.stdout)
        } else {
          cy.log(`Fallback approach failed: ${result.stderr}`)
          throw new Error('Both API and fallback approaches failed to create admin user')
        }
      })
    }
  })
})

// Command for admin login with setup
Cypress.Commands.add('adminLogin', (username = 'admin', password = 'password', setup = true) => {
  if (setup) {
    cy.setupTestAdmin({ username, password })
  }

  cy.visit('/admin/login/')
  cy.get('#id_username').type(username)
  cy.get('#id_password').type(password)
  cy.get('input[type="submit"]').click()
})

// Command to create admin user using the existing management command
Cypress.Commands.add('createAdminUser', (username = 'admin', password = 'password', reset = false) => {
  cy.log(`Creating admin user: ${username}`)

  // Build the command arguments
  const args = ['load_test_admin', `--username=${username}`, `--password=${password}`]
  if (reset) args.push('--reset')

  // Execute the Django management command
  cy.exec(`python manage.py ${args.join(' ')}`, {
    timeout: 60000,  // Increase timeout to 60 seconds
    failOnNonZeroExit: false
  }).then((result) => {
    if (result.code === 0) {
      cy.log('Admin user created successfully')
      cy.log(result.stdout)
    } else {
      cy.log(`Failed to create admin user: ${result.stderr}`)
      // Fallback: try creating user directly through Django shell
      cy.exec(`python manage.py shell -c "
from django.contrib.auth.models import User
try:
    user = User.objects.get(username='${username}')
    user.set_password('${password}')
    user.is_superuser = True
    user.is_staff = True
    user.save()
    print('Admin user updated successfully')
except User.DoesNotExist:
    User.objects.create_superuser('${username}', 'admin@example.com', '${password}')
    print('Admin user created successfully')
"`, { timeout: 30000 })
    }
  })
})

// Command to create test data for bookings (customers and courts)
Cypress.Commands.add('createBookingTestData', () => {
  cy.log('Creating test data for bookings')
  
  // Make a request to create test customers and courts
  cy.request({
    method: 'POST',
    url: '/api/test-create-booking-data/',
    timeout: 30000,
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 200) {
      cy.log(response.body.message)
    } else {
      cy.log(`Failed to create booking test data: ${response.body.message}`)
      throw new Error(`Failed to create booking test data: ${response.body.message}`)
    }
  })
})

Cypress.Commands.add('loginAsRegularUser', (email = 'paysol.postal@gmail.com', password = 'StrongPassword123!') => {
  // First check if the server is running
  cy.request({
    method: 'GET',
    url: '/',
    timeout: 5000,
    failOnStatusCode: false
  }).then((response) => {
    if (response.status !== 200) {
      cy.log('Server is not responding properly. Make sure Django server is running on localhost:8000');
      throw new Error('Server not responding');
    }
  });

  // Create a verified user using our updated endpoint
  cy.request({
    method: 'POST',
    url: '/api/test-create-user/',
    body: {
      email,
      password
    },
    timeout: 30000,
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 200) {
      cy.log('User created and verified successfully')
    } else {
      cy.log(`User creation failed: ${JSON.stringify(response.body)}`)
    }
  })
  
  // Now login with the user
  cy.visit('/accounts/login/')
  cy.get('#id_login').type(email)
  cy.get('#id_password').type(password)
  cy.get('button[type="submit"]').click()
  
  // Wait for login to complete and verify we're redirected to home page
  cy.url().should('eq', 'http://localhost:8000/')
  
  // Verify the user is actually authenticated by checking for the user dropdown in the navbar
  cy.get('.navbar-nav .dropdown-toggle').should('contain', email.split('@')[0])
  
  // Wait a moment for the page to fully load
  cy.wait(1000)
})

// Custom command to add neon highlighting and arrow to an element
Cypress.Commands.add('highlightWithArrow', { prevSubject: 'element' }, (subject, options = {}) => {
  // Default options
  const {
    duration = 2000, // How long to highlight before clicking (ms)
    borderColor = '#00ff00', // Neon green
    borderWidth = '10px', // Thicker border
    glowColor = '#00ff00', // Glow color
    arrowColor = '#00ff00', // Changed to green to match
    backgroundColor = 'rgba(0, 255, 0, 0.1)', // Very subtle background
    arrowPosition = 'auto', // 'auto', 'top', 'bottom', 'left', 'right'
    arrowSize = '60px' // Size of the arrow
  } = options;

  // Generate unique ID for this highlight
  const highlightId = 'cypress-highlight-' + Date.now();
  const arrowId = 'cypress-arrow-' + Date.now();

  // Store original styles
  const originalStyles = {
    border: subject[0].style.border,
    backgroundColor: subject[0].style.backgroundColor,
    borderRadius: subject[0].style.borderRadius,
    zIndex: subject[0].style.zIndex,
    position: subject[0].style.position,
    transition: subject[0].style.transition,
    transform: subject[0].style.transform,
    boxShadow: subject[0].style.boxShadow,
    outline: subject[0].style.outline
  };

  // Apply highlight styles using Cypress
  cy.wrap(subject).then(($el) => {
    // Add inline styles directly to the element
    $el.css({
      border: `${borderWidth} solid ${borderColor}`,
      backgroundColor: backgroundColor,
      borderRadius: '5px',
      zIndex: '9999',
      position: 'relative',
      transition: 'all 0.3s ease',
      transform: 'scale(1.02)',
      boxShadow: `0 0 20px ${glowColor}, 0 0 30px ${glowColor}, 0 0 40px ${glowColor}`,
      outline: `${borderWidth} solid ${borderColor}`
    });
    
    // Add a class for potential additional styling
    $el.addClass(highlightId);
  });

  // Create and position arrow using Cypress
  cy.window().then((win) => {
    // Get element position and dimensions
    const elementRect = subject[0].getBoundingClientRect();
    const centerX = elementRect.left + elementRect.width / 2;
    const centerY = elementRect.top + elementRect.height / 2;
    
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
    const style = win.document.createElement('style');
    style.textContent = `
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
      
      .${highlightId} {
        animation: neon-glow 1s infinite !important;
      }
    `;
    
    win.document.head.appendChild(style);
    win.document.body.appendChild(arrow);
    
    // Log the highlight action
    cy.log(`⭐ Highlighting element with ${position} arrow for ${duration}ms`);
    
    // Wait for the highlight duration
    cy.wait(duration);
    
    // Clean up: remove highlight and arrow
    cy.wrap(subject).then(($el) => {
      // Restore original styles
      $el.css(originalStyles);
      $el.removeClass(highlightId);
      
      // Remove arrow
      const arrowElement = win.document.getElementById(arrowId);
      if (arrowElement) {
        arrowElement.remove();
      }
      
      // Remove style tag
      const styleElements = win.document.querySelectorAll('style');
      styleElements.forEach((el) => {
        if (el.textContent.includes('neon-glow') || el.textContent.includes('arrow-pulse')) {
          el.remove();
        }
      });
    });
  });
});

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

// Object to store active status messages
const statusMessages = {};

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