// cypress/support/step_definitions/inventory.js
import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

// -------------------------------------------------------------------
// Background
// -------------------------------------------------------------------
Given('I am logged in as an admin', () => {
  cy.adminLogin();
  cy.createAdminGroup();
  cy.addUserToAdminGroup();
});

// -------------------------------------------------------------------
// Navigation
// -------------------------------------------------------------------
When('I navigate to the Product admin list page', () => {
  cy.visit('/admin/inventory/product/');
});

When('I navigate to the Inventory Transaction admin list page', () => {
  cy.visit('/admin/inventory/inventorytransaction/');
});

When('I click the {string} button', (buttonText) => {
  // Django admin "Add" button is a link with text like "Add product"
  cy.contains('a', buttonText).click();
});

// -------------------------------------------------------------------
// Form filling – Product
// -------------------------------------------------------------------
When('I fill in the product creation form with:', (dataTable) => {
  // dataTable.raw() returns a 2D array, the first row contains keys
  const raw = dataTable.raw();
  const headers = raw[0];
  const values = raw[1];
  const data = {};
  headers.forEach((key, i) => {
    data[key] = values[i];
  });

  if (data.name) cy.get('#id_name').clear().type(data.name);
  if (data.sku) cy.get('#id_sku').clear().type(data.sku);
  if (data.category) {
    // Assume category is a select field – use the visible text
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
// Form filling – Transaction
// -------------------------------------------------------------------
When('I fill in the transaction creation form with:', (dataTable) => {
  const raw = dataTable.raw();
  const headers = raw[0];
  const values = raw[1];
  const data = {};
  headers.forEach((key, i) => {
    data[key] = values[i];
  });

  // Product is a ForeignKey – select by visible name
  if (data.product) cy.get('#id_product').select(data.product);
  // Transaction type: select by visible text
  if (data.transaction_type) cy.get('#id_transaction_type').select(data.transaction_type);
  if (data.quantity) cy.get('#id_quantity').clear().type(data.quantity);
  if (data.unit_price) cy.get('#id_unit_price').clear().type(data.unit_price);
  if (data.notes) cy.get('#id_notes').clear().type(data.notes);
});

When('I submit the transaction form', () => {
  cy.get('input[type="submit"][value="Save"]').click();
});

// -------------------------------------------------------------------
// Success messages & list checks
// -------------------------------------------------------------------
Then('I should see a success message {string}', (message) => {
  cy.contains('.messagelist li.success', message, { timeout: 5000 }).should('be.visible');
});

Then('the product {string} should appear in the product list', (productName) => {
  // Navigate back to product list (already there after creation redirect)
  cy.visit('/admin/inventory/product/');
  cy.get('#result_list').contains('tr', productName).should('be.visible');
});

// -------------------------------------------------------------------
// Preconditions: setting product quantities
// -------------------------------------------------------------------
Given('the product {string} has a quantity on hand of {string}', (productName, quantity) => {
  // Create product if it doesn't exist, then set quantity
  ensureProductExistsAndSetQuantity(productName, quantity);
});

Given('the product {string} has a quantity on hand of {string} and reorder level of {string}', (productName, quantity, reorder) => {
  ensureProductExistsAndSetQuantity(productName, quantity, reorder);
});

function ensureProductExistsAndSetQuantity(productName, quantityOnHand, reorderLevel = null) {
  cy.visit('/admin/inventory/product/');
  // Check if product exists – if not, create it with a basic SKU
  cy.get('#result_list').then(($list) => {
    if ($list.find(`tr:contains("${productName}")`).length === 0) {
      cy.visit('/admin/inventory/product/add/');
      cy.get('#id_name').type(productName);
      cy.get('#id_sku').type('TEMP-SKU-' + Date.now());
      cy.get('#id_quantity_on_hand').clear().type('0');
      cy.get('#id_reorder_level').clear().type('0');
      cy.get('input[type="submit"][value="Save"]').click();
      cy.contains('was added successfully', { timeout: 5000 }).should('be.visible');
    }
  });

  // Now open the product change form and set quantity (and reorder if given)
  cy.visit('/admin/inventory/product/');
  cy.contains('tr', productName).click(); // opens change form
  cy.get('#id_quantity_on_hand').clear().type(quantityOnHand);
  if (reorderLevel !== null) {
    cy.get('#id_reorder_level').clear().type(reorderLevel);
  }
  cy.get('input[type="submit"][value="Save"]').click();
  // Back to list
  cy.visit('/admin/inventory/product/');
}

// -------------------------------------------------------------------
// Stock verification after transaction
// -------------------------------------------------------------------
Then('the product {string} should have a quantity on hand of {string}', (productName, expectedQty) => {
  cy.visit('/admin/inventory/product/');
  cy.contains('tr', productName)
    .find('.field-quantity_on_hand')
    .should('contain', expectedQty);
});

Then('the transaction list should contain a row with:', (dataTable) => {
  const raw = dataTable.raw();
  const headers = raw[0];
  const values = raw[1];

  cy.visit('/admin/inventory/inventorytransaction/');
  // Locate row containing the product name and verify transaction type & quantity
  cy.get('#result_list').contains('tr', values[0]) // first column is product name
    .within(() => {
      cy.contains(values[1]).should('exist'); // transaction type
      cy.contains(values[2]).should('exist'); // quantity
    });
});

// -------------------------------------------------------------------
// Low‑stock alert steps
// -------------------------------------------------------------------
When('the low‑stock check task runs', () => {
  // Trigger the Celery task via Django management command inside the dev container.
  // For local/docker testing, we use cy.exec to call manage.py check_low_stock.
  // You can also have a test-only URL that calls the task synchronously.
  cy.exec('python manage.py check_low_stock 2>&1', { failOnNonZeroExit: false }).then((result) => {
    cy.log('Low‑stock check output:', result.stdout);
  });
  // Wait a moment for email to be sent (if using locmem backend)
  cy.wait(2000);
});

Then('I should see an email notification for {string} in the test mailbox', (productName) => {
  // This step requires a custom admin view that lists recent emails from django.core.mail.outbox.
  // For now, we'll assume you have added a test URL like /admin/test-emails/
  cy.visit('/admin/test-emails/');
  cy.contains('.email-item', productName).should('exist');
});

Then('the product {string} should be marked as low stock in the admin product list', (productName) => {
  cy.visit('/admin/inventory/product/');
  // Expect a CSS class 'low-stock' on the row (you'll need to add that CSS class in your admin).
  cy.contains('tr', productName).should('have.class', 'low-stock');
});