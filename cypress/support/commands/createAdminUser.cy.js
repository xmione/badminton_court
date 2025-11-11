// cypress/support/commands/createAdminUser.cy.js
export const createAdminUser = () => {
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
from django.conf import settings
from django.contrib.auth.models import User
try:
    user = User.objects.get(username='${username}')
    user.set_password('${password}')
    user.is_superuser = True
    user.is_staff = True
    user.save()
    print('Admin user updated successfully')
except User.DoesNotExist:
    # Get domain from settings or use default
    domain = getattr(settings, 'POSTE_DOMAIN')
    User.objects.create_superuser('${username}', f'${username}@{domain}', '${password}')
    print('Admin user created successfully')
"`, { timeout: 30000 })
            }
        })
    })

};

createAdminUser();