Feature: Work order saga
  The workshop opens a work order and the system coordinates parts, quote,
  payment and repair across three services. Every step is a message; if any of
  them fails, everything already done is undone and the order is cancelled.

  Background:
    Given a work order was opened for a customer with a vehicle

  Scenario: The repair is completed and the work order finishes
    When the parts are reserved
    Then the work order is in diagnosis
    And the workshop is asked to generate the quote

    When the quote is generated
    Then the work order is awaiting approval

    When the customer approves the quote
    Then the payment is requested

    When the payment is confirmed
    Then the work order is in execution
    And the workshop is asked to start the execution

    When the execution is completed
    Then the work order is finished
    And the saga is completed
    And no compensation was issued
    And the customer was notified of every status change

  Scenario: The parts are not in stock and the work order is cancelled
    When the parts reservation fails
    Then the work order is cancelled
    And the saga is cancelled
    And no compensation was issued
      # Nothing had been done yet, so there is nothing to undo.

  Scenario: The customer rejects the quote and the reserved parts go back to stock
    Given the parts are reserved
    And the quote is generated
    When the customer rejects the quote
    Then the work order is cancelled
    And the saga is cancelled
    And the parts are released
    And the quote is cancelled

  Scenario: The payment fails and everything done so far is undone
    Given the parts are reserved
    And the quote is generated
    And the customer approves the quote
    When the payment fails
    Then the work order is cancelled
    And the saga is cancelled
    And the parts are released
    And the quote is cancelled

  Scenario: The repair fails and the payment is refunded
    Given the parts are reserved
    And the quote is generated
    And the customer approves the quote
    And the payment is confirmed
    When the execution fails
    Then the work order is cancelled
    And the saga is cancelled
    And the payment is refunded
    And the parts are released
    And the quote is cancelled

  Scenario: A redelivered message does not advance the saga twice
    Given the parts are reserved
    When the parts are reserved again
    Then the workshop was asked to generate the quote only once
    And the work order is in diagnosis
