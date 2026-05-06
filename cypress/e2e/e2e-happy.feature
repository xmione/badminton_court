Feature: End‑To‑End Happy Path
  As a tester
  I want to run the full happy‑path flow of the application
  So that I can verify that all main components work together

  Background:
    Given the Django database is reset
    And the Poste.io database is reset

  Scenario: Poste.io setup and admin login
    When I set up Poste.io and log in
    Then I should see the Poste.io dashboard

  Scenario: Add a new Poste.io regular user
    Given I clean up the test regular user
    When I add a new Poste.io regular user
    Then a success message should appear

  Scenario: Admin login with valid credentials
    Given the admin user exists and is verified
    And the Administrators group exists
    When I log in to the admin panel
    Then I should be on the admin dashboard

  Scenario: Admin login with invalid credentials
    Given the admin user exists (without reset)
    When I attempt to log in to the admin panel with invalid credentials
    Then I should see an error message

  Scenario: User registration
    Given the Regular Users group exists
    When I register a new user
    And I sign out
    Then the registration should succeed

  Scenario: Registered user login
    When I log in with the registered user
    And I sign out
    Then the login should succeed

  Scenario: Invalid login credentials for regular user
    When I attempt to log in with invalid credentials
    Then I should see an error message

  Scenario: Duplicate email registration
    When I try to register with a duplicate email
    Then I should see a duplicate email error

  Scenario: Mismatched passwords registration
    When I try to register with mismatched passwords
    Then I should see a password mismatch error

  Scenario: Create and view a booking
    Given booking test data has been created
    And I am logged in as a regular user
    When I create a new booking for "Jane Smith" on "Court 2" at 9 AM for 3 hours
    And I view the booking details for "Jane Smith" on "Court 2"
    Then the booking details should be displayed correctly

  Scenario: Process payment for a booking
    Given booking test data has been created
    And I am logged in as a regular user
    When I create a new booking for "Jane Smith" on "Court 2" at 1 PM for 3 hours
    And I process payment for that booking
    Then the payment should be confirmed

  Scenario: Edit an existing booking
    Given booking test data has been created
    When I edit an existing booking
    Then the booking should be updated

  Scenario: Delete an unpaid booking
    Given booking test data has been created
    And I am logged in as a regular user
    When I create an unpaid booking for "John Doe" on "Court 2" at 5 PM for 1 hour
    And I delete that unpaid booking
    Then the booking should be removed

  Scenario: Attempt to delete a paid booking (should fail)
    Given booking test data has been created
    And I am logged in as a regular user
    When I create a booking for "Jane Smith" on "Court 1" at 11 AM for 2 hours
    And I pay for that booking
    And I try to delete that paid booking
    Then I should see an error that paid bookings cannot be deleted