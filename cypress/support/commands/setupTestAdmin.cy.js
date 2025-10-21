// cypress/support/commands/setupTestAdmin.cy.js
export const setupTestAdmin = () => {

    // Command to setup test admin users
    Cypress.Commands.add('setupTestAdmin', (options = {}) => {
        cy.log('Setting up test admin users')

        const defaultOptions = {
            reset: true,
            username: Cypress.env('ADMIN_EMAIL'),
            password: Cypress.env('ADMIN_PASSWORD'),
            email: Cypress.env('ADMIN_EMAIL')
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
};

setupTestAdmin();