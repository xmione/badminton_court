Feature: Inventory Management

  As an admin,
  I want to manage inventory products and transactions
  So that I can track stock and receive low‑stock alerts.

  Background:
    Given I am logged in as an admin

  @inventory
  Scenario: Add a new inventory product
    When I navigate to the Product admin list page
    And I click the "Add Product" button
    And I fill in the product creation form with:
      | name             | Yonex Aerosensa 50   |
      | sku              | SHUTTLE-Y50          |
      | category         | Shuttlecocks         |
      | quantity_on_hand | 100                  |
      | reorder_level    | 20                   |
      | unit_cost        | 2.50                 |
      | location         | Storage Room A       |
    And I submit the product form
    Then I should see a success message "Product was added successfully"
    And the product "Yonex Aerosensa 50" should appear in the product list

  @inventory
  Scenario: Record a stock‑in transaction for an existing product
    Given the product "Yonex Aerosensa 50" has a quantity on hand of "80"
    When I navigate to the Inventory Transaction admin list page
    And I click the "Add Transaction" button
    And I fill in the transaction creation form with:
      | product          | Yonex Aerosensa 50 |
      | transaction_type | Stock In           |
      | quantity         | 20                 |
      | unit_price       | 2.50               |
      | notes            | Restock shipment   |
    And I submit the transaction form
    Then I should see a success message "Transaction was added successfully"
    And the product "Yonex Aerosensa 50" should have a quantity on hand of "100"
    And the transaction list should contain a row with:
      | product          | Yonex Aerosensa 50            |
      | transaction_type | Stock In (Purchase/Return)    |
      | quantity         | 20                           |

  @inventory @low-stock
  Scenario: Verify low-stock alert is triggered
    Given the product "Yonex Aerosensa 50" has a quantity on hand of "2" and reorder level of "10"
    When the low‑stock check task runs
    Then I should see an email notification for "Yonex Aerosensa 50" in the test mailbox
    And the product "Yonex Aerosensa 50" should be marked as low stock in the admin product list