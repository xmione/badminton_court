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
  // Create a verified user using our updated endpoint
  cy.request({
    method: 'POST',
    url: '/api/test-create-user/',
    body: {
      email,
      password
    },
    timeout: 10000,
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