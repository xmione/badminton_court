// cypress/e2e/inventory/inventory.cy.js
import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

// -------------------------------------------------------------------
// Background / Common steps
// -------------------------------------------------------------------
Given('I am logged in as an admin', () => {
  cy.adminLogin(); // uses your custom admin login command
});

// -------------------------------------------------------------------
// Navigation helpers
// -------------------------------------------------------------------
When('I navigate to the Product admin list page', () => {
  cy.visit('/admin/inventory/product/');
});

When('I navigate to the Inventory Transaction admin list page', () => {
  cy.visit('/admin/inventory/inventorytransaction/');
});

When('I click the {string} button', (buttonText) => {
  cy.contains('a', buttonText).click();
});

// -------------------------------------------------------------------
// Form filling (Product)
// -------------------------------------------------------------------
When('I fill in the product creation form with:', (dataTable) => {
  const data = dataTable.rowsHash();
  if (data.name) cy.get('#id_name').clear().type(data.name);
  if (data.sku) cy.get('#id_sku').clear().type(data.sku);
  if (data.category) {
    // Select category by name (assuming a <select>, we can use cy.select)
    cy.get('#id_category').select(data.category);
  }
  if (data.quantity_on_hand) cy.get('#id_quantity_on_hand').clear().type(data.quantity_on_hand);
  if (data.reorder_level) cy.get('#id_reorder_level').clear().type(data.reorder_level);
  if (data.unit_cost) cy.get('#id_unit_cost').clear().type(data.unit_cost);
  if (data.location) cy.get('#id_location').clear().type(data.location);
});

When('I submit the product form', () => {
  cy.get('input[type="submit"][value="Save"]').click();
});

// -------------------------------------------------------------------
// Form filling (Transaction)
// -------------------------------------------------------------------
When('I fill in the transaction creation form with:', (dataTable) => {
  const data = dataTable.rowsHash();
  // Product – it's a ForeignKey, use a <select> dropdown
  if (data.product) {
    cy.get('#id_product').select(data.product);
  }
  // Transaction type: select by visible text
  if (data.transaction_type) {
    cy.get('#id_transaction_type').select(data.transaction_type);
  }
  if (data.quantity) cy.get('#id_quantity').clear().type(data.quantity);
  if (data.unit_price) cy.get('#id_unit_price').clear().type(data.unit_price);
  if (data.notes) cy.get('#id_notes').clear().type(data.notes);
});

When('I submit the transaction form', () => {
  cy.get('input[type="submit"][value="Save"]').click();
});

// -------------------------------------------------------------------
// Assertions – Product
// -------------------------------------------------------------------
Then('I should see a success message {string}', (message) => {
  cy.contains('.messagelist li.success', message).should('be.visible');
});

Then('the product {string} should appear in the product list', (productName) => {
  cy.get('#result_list').contains('tr', productName).should('be.visible');
});

Then('the product {string} should have a quantity on hand of {string}', (productName, expectedQty) => {
  // Navigate back to product list (or use the link after creation)
  cy.visit('/admin/inventory/product/');
  // Find the row containing the product name, then verify the quantity column
  cy.get('#result_list').contains('tr', productName)
    .find('.field-quantity_on_hand')
    .should('contain', expectedQty);
});

// -------------------------------------------------------------------
// Precondition helpers (given a product with a certain quantity)
// -------------------------------------------------------------------
Given('the product {string} has a quantity on hand of {string}', (productName, quantity) => {
  // Directly update via API or admin bulk edit – for simplicity,
  // we navigate to the product change page and set the quantity.
  // First, go to product list to find the link.
  cy.visit('/admin/inventory/product/');
  cy.contains('tr', productName).click(); // click the row (opens change form)
  cy.get('#id_quantity_on_hand').clear().type(quantity);
  cy.get('input[type="submit"][value="Save"]').click();
  // Back to list for later steps
  cy.visit('/admin/inventory/product/');
});

Given('the product {string} has a quantity on hand of {string} and reorder level of {string}', (productName, quantity, reorder) => {
  cy.visit('/admin/inventory/product/');
  cy.contains('tr', productName).click();
  cy.get('#id_quantity_on_hand').clear().type(quantity);
  cy.get('#id_reorder_level').clear().type(reorder);
  cy.get('input[type="submit"][value="Save"]').click();
  cy.visit('/admin/inventory/product/');
});

// -------------------------------------------------------------------
// Low‑stock alert checks
// -------------------------------------------------------------------
When('the low‑stock check task runs', () => {
  // Call the Celery task directly via a management command endpoint or a custom URL.
  // For testing, we might have a special view that triggers the task.
  // As a fallback, we simulate by calling the task programmatically if it's exposed.
  // We'll assume you have a test endpoint like /admin/run-low-stock-check/
  // If not, you can run a Django management command via cy.exec (requires backend setup).
  cy.visit('/admin/'); // place holder
  // Example: cy.request('GET', '/api/run-low-stock-check/');
  // Or use cy.exec to run manage.py command:
  cy.exec('python manage.py check_low_stock --test 2>&1', { failOnNonZeroExit: false }).then((result) => {
    cy.log('Low-stock check output:', result.stdout);
  });
  // Wait for email to be processed (if using a test mail backend)
  cy.wait(2000); // allow async email sending
});

Then('I should see an email notification for {string} in the test mailbox', (productName) => {
  // Check the test email backend. If using django.core.mail.outbox,
  // we can inspect the outbox via a custom admin view or test API.
  // For demo purposes, we'll assume a custom admin URL that shows test emails.
  cy.visit('/admin/email_test_view/'); // hypothetical
  cy.contains('.email-item', productName).should('exist');
});

Then('the product {string} should be marked as low stock in the admin product list', (productName) => {
  cy.visit('/admin/inventory/product/');
  // Look for a visual indicator, e.g., a red background or a badge class
  cy.contains('tr', productName)
    .should('have.class', 'low-stock') // or custom class
    .and('be.visible');
});