Feature: Admin Flow

  Background:
    Given the Django database is reset
    And the admin user exists
    And the Administrators group exists
    And the admin email is verified

  Scenario: Successful login to the admin panel
    When I log in to the admin panel
    Then I should be on the admin dashboard

  Scenario: Add admin user to the Administrators group
    When I log in to the admin panel
    And I add the admin user to the Administrators group
    Then I should see a confirmation that the user was added

  Scenario: Login fails with invalid credentials
    When I attempt to log in to the admin panel with invalid credentials
    Then I should see an error message